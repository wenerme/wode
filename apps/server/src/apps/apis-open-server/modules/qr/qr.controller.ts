import { type FastifyReply, type FastifyRequest } from 'fastify';
import Jimp from 'jimp';
import hash from 'object-hash';
import QRCode, { type QRCodeRenderersOptions } from 'qrcode';
import { z } from 'zod';
import { FileInterceptor } from '@nest-lab/fastify-multer';
import {
  Controller,
  Get,
  HttpException,
  Logger,
  Param,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiOperation, ApiParam, ApiProperty, ApiTags } from '@nestjs/swagger';
import {
  BarcodeFormat,
  BinaryBitmap,
  DecodeHintType,
  HybridBinarizer,
  MultiFormatReader,
  ResultMetadataType,
  RGBLuminanceSource,
} from '@zxing/library';
import { getServerUrl } from '../../getServerUrl';

class FileUploadDto {
  @ApiProperty({ type: 'string', format: 'binary' })
  file: any;
}

@ApiTags('QrCode')
@Controller('qr')
export class QrController {
  private readonly log = new Logger('QrController');

  @Get('enc/:format/:dataFormat/*')
  @ApiOperation({ summary: 'Encode data to QR code' })
  @ApiParam({ name: 'level', required: false })
  @ApiParam({ name: 'bg', required: false })
  @ApiParam({ name: 'fg', required: false })
  @ApiParam({ name: 'width', required: false })
  @ApiParam({ name: 'scale', required: false })
  @ApiParam({ name: 'margin', required: false })
  @ApiParam({ name: 'format', enum: ['png', 'svg', 'jpg'] })
  @ApiParam({ name: 'dataFormat', enum: ['base64', 'raw'] })
  async enc(
    @Param('format') format: string,
    @Param('dataFormat') dataFormat: string,
    @Param('*') data: string,
    @Query() query: Record<string, any>,
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) res: FastifyReply,
  ) {
    const { log } = this;
    const options = EncodeOptions.safeParse({
      ...query,
      format,
    });
    if (!options.success) {
      throw new HttpException(options.error, 400);
    }
    let buf;
    if (dataFormat === 'base64') {
      buf = Buffer.from(data, 'base64');
    } else {
      buf = Buffer.from(data, 'utf-8');
    }
    if (!buf) {
      log.error(`Invalid data ${data}`);
      throw new HttpException('invalid data', 400);
    }

    const str = buf.toString();

    const { version, level: errorCorrectionLevel, margin, scale, width, bg, fg } = options.data;
    const opts: QRCodeRenderersOptions = {
      version,
      errorCorrectionLevel,
      margin,
      scale,
      width,
      color: {
        light: bg,
        dark: fg,
      },
    };

    if (format === 'png') {
      opts.width ??= 200;
      opts.scale ??= 2;
      opts.margin ??= 1;
    }

    log.log(`Encode ${format} ${trim(opts)} ${str}`);
    const etag = hash(trim({ ...opts, text: str, format }));

    if (req.headers['if-none-match'] === etag) {
      res.status(304);
      return;
    }

    res.headers({
      'Content-Disposition': `inline; filename="qrcode.${format}"`,
      'Cache-Control': 'public,max-age=86400,s-maxage=86400',
      ETag: etag,
    });
    switch (format) {
      case 'svg':
        res.headers({
          'Content-Type': 'image/svg+xml',
        });
        return await QRCode.toString(str, { type: 'svg', ...opts });
      case 'png':
        res.headers({
          'Content-Type': 'image/png',
        });
        return await QRCode.toBuffer(str, { type: 'png', ...opts });
      default:
        throw new HttpException('invalid format', 400);
    }
  }

  @Post('dec/:format')
  @ApiParam({ name: 'format', enum: ['json', 'text'] })
  @UseInterceptors(FileInterceptor('file', { limits: { fieldSize: 1024 * 1024 * 5 } }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'QR code image file',
    type: FileUploadDto,
  })
  async dec(@Param('format') format: string, @UploadedFile() file: IUploadedFile) {
    const { log } = this;
    const img = await Jimp.read(file.buffer);
    const imageData = img.bitmap;

    const formats = [BarcodeFormat.QR_CODE];
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, formats);
    hints.set(DecodeHintType.TRY_HARDER, true);
    const reader = new MultiFormatReader();
    reader.setHints(hints);

    const len = imageData.width * imageData.height;
    const luminancesUint8Array = new Uint8ClampedArray(len);

    for (let i = 0; i < len; i++) {
      // (0.2126R + 0.7152G + 0.0722*B))
      // luminancesUint8Array[i] = ((rawImageData.data[i*4]*2+rawImageData.data[i*4+1]*7+rawImageData.data[i*4+2]) / 10) & 0xFF;
      luminancesUint8Array[i] =
        ((imageData.data[i * 4] + imageData.data[i * 4 + 1] * 2 + imageData.data[i * 4 + 2]) / 4) & 0xff;
    }

    const luminanceSource = new RGBLuminanceSource(luminancesUint8Array, imageData.width, imageData.height);
    const binaryBitmap = new BinaryBitmap(new HybridBinarizer(luminanceSource));
    const decoded = reader.decode(binaryBitmap);

    const text = decoded.getText();
    log.log(`Decode qrcode ${imageData.width}x${imageData.height} to ${text}`);
    switch (format) {
      case 'json': {
        const url = getServerUrl(`/qr/enc/svg/base64/${btoa(text)}`);

        return {
          text,
          url,
          image: {
            mime: img.getMIME(),
            ext: img.getExtension(),
            width: imageData.width,
            height: imageData.height,
          },
          qrcode: {
            bytes: decoded.getRawBytes().length,
            level: decoded.getResultMetadata().get(ResultMetadataType.ERROR_CORRECTION_LEVEL),
            orientation: decoded.getResultMetadata().get(ResultMetadataType.ORIENTATION),
          },
        };
      }
      case 'text':
        return text;
      default:
        throw new HttpException('invalid format', 400);
    }
  }
}

interface IUploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string; // 7bit
  mimetype: string;
  buffer: Buffer;
  size: number;
}

const EncodeOptions = z.object({
  format: z.enum(['png', 'svg']),
  level: z.enum(['low', 'medium', 'quartile', 'high', 'L', 'M', 'Q', 'H']).optional(),
  version: z.coerce.number().optional(),
  margin: z.coerce.number().optional(),
  scale: z.coerce.number().min(1).max(4).optional(),
  width: z.coerce.number().min(10).max(2000).optional(),
  bg: z
    .string()
    .regex(/[0-9a-f]{6}/i)
    .optional()
    .transform((v) => (v ? '#' + v : v)),
  fg: z
    .string()
    .regex(/[0-9a-f]{6}/i)
    .optional()
    .transform((v) => (v ? '#' + v : v)),
});

function trim(
  o: any,
  by = (v: any) => {
    switch (v) {
      case '':
      case undefined:
      case null:
        return undefined;
    }
    return v;
  },
) {
  o = by(o);
  if (o === undefined) {
    return undefined;
  }
  if (typeof o !== 'object') {
    return o;
  }
  if (Array.isArray(o)) {
    o = o.map((v) => trim(v, by)).filter((v) => v !== undefined);
    return o.length === 0 ? undefined : o;
  }
  for (const k in o) {
    const v = (o[k] = trim(o[k], by));
    if (v === undefined) {
      delete o[k];
    }
  }
  return Object.keys(o).length === 0 ? undefined : o;
}

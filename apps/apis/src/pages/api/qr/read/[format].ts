import { Fields, Files, IncomingForm } from 'formidable';
import Jimp from 'jimp';
import { NextApiRequest, NextApiResponse, PageConfig } from 'next';
import { z } from 'zod';
import { firstOfMaybeArray } from '@wener/utils';
import {
  BarcodeFormat,
  BinaryBitmap,
  DecodeHintType,
  HybridBinarizer,
  MultiFormatReader,
  RGBLuminanceSource,
} from '@zxing/library';

export const config: PageConfig = {
  api: {
    bodyParser: false,
  },
};

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const params = Params.safeParse(req.query);

  if (!params.success) {
    return res.status(400).send({ message: 'invalid request', error: params.error });
  }
  if (req.method !== 'POST') {
    return res.status(400).send({ message: 'invalid method' });
  }

  const form = new IncomingForm();
  const { fields, files } = await new Promise<{ fields: Fields; files: Files }>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        reject(err);
        return;
      }
      resolve({ fields, files });
    });
  });
  let file = firstOfMaybeArray(files['file']);
  if (!file) {
    return res.status(400).send({ error: 'invalid file' });
  }

  const img = await Jimp.read(file.filepath);
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

  console.log(`Decode qrcode ${imageData.width}x${imageData.height} to ${decoded.getText()}`);
  const { format } = params.data;
  switch (format) {
    case 'json':
      return res.status(200).json({
        text: decoded.getText(),
      });
    case 'text':
      return res.status(200).send(decoded.getText());
  }
};

export default handler;

const Params = z.object({
  format: z.enum(['json', 'text']),
});

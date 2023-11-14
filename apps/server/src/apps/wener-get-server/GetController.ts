import { createZodDto } from '@anatine/zod-nestjs';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import { FileInterceptor } from '@nest-lab/fastify-multer';
import { Body, Controller, Get, Logger, Param, Post, Req, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiOkResponse, ApiOperation, ApiProperty } from '@nestjs/swagger';
import { Errors, firstOfMaybeArray, isUUID } from '@wener/utils';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { Public } from '../../app/auth';
import { StorageItemEntity } from '../../entity/StorageItemEntity';
import { writeAuditLog } from '../../modules/audit';
import { StorageService } from './StorageService';

export const ResourceOutputSchema = z.object({
  // meta fields
  id: z.string().describe('ID'),
  eid: z.string().describe('External ID').nullish(),
  tid: z.string().describe('Tenant ID').nullish(),
  sid: z.coerce.number().nullish().describe('Serial ID'),
  createdAt: z.coerce.date().nullish().describe('创建时间'),
  updatedAt: z.coerce.date().nullish().describe('更新时间'),
  createdById: z.string().nullish(),
  updatedById: z.string().nullish(),
  ownerId: z.string().nullish(),
  ownerType: z.string().nullish(),
  ownerUserId: z.string().nullish(),
  ownerTeamId: z.string().nullish(),
  customerId: z.string().nullish(),
  customerType: z.string().nullish(),
  state: z.string().nullish(),
  status: z.string().nullish(),
  // deletedAt: z.date().or(z.string()).nullish().describe('删除时间'),
  attributes: z.record(z.any()).nullish(),
  properties: z.record(z.any()).nullish(),
});

export const FileOutputSchema = ResourceOutputSchema.extend({
  cid: z.string().optional(),
  rid: z.string().optional(),
  entityId: z.string().optional(),
  entityType: z.string().optional(),
  fileName: z.string().optional(),
  md5sum: z.string().optional(),
  sha256sum: z.string().optional(),
  size: z.coerce.number().optional(),
  mimeType: z.string().optional(),
  ext: z.string().optional(),
  text: z.string().optional(),
  width: z.coerce.number().optional(),
  height: z.coerce.number().optional(),
  length: z.coerce.number().optional(),
  objectUrl: z.string().optional(),
  originUrl: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});
export type FileOutput = z.infer<typeof FileOutputSchema>;

export interface IUploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string; // 7bit
  mimetype: string;
  buffer: Buffer;
  size: number;
}

export class FileUploadDto {
  @ApiProperty({ type: String, format: 'binary' })
  file: any;

  @ApiProperty({ type: String, required: false })
  fileName?: string;

  @ApiProperty({ type: String, required: false })
  code?: string;

  @ApiProperty({ type: String, required: false })
  text?: string;

  @ApiProperty({ type: String, required: false })
  md5sum?: string;

  @ApiProperty({ type: String, required: false })
  sha256sum?: string;

  @ApiProperty({ type: String, required: false })
  entityId?: string;

  @ApiProperty({ type: String, required: false })
  entityType?: string;

  @ApiProperty({ type: Object, required: false })
  attributes?: Record<string, any>;
}

export class FileResponseDto extends createZodDto(FileOutputSchema) {}

const GetServerAuditType = {
  StorageItemAccessDenied: 'storage-item.access-denied',
  StorageItemGet: 'storage-item.get',
  StorageItemUpload: 'storage-item.upload',
};

@Controller()
@Public()
export class GetController {
  private log = new Logger(this.constructor.name);
  constructor(
    protected readonly svc: StorageService,
    @InjectRepository(StorageItemEntity) protected readonly repo: EntityRepository<StorageItemEntity>,
  ) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', { limits: { fieldSize: 1024 * 1024 * 10 } }))
  @ApiOperation({
    description: '使用 Form 表单上传文件；文件大小 < 10m',
  })
  @ApiBody({
    type: FileUploadDto,
  })
  @ApiOkResponse({
    type: FileResponseDto,
  })
  @ApiConsumes('multipart/form-data', 'application/json')
  async upload(@UploadedFile() file: IUploadedFile, @Body() body: FileUploadDto, @Req() req: FastifyRequest) {
    const contentType = req.headers['content-type'] ?? '';
    body ||= {} as any;

    let buffer: Buffer | undefined;

    if (contentType.startsWith('multipart/form-data')) {
      Errors.BadRequest.check(Boolean(file), 'missing form file');
      buffer = file.buffer;
      body.fileName ||= file.originalname;
    } else if (contentType.startsWith('application/json')) {
      if (body.text) {
        buffer = Buffer.from(body.text);
      } else {
        Errors.BadRequest.check(body?.file, 'missing base64 file');
        try {
          buffer = Buffer.from(body.file, 'base64');
        } catch {
          throw Errors.BadRequest.asError('错误的数据');
        }
      }
    }

    Errors.BadRequest.check(buffer, 'invalid file');

    const ent = await this.svc.upload({
      ...body,
      content: buffer.toString('base64'),
    });
    writeAuditLog({
      entity: {
        actionType: GetServerAuditType.StorageItemUpload,
        entityId: ent.id,
      },
    });

    return FileOutputSchema.parse(ent);
  }

  @Get('/:code')
  async get(@Param('code') code: string, @Req() req: FastifyRequest, @Res({ passthrough: true }) res: FastifyReply) {
    Errors.BadRequest.check(code, 'invalid code');

    let builder = this.repo.qb();
    if (isUUID(code)) {
      builder.andWhere({
        uid: code.toLowerCase(),
      });
    } else {
      builder.andWhere({
        code: code,
      });
    }
    builder.cache(60 * 1000);
    const entity = await builder.getSingleResult();

    Errors.NotFound.check(entity, 'item not found');

    let accessAllowed = true;
    if (entity.authToken) {
      accessAllowed = false;
      // 2017 Chrome 59 不允许 embed basic auth subresource https://chromestatus.com/feature/5669008342777856
      // 但应该是支持当前请求的
      let [type, token] = req.headers.authorization?.split(' ') ?? [];
      if (type === 'Basic') {
        const sp = atob(token).split(':');
        // treat user as token
        token = sp[0];
      }
      token ||= firstOfMaybeArray((req.query as any)?.token);
      accessAllowed = token === entity.authToken;
    }
    if (!accessAllowed) {
      writeAuditLog({
        entity: {
          actionType: GetServerAuditType.StorageItemAccessDenied,
          entityId: entity.id,
        },
      });
    }
    Errors.Unauthorized.check(accessAllowed);

    if (entity.link) {
      res.redirect(entity.link);
      return;
    }

    const etag = entity.sha256sum;
    if (req.headers['if-none-match'] === etag) {
      res.status(304);
      return;
    }

    writeAuditLog({
      entity: {
        actionType: GetServerAuditType.StorageItemGet,
        entityId: entity.id,
      },
    });

    // const content = await this.svc.getContentEntity(entity);
    const content = entity;

    let contentType = entity.mimeType;
    // add utf8 to text
    if (contentType?.startsWith('text/')) {
      contentType += '; charset=utf-8';
    }
    res.headers({
      'Content-Disposition': `inline; filename="${content.fileName ?? `file.${content.ext}`}"`,
      // 'Cache-Control': 'public,max-age=86400,s-maxage=86400',
      // cache 1m
      'Cache-Control': 'public,max-age=60,s-maxage=60',
      'Content-Type': contentType,
      ETag: etag,
    });
    if (content.text) {
      return content.text;
    }
    return content.content;
  }
}

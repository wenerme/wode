import { createHash } from 'node:crypto';
import path from 'node:path';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import { Injectable, Logger } from '@nestjs/common';
import { Errors, hex, sha256 } from '@wener/utils';
import type { FileExtension } from 'file-type';
import { fileTypeFromBuffer, supportedExtensions } from 'file-type';
import MIME from 'mime-types';
import sharp from 'sharp';
import { runInTransaction } from '../../app/mikro-orm';
import { FileContentEntity } from '../../entity/FileContentEntity';
import { StorageItemEntity } from '../../entity/StorageItemEntity';
import { getTenantId } from '../../modules/tenant';

@Injectable()
export class StorageService {
  protected readonly log = new Logger(this.constructor.name);

  constructor(
    @InjectRepository(StorageItemEntity) protected readonly repo: EntityRepository<StorageItemEntity>,
    @InjectRepository(StorageItemEntity) protected readonly fileContentRepo: EntityRepository<FileContentEntity>,
  ) {}

  async upload(
    opts: {
      code?: string;
      fileName?: string;
      md5sum?: string;
      sha256sum?: string;
      metadata?: Record<string, any>;
    } & { buffer?: Buffer; content?: string; text?: string },
  ) {
    let buffer = opts.buffer;
    if (!buffer && opts.content) {
      buffer = Buffer.from(opts.content, 'base64');
    }
    if (!buffer && opts.text) {
      buffer = Buffer.from(opts.text);
    }
    Errors.BadRequest.check(buffer, 'missing content');
    const sha256sum = hex(await sha256(buffer));
    const md5sum = md5(buffer);

    Errors.BadRequest.check(!opts.sha256sum || opts.sha256sum === sha256sum, 'sha256sum mismatch');
    Errors.BadRequest.check(!opts.md5sum || opts.md5sum === md5sum, 'md5sum mismatch');

    const fileType = await fileTypeFromBuffer(buffer);
    let mimeType: string | undefined = fileType?.mime;
    let ext: string | undefined = fileType?.ext;

    if (!mimeType) {
      ext = path.extname(opts.fileName ?? '')?.slice(1);
      if (ext) {
        if (supportedExtensions.has(ext as FileExtension)) {
          this.log.warn(`claimed ext ${ext} but not detected`);
        }

        mimeType = MIME.lookup(ext) || undefined;
      }
    }

    let metadata: Record<string, any> = {};
    if (mimeType?.startsWith('image/')) {
      metadata = await sharp(buffer).metadata();
    }

    const ent = await runInTransaction(async (em) => {
      const base = {
        code: opts.code,
        fileName: opts.fileName,
        md5sum,
        sha256sum,
        width: metadata?.width,
        height: metadata?.height,
        size: buffer!.length,
        mimeType,
        ext,

        text: opts.text,
        content: buffer,
      };
      const file = await em.upsert(
        StorageItemEntity,
        {
          ...base,
          // entityId: opts.entityId,
          // entityType: opts.entityType,
          metadata: opts.metadata ?? {},
        },
        {
          onConflictAction: 'merge',
          onConflictExcludeFields: ['code', 'createdAt'],
        },
      );
      await em.persistAndFlush([file]);

      // let content = await this.fileContentRepo.findOne({
      //   sha256sum,
      // });
      // if (!content) {
      //   content = this.fileContentRepo.create({
      //     ...base,
      //     content: buffer,
      //     metadata,
      //   });
      // }
      // await em.persistAndFlush([content]);

      return file;
    });

    return ent;
  }

  async getContentEntity(ent: { sha256sum?: string; md5sum?: string; tid?: string }): Promise<FileContentEntity> {
    const tid = ent.tid || getTenantId();
    let content;
    if (ent.sha256sum) {
      content = await this.fileContentRepo.findOneOrFail({
        tid,
        sha256sum: ent.sha256sum,
      });
    } else if (ent.md5sum) {
      content = await this.fileContentRepo.findOneOrFail({
        tid,
        md5sum: ent.md5sum,
      });
    } else {
      throw Errors.BadRequest.asError('unable to find file content');
    }

    return content;
  }
}

function md5(input: Buffer | string) {
  return createHash('md5').update(input).digest('hex');
}

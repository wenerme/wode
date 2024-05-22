import { BinaryLike, createHash } from 'node:crypto';
import path from 'node:path';
import { Errors, hex, isDefined, sha256 } from '@wener/utils';
import { FileExtension, fileTypeFromBuffer, supportedExtensions } from 'file-type';
import MIME from 'mime-types';

export interface ResolveFileObjectOptions {
  file?: File;
  buffer?: Buffer;
  content?: string;
  base64?: string;
  text?: string;
  name?: string;
  size?: number;
  sha256sum?: string;
  md5sum?: string;
}

export interface FileObject {
  buffer: Buffer;
  size: number;
  type: string;
  ext: string;
  filename?: string;
  sha256sum: string;
  md5sum: string;
  metadata?: Record<string, unknown>;
}

const OctetStream = 'application/octet-stream';

export async function resolveFileObject(opts: ResolveFileObjectOptions): Promise<FileObject> {
  let buffer = opts.buffer;
  let type = '';

  let filename = opts.name;
  if (!buffer && opts.base64) {
    buffer = Buffer.from(opts.base64, 'base64');
  }
  if (!buffer && opts.content) {
    if (opts.content.startsWith('data:')) {
      // fetch from url
      const res = await fetch(opts.content);
      type = res.headers.get('content-type') || type;
      buffer = Buffer.from(await res.arrayBuffer());
    } else {
      throw new Error('Unknown content format');
    }
  }
  if (!buffer && opts.text) {
    buffer = Buffer.from(opts.text);
    type = 'text/plain';
  }
  if (!buffer && opts.file) {
    buffer = Buffer.from(await opts.file.arrayBuffer());
    type = opts.file.type;
    filename ||= opts.file.name;
  }
  if (!buffer) {
    throw new Error('invalid file object');
  }

  let size = buffer.byteLength;
  const sha256sum = hex(await sha256(buffer));
  const md5sum = md5(buffer);

  isDefined(opts.size) && Errors.BadRequest.check(opts.size === size, 'size mismatch');
  opts.sha256sum && Errors.BadRequest.check(opts.sha256sum === sha256sum, 'sha256sum mismatch');
  opts.md5sum && Errors.BadRequest.check(opts.md5sum === md5sum, 'md5sum mismatch');
  let ext = filename ? path.extname(filename).slice(1) : 'bin';

  if (type === OctetStream) {
    type = '';
  }
  if (filename && !type) {
    type = MIME.lookup(filename) || type;
  } else if (type && !ext) {
    ext = MIME.extension(type) || ext;
  }

  {
    const fileType = await fileTypeFromBuffer(buffer);
    if (fileType) {
      type = fileType.mime;
      ext = fileType.ext;
    } else if (ext && supportedExtensions.has(ext as FileExtension)) {
      // this.log.warn(`claimed ext ${ext} but not detected`);
      console.warn(`claimed ext ${ext} but not detected`);
    }
  }

  type ||= OctetStream;

  return {
    buffer,
    type,
    ext,
    filename,
    size,
    sha256sum,
    md5sum,
  };
}

function md5(input: BinaryLike | string) {
  return createHash('md5').update(input).digest('hex');
}

export async function resolveImageFileObject(fo: FileObject): Promise<FileObject & {
  width?: number;
  height?: number;
}> {
  const { type, buffer } = fo;
  if (type.startsWith('image/')) {
    const { default: sharp } = await import('sharp');
    const md = await sharp(buffer).metadata();
    fo.metadata ||= {};
    fo.metadata.image = md;
    (fo as any).width = md.width;
    (fo as any).height = md.height;
  }
  return fo;
}

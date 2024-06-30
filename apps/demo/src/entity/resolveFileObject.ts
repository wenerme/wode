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

  filename?: string;
  size?: number;
  sha256?: string;
  md5?: string;
}

export interface FileObject {
  content: Buffer;
  text?: string;

  filename?: string;
  size: number;
  sha256: string;
  md5: string;

  ext: string;
  mimeType: string;

  metadata?: Record<string, any>;
  width?: number;
  height?: number;
}

const OctetStream = 'application/octet-stream';

export async function resolveFileObject(opts: ResolveFileObjectOptions): Promise<FileObject> {
  let buffer = opts.buffer;
  let type = '';

  let filename = opts.filename;
  if (!buffer && opts.file) {
    buffer = Buffer.from(await opts.file.arrayBuffer());
    type = opts.file.type;
    filename ||= opts.file.name;
  }
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

  if (!buffer) {
    throw new Error('invalid file object');
  }

  let size = buffer.byteLength;
  const sha256sum = hex(await sha256(buffer));
  const md5sum = md5(buffer);

  isDefined(opts.size) && Errors.BadRequest.check(opts.size === size, 'size mismatch');
  opts.sha256 && Errors.BadRequest.check(opts.sha256 === sha256sum, 'sha256 mismatch');
  opts.md5 && Errors.BadRequest.check(opts.md5 === md5sum, 'md5 mismatch');
  let ext = filename ? path.extname(filename).slice(1) : '';

  if (type === OctetStream) {
    type = '';
  }
  if (filename && !type) {
    type = MIME.lookup(filename) || type;
  }
  if (type && !ext) {
    ext = MIME.extension(type) || ext;
  }

  ext ||= 'bin';

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

  const fo: FileObject = {
    content: buffer,
    mimeType: type,
    ext,
    filename,
    size,
    sha256: sha256sum,
    md5: md5sum,
  };

  if (fo.mimeType.startsWith('text/')) {
    fo.text = buffer.toString('utf-8');
  }

  // image metadata
  await resolveImageFileObject(fo);

  return fo;
}

function md5(input: BinaryLike | string) {
  return createHash('md5').update(input).digest('hex');
}

async function resolveImageFileObject(fo: FileObject): Promise<FileObject> {
  const { mimeType, content } = fo;
  if (mimeType.startsWith('image/')) {
    const { default: sharp } = await import('sharp');
    const md = await sharp(content).metadata();
    fo.metadata ||= {};
    fo.metadata.image = md;
    fo.width = md.width;
    fo.height = md.height;
  }
  return fo;
}

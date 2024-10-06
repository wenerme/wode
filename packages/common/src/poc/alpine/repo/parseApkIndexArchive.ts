import { ArrayBuffers, createLazyPromise } from '@wener/utils';
import pako from 'pako';
import tar from 'tar-stream';
import { toNodeReadableStream } from './toNodeReadableStream';

export interface ApkIndexArchiveContent {
  description: string; // vYYYYMMDD-#-HASH
  apkindex: string;
  signName: string;
  signData: ArrayBuffer;
  mtime: Date;
}

export function parseApkIndexArchive(
  input: ReadableStream | ArrayBuffer,
  {
    onEntry,
    skip,
  }: {
    onEntry?: (v: ApkIndexArchiveContent) => void;
    skip?: (ctx: { content: ApkIndexArchiveContent; name: string }) => void;
  } = {},
) {
  const content: ApkIndexArchiveContent = {
    description: '',
    apkindex: '',
    signName: '',
    signData: new Uint8Array(0),
    mtime: new Date(0),
  };

  const final = createLazyPromise<ApkIndexArchiveContent>();

  const extract = tar.extract();
  extract.on('entry', (header, stream, next) => {
    let contents: Uint8Array[] = [];
    switch (header.name) {
      case 'APKINDEX':
        if (header.mtime) content.mtime = header.mtime;
        break;
      default:
        if (header.name.startsWith('.SIGN.')) {
          content.signName = header.name;
        }
    }

    // APKINDEX is large, use stream to avoid memory issue
    if (skip?.({ content, name: header.name })) {
      stream.resume();
      return next();
    }

    stream.on('data', (chunk) => {
      contents.push(chunk);
    });

    stream.on('error', (e) => {
      final.reject(e);
    });

    stream.on('end', () => {
      const buf = ArrayBuffers.concat(contents);
      switch (header.name) {
        case 'APKINDEX':
          content.apkindex = ArrayBuffers.toString(buf);
          break;
        case 'DESCRIPTION':
          content.description = ArrayBuffers.toString(buf);
          break;
        default:
          if (header.name.startsWith('.SIGN.')) {
            content.signData = buf;
          }
      }
      onEntry?.(content);
      next();
    });
    stream.resume();
  });
  extract.on('finish', () => {
    final.resolve(content);
  });
  extract.on('error', (e) => {
    final.reject(e);
  });

  if (input instanceof ArrayBuffer) {
    const data = pako.inflate(input);
    extract.end(data);
  } else {
    let deco = new DecompressionStream('gzip');
    Promise.resolve(toNodeReadableStream(input.pipeThrough(deco) as any))
      .then((s) => s.pipe(extract))
      .catch((e) => final.reject(e));
  }
  return final;
}

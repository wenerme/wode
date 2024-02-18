import { ArrayBuffers, createLazyPromise } from '@wener/utils';
import pako from 'pako';
import tar from 'tar-stream';

export interface ApkIndexArchiveContent {
  description: string; // vYYYYMMDD-#-HASH
  apkindex: string;
  signName: string;
  signData: ArrayBuffer;
}

export function parseApkIndexArchive(buf: ArrayBuffer) {
  const data = pako.inflate(buf);
  const out: ApkIndexArchiveContent = {
    description: '',
    apkindex: '',
    signName: '',
    signData: new Uint8Array(0),
  };

  const final = createLazyPromise<ApkIndexArchiveContent>();

  const extract = tar.extract();
  extract.on('entry', (header, stream, next) => {
    let contents: Uint8Array[] = [];
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
          out.apkindex = ArrayBuffers.toString(buf);
          break;
        case 'DESCRIPTION':
          out.description = ArrayBuffers.toString(buf);
          break;
        default:
          if (header.name.startsWith('.SIGN.')) {
            out.signName = header.name;
            out.signData = buf;
          }
      }
      next();
    });
    stream.resume();
  });
  extract.on('finish', () => {
    final.resolve(out);
  });
  extract.on('error', (e) => {
    final.reject(e);
  });
  extract.end(data);
  return final;
}

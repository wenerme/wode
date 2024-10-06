import path from 'node:path';
import { Logger } from '@nestjs/common';
import { parseBoolean, type MaybePromise } from '@wener/utils';
import { z } from 'zod';
import { getCacheFile } from './getCacheFile';

export interface FileMetaObject {
  filename?: string;
  sha256?: string;
  md5?: string;
  updatedAt?: Date;
  createdAt?: Date;
  mimeType?: string;
  size: number;
  ext?: string;
}

interface ServeFileOptions {
  req: Request;
  file: FileMetaObject;
  getBuffer: () => MaybePromise<Buffer>;
}

interface ServeFileResult {
  body?: Buffer;
  status: number;
  headers?: Record<string, string>;
}

const ParamSchema = z.object({
  w: z.coerce.number().min(0).optional(),
  h: z.coerce.number().min(0).optional(),
  q: z.coerce.number().min(0).optional(),
  s: z.coerce.number().min(0).optional(),
});

export async function serveFile({
  req,
  file,
  getBuffer: _getBuffer,
  getStream: _getStream,
  cacheDir,
}: {
  req: Request;
  file: FileMetaObject;
  getStream?: () => MaybePromise<ReadableStream>;
  getBuffer: () => MaybePromise<Buffer>;
  cacheDir?: string;
}): Promise<ServeFileResult> {
  const log = new Logger(`serveFile`);
  // https://github.com/honojs/node-server/blob/main/src/serve-static.ts
  const { method, url } = req;

  if (!_getBuffer && !_getStream) {
    throw new Error('getBuffer or getStream is required');
  }
  if (!_getBuffer && _getStream) {
    let get = _getStream;
    _getBuffer = async () => {
      const stream = await get();
      const chunks = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }
      return Buffer.concat(chunks);
    };
  } else if (_getBuffer && !_getStream) {
    _getStream = async () => {
      const buffer = await _getBuffer();
      return new ReadableStream({
        start(controller) {
          controller.enqueue(buffer);
          controller.close();
        },
      });
    };
  }
  let getStream = _getStream;
  let getBuffer = _getBuffer;

  const { createdAt: btime, updatedAt: mtime, size, ext = 'bin', mimeType = '', filename = `download.${ext}` } = file;
  let etag = file.sha256 || file.md5;
  let headers: Record<string, string> = {};
  let getData = getBuffer;

  if (mimeType.startsWith('image/')) {
    const u = new URL(url);
    const result = ParamSchema.safeParse(Object.fromEntries(u.searchParams.entries()));
    if (result.success) {
      const param = result.data;
      let { w, h, q } = param;
      if (w || h) {
        etag = [etag, w, h, q].filter(Boolean).join('');
        q ||= 80;
        getData = async () => {
          const data = await getBuffer();

          const start = Date.now();
          const { default: sharp } = await import('sharp');
          const pipeline = sharp(data);
          const meta = await pipeline.metadata();
          // may skip the resize step
          let ow = meta.width;
          let oh = meta.height;

          if (w && ow && w > ow) {
            w = undefined;
          }
          if (h && oh && h > oh) {
            h = undefined;
          }
          if (w && h) {
            pipeline.resize(w, h);
          } else if (w) {
            pipeline.resize(w);
          } else if (h) {
            pipeline.resize(null, h);
          }
          pipeline.webp({ quality: q });
          try {
            return pipeline.toBuffer();
          } finally {
            log.log(`resize ${ow}x${oh} -> ${w || '-'}x${h || '-'} q=${q} ${Date.now() - start}ms`);
          }
        };

        if (cacheDir) {
          const last = getData;
          getData = async () => {
            const { read } = await getCacheFile({
              cacheFile: () => path.join(cacheDir, 'vips', `${etag}.webp`),
              getContent: async () => {
                const data = await last();
                return { content: data };
              },
            });
            return read();
          };
        }
      }
    }
  }

  if (mimeType.startsWith('video/')) {
    // fluent-ffmpeg
    // https://github.com/fluent-ffmpeg/node-fluent-ffmpeg
  }

  switch (method) {
    case 'HEAD':
    case 'OPTIONS':
      return { status: 200 };
    case 'GET':
      break;
    default:
      return { status: 405, headers: { Allow: 'GET, HEAD, OPTIONS' } };
  }

  const ifNoneMatch = req.headers.get('if-none-match');
  if (ifNoneMatch && etag && etag === ifNoneMatch) {
    return { status: 304 };
  }

  if (mtime) {
    let ifModifiedSince = req.headers.get('if-modified-since');
    if (ifModifiedSince) {
      let ims = new Date(ifModifiedSince);
      if (mtime <= ims) {
        return { status: 304 };
      }
    }
  }

  const range = req.headers.get('range') || '';
  const buffer = await getData();
  if (range) {
    const parts = range.replace(/bytes=/, '').split('-', 2);
    // bytes=0-
    if (parts[0] === '0' && !parts[1]) {
      // just return full data ?
    } else {
      let start = parts[0] ? Number.parseInt(parts[0], 10) : 0;
      let end = parts[1] ? Number.parseInt(parts[1], 10) : size - 1;
      start = Number.isNaN(start) ? 0 : start;
      end = Number.isNaN(end) ? size - 1 : end;
      end = Math.min(end, size - 1);

      headers['Accept-Ranges'] = 'bytes';
      if (mtime) {
        headers['Date'] = mtime.toUTCString();
      }

      const chunksize = end - start + 1;
      const part = buffer.subarray(start, end + 1);

      headers['Content-Length'] = chunksize.toString();
      headers['Content-Range'] = `bytes ${start}-${end}/${size}`;
      headers['Content-Type'] = mimeType;
      return {
        headers,
        status: 206,
        body: part,
      };
    }
  }

  headers['Content-Length'] = size.toString();
  if (mimeType) {
    headers['Content-Type'] = mimeType;
  }
  if (etag) {
    headers['ETag'] = etag;
    // 15min
    headers['Cache-Control'] = 'public, max-age=900';
  }
  if (mtime) {
    headers['Last-Modified'] = mtime.toUTCString();
  }

  // check download
  if (parseBoolean(new URL(req.url).searchParams.get('download'))) {
    headers['Content-Disposition'] = `attachment; filename="${encodeURIComponent(filename)}"`;
  }

  return { headers, body: buffer, status: 200 };
}

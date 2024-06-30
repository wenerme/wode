import { MaybePromise, parseBoolean } from '@wener/utils';

interface FileObject {
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
  file: FileObject;
  getBuffer: () => MaybePromise<Buffer>;
}

interface ServeFileResult {
  body?: Buffer;
  status: number;
  headers?: Record<string, string>;
}

export async function serveFile({
                                  req,
                                  file,
                                  getBuffer,
                                }: {
  req: Request;
  file: FileObject;
  getBuffer: () => MaybePromise<Buffer>;
}): Promise<ServeFileResult> {
  // https://github.com/honojs/node-server/blob/main/src/serve-static.ts
  const { method } = req;

  const { createdAt: btime, updatedAt: mtime, size, ext = 'bin', mimeType, filename = `download.${ext}` } = file;
  const etag = file.sha256 || file.md5;
  let headers: Record<string, string> = {};

  switch (method) {
    case 'HEAD':
    case 'OPTIONS':
      return { status: 200 };
    case 'GET':
      break;
    default:
      return { status: 405, headers: { 'Allow': 'GET, HEAD, OPTIONS' } };
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
  const buffer = await getBuffer();
  if (range) {
    headers['Accept-Ranges'] = 'bytes';
    if (mtime) {
      headers['Date'] = mtime.toUTCString();
    }

    const parts = range.replace(/bytes=/, '').split('-', 2);
    let start = parts[0] ? parseInt(parts[0], 10) : 0;
    let end = parts[1] ? parseInt(parts[1], 10) : size - 1;
    start = Number.isNaN(start) ? 0 : start;
    end = Number.isNaN(end) ? size - 1 : end;
    end = Math.min(end, size - 1);

    const chunksize = end - start + 1;
    const part = buffer.subarray(start, end + 1);

    headers['Content-Length'] = chunksize.toString();
    headers['Content-Range'] = `bytes ${start}-${end}/${size}`;
    return {
      headers,
      status: 206,
      body: part,
    };
  }

  headers['Content-Length'] = size.toString();
  if (mimeType) {
    headers['Content-Type'] = mimeType;
  }
  if (etag) {
    headers['ETag'] = etag;
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

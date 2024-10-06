import fsp from 'node:fs/promises';
import path from 'node:path';
import { Readable, type Stream } from 'node:stream';
import { isBuffer, maybeFunction, type MaybeFunction, type MaybePromise } from '@wener/utils';
import fs from 'fs-extra';

export async function getCacheFile<M extends {} = Record<string, any>>({
  cacheFile,
  getContent,
}: {
  cacheFile: MaybeFunction<string>;
  getContent: () => MaybePromise<{
    content?: Buffer | Stream | ReadableStream<Uint8Array>;
    metadata?: M;
  } | void>;
}): Promise<{
  file: string;
  metadata: M;
  readStream(): ReadableStream;
  read(): Promise<Buffer>;
}> {
  cacheFile = maybeFunction(cacheFile);
  let metaFile = `${cacheFile}.meta.json`;
  let metadata: M | undefined;

  try {
    await fs.stat(cacheFile);
    return {
      file: cacheFile,
      get metadata() {
        try {
          return JSON.parse(fs.readFileSync(metaFile, 'utf-8'));
        } catch (e) {
          return {};
        }
      },
      readStream() {
        return Readable.toWeb(fs.createReadStream(cacheFile)) as any;
      },
      read() {
        return fs.readFile(cacheFile);
      },
    };
  } catch (e) {}

  const result = await getContent();

  if (result?.content) {
    try {
      await fsp.writeFile(cacheFile, result.content);
    } catch (e) {
      // if dir not exists create it
      if ((e as any).code === 'ENOENT') {
        await fs.mkdir(path.dirname(cacheFile), { recursive: true });
        await fsp.writeFile(cacheFile, result.content);
      }
    }
  }
  if (result?.metadata) {
    metadata = result.metadata;
    await fs.writeFile(metaFile, JSON.stringify(result.metadata, null, 2));
  }

  return {
    file: cacheFile,
    metadata: (metadata || {}) as M,
    readStream() {
      return Readable.toWeb(fs.createReadStream(cacheFile)) as any;
    },
    async read(): Promise<Buffer> {
      if (isBuffer(result?.content)) {
        return result.content;
      }
      return fs.readFile(cacheFile);
    },
  };
}

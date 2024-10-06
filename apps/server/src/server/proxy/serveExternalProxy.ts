import path from 'node:path';
import { Logger } from '@nestjs/common';
import type { Context } from 'hono';
import { getCacheFile } from '@/utils/getCacheFile';
import { dropProxyHeaders } from './dropProxyHeaders';

export async function serveExternalProxy({
  context: c,
  target,
  log = new Logger(serveExternalProxy.name),
  cacheDir: fileCacheDir,
}: {
  context: Context;
  target?: string;
  log?: Logger;
  cacheDir: string;
}) {
  // const { url: u } = resolveProxyExternalUrl(target) ?? {};
  const u = target;
  if (!u) {
    log.warn(`invalid proxy ${target}`);
    return c.json({ error: 'invalid' }, 400);
  }

  let key = btoa(u.toString());
  let cacheFile = path.join(fileCacheDir, 'proxy', key.slice(0, 2), key);

  const {
    metadata: { headers },
    readStream,
  } = await getCacheFile({
    cacheFile,
    getContent: async () => {
      log.log(`proxy fetch ${u}`);
      const res = await fetch(u);
      if (!res.ok) {
        log.error(`failed to proxy ${u}: ${res.status} ${res.statusText}`);
        throw new Error(`failed to proxy: ${res.status} ${res.statusText}`);
      }
      return {
        content: res.body!,
        metadata: {
          headers: Object.fromEntries(res.headers.entries()),
        },
      };
    },
  });

  return new Response(readStream(), {
    status: 200,
    headers: dropProxyHeaders(new Headers(headers)),
  });
}

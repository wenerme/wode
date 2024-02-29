import { HttpBindings } from '@hono/node-server';
import { runServer } from '@wener/nestjs/hono';
import { Hono } from 'hono';
import { logger } from 'hono/logger';

export async function runOpenApisServer() {
  type Bindings = HttpBindings & {
    /* ... */
  };
  const app = new Hono<{ Bindings: Bindings }>();
  app.use(logger());

  app.mount('/cors/', async (req) => {
    // https://github.com/Rob--W/cors-anywhere/blob/master/lib/cors-anywhere.js
    let input = new Headers(req.headers);
    input.delete('host');
    input.delete('origin');
    input.delete('referer');
    input.delete('cookie');
    input.delete('content-length');
    input.set('accept-encoding', 'deflate, gzip'); // override to avoid unsupported

    let init: RequestInit & Record<string, any> & { headers: Headers } = {
      method: req.method,

      headers: input,
      body: req.body,
    };
    console.log(`CORS ${req.method} ${req.url} ${new URL(req.url).pathname}`);

    const headers: Record<string, string | string[]> = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'OPTIONS, GET, POST, PUT, DELETE',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
      Vary: ['Origin', 'Access-Control-Request-Method', 'Access-Control-Request-Headers'],
    };

    if (req.method === 'OPTIONS') {
      headers['Access-Control-Max-Age'] = '86400';
      return new Response('', { status: 200, headers: createHeaders(headers) });
    }

    let u = req.url;
    try {
      let url = new URL(req.url);
      if (url.host !== req.headers.get('host')) {
        // http://0.0.0.0:8787/cors/http://wener.me -> http://wener.me
        // fixme 无法获取到完整的 url
      } else {
        let u = url.pathname;
        if (u.startsWith('/cors/')) {
          u = u.slice('/cors/'.length);
        }
        if (!/^https?:\/\//.test(u)) {
          u = `https://${u}`;
        }
        url = new URL(u);
      }
      url.port = '';
      u = url.toString();
    } catch (e) {
      console.log(`X ${req.method} ${req.url} -> ${u}`);
      return new Response(JSON.stringify({ error: 'Invalid url' }), { status: 400 });
    }

    let inputContentType = init.headers.get('content-type')?.split(';')[0];
    console.log(`> ${init.method} ${u} ${inputContentType || ''}`);
    for (let [k, v] of init.headers.entries()) {
      console.log(`${k}: ${v}`);
    }

    if (init.body && inputContentType) {
      switch (inputContentType) {
        case 'application/json':
          // ReadableStream to string
          if (init.body instanceof ReadableStream) {
            const reader = init.body.getReader();
            let chunks: Uint8Array[] = [];
            while (true) {
              const { done, value } = await reader.read();
              if (done) {
                break;
              }
              chunks.push(value);
            }
            init.body = Buffer.concat(chunks).toString('utf-8');
            console.log();
            switch (inputContentType) {
              case 'application/json':
                console.log(JSON.stringify(JSON.parse(init.body), null, 2));
                break;
              default:
                console.log(init.body);
            }
          }
      }
    }

    // 处理压缩有问题
    // https://github.com/nodejs/undici/issues/1462

    let res: Response;
    try {
      Object.defineProperty(init, 'duplex', {
        get() {
          if (init.body instanceof ReadableStream) {
            return 'half';
          }
        },
      });
      res = await fetch(u, init);
    } catch (e) {
      console.log(`X ${init.method} ${u}`, e);
      return new Response(JSON.stringify({ error: 'Fetch error' }), { status: 500 });
    }
    let body = res.body!;
    const output = new Headers(Array.from(res.headers.entries()).concat(Array.from(createHeaders(headers).entries())));

    console.log(`< ${init.method} ${u} ${res.status} ${output.get('content-type')}`);

    output.delete('content-encoding'); // gzip
    output.set('access-control-allow-origin', '*');
    for (let [k, v] of output.entries()) {
      console.log(`${k}: ${v}`);
    }
    return new Response(body, {
      status: res.status,
      headers: output,
    });
  });

  return runServer({ app });
}

function createHeaders(r: Record<string, string | string[]>) {
  let init = Object.entries(r).flatMap(([k, v]) => {
    if (Array.isArray(v)) {
      return v.map((vv) => [k, vv] as [string, string]);
    }
    return [[k, v] as [string, string]];
  });
  return new Headers(init);
}

function dump(o: { url: string; method: string; header: Headers; body?: any }) {}

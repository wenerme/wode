import { FetchLike } from '../fetch';

export function createFetchWithLogger({
  fetch = globalThis.fetch,
  logger = console.log,
}: {
  fetch?: FetchLike;
  logger?: (s: string) => void;
} = {}): FetchLike {
  return async (...args) => {
    const [, init = { method: 'GET', headers: {} }] = args;
    const url = typeof args[0] === 'string' ? args[0] : args[0].url;

    let dumpRequest = `-> ${init.method} ${url}
${Array.from(new Headers(init.headers).entries())
  .map(([k, v]) => `${k}: ${v}`)
  .join('\n')}
`;

    if (init.body) {
      if (init.body instanceof ReadableStream) {
        const [a, b] = init.body.tee();
        init.body = a;
        const signal = init.signal;
        Promise.resolve().then(async () => {
          const reader = b.getReader();
          logger(dumpRequest);
          while (true) {
            if (signal?.aborted) {
              break;
            }

            let { done, value } = await reader.read();
            value instanceof Uint8Array && (value = new TextDecoder().decode(value));
            dumpRequest += value;
            logger(value);
            if (!done) {
              break;
            }
          }
          // maybe for archive
          dumpRequest += `\n`;
        });
      } else {
        dumpRequest += `
${init.body}
`;
      }
    }
    console.log(dumpRequest);

    try {
      let res = await fetch(...args);
      let dumpResponse = `<- ${res.status} ${res.statusText} ${init.method} ${url}
  ${Array.from(res.headers.entries())
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n')}
   `;
      let contentType = res.headers.get('content-type');
      // text/event-stream
      if (contentType?.includes('application/json') || contentType?.includes('text/plain')) {
        const body = await res.text();
        dumpResponse += `\n${body}\n`;
        res = new Response(body, res);
      }

      logger(dumpResponse);

      return res;
    } catch (e) {
      console.error(`[Error] -> ${init.method} ${url} :${e}`);
      throw e;
    }
  };
}

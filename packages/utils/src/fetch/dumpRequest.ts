export function dumpRequest({
  url,
  req = {},
  log = console.log,
}: {
  url: string;
  req?: RequestInit;
  log?: (s: string) => void;
}) {
  const { method = 'GET' } = req;
  let out = `-> ${method} ${url}
${Array.from(new Headers(req.headers).entries())
  .map(([k, v]) => `${k}: ${v}`)
  .join('\n')}
`;

  let done: Promise<string> | undefined;
  if (req.body) {
    let hdr = new Headers(req.headers);
    let ct = hdr.get('content-type');
    if (ct === 'application/octet-stream') {
      // skip
    } else if (req.body instanceof ReadableStream) {
      const [a, b] = req.body.tee();
      req.body = a;
      const signal = req.signal;
      done = Promise.resolve().then(async () => {
        const reader = b.getReader();
        log(out);
        while (true) {
          if (signal?.aborted) {
            break;
          }

          let { done, value } = await reader.read();
          value instanceof Uint8Array && (value = new TextDecoder().decode(value));
          out += value;
          log(value);
          if (!done) {
            break;
          }
        }
        // maybe for archive
        out += `\n`;
        return out;
      });
    } else {
      out += `
${req.body}
`;
    }
    log(out);
  }
  return done || Promise.resolve(out);
}

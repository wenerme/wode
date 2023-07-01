export async function dumpResponse({
  res,
  url,
  req,
  log = console.log,
}: {
  res: Response;
  url: string;
  req: RequestInit;
  log?: (s: string) => void;
}) {
  let out = `<- ${res.status} ${res.statusText} ${req.method} ${url}
  ${Array.from(res.headers.entries())
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n')}
   `;
  let contentType = res.headers.get('content-type');
  // TODO text/event-stream
  if (contentType?.includes('application/json') || contentType?.includes('text/plain')) {
    const body = await res.text();
    out += `\n${body}\n`;
    res = new Response(body, res);
  }

  log(out);

  return res;
}

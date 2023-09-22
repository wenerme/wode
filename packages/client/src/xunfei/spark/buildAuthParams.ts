import { createHmac } from 'node:crypto';

export function buildAuthParams({
  date = new Date(),
  apiSecret = process.env.XF_API_SECRET ?? '',
  apiKey = process.env.XF_API_KEY ?? '',
  url,
  host = url?.host ?? 'spark-api.xf-yun.com',
  method = 'GET',
  path = url?.pathname ?? '/v1.1/chat',
}: {
  url?: URL;
  host?: string;
  method?: string;
  path?: string;
  apiSecret?: string;
  apiKey?: string;
  date?: Date;
}) {
  const hmac = createHmac('sha256', apiSecret);
  hmac.update([`host: ${host}`, `date: ${date.toUTCString()}`, `${method} ${path} HTTP/1.1`].join('\n'));
  let sign = hmac.digest('base64');
  const origin = `api_key="${apiKey}", algorithm="hmac-sha256", headers="host date request-line", signature="${sign}"`;
  return {
    authorization: btoa(origin),
    date: date.toUTCString(),
    host,
  };
}

export function buildAuthUrl({ url, apiKey, apiSecret }: { url: string | URL; apiSecret?: string; apiKey?: string }) {
  const u = new URL(url);
  Object.entries(buildAuthParams({ url: u, apiKey, apiSecret })).forEach(([k, v]) => {
    u.searchParams.set(k, v);
  });
  return u;
}

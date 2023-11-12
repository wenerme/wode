import { hmac, isDefined, randomUUID, sha256 } from '@wener/utils';

export async function signv3(
  {
    method,
    url,
    headers,
    body,
  }: { method: string; url: string; headers: Record<string, any>; body?: string | BufferSource },
  {
    accessKeyId,
    accessKeySecret,
    date,
    nonce,
    debug,
  }: {
    accessKeyId: string;
    accessKeySecret: string;
    date?: string;
    nonce?: string;
    debug?: boolean;
  },
) {
  const u = new URL(url);
  headers.host ||= u.host;
  // x-acs-content-sha256
  date = headers['x-acs-date'] ||= date || new Date().toJSON().replace(/[.]\d+Z$/, 'Z'); // 2023-11-11T20:41:07.364Z
  nonce = headers['x-acs-signature-nonce'] ||= nonce || randomUUID().replaceAll('-', '');
  const contentHash = (headers['x-acs-content-sha256'] ||= await sha256(body ?? '', 'hex'));
  let all = Object.entries({
    ...headers,
  });
  let entries = all
    .filter(([k, v]) => (k.startsWith('x-acs-') || k === 'host' || k === 'content-type') && isDefined(v))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => {
      return [k.toLowerCase(), String(v).trim()];
    });
  let signedHeaders = entries.map(([k]) => k).join(';');
  let parts = [
    method,
    u.pathname,
    u.search.slice(1),
    entries.map(([k, v]) => `${k}:${v}\n`).join(''),
    signedHeaders,
    // empty sha256 to e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
    contentHash,
  ];
  let canonical = parts.join('\n');
  const hash = await sha256(canonical, 'hex');
  const algorithm = 'ACS3-HMAC-SHA256';
  // const { createHmac } = await import('node:crypto');
  // const signature = createHmac('sha256', accessKeySecret).update([algorithm, hash].join('\n')).digest().toString('hex');
  const signature = await hmac('sha256', accessKeySecret, [algorithm, hash].join('\n'), 'hex');

  if (debug) {
    console.log(`> canonical\n${canonical}`);
    console.log(`> hash\n${hash}`);
    console.log(`> signature ${algorithm}\n${signature}`);
  }

  const authorization = `${algorithm} Credential=${accessKeyId},SignedHeaders=${signedHeaders},Signature=${signature}`;
  return {
    signature,
    authorization,
    date,
    nonce,
    headers: {
      ...headers,
      authorization,
    },
  };
}

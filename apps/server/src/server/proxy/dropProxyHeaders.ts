const ShouldDropHeaders = [
  // res
  'accept-ranges',
  'cache-control',
  'set-cookie',
  'content-length',
  'content-encoding',
  'etag',
  'last-modified',
  'server',
  'connection',
  'transfer-encoding',
  'vary',
  'x-frame-options',
  'via',
  // req
  'host',
  'referer',
  'origin',
  'if-none-match',
  'if-modified-since',
  'upgrade-insecure-requests',
  'date',
  'pragma',
  'sec-ch-ua',
  'sec-ch-ua-mobile',
  'sec-ch-ua-platform',
  'sec-fetch-dest',
  'sec-fetch-mode',
  'sec-fetch-site',
  'sec-fetch-user',
  'user-agent', // privacy

  // qq/wechat
  'chid',
  'fid',
  'user-returncode',
  'x-bcheck',
  'x-cpt',
  'x-datasrc',
  'x-delay',
  'x-info',
  'x-nws-log-uuid',
  'x-reqgue',
];

export function dropProxyHeaders(headers: Headers) {
  const drop = ShouldDropHeaders;
  drop.forEach((k) => headers.delete(k));
  return headers;
}

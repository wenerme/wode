const ApiUrl = 'https://apis.wener.me/open/';

export function getOpenApiUrl(pathname?: string, o?: { params: Record<string, any> }) {
  let url =
    !pathname || /^https?:/.test(pathname)
      ? new URL(pathname || ApiUrl)
      : new URL(pathname.replaceAll(/^\//g, ''), ApiUrl);
  if (o?.params) {
    Object.entries(o.params).forEach(([k, v]) => url.searchParams.append(k, v));
  }
  return url.toString();
}

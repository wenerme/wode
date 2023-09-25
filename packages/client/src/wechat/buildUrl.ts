export interface BuildAuthorizeUrlOptions {
  appid?: string;
  redirect_uri?: string;
  response_type?: string;
  scope?: 'snsapi_base' | 'snsapi_userinfo';
  state?: string;
  forcePopup?: boolean;

  [k: string]: any;
}

export function buildAuthorizeUrl({
  appid = process.env.WECHAT_APP_ID || process.env.NEXT_PUBLIC_WECHAT_APP_ID,
  redirect_uri = globalThis.location?.href,
  ...o
}: BuildAuthorizeUrlOptions = {}) {
  const u = new URL('https://open.weixin.qq.com/connect/oauth2/authorize#wechat_redirect');
  if (!appid) {
    throw new Error(`buildAuthorizeUrl: appid is required`);
  }
  if (!redirect_uri) {
    throw new Error(`buildAuthorizeUrl: redirect_uri is required`);
  }
  Object.entries({
    appid,
    redirect_uri,
    response_type: 'code',
    scope: 'snsapi_base',
    ...o,
  })
    .filter((v) => v[1])
    .forEach((v) => {
      u.searchParams.append(v[0], String(v[1]));
    });
  return u.toString();
}

export function buildOfficialAccountProfileUrl({
  uin = process.env.WECHAT_OA_UIN || process.env.NEXT_PUBLIC_WECHAT_OA_UIN,
}: { uin?: string } = {}) {
  if (!uin) {
    throw new Error('buildOfficialAccountProfileUrl: uin required');
  }
  return `https://mp.weixin.qq.com/mp/profile_ext?action=home&__biz=${btoa(uin)}&scene=124#wechat_redirect`;
}

export function buildShowQrcodeUrl(o: { ticket: string }) {
  const url = new URL(`https://mp.weixin.qq.com/cgi-bin/showqrcode`);
  Object.entries(o).forEach(([k, v]) => {
    url.searchParams.append(k, v);
  });
  return url.toString();
}

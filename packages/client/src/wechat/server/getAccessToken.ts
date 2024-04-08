import { request, RequestOptions } from './request';

interface AccessTokenResponse {
  // 至少保留 512 字节
  access_token: string;
  expires_in: number;
}

export function getAccessToken(
  {
    grant_type = 'client_credential',
    appid,
    secret,
  }: {
    grant_type?: string;
    appid: string;
    secret: string;
  },
  opts: Partial<RequestOptions> = {},
) {
  return request<AccessTokenResponse>({
    ...opts,
    url: 'token',
    params: {
      grant_type,
      appid,
      secret,
    },
  });
}

/**
 * 获取稳定版接口调用凭据
 *
 * -  1万 次每分钟， 50万 次每天
 *
 * @see https://developers.weixin.qq.com/miniprogram/dev/OpenApiDoc/mp-access-token/getStableAccessToken.html
 */
export function getStableAccessToken(
  params: {
    grant_type?: string;
    force_refresh?: boolean; // 导致上一次 access_token 失效，一天 20 次，间隔至少 30s 才会刷新
    appid: string;
    secret: string;
  },
  opts: Partial<RequestOptions> = {},
) {
  return request<AccessTokenResponse>({
    ...opts,
    url: 'stable_token',
    body: {
      grant_type: 'client_credential',
      ...params,
    },
  });
}

export function code2session(
  params: {
    grant_type?: string;
    appid: string;
    secret: string;
    js_code: string;
  },
  opts: Partial<RequestOptions> = {},
) {
  return request<{
    session_key: string;
    openid: string;
    unionid?: string;
  }>({
    ...opts,
    url: 'https://api.weixin.qq.com/sns/jscode2session',
    params: {
      grant_type: 'authorization_code',
      ...params,
    },
  });
}

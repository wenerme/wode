import { TokenSet } from 'next-auth';
import { Provider } from 'next-auth/providers';

// https://developer.work.weixin.qq.com/document/path/91023
export interface AuthGetUserInfoResponse {
  userid?: string;
  user_ticket?: string;
  openid?: string;
  external_userid?: string;
}

export function WecomWebProvider({
  clientId,
  clientSecret,
  agentId,
  accessTokenProvider: _accessTokenProvider,
}: {
  clientId: string;
  agentId: string | number;
  clientSecret?: string;
  accessTokenProvider?: (options: {
    clientId: string;
    clientSecret?: string;
    agentId: string | number;
  }) => Promise<string>;
}): Provider {
  if (!_accessTokenProvider && !clientSecret) {
    throw new Error('appSecret or accessTokenProvider must be provided');
  }

  let token: { expires_at: number; token: string } | undefined;
  let get: Promise<{ expires_at: number; token: string }> | undefined;
  const accessTokenProvider =
    _accessTokenProvider ||
    (async ({ clientId, clientSecret }) => {
      if (token?.token && token.expires_at > Date.now()) {
        return token.token;
      }
      if (!get) {
        get = Promise.resolve().then(async () => {
          const resp = await fetch(
            `https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=${clientId}&corpsecret=${clientSecret}`,
          ).then((v) => v.json());
          if (resp.errcode) {
            throw new Error(resp.errmsg);
          }
          token = {
            token: resp.access_token,
            expires_at: Date.now() + resp.expires_in * 1000 - 5000,
          };
          get = undefined;
          return token;
        });
      }
      return await get.then((res) => res.token);
    });

  return {
    id: `wecom-web@${clientId}@${agentId}`,
    name: '企业微信网页登录',
    type: 'oauth',
    clientId,
    clientSecret,
    userinfo: {
      url: 'https://qyapi.weixin.qq.com/cgi-bin/auth/getuserinfo',
      async request({ client, provider, tokens }) {
        const url = new URL((provider.userinfo as any).url);
        url.search = new URLSearchParams({
          ...(provider.userinfo as any).params,
          access_token: await accessTokenProvider({ clientId, clientSecret, agentId }),
          code: tokens.code,
        } as Record<string, string>).toString();

        const r = (await fetch(url).then((v) => v.json())) as AuthGetUserInfoResponse;

        return {
          sub: r.openid || r.userid,
          ...r,
        };
      },
    },
    authorization: {
      // https://open.weixin.qq.com/connect/oauth2/authorize?appid=CORPID&redirect_uri=REDIRECT_URI&response_type=code&scope=snsapi_base&state=STATE&agentid=AGENTID#wechat_redirect
      url: 'https://open.weixin.qq.com/connect/oauth2/authorize#wechat_redirect',
      params: {
        appid: clientId,
        response_type: 'code',
        scope: 'snsapi_base',
      },
    },
    token: {
      async request({ provider, client, params, checks }) {
        return { tokens: { code: params.code, expires_at: 5 * 60 * 1000 + Date.now() } as TokenSet };
      },
    },
    profile(profile, tokens) {
      return {
        ...profile,
        id: profile.openid,
      };
    },
    // not checked yet, i don't know how
    // checks: ['state'],
  };
}

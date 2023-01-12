import { Provider } from 'next-auth/providers';

export interface SnsOAuth2AccessTokenResponse {
  openid: string;
  unionid: string;
  scope: string;
  access_token: string;
  refresh_token: string; // 30d
  expires_in: number; // 7200
}

export interface SnsUserInfoResponse {
  openid: string;
  nickname: string;
  sex: number; // 值为1时是男性，值为2时是女性，值为0时是未知
  province: string;
  city: string;
  country: string;
  headimgurl: string;
  privilege: string[];
  unionid: string;
}

export function WechatWebProvider({ clientId, clientSecret }: { clientId: string; clientSecret: string }): Provider {
  return {
    id: `wechat-web@${clientId}`,
    name: '微信网页登录',
    type: 'oauth',
    clientId,
    clientSecret,
    userinfo: {
      url: 'https://api.weixin.qq.com/sns/userinfo',
      async request({ client, provider, tokens }) {
        const url = new URL((provider.userinfo as any).url);
        url.search = new URLSearchParams({
          ...(provider.userinfo as any).params,
          access_token: tokens.access_token,
          openid: tokens.openid,
        } as Record<string, string>).toString();

        const r = (await fetch(url).then((v) => v.json())) as SnsUserInfoResponse;
        return {
          sub: r.openid,
          name: r.nickname,
          image: r.headimgurl,
          ...r,
        };
      },
    },
    authorization: {
      // `https://open.weixin.qq.com/connect/qrconnect?appid=APPID&redirect_uri=REDIRECT_URI&response_type=code&scope=SCOPE&state=STATE#wechat_redirect`
      url: `https://open.weixin.qq.com/connect/qrconnect#wechat_redirect`,
      params: {
        appid: clientId,
        response_type: 'code',
        scope: 'snsapi_login',
      },
    },
    token: {
      // https://api.weixin.qq.com/sns/oauth2/access_token?appid=APPID&secret=SECRET&code=CODE&grant_type=authorization_code
      url: 'https://api.weixin.qq.com/sns/oauth2/access_token',
      params: {
        appid: clientId,
        secret: clientSecret,
        grant_type: 'authorization_code',
      },
      async request({ provider, client, params, checks }) {
        const url = new URL((provider.token as any).url);
        url.search = new URLSearchParams(params as Record<string, string>).toString();
        const r = (await fetch(url).then((v) => v.json())) as SnsOAuth2AccessTokenResponse;
        return { tokens: { ...r } };
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

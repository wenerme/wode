import type { Logger } from '@wener/utils';
import { isDefined } from '@wener/utils';
import type { Token, TokenProvider } from './Token';
import { createDummyTokenProvider } from './Token';

export const TokenTypes = {
  AppSecret: 'AppSecret',
  AccessToken: 'AccessToken',
  JsTicket: 'JsTicket',
};

export class WechatServerClient {
  options: ClientOptions = {
    fetch: globalThis.fetch,
    baseUrl: 'https://api.weixin.qq.com/cgi-bin/',
    logger: console,
    tokenProvider: createDummyTokenProvider(),
  };

  constructor(options: Partial<ClientOptions> = {}) {
    this.options = {
      ...this.options,
      ...options,
    };
  }

  async request<T>(o: RequestOptions): Promise<T> {
    const { fetch, baseUrl, logger } = this.options;
    let { method = 'GET', params, body } = o;
    const u = new URL(o.url.replace(/^\/+/, ''), baseUrl);
    if (params) {
      if ('appid' in params) {
        params.appid ||= this.options.appId;
        if (!params.appid) {
          throw new Error('appid required');
        }
      }
      if ('secret' in params) {
        params.secret ||=
          this.options.appSecret ||
          (await this.options.tokenProvider(params.appid, TokenTypes.AppSecret).then((v) => v.token));
      }
      if ('access_token' in params) {
        params.access_token ||= await this.accessToken({ appid: params.appid, secret: params.secret }).then(
          (v) => v.token,
        );
      }
      const p = u.searchParams;
      Object.entries(params)
        .filter((v) => isDefined(v[1]))
        .forEach(([k, v]) => p.set(k, v));
    }
    if (body) {
      body = JSON.stringify(body);
    }

    const url = u.toString();
    const resp = await fetch(url, {
      method,
      body,
    });
    u.searchParams.delete('secret');
    u.searchParams.delete('access_token');
    const masked = u.toString();
    if (!resp.ok) {
      logger.error(`WechatServerClient request failed: ${masked} ${resp.status} ${resp.statusText}`);
      throw Object.assign(
        new Error(`WechatServerClient: request ${masked} failed: ${resp.status} ${resp.statusText}`),
        {
          url,
          // response: resp
        },
      );
    }
    const data = await resp.json();

    if (data.errcode) {
      logger.error(`WechatServerClient request failed: ${masked} ${data.errcode} ${data.errmsg}`);
      throw Object.assign(new Error(`WechatServerClient: request ${masked} failed: ${data.errcode} ${data.errmsg}`), {
        url,
        data,
        // response: resp,
        code: data.errcode,
      });
    }
    return data;
  }

  /**
   * @see https://developers.weixin.qq.com/doc/offiaccount/User_Management/Get_users_basic_information_UnionID.html UnionID机制
   */
  userInfo({ access_token, openid, lang = 'zh_CN' }: { access_token?: string; openid: string; lang?: string }) {
    return this.request<UserInfoResponse>({
      url: '/user/info',
      params: {
        access_token,
        openid,
        lang,
      },
    });
  }

  userInfoBatch({
    access_token,
    users,
    lang = 'zh_CN', // zh_TW,en
  }: {
    access_token?: string;
    users: Array<{ openid: string; lang?: string }>;
    lang?: string;
  }) {
    return this.request<UserInfoResponse>({
      method: 'POST',
      url: '/user/info/batchget',
      params: {
        access_token,
        lang,
      },
      body: {
        user_list: users,
      },
    });
  }

  async accessToken({
    appid = this.options.appId,
    secret,
    refresh,
  }: { appid?: string; secret?: string; refresh?: boolean } & ApiRequestOptions = {}): Promise<Token> {
    if (!appid) {
      throw new Error('appid required');
    }
    if (!secret) {
      secret = await this.options.tokenProvider(appid, TokenTypes.AppSecret).then((v) => v.token);
    }
    if (!refresh) {
      return await this.options.tokenProvider(appid, TokenTypes.AccessToken, {
        getter: () => this.accessToken({ appid, secret, refresh: true }),
      });
    }
    const { access_token, expires_in }: TokenResponse = await this.request({
      url: '/token',
      params: {
        grant_type: 'client_credential',
        appid,
        secret,
      },
    });
    return {
      appId: appid,
      type: TokenTypes.AccessToken,
      token: access_token,
      expiresIn: expires_in,
      expiresAt: Date.now() + expires_in * 1000 - 2000, // ensure valid
    };
  }

  async snsOauth2RefreshToken({
    appid,
    grant_type = 'refresh_token',
    refresh_token,
  }: {
    appid?: string;
    grant_type?: string;
    refresh_token: string;
  }) {
    return await this.request({
      url: 'https://api.weixin.qq.com/sns/oauth2/refresh_token',
      params: {
        appid,
        grant_type,
        refresh_token,
      },
    });
  }

  async snsOauth2AccessToken({
    appid,
    secret,
    code,
    grant_type = 'authorization_code',
  }: {
    appid?: string;
    secret?: string;
    code: string;
    grant_type?: string;
    refresh?: boolean;
  } & ApiRequestOptions): Promise<SnsOAuth2TokenResponse> {
    return await this.request({
      url: 'https://api.weixin.qq.com/sns/oauth2/access_token',
      params: {
        appid,
        secret,
        code,
        grant_type,
      },
    });
  }

  /**
   * 获取用户信息, scope=snsapi_userinfo
   */
  async snsUserInfo({
    access_token,
    openid,
    lang = 'zh_CN',
  }: {
    access_token?: string;
    openid: string;
    lang?: string;
  }) {
    return await this.request({
      url: 'https://api.weixin.qq.com/sns/userinfo',
      params: {
        access_token,
        openid,
        lang,
      },
    });
  }

  /**
   * check {@link access_token} is still valid
   */
  async snsAuth({ access_token, openid }: { access_token?: string; openid: string }) {
    return await this.request<ErrorResponse>({
      url: 'https://api.weixin.qq.com/sns/auth',
      params: {
        access_token,
        openid,
      },
    });
  }
}

export interface RequestOptions {
  method?: string;
  url: string;
  params?: Record<string, any>;
  body?: any;
}

interface ClientOptions {
  fetch: (url: string, options: RequestInit) => Promise<Response>;
  baseUrl: string;
  logger: Logger;
  appId?: string;
  appSecret?: string;
  tokenProvider: TokenProvider;
}

export interface ApiRequestOptions {}

export interface TokenResponse {
  access_token: string;
  expires_in: number;
}

export interface SnsOAuth2TokenResponse {
  access_token: string;
  expires_in: string;
  refresh_token: string; // 30天
  openid: string;
  scope: string;
  is_snapshotuser: number;
}

export interface ErrorResponse {
  errcode: number;
  errmsg: string;
}

export interface UserInfoResponse {
  subscribe: number; // 用户是否订阅该公众号标识，值为0时，代表此用户没有关注该公众号，拉取不到其余信息。
  openid: string; // 用户的标识，对当前公众号唯一
  nickname: string;
  sex: number;
  language: string; // 用户的语言，简体中文为zh_CN
  city: string;
  province: string;
  country: string;
  headimgurl: string;
  subscribe_time: number; // 用户关注时间，为时间戳。如果用户曾多次关注，则取最后关注时间
  unionid: string; // 只有在用户将公众号绑定到微信开放平台帐号后，才会出现该字段。
  remark: string; // 公众号运营者对粉丝的备注，公众号运营者可在微信公众平台用户管理界面对粉丝添加备注
  groupid: number; // 用户所在的分组ID（兼容旧的用户分组接口）
  tagid_list?: string[];
  subscribe_scene: string; // 关注的渠道来源
  qr_scene: number; // 二维码扫码场景（开发者自定义）
  qr_scene_str: string; // 二维码扫码场景描述（开发者自定义）
}

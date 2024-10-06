import { Errors, FetchLike } from '@wener/utils';
import { createExpireValueHolder, ExpireValueHolderInit, ExpiryValue, ExpiryValueHolder } from '../../ExpiryValue';
import { getAccessToken, getStableAccessToken } from './getAccessToken';
import { request, RequestOptions } from './request';
import { GetDomainInfoResponse, GetOpenAPIQuotaResponse } from './types';

export interface WechatServerClientInit {
  fetch?: FetchLike;
  appId?: string;
  appSecret?: string;
  accessToken?: ExpireValueHolderInit;
  stableAccessToken?: ExpireValueHolderInit;
  onAccessToken?: (data: ExpiryValue) => void;
  debug?: boolean;
  onStableAccessToken?: (data: ExpiryValue) => void;
}

export interface WechatServerClientOptions {
  appId?: string;
  appSecret?: string;
  accessToken: ExpiryValueHolder;
  stableAccessToken: ExpiryValueHolder;
  debug: boolean;
}

export class WechatServerClient {
  static create({
    appSecret,
    appId,
    accessToken,
    stableAccessToken,
    onAccessToken,
    onStableAccessToken,
    ...init
  }: WechatServerClientInit) {
    return new WechatServerClient({
      debug: false,
      fetch: globalThis.fetch,
      accessToken: createExpireValueHolder({
        value: accessToken,
        onLoad: onAccessToken,
        loader: () => {
          if (!appId || !appSecret) {
            throw new Error('appId and appSecret is required');
          }
          return getAccessToken({ appid: appId, secret: appSecret }).then(({ access_token, expires_in }) => {
            return {
              value: access_token,
              expiresAt: new Date(Date.now() + expires_in * 1000),
            };
          });
        },
      }),

      stableAccessToken: createExpireValueHolder({
        value: stableAccessToken,
        onLoad: onStableAccessToken,
        loader: () => {
          if (!appId || !appSecret) {
            throw new Error('appId and appSecret is required');
          }
          return getStableAccessToken({ appid: appId, secret: appSecret }).then(({ access_token, expires_in }) => {
            return {
              value: access_token,
              expiresAt: new Date(Date.now() + expires_in * 1000),
            };
          });
        },
      }),
      appId,
      appSecret,
      ...init,
    });
  }

  constructor(readonly options: WechatServerClientOptions) {}

  with(o: Partial<WechatServerClientOptions>) {
    return new WechatServerClient({
      ...this.options,
      ...o,
    });
  }

  async getAccessToken() {
    return this.options.accessToken.get();
  }

  async getStableAccessToken() {
    return this.options.stableAccessToken.get();
  }

  async getOpenAPIQuota(params: {
    cgi_path: string; // 例如 /cgi-bin/message/custom/send
  }) {
    return this.request<GetOpenAPIQuotaResponse>({
      url: 'openapi/quota/get',
      method: 'POST',
      params: {
        access_token: true,
      },
      body: params,
    });
  }

  /**
   * @see https://developers.weixin.qq.com/miniprogram/dev/OpenApiDoc/operation/getDomainInfo.html
   */
  async getDomainInfo() {
    return this.request<GetDomainInfoResponse>({
      url: 'https://api.weixin.qq.com/wxa/getwxadevinfo',
      params: {
        access_token: true,
      },
    });
  }

  async ping() {
    await this.getApiDomainIps();
  }

  /**
   *
   * @see https://developers.weixin.qq.com/miniprogram/dev/OpenApiDoc/user-login/code2Session.html
   */
  async code2Session(params: { appid?: string; secret?: string; js_code: string; grant_type?: string }) {
    return this.request<{
      openid: string;
      session_key: string;
      unionid?: string; // 若当前小程序已绑定到微信开放平台账号下会返回
    }>({
      url: 'https://api.weixin.qq.com/sns/jscode2session',
      params: {
        appid: true,
        secret: true,
        grant_type: 'authorization_code',
        ...params,
      },
    });
  }

  /**
   *
   * @see https://developers.weixin.qq.com/miniprogram/dev/OpenApiDoc/user-login/checkSessionKey.html
   */
  async checkSessionKey(params: { openid: string; sig_method: 'hmac_sha256'; signature: string }) {
    return this.request<{
      errcode: number;
      errmsg: string;
    }>({
      url: 'https://api.weixin.qq.com/wxa/checksession',
      params: {
        ...params,
        access_token: true,
      },
    });
  }

  async resetSessionKey(params: { openid: string; sig_method: 'hmac_sha256'; signature: string }) {
    return this.request<{
      openid: string;
      session_key: string;
    }>({
      url: 'https://api.weixin.qq.com/wxa/resetusersessionkey',
      params: {
        ...params,
        access_token: true,
      },
    });
  }

  /**
   * 检测后台配置的回调地址
   *
   * @see https://developers.weixin.qq.com/doc/offiaccount/Basic_Information/Network_Detection.html
   */
  async checkCallback(
    params: {
      action?: 'all' | 'dns' | 'ping';
      check_operator?: 'DEFAULT' | 'CHINANET' | 'UNICOM' | 'CAP'; // CAP 为腾讯自建
    } = {},
  ) {
    return this.request<{
      dns: Array<{
        ip: string;
        real_operator: string;
      }>;
      ping: Array<{
        ip: string;
        from_operator: string;
        package_loss: number;
        time: string;
      }>;
    }>({
      url: 'https://api.weixin.qq.com/cgi-bin/callback/check',
      params: {
        access_token: true,
      },
      body: {
        action: 'all',
        check_operator: 'DEFAULT',
        ...params,
      },
    });
  }

  async getCallbackIps() {
    return this.request<{ ip_list: string[] }>({
      url: 'https://api.weixin.qq.com/cgi-bin/getcallbackip',
      params: {
        access_token: true,
      },
    });
  }

  async getApiDomainIps() {
    return this.request<{ ip_list: string[] }>({
      url: 'https://api.weixin.qq.com/cgi-bin/get_api_domain_ip',
      params: {
        access_token: true,
      },
    });
  }

  async request<T>(o: RequestOptions): Promise<T> {
    const { params } = o;
    if (params) {
      if (params['appid'] === true) {
        params.appid = Errors.BadRequest.require(this.options.appId, 'client config without appId');
      }
      if (params['secret'] === true) {
        params.secret = Errors.BadRequest.require(this.options.appSecret, 'client config without appSecret');
      }
      if (params['access_token'] === true) {
        params.access_token = await this.getAccessToken();
      }
    }
    o.debug ??= this.options.debug;
    return request(o);
  }
}

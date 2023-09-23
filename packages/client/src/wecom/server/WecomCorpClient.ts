import { FetchLike } from '@wener/utils';
import { createExpireValueHolder, CreateExpireValueHolderOptions } from '../../ExpiryValue';
import { getValue, MaybeValueHolder, ReadonlyValueHolder } from '../../ValueHolder';
import { createJsSdkSignature } from '../../wechat';
import { request, RequestOptions } from './request';

// type ExpireValueLike<T, P extends any[] = any[]> = MaybeFunction<ReadonlyValueHolder<T>, P> | ExpiryValue<T>;
// type ClientExpiryValue = ExpireValueLike<string, [{ client: WecomCorpClient; loader: () => ExpiryValue<string> }]>;

export interface WecomCorpClientInitOptions {
  corpId: string;
  corpSecret: MaybeValueHolder<string>;
  accessToken?: CreateExpireValueHolderOptions<string>['value'];
  jsApiTicket?: CreateExpireValueHolderOptions<string>['value'];
  agentJsApiTicket?: CreateExpireValueHolderOptions<string>['value'];
  onAccessToken?: (data: { value: string; expiresAt: Date }) => void;
  onJsApiTicket?: (data: { value: string; expiresAt: Date }) => void;
  onAgentJsApiTicket?: (data: { value: string; expiresAt: Date }) => void;
  fetch?: FetchLike;
}

export interface WecomCorpClientOptions {
  corpId: string;
  corpSecret: MaybeValueHolder<string>;
  accessToken: ReadonlyValueHolder<string>;
  jsApiTicket: ReadonlyValueHolder<string>;
  agentJsApiTicket: ReadonlyValueHolder<string>;
  fetch: FetchLike;
}

export class WecomCorpClient {
  readonly options: WecomCorpClientOptions;

  constructor({
    onAccessToken,
    accessToken,
    jsApiTicket,
    agentJsApiTicket,
    onJsApiTicket,
    onAgentJsApiTicket,
    ...options
  }: WecomCorpClientInitOptions) {
    this.options = {
      fetch: globalThis.fetch,
      accessToken: createExpireValueHolder<string>({
        value: accessToken,
        onLoad: onAccessToken,
        loader: async () => {
          const { access_token, expires_at } = await this.getAccessToken();
          return {
            value: access_token,
            expiresAt: expires_at,
          };
        },
      }),
      jsApiTicket: createExpireValueHolder<string>({
        value: jsApiTicket,
        onLoad: onJsApiTicket,
        loader: async () => {
          const { ticket, expires_at } = await this.getJsApiTicket();
          return {
            value: ticket,
            expiresAt: expires_at,
          };
        },
      }),
      agentJsApiTicket: createExpireValueHolder<string>({
        value: agentJsApiTicket,
        onLoad: onAgentJsApiTicket,
        loader: async () => {
          const { ticket, expires_at } = await this.getAgentJsApiTicket();
          return {
            value: ticket,
            expiresAt: expires_at,
          };
        },
      }),
      ...options,
    };
  }

  /**
   * https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=ID&corpsecret=SECRET
   *
   * @see https://developer.work.weixin.qq.com/document/path/91039
   */
  getAccessToken() {
    return this.request<GetAccessTokenResponse>({
      url: '/cgi-bin/gettoken',
      params: {
        corpid: true,
        corpsecret: true,
      },
    }).then((v) => {
      v.expires_at = Date.now() + v.expires_in * 1000;
      return v;
    });
  }

  /**
   * https://qyapi.weixin.qq.com/cgi-bin/get_jsapi_ticket?access_token=ACCESS_TOKEN
   */
  getJsApiTicket() {
    return this.request<GetJsApiTicketResponse>({
      url: '/cgi-bin/get_jsapi_ticket',
      params: {
        access_token: true,
      },
    }).then((v) => {
      v.expires_at = Date.now() + v.expires_in * 1000;
      return v;
    });
  }

  /**
   * https://qyapi.weixin.qq.com/cgi-bin/ticket/get?access_token=ACCESS_TOKEN&type=agent_config
   */
  getAgentJsApiTicket() {
    return this.request<GetJsApiTicketResponse>({
      url: '/cgi-bin/ticket/get',
      params: {
        access_token: true,
        type: 'agent_config',
      },
    });
  }

  async getJsSdkSignature({ url, timestamp, nonce }: { url: string; timestamp?: number; nonce?: string }) {
    return createJsSdkSignature({
      url,
      timestamp,
      nonce,
      ticket: await this.options.jsApiTicket.get(),
    });
  }

  async getAgentJsSdkSignature({ url, timestamp, nonce }: { url: string; timestamp?: number; nonce?: string }) {
    return createJsSdkSignature({
      url,
      timestamp,
      nonce,
      ticket: await this.options.agentJsApiTicket.get(),
    });
  }

  async request<T>(o: RequestOptions<T>): Promise<T> {
    o.params ||= {};
    const preset: Record<string, MaybeValueHolder<any>> = {
      corpid: () => this.options.corpId,
      corpsecret: () => this.options.corpSecret,
      access_token: () => this.options.accessToken,
    };
    for (const [k, v] of Object.entries(preset)) {
      if (o.params[k] === true) {
        o.params[k] = await getValue(v());
      }
    }
    o.fetch ||= this.options.fetch;
    return request<T>(o);
  }
}

export interface GetAccessTokenResponse {
  access_token: string;
  expires_at: number;
  expires_in: number;
}

export interface GetJsApiTicketResponse {
  ticket: string;
  expires_in: number;
  expires_at: number;
}

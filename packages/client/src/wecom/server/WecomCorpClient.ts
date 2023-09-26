import { FetchLike } from '@wener/utils';
import { createExpireValueHolder, CreateExpireValueHolderOptions, ExpiryValueHolder } from '../../ExpiryValue';
import { getValue, MaybeValueHolder } from '../../ValueHolder';
import { createJsSdkSignature } from '../../wechat';
import { CreateUserRequest, DepartmentInput, DepartmentOutput, GeneralResponse, GetUserResponse } from './api';
import { request, RequestOptions } from './request';

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
  accessToken: ExpiryValueHolder<string>;
  jsApiTicket: ExpiryValueHolder<string>;
  agentJsApiTicket: ExpiryValueHolder<string>;
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
    }).then((v) => {
      v.expires_at = Date.now() + v.expires_in * 1000;
      return v;
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

  /**
   * @see https://developer.work.weixin.qq.com/document/path/91023
   */
  getUserInfoByAuthCode({ code }: { code: string }) {
    return this.request<{
      userid?: string;
      user_ticket?: string; // snsapi_privateinfo, 1800s

      openid?: string;
      external_userid?: string;
    }>({
      url: '/cgi-bin/auth/getuserinfo',
      params: {
        access_token: true,
        code,
      },
    });
  }

  /**
   * @see https://developer.work.weixin.qq.com/document/path/95833
   */
  getUserDetailByUserTicket({ user_ticket }: { user_ticket: string }) {
    return this.request<{
      gender: string; // 1 男 2 女 0 未知
      avatar: string;
      qr_code: string;
      mobile: string;
      email: string;
      biz_mail: string;
      address: string;
    }>({
      url: '/cgi-bin/auth/getuserdetail',
      params: {
        access_token: true,
      },
      body: {
        user_ticket,
      },
    });
  }

  /**
   * @see https://developer.work.weixin.qq.com/document/path/90196
   */
  getUser({ userid }: { userid: string }) {
    return this.request<GetUserResponse>({
      url: '/cgi-bin/user/get',
      params: {
        access_token: true,
        userid,
      },
    });
  }

  /**
   * @see https://developer.work.weixin.qq.com/document/path/90198
   */
  deleteUser({ userid }: { userid: string }) {
    return this.request<GeneralResponse>({
      url: '/cgi-bin/user/delete',
      params: {
        access_token: true,
        userid,
      },
    });
  }

  /**
   * @see https://developer.work.weixin.qq.com/document/path/90199
   */
  batchDeleteUser({ useridlist }: { useridlist: string[] }) {
    return this.request<GeneralResponse>({
      url: '/cgi-bin/user/delete',
      params: {
        access_token: true,
      },
      body: {
        useridlist,
      },
    });
  }

  /**
   * @see https://developer.work.weixin.qq.com/document/path/90195
   */
  createUser(data: CreateUserRequest) {
    return this.request<GeneralResponse>({
      url: '/cgi-bin/user/create',
      params: {
        access_token: true,
      },
      body: data,
    });
  }

  /**
   * @see https://developer.work.weixin.qq.com/document/path/90197
   */
  updateUser(data: CreateUserRequest) {
    return this.request<GeneralResponse>({
      url: '/cgi-bin/user/update',
      params: {
        access_token: true,
      },
      body: data,
    });
  }

  /**
   * @see https://developer.work.weixin.qq.com/document/path/96021
   */
  listUserId({ cursor, limit }: { limit?: number; cursor?: string }) {
    return this.request<{
      next_cursor: string;
      dept_user: Array<{
        open_userid: string;
        department: number;
      }>;
    }>({
      url: '/cgi-bin/user/list_id',
      params: {
        access_token: true,
        cursor,
        limit,
      },
      method: 'POST',
    });
  }

  /**
   * @see https://developer.work.weixin.qq.com/document/path/95350
   */
  listDepartmentId({ id }: { id?: string | number }) {
    return this.request<{
      department_id: Array<{
        id: number;
        parentid: number; // root=1
        order: number;
      }>;
    }>({
      url: '/cgi-bin/department/simplelist',
      params: {
        access_token: true,
        id,
      },
    });
  }

  /**
   * @see https://developer.work.weixin.qq.com/document/path/90205
   */
  createDepartment(data: DepartmentInput) {
    return this.request<GeneralResponse & { id: number }>({
      url: '/cgi-bin/department/create',
      params: {
        access_token: true,
      },
      body: data,
    });
  }

  /**
   * @see https://developer.work.weixin.qq.com/document/path/90206
   */
  updateDepartment(data: DepartmentInput & { id: string | number }) {
    return this.request<GeneralResponse & { id: number }>({
      url: '/cgi-bin/department/update',
      params: {
        access_token: true,
      },
      body: data,
    });
  }

  /**
   * @see https://developer.work.weixin.qq.com/document/path/90207
   */
  deleteDepartment({ id }: { id: number | string }) {
    return this.request<GeneralResponse>({
      url: '/cgi-bin/department/delete',
      params: {
        access_token: true,
        id,
      },
    });
  }

  /**
   * @see https://developer.work.weixin.qq.com/document/path/95351
   */
  getDepartment({ id }: { id: number | string }) {
    return this.request<{
      department: DepartmentOutput;
    }>({
      url: '/cgi-bin/department/delete',
      params: {
        access_token: true,
        id,
      },
    });
  }

  /**
   * @see https://developer.work.weixin.qq.com/document/path/90200
   * @deprecated
   */
  listDepartmentMember({ department_id }: { department_id: string | number }) {
    return this.request<{
      userlist: Array<{
        userid: string;
        name: string;
        department: Array<number>;
        open_userid: string;
      }>;
    }>({
      url: '/cgi-bin/user/simplelist',
      params: {
        access_token: true,
        department_id,
      },
    });
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

// enum SecretType {
//   AccessToken = 'AccessToken',
//   JsApiTicket = 'JsApiTicket',
//   AgentJsApiTicket = 'AgentJsApiTicket',
//   CorpSecret = 'CorpSecret',
//   // ServerEncodingAESKey
// }

import { FetchLike } from '@wener/utils';
import { createExpireValueHolder, CreateExpireValueHolderOptions, ExpiryValueHolder } from '../../ExpiryValue';
import { getValue, MaybeValueHolder } from '../../ValueHolder';
import { createJsSdkSignature } from '../../wechat';
import { CreateUserRequest, DepartmentInput, DepartmentOutput, GeneralResponse, GetUserResponse } from './api';
import { request, RequestOptions } from './request';
import {
  BatchGetExternalContactByUserResponse,
  GetExternalContactGroupChat,
  GetExternalContactResponse,
  GetMessageAuditGroupChatResponse,
} from './types';

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
   * @see https://developer.work.weixin.qq.com/document/path/90202 userid转openid
   */
  convertUserIdToOpenId(body: { userid: string }) {
    return this.request<{ openid: string }>({
      method: 'POST',
      url: '/cgi-bin/user/convert_to_openid',
      params: {
        access_token: true,
      },
      body,
    });
  }

  convertOpenIdToUserId(body: { openid: string }) {
    return this.request<{ userid: string }>({
      method: 'POST',
      url: '/cgi-bin/user/convert_to_userid',
      params: {
        access_token: true,
      },
      body,
    });
  }

  /**
   * @see https://developer.work.weixin.qq.com/document/path/92951 获取会话内容存档内部群信息
   */
  getMessageAuditGroupChat(body: { roomid: string }) {
    return this.request<GetMessageAuditGroupChatResponse>({
      method: 'POST',
      url: '/cgi-bin/msgaudit/groupchat/get',
      params: {
        access_token: true,
      },
      body,
    });
  }


  /**
   * @see https://developer.work.weixin.qq.com/document/path/91614 获取会话内容存档开启成员列表
   */
  getMessageAuditPermitUserList(
    params: {
      // 拉取对应版本的开启成员列表。1表示办公版；2表示服务版；3表示企业版。非必填，不填写的时候返回全量成员列表。
      type?: number;
    } = {},
  ) {
    return this.request<{ ids: string[] }>({
      url: '/cgi-bin/msgaudit/get_permit_user_list',
      params: {
        access_token: true,
        ...params,
      },
    });
  }

  /**
   * @see https://developer.work.weixin.qq.com/document/path/91774 获取机器人信息
   */
  getMessageAuditRobotInfo(params: { access_token?: string; robot_id: string }) {
    return this.request<{
      data: {
        name: string;
        robot_id: string;
        creator_userid: string;
      };
    }>({
      url: '/cgi-bin/msgaudit/get_robot_info',
      params: {
        access_token: true,
        ...params,
      },
    });
  }

  /**
   * @see https://developer.work.weixin.qq.com/document/path/95327 转换external-userid
   */
  getExternalContactNewExternalUserId({
                                        access_token,
                                        ...body
                                      }: {
    access_token?: string;
    external_userid_list: string[];
  }) {
    return this.request({
      method: 'POST',
      url: '/cgi-bin/externalcontact/get_new_external_userid',
      params: {
        access_token,
      },
      body,
    });
  }


  /**
   * @see https://developer.work.weixin.qq.com/document/path/96721 外部联系人openid转换
   */
  convertExternalContactUserIdToOpenId(body: { external_userid: string }) {
    return this.request({
      method: 'POST',
      url: '/cgi-bin/externalcontact/convert_to_openid',
      params: {
        access_token: true,
      },
      body,
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
  getUserIds({ cursor, limit }: { limit?: number; cursor?: string }) {
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
  getDepartmentIds({ id }: { id?: string | number }) {
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
  getDepartmentMembers({ department_id }: { department_id: string | number }) {
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

  /**
   * @see https://developer.work.weixin.qq.com/document/path/92122 获取客户群详情
   */
  getExternalContactGroupChat(body: {
    access_token?: string;
    chat_id?: string;
    need_name?: number;
  }) {
    return this.request<GetExternalContactGroupChat>({
      method: 'POST',
      url: '/cgi-bin/externalcontact/groupchat/get',
      params: {
        access_token: true,
      },
      body,
    });
  }

  /**
   *
   * @see https://developer.work.weixin.qq.com/document/path/92113 获取客户列表
   */
  getExternalContactList(params: {
    userid?: string; // 企业成员的userid
  }) {
    return this.request<{ external_userid: Array<string> }>({
      method: 'GET',
      url: '/cgi-bin/externalcontact/list',
      params: {
        access_token: true,
        ...params,
      },
    });
  }

  /**
   * @see https://developer.work.weixin.qq.com/document/path/92120 获取客户群列表
   */
  getExternalContactGroupChatList(body: {
    status_filter?: number;
    // 最大 1000
    limit?: number;
    owner_filter?: {
      userid_list: string[];
    };
    cursor?: string;
  }) {
    return this.request<{
      next_cursor?: string
      group_chat_list: Array<{
        /**
         * 0 - 跟进人正常
         * 1 - 跟进人离职
         * 2 - 离职继承中
         * 3 - 离职继承完成
         */
        status: number;
        chat_id: string;
      }>;
    }>({
      method: 'POST',
      url: '/cgi-bin/externalcontact/groupchat/list',
      params: {
        access_token: true,
      },
      body: {
        limit: 1000,
        ...body,
      },
    });
  }

  /**
   * @see https://developer.work.weixin.qq.com/document/path/92114 获取客户详情
   */
  getExternalContact(params: { external_userid: string }) {
    return this.request<GetExternalContactResponse>({
      url: '/cgi-bin/externalcontact/get',
      params: {
        access_token: true,
        ...params,
      },
    });
  }

  /**
   * @see https://developer.work.weixin.qq.com/document/path/92994 批量获取客户详情
   */
  batchGetExternalContactByUser(params: {
    access_token?: string;
    userid_list: string[];
    cursor?: string;
    // 最大 100
    limit: number;
  }) {
    return this.request<BatchGetExternalContactByUserResponse>({
      url: '/cgi-bin/externalcontact/batch/get_by_user',
      params: {
        access_token: true,
        ...params,
      },
    });
  }

  getExternalContactFollowUserList() {
    // https://developer.work.weixin.qq.com/document/path/92571
    return this.request<{ follow_user: string[] }>({
      url: '/cgi-bin/externalcontact/get_follow_user_list',
      params: {
        access_token: true,
      },
    });
  }

  /**
   * @see https://developer.work.weixin.qq.com/document/path/90247
   */
  getAppChat(params: { chatid: string }) {
    return this.request<{
      chat_info: {
        chatid: string;
        name: string;
        owner: string;
        userlist: string[];
      };
    }>({
      url: '/cgi-bin/appchat/get',
      params: {
        access_token: true,
        ...params,
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

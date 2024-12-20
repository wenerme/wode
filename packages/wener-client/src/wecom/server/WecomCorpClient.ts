import type { FetchLike } from '@wener/utils';
import {
  createExpireValueHolder,
  type CreateExpireValueHolderOptions,
  type ExpiryValueHolder,
} from '../../ExpiryValue';
import { getValue, type MaybeValueHolder } from '../../ValueHolder';
import { createJsSdkSignature } from '../../wechat';
import type { CreateUserRequest, DepartmentInput, DepartmentOutput, GeneralResponse } from './api';
import { request, type RequestOptions } from './request';
import type {
  BatchGetExternalContactByUserResponse,
  ExternalContactTagGroup,
  GetExternalContactGroupChat,
  GetExternalContactResponse,
  GetExternalContactTagsResponse,
  GetMessageAuditGroupChatResponse,
  GetUserResponse,
  SendMessageRequest,
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
  async getAccessToken() {
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
  async getJsApiTicket() {
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
  async getAgentJsApiTicket() {
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

  /**
   * @see  https://developer.work.weixin.qq.com/document/path/92521 获取企业微信服务器的ip段
   */
  async getCallbackIps() {
    return this.request<{
      ip_list: string[];
    }>({
      url: '/cgi-bin/getcallbackip',
      params: {
        access_token: true,
      },
    }).then((v) => v.ip_list);
  }

  /**
   * @see https://developer.work.weixin.qq.com/document/path/92520 获取企业微信接口IP段
   */
  async getApiDomainIps() {
    return this.request<{
      ip_list: string[];
    }>({
      url: '/cgi-bin/get_api_domain_ip',
      params: {
        access_token: true,
      },
    }).then((v) => v.ip_list);
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
  async getUserInfoByAuthCode({ code }: { code: string }) {
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
  async getUserDetailByUserTicket({ user_ticket }: { user_ticket: string }) {
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
  async getUser({ userid }: { userid: string }) {
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
  async convertUserIdToOpenId(body: { userid: string }) {
    return this.request<{ openid: string }>({
      method: 'POST',
      url: '/cgi-bin/user/convert_to_openid',
      params: {
        access_token: true,
      },
      body,
    });
  }

  async convertOpenIdToUserId(body: { openid: string }) {
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
  async getMessageAuditGroupChat(body: { roomid: string }) {
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
  async getMessageAuditPermitUsers(
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
  async getMessageAuditRobotInfo(params: { access_token?: string; robot_id: string }) {
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
  async getExternalContactNewExternalUserId({
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
  async convertExternalContactUserIdToOpenId(body: { external_userid: string }) {
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
  async deleteUser({ userid }: { userid: string }) {
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
  async batchDeleteUser({ useridlist }: { useridlist: string[] }) {
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
  async createUser(data: CreateUserRequest) {
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
  async updateUser(data: CreateUserRequest) {
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
  async getUserIds({ cursor, limit }: { limit?: number; cursor?: string }) {
    return this.request<{
      next_cursor: string;
      dept_user: Array<{
        userid: string;
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
  async getDepartmentIds({ id }: { id?: string | number }) {
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
  async createDepartment(data: DepartmentInput) {
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
  async updateDepartment(data: DepartmentInput & { id: string | number }) {
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
  async deleteDepartment({ id }: { id: number | string }) {
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
  async getDepartment({ id }: { id: number | string }) {
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
  async getDepartmentMembers({ department_id }: { department_id: string | number }) {
    return this.request<{
      userlist: Array<{
        userid: string;
        name: string;
        department: number[];
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
  async getExternalContactGroupChat(body: { access_token?: string; chat_id?: string; need_name?: number }) {
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
  async getExternalContacts(params: {
    userid?: string; // 企业成员的userid
  }) {
    return this.request<{ external_userid: string[] }>({
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
  async getExternalContactGroupChats(body: {
    status_filter?: number;
    // 最大 1000
    limit?: number;
    owner_filter?: {
      userid_list: string[];
    };
    cursor?: string;
  }) {
    return this.request<{
      next_cursor?: string;
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
  async getExternalContact(params: { external_userid: string }) {
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
  async batchGetExternalContactByUser(body: {
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
      },
      body,
    });
  }

  async getExternalContactFollowUsers() {
    // https://developer.work.weixin.qq.com/document/path/92571
    return this.request<{ follow_user: string[] }>({
      url: '/cgi-bin/externalcontact/get_follow_user_list',
      params: {
        access_token: true,
      },
    });
  }

  /**
   * @see https://developer.work.weixin.qq.com/document/path/92117 获取企业标签库
   */
  async getExternalContactTags(body: { tag_id?: string[]; group_id?: string[] }) {
    return this.request<GetExternalContactTagsResponse>({
      url: '/cgi-bin/externalcontact/get_corp_tag_list',
      params: {
        access_token: true,
      },
      body,
    });
  }

  /**
   * @see https://developer.work.weixin.qq.com/document/path/92117 删除企业客户标签
   */
  async deleteExternalContactTags(body: { tag_id?: string[]; group_id?: string[]; agentid?: number }) {
    return this.request<GeneralResponse>({
      url: '/cgi-bin/externalcontact/del_corp_tag',
      params: {
        access_token: true,
      },
      body,
    });
  }

  /**
   * @see https://developer.work.weixin.qq.com/document/path/92117 添加企业客户标签
   */
  async createExternalContactTag(body: {
    group_id?: string;
    group_name?: string;
    order?: number;
    tag: { name: string; order?: number };
    ahentid?: number;
  }) {
    return this.request<{ tag_group: ExternalContactTagGroup }>({
      url: '/cgi-bin/externalcontact/add_corp_tag',
      params: {
        access_token: true,
      },
      body,
    });
  }

  /**
   * @see https://developer.work.weixin.qq.com/document/path/92117 编辑企业客户标签
   */
  async updateExternalContactTag(body: { id: string; name?: string; order?: number; agentid?: number }) {
    return this.request<GeneralResponse>({
      url: '/cgi-bin/externalcontact/edit_corp_tag',
      params: {
        access_token: true,
      },
      body,
    });
  }

  async convertOpenGidToChatId(body: { opengid: string }) {
    return this.request<{ chat_id: string }>({
      url: '/cgi-bin/externalcontact/opengid_to_chatid',
      params: {
        access_token: true,
      },
      body,
    });
  }

  /**
   * @see https://developer.work.weixin.qq.com/document/path/90247
   */
  async getAppChat(params: { chatid: string }) {
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

  async getTags() {
    return this.request<{
      taglist: Array<{
        tagid: number;
        tagname: string;
      }>;
    }>({
      url: '/cgi-bin/tag/list',
      params: {
        access_token: true,
      },
    });
  }

  async createTag(body: { tagname: string; tagid?: number }) {
    return this.request<{
      tagid: number;
    }>({
      url: '/cgi-bin/tag/create',
      params: {
        access_token: true,
      },
      body,
    });
  }

  async updateTag(body: { tagname: string; tagid: number }) {
    return this.request<Record<string, unknown>>({
      url: '/cgi-bin/tag/update',
      params: {
        access_token: true,
      },
      body,
    });
  }

  async deleteTag(params: { tagid: number }) {
    return this.request<Record<string, unknown>>({
      url: '/cgi-bin/tag/update',
      params: {
        ...params,
        access_token: true,
      },
    });
  }

  async getTagMembers(params: { tagid: number }) {
    return this.request<{
      tagname: string;
      userlist: Array<{
        userid: string;
        name?: string;
      }>; // 成员
      partylist: number[]; // 部门
    }>({
      url: '/cgi-bin/tag/get',
      params: {
        ...params,
        access_token: true,
      },
    });
  }

  async addTagMembers(body: {
    tagid: number;
    /* 单次不超过 1000 */ userlist?: string[];
    /* 单次不超过 100 */ partylist?: number[];
  }) {
    return this.request<Record<string, unknown>>({
      url: '/cgi-bin/tag/addtagusers',
      params: {
        access_token: true,
      },
      body,
    });
  }

  async deleteTagMembers(body: {
    tagid: number;
    /* 单次不超过 1000 */ userlist?: string[];
    /* 单次不超过 100 */ partylist?: number[];
  }) {
    return this.request<Record<string, unknown>>({
      url: '/cgi-bin/tag/deltagusers',
      params: {
        access_token: true,
      },
      body,
    });
  }

  async sendMessage(body: SendMessageRequest) {
    return this.request<{
      invaliduser: string; // | 分割
      invalidparty: string;
      invalidtag: string;
      unlicenseduser: string;
      msgid: string;
      response_code: string;
    }>({
      url: '/cgi-bin/message/send',
      params: {
        access_token: true,
      },
      body,
    });
  }

  async recallMessage(body: { msgid: string }) {
    return this.request<GeneralResponse>({
      url: '/cgi-bin/message/recall',
      params: {
        access_token: true,
      },
      body,
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

const AgentTypes = {
  3_010_185: {
    title: '人事助手',
  },
  3_010_115: {
    title: '对外收款',
  },
  3_010_011: {
    title: '打卡',
  },
  3_010_040: {
    title: '审批',
  },
  3_010_041: {
    title: '汇报',
  },
  3_010_097: { title: '直播' }, // https://developer.work.weixin.qq.com/document/path/93633
  // : { title: '公费电话' }, // https://work.weixin.qq.com/api/doc/14744
  // 企业微信服务商助手
  // 会议室
  // 学习园地
  // 公告
  // 健康上报
  // 同事吧
  // 行业资讯
  // 投屏
  // 测温
  // 打印
  // 网络
  // 门禁
  // 通讯录同步
};

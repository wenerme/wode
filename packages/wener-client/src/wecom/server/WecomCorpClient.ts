import type { FetchLike } from '@wener/utils';
import {
	type CreateExpireValueHolderOptions,
	createExpireValueHolder,
	type ExpiryValueHolder,
} from '../../ExpiryValue';
import { getValue, type MaybeValueHolder } from '../../ValueHolder';
import { createJsSdkSignature } from '../../wechat';
import type { CreateUserRequest, DepartmentInput, DepartmentOutput, GeneralResponse } from './api';
import { type RequestOptions, request } from './request';
import type * as S from './schema';
import type {
	BatchGetExternalContactByUserResponse,
	ExternalContactTagGroup,
	GetAgentMenuResponse,
	GetAgentResponse,
	GetExternalContactGroupChat,
	GetExternalContactResponse,
	GetExternalContactTagsResponse,
	GetMessageAuditGroupChatResponse,
	GetUserResponse,
	SendMessageRequest,
	SetAgentMenuRequest,
	SetAgentMenuResponse,
	SetAgentRequest,
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
					return { value: access_token, expiresAt: expires_at };
				},
			}),
			jsApiTicket: createExpireValueHolder<string>({
				value: jsApiTicket,
				onLoad: onJsApiTicket,
				loader: async () => {
					const { ticket, expires_at } = await this.getJsApiTicket();
					return { value: ticket, expiresAt: expires_at };
				},
			}),
			agentJsApiTicket: createExpireValueHolder<string>({
				value: agentJsApiTicket,
				onLoad: onAgentJsApiTicket,
				loader: async () => {
					const { ticket, expires_at } = await this.getAgentJsApiTicket();
					return { value: ticket, expiresAt: expires_at };
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
			params: { corpid: true, corpsecret: true },
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
			params: { access_token: true },
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
			params: { access_token: true, type: 'agent_config' },
		}).then((v) => {
			v.expires_at = Date.now() + v.expires_in * 1000;
			return v;
		});
	}

	/**
	 * @see  https://developer.work.weixin.qq.com/document/path/92521 获取企业微信服务器的ip段
	 */
	async getCallbackIps() {
		return this.request<{ ip_list: string[] }>({ url: '/cgi-bin/getcallbackip', params: { access_token: true } }).then(
			(v) => v.ip_list,
		);
	}

	/**
	 * @see https://developer.work.weixin.qq.com/document/path/92520 获取企业微信接口IP段
	 */
	async getApiDomainIps() {
		return this.request<{ ip_list: string[] }>({
			url: '/cgi-bin/get_api_domain_ip',
			params: { access_token: true },
		}).then((v) => v.ip_list);
	}

	async getJsSdkSignature({ url, timestamp, nonce }: { url: string; timestamp?: number; nonce?: string }) {
		return createJsSdkSignature({ url, timestamp, nonce, ticket: await this.options.jsApiTicket.get() });
	}

	async getAgentJsSdkSignature({ url, timestamp, nonce }: { url: string; timestamp?: number; nonce?: string }) {
		return createJsSdkSignature({ url, timestamp, nonce, ticket: await this.options.agentJsApiTicket.get() });
	}

	async request<T>(o: RequestOptions<T>): Promise<T> {
		o.params ||= {};
		// Default: inject access_token unless explicitly set or corpid auth is used
		if (!('access_token' in o.params) && !('corpid' in o.params)) {
			o.params.access_token = true;
		}
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
		}>({ url: '/cgi-bin/auth/getuserinfo', params: { access_token: true, code } });
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
		}>({ url: '/cgi-bin/auth/getuserdetail', params: { access_token: true }, body: { user_ticket } });
	}

	/**
	 * @see https://developer.work.weixin.qq.com/document/path/90196
	 */
	async getUser({ userid }: { userid: string }) {
		return this.request<GetUserResponse>({ url: '/cgi-bin/user/get', params: { access_token: true, userid } });
	}

	/**
	 * @see https://developer.work.weixin.qq.com/document/path/90202 userid转openid
	 */
	async convertUserIdToOpenId(body: { userid: string }) {
		return this.request<{ openid: string }>({
			method: 'POST',
			url: '/cgi-bin/user/convert_to_openid',
			params: { access_token: true },
			body,
		});
	}

	async convertOpenIdToUserId(body: { openid: string }) {
		return this.request<{ userid: string }>({
			method: 'POST',
			url: '/cgi-bin/user/convert_to_userid',
			params: { access_token: true },
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
			params: { access_token: true },
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
			params: { access_token: true, ...params },
		});
	}

	/**
	 * @see https://developer.work.weixin.qq.com/document/path/91774 获取机器人信息
	 */
	async getMessageAuditRobotInfo(params: { access_token?: string; robot_id: string }) {
		return this.request<{ data: { name: string; robot_id: string; creator_userid: string } }>({
			url: '/cgi-bin/msgaudit/get_robot_info',
			params: { access_token: true, ...params },
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
			params: { access_token },
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
			params: { access_token: true },
			body,
		});
	}

	/**
	 * @see https://developer.work.weixin.qq.com/document/path/90198
	 */
	async deleteUser({ userid }: { userid: string }) {
		return this.request<GeneralResponse>({ url: '/cgi-bin/user/delete', params: { access_token: true, userid } });
	}

	/**
	 * @see https://developer.work.weixin.qq.com/document/path/90199
	 */
	async batchDeleteUser({ useridlist }: { useridlist: string[] }) {
		return this.request<GeneralResponse>({
			url: '/cgi-bin/user/batchdelete',
			params: { access_token: true },
			body: { useridlist },
		});
	}

	/**
	 * @see https://developer.work.weixin.qq.com/document/path/90195
	 */
	async createUser(data: CreateUserRequest) {
		return this.request<GeneralResponse>({ url: '/cgi-bin/user/create', params: { access_token: true }, body: data });
	}

	/**
	 * @see https://developer.work.weixin.qq.com/document/path/90197
	 */
	async updateUser(data: CreateUserRequest) {
		return this.request<GeneralResponse>({ url: '/cgi-bin/user/update', params: { access_token: true }, body: data });
	}

	/**
	 * @see https://developer.work.weixin.qq.com/document/path/96021
	 */
	async getUserIds({ cursor, limit }: { limit?: number; cursor?: string }) {
		return this.request<{ next_cursor: string; dept_user: Array<{ userid: string; department: number }> }>({
			url: '/cgi-bin/user/list_id',
			params: { access_token: true, cursor, limit },
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
		}>({ url: '/cgi-bin/department/simplelist', params: { access_token: true, id } });
	}

	/**
	 * @see https://developer.work.weixin.qq.com/document/path/90205
	 */
	async createDepartment(data: DepartmentInput) {
		return this.request<GeneralResponse & { id: number }>({
			url: '/cgi-bin/department/create',
			params: { access_token: true },
			body: data,
		});
	}

	/**
	 * @see https://developer.work.weixin.qq.com/document/path/90206
	 */
	async updateDepartment(data: DepartmentInput & { id: string | number }) {
		return this.request<GeneralResponse & { id: number }>({
			url: '/cgi-bin/department/update',
			params: { access_token: true },
			body: data,
		});
	}

	/**
	 * @see https://developer.work.weixin.qq.com/document/path/90207
	 */
	async deleteDepartment({ id }: { id: number | string }) {
		return this.request<GeneralResponse>({ url: '/cgi-bin/department/delete', params: { access_token: true, id } });
	}

	/**
	 * @see https://developer.work.weixin.qq.com/document/path/95351
	 */
	async getDepartment({ id }: { id: number | string }) {
		return this.request<{ department: DepartmentOutput }>({
			url: '/cgi-bin/department/get',
			params: { access_token: true, id },
		});
	}

	/**
	 * @see https://developer.work.weixin.qq.com/document/path/90200
	 * @deprecated
	 */
	async getDepartmentMembers({ department_id }: { department_id: string | number }) {
		return this.request<{
			userlist: Array<{ userid: string; name: string; department: number[]; open_userid: string }>;
		}>({ url: '/cgi-bin/user/simplelist', params: { access_token: true, department_id } });
	}

	/**
	 * @see {https://developer.work.weixin.qq.com/document/path/92122 获取客户群详情}
	 */
	async getExternalContactGroupChat(body: { access_token?: string; chat_id?: string; need_name?: number }) {
		return this.request<GetExternalContactGroupChat>({
			method: 'POST',
			url: '/cgi-bin/externalcontact/groupchat/get',
			params: { access_token: true },
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
			params: { access_token: true, ...params },
		});
	}

	/**
	 * @see https://developer.work.weixin.qq.com/document/path/92120 获取客户群列表
	 */
	async getExternalContactGroupChats(body: {
		status_filter?: number;
		// 最大 1000
		limit?: number;
		owner_filter?: { userid_list: string[] };
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
			params: { access_token: true },
			body: { limit: 1000, ...body },
		});
	}

	/**
	 * @see https://developer.work.weixin.qq.com/document/path/92114 获取客户详情
	 */
	async getExternalContact(params: { external_userid: string }) {
		return this.request<GetExternalContactResponse>({
			url: '/cgi-bin/externalcontact/get',
			params: { access_token: true, ...params },
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
			params: { access_token: true },
			body,
		});
	}

	async getExternalContactFollowUsers() {
		// https://developer.work.weixin.qq.com/document/path/92571
		return this.request<{ follow_user: string[] }>({
			url: '/cgi-bin/externalcontact/get_follow_user_list',
			params: { access_token: true },
		});
	}

	/**
	 * @see https://developer.work.weixin.qq.com/document/path/92117 获取企业标签库
	 */
	async getExternalContactTags(body: { tag_id?: string[]; group_id?: string[] }) {
		return this.request<GetExternalContactTagsResponse>({
			url: '/cgi-bin/externalcontact/get_corp_tag_list',
			params: { access_token: true },
			body,
		});
	}

	/**
	 * @see https://developer.work.weixin.qq.com/document/path/92117 删除企业客户标签
	 */
	async deleteExternalContactTags(body: { tag_id?: string[]; group_id?: string[]; agentid?: number }) {
		return this.request<GeneralResponse>({
			url: '/cgi-bin/externalcontact/del_corp_tag',
			params: { access_token: true },
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
		agentid?: number;
	}) {
		return this.request<{ tag_group: ExternalContactTagGroup }>({
			url: '/cgi-bin/externalcontact/add_corp_tag',
			params: { access_token: true },
			body,
		});
	}

	/**
	 * @see https://developer.work.weixin.qq.com/document/path/92117 编辑企业客户标签
	 */
	async updateExternalContactTag(body: { id: string; name?: string; order?: number; agentid?: number }) {
		return this.request<GeneralResponse>({
			url: '/cgi-bin/externalcontact/edit_corp_tag',
			params: { access_token: true },
			body,
		});
	}

	async convertOpenGidToChatId(body: { opengid: string }) {
		return this.request<{ chat_id: string }>({
			url: '/cgi-bin/externalcontact/opengid_to_chatid',
			params: { access_token: true },
			body,
		});
	}

	/**
	 * @see https://developer.work.weixin.qq.com/document/path/90247
	 */
	async getAppChat(params: { chatid: string }) {
		return this.request<{ chat_info: { chatid: string; name: string; owner: string; userlist: string[] } }>({
			url: '/cgi-bin/appchat/get',
			params: { access_token: true, ...params },
		});
	}

	async getTags() {
		return this.request<{ taglist: Array<{ tagid: number; tagname: string }> }>({
			url: '/cgi-bin/tag/list',
			params: { access_token: true },
		});
	}

	async createTag(body: { tagname: string; tagid?: number }) {
		return this.request<{ tagid: number }>({ url: '/cgi-bin/tag/create', params: { access_token: true }, body });
	}

	async updateTag(body: { tagname: string; tagid: number }) {
		return this.request<Record<string, unknown>>({ url: '/cgi-bin/tag/update', params: { access_token: true }, body });
	}

	async deleteTag(params: { tagid: number }) {
		return this.request<Record<string, unknown>>({
			url: '/cgi-bin/tag/delete',
			params: { ...params, access_token: true },
		});
	}

	async getTagMembers(params: { tagid: number }) {
		return this.request<{
			tagname: string;
			userlist: Array<{ userid: string; name?: string }>; // 成员
			partylist: number[]; // 部门
		}>({ url: '/cgi-bin/tag/get', params: { ...params, access_token: true } });
	}

	async addTagMembers(body: {
		tagid: number;
		/* 单次不超过 1000 */ userlist?: string[];
		/* 单次不超过 100 */ partylist?: number[];
	}) {
		return this.request<Record<string, unknown>>({
			url: '/cgi-bin/tag/addtagusers',
			params: { access_token: true },
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
			params: { access_token: true },
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
		}>({ url: '/cgi-bin/message/send', params: { access_token: true }, body });
	}

	async recallMessage(body: { msgid: string }) {
		return this.request<GeneralResponse>({ url: '/cgi-bin/message/recall', params: { access_token: true }, body });
	}

	/**
	 * @see {https://developer.work.weixin.qq.com/document/path/90227 获取应用}
	 */
	async getAgent(params: { agentid: string }) {
		return this.request<GetAgentResponse>({ url: '/cgi-bin/agent/get', params: { access_token: true, ...params } });
	}

	/**
	 * @see {https://developer.work.weixin.qq.com/document/path/90227 获取应用}
	 */
	async setAgent(body: SetAgentRequest) {
		return this.request<GeneralResponse>({ url: '/cgi-bin/agent/set', params: { access_token: true }, body });
	}

	/**
	 * 设置自定义菜单的请求方法。
	 */
	async setAgentMenu(body: SetAgentMenuRequest) {
		return this.request<SetAgentMenuResponse>({ url: '/cgi-bin/menu/create', params: { access_token: true }, body });
	}

	/**
	 * 设置自定义菜单的请求方法。
	 */
	async getAgentMenu(params: { agentid: string }) {
		return this.request<GetAgentMenuResponse>({ url: '/cgi-bin/menu/get', params: { access_token: true, ...params } });
	}

	/**
	 * 设置自定义菜单的请求方法。
	 */
	async deleteAgentMenu(params: { agentid: string }) {
		return this.request<GeneralResponse>({ url: '/cgi-bin/menu/delete', params: { access_token: true, ...params } });
	}

	// region generated-apis
	// Code generated from WeChat Work API documentation. DO NOT EDIT.
	// prettier-ignore-start
	/**
	 * 批量获取申请单ID
	 * @see https://developer.work.weixin.qq.com/document/path/99883
	 */
	async listApplyId(body: S.ListApplyIdRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.ListApplyIdResponse>({
			method: 'POST',
			url: '/cgi-bin/advanced_feature/get_apply_id_list',
			body,
			...opts,
		});
	}
	/**
	 * 获取申请单详细信息
	 * @see https://developer.work.weixin.qq.com/document/path/99885
	 */
	async getApprovalInfo(body: S.GetApprovalInfoRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetApprovalInfoResponse>({
			method: 'POST',
			url: '/cgi-bin/advanced_feature/get_approval_info',
			body,
			...opts,
		});
	}
	/**
	 * 设置审批单审批信息
	 * @see https://developer.work.weixin.qq.com/document/path/99880
	 */
	async setApprovalDetail(body: S.SetApprovalDetailRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: '/cgi-bin/advanced_feature/set_approval_detail',
			body,
			...opts,
		});
	}
	/**
	 * 设置应用在工作台展示的模版
	 * @see https://developer.work.weixin.qq.com/document/path/92536
	 */
	async setWorkbenchTemplate(body: S.SetWorkbenchTemplateRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: '/cgi-bin/agent/set_workbench_template',
			body,
			...opts,
		});
	}
	/**
	 * 创建群聊会话
	 * @see https://developer.work.weixin.qq.com/document/path/90068
	 */
	async createGroupChat(body: S.CreateGroupChatRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.CreateGroupChatResponse>({
			method: 'POST',
			url: '/cgi-bin/appchat/create',
			body,
			...opts,
		});
	}
	/**
	 * 应用推送消息
	 * @see https://developer.work.weixin.qq.com/document/path/90071
	 */
	async sendAppChatMessage(body: S.SendAppChatMessageRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({ method: 'POST', url: '/cgi-bin/appchat/send', body, ...opts });
	}
	/**
	 * 修改群聊会话
	 * @see https://developer.work.weixin.qq.com/document/path/98913
	 */
	async updateAppChat(body: S.UpdateAppChatRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({ method: 'POST', url: '/cgi-bin/appchat/update', body, ...opts });
	}
	/**
	 * 获取用户二次验证信息
	 * @see https://developer.work.weixin.qq.com/document/path/99502
	 */
	async getTfaInfo(body: S.GetTfaInfoRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetTfaInfoResponse>({
			method: 'POST',
			url: '/cgi-bin/auth/get_tfa_info',
			body,
			...opts,
		});
	}
	/**
	 * 获取异步任务结果
	 * @see https://developer.work.weixin.qq.com/document/path/90482
	 */
	async batchGetResult(params: S.BatchGetResultRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.BatchGetResultResponse>({
			url: '/cgi-bin/batch/getresult',
			params,
			...opts,
		});
	}
	/**
	 * 邀请成员
	 * @see https://developer.work.weixin.qq.com/document/path/90475
	 */
	async batchInvite(body: S.BatchInviteRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.BatchInviteResponse>({
			method: 'POST',
			url: '/cgi-bin/batch/invite',
			body,
			...opts,
		});
	}
	/**
	 * userid转换
	 * @see https://developer.work.weixin.qq.com/document/path/95884
	 */
	async batchOpenUserIdToUserId(body: S.BatchOpenUserIdToUserIdRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.BatchOpenUserIdToUserIdResponse>({
			method: 'POST',
			url: '/cgi-bin/batch/openuserid_to_userid',
			body,
			...opts,
		});
	}
	/**
	 * 全量覆盖部门
	 * @see https://developer.work.weixin.qq.com/document/path/90481
	 */
	async batchReplaceParty(body: S.BatchReplacePartyRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.BatchReplacePartyResponse>({
			method: 'POST',
			url: '/cgi-bin/batch/replaceparty',
			body,
			...opts,
		});
	}
	/**
	 * 全量覆盖成员
	 * @see https://developer.work.weixin.qq.com/document/path/90480
	 */
	async batchReplaceUser(body: S.BatchReplaceUserRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.BatchReplaceUserResponse>({
			method: 'POST',
			url: '/cgi-bin/batch/replaceuser',
			body,
			...opts,
		});
	}
	/**
	 * 增量更新成员
	 * @see https://developer.work.weixin.qq.com/document/path/90479
	 */
	async batchSyncUser(body: S.BatchSyncUserRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.BatchSyncUserResponse>({
			method: 'POST',
			url: '/cgi-bin/batch/syncuser',
			body,
			...opts,
		});
	}
	/**
	 * 查询电子发票
	 * @see https://developer.work.weixin.qq.com/document/path/90103
	 */
	async getInvoiceInfo(body: S.GetInvoiceInfoRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetInvoiceInfoResponse>({
			method: 'POST',
			url: '/cgi-bin/card/invoice/reimburse/getinvoiceinfo',
			body,
			...opts,
		});
	}
	/**
	 * 批量查询电子发票
	 * @see https://developer.work.weixin.qq.com/document/path/90106
	 */
	async batchGetInvoiceInfo(body: S.BatchGetInvoiceInfoRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.BatchGetInvoiceInfoResponse>({
			method: 'POST',
			url: '/cgi-bin/card/invoice/reimburse/getinvoiceinfobatch',
			body,
			...opts,
		});
	}
	/**
	 * 更新发票状态
	 * @see https://developer.work.weixin.qq.com/document/path/90104
	 */
	async updateInvoiceStatus(body: S.UpdateInvoiceStatusRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: '/cgi-bin/card/invoice/reimburse/updateinvoicestatus',
			body,
			...opts,
		});
	}
	/**
	 * 批量更新发票状态
	 * @see https://developer.work.weixin.qq.com/document/path/90105
	 */
	async batchUpdateInvoiceStatus(body: S.BatchUpdateInvoiceStatusRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: '/cgi-bin/card/invoice/reimburse/updatestatusbatch',
			body,
			...opts,
		});
	}
	/**
	 * 创建专区程序调用任务
	 * @see https://developer.work.weixin.qq.com/document/path/99966
	 */
	async createProgramTask(body: S.CreateProgramTaskRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.CreateProgramTaskResponse>({
			method: 'POST',
			url: '/cgi-bin/chatdata/async_program_task',
			body,
			...opts,
		});
	}
	/**
	 * 获取专区调试模式状态
	 * @see https://developer.work.weixin.qq.com/document/path/100113
	 */
	async checkDebugMode(body: S.CheckDebugModeRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.CheckDebugModeResponse>({
			method: 'POST',
			url: '/cgi-bin/chatdata/check_debug_mode',
			body,
			...opts,
		});
	}
	/**
	 * 关闭专区调试模式
	 * @see https://developer.work.weixin.qq.com/document/path/100088
	 */
	async closeDebugMode(body: S.CloseDebugModeRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({ method: 'POST', url: '/cgi-bin/chatdata/close_debug_mode', body, ...opts });
	}
	/**
	 * 获取授权存档的成员列表
	 * @see https://developer.work.weixin.qq.com/document/path/99962
	 */
	async getAuthUserList(body: S.GetAuthUserListRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetAuthUserListResponse>({
			method: 'POST',
			url: '/cgi-bin/chatdata/get_auth_user_list',
			body,
			...opts,
		});
	}
	/**
	 * 开启专区调试模式
	 * @see https://developer.work.weixin.qq.com/document/path/100087
	 */
	async openChatDataDebugMode(body: S.OpenChatDataDebugModeRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({ method: 'POST', url: '/cgi-bin/chatdata/open_debug_mode', body, ...opts });
	}
	/**
	 * 设置成员会话组件敏感信息隐藏配置
	 * @see https://developer.work.weixin.qq.com/document/path/100139
	 */
	async setChatdataHideSensitiveInfoConfig(
		body: S.SetChatdataHideSensitiveInfoConfigRequest,
		opts?: Partial<RequestOptions<any>>,
	) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: '/cgi-bin/chatdata/set_hide_sensitiveinfo_config',
			body,
			...opts,
		});
	}
	/**
	 * 设置日志打印级别
	 * @see https://developer.work.weixin.qq.com/document/path/100108
	 */
	async setLogLevel(body: S.SetLogLevelRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({ method: 'POST', url: '/cgi-bin/chatdata/set_log_level', body, ...opts });
	}
	/**
	 * 设置公钥
	 * @see https://developer.work.weixin.qq.com/document/path/99961
	 */
	async setPublicKey(body: S.SetPublicKeyRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({ method: 'POST', url: '/cgi-bin/chatdata/set_public_key', body, ...opts });
	}
	/**
	 * 设置专区接收回调事件
	 * @see https://developer.work.weixin.qq.com/document/path/99963
	 */
	async setReceiveCallback(body: S.SetReceiveCallbackRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: '/cgi-bin/chatdata/set_receive_callback',
			body,
			...opts,
		});
	}
	/**
	 * 应用同步调用专区程序
	 * @see https://developer.work.weixin.qq.com/document/path/99965
	 */
	async syncCallProgram(body: S.SyncCallProgramRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.SyncCallProgramResponse>({
			method: 'POST',
			url: '/cgi-bin/chatdata/sync_call_program',
			body,
			...opts,
		});
	}
	/**
	 * 上传临时文件到专区
	 * @see https://developer.work.weixin.qq.com/document/path/100174
	 */
	async uploadChatDataMedia(body: S.UploadChatDataMediaRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.UploadChatDataMediaResponse>({
			method: 'POST',
			url: '/cgi-bin/chatdata/upload_media',
			body,
			...opts,
		});
	}
	/**
	 * 创建打卡规则
	 * @see https://developer.work.weixin.qq.com/document/path/98057
	 */
	async addCheckinOption(body: S.AddCheckinOptionRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({ method: 'POST', url: '/cgi-bin/checkin/add_checkin_option', body, ...opts });
	}
	/**
	 * 添加打卡记录
	 * @see https://developer.work.weixin.qq.com/document/path/99647
	 */
	async addCheckinRecord(body: S.AddCheckinRecordRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({ method: 'POST', url: '/cgi-bin/checkin/add_checkin_record', body, ...opts });
	}
	/**
	 * 录入打卡人员人脸信息
	 * @see https://developer.work.weixin.qq.com/document/path/93456
	 */
	async addCheckinUserFace(body: S.AddCheckinUserFaceRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({ method: 'POST', url: '/cgi-bin/checkin/addcheckinuserface', body, ...opts });
	}
	/**
	 * 获取打卡日报数据
	 * @see https://developer.work.weixin.qq.com/document/path/93451
	 */
	async getCheckinDayData(body: S.GetCheckinDayDataRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetCheckinDayDataResponse>({
			method: 'POST',
			url: '/cgi-bin/checkin/getcheckin_daydata',
			body,
			...opts,
		});
	}
	/**
	 * 获取打卡月报数据
	 * @see https://developer.work.weixin.qq.com/document/path/93452
	 */
	async getCheckinMonthData(body: S.GetCheckinMonthDataRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetCheckinMonthDataResponse>({
			method: 'POST',
			url: '/cgi-bin/checkin/getcheckin_monthdata',
			body,
			...opts,
		});
	}
	/**
	 * 获取打卡记录数据
	 * @see https://developer.work.weixin.qq.com/document/path/93450
	 */
	async getCheckinData(body: S.GetCheckinDataRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetCheckinDataResponse>({
			method: 'POST',
			url: '/cgi-bin/checkin/getcheckindata',
			body,
			...opts,
		});
	}
	/**
	 * 获取员工打卡规则
	 * @see https://developer.work.weixin.qq.com/document/path/93449
	 */
	async getCheckinOption(body: S.GetCheckinOptionRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetCheckinOptionResponse>({
			method: 'POST',
			url: '/cgi-bin/checkin/getcheckinoption',
			body,
			...opts,
		});
	}
	/**
	 * 获取打卡人员排班信息
	 * @see https://developer.work.weixin.qq.com/document/path/93453
	 */
	async getCheckInScheduleList(body: S.GetCheckInScheduleListRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetCheckInScheduleListResponse>({
			method: 'POST',
			url: '/cgi-bin/checkin/getcheckinschedulist',
			body,
			...opts,
		});
	}
	/**
	 * 获取企业所有打卡规则
	 * @see https://developer.work.weixin.qq.com/document/path/93448
	 */
	async getCorpCheckinOption(body?: Record<string, any>, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetCorpCheckinOptionResponse>({
			method: 'POST',
			url: '/cgi-bin/checkin/getcorpcheckinoption',
			body,
			...opts,
		});
	}
	/**
	 * 为打卡人员补卡
	 * @see https://developer.work.weixin.qq.com/document/path/95803
	 */
	async punchCorrection(body: S.PunchCorrectionRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({ method: 'POST', url: '/cgi-bin/checkin/punch_correction', body, ...opts });
	}
	/**
	 * 为打卡人员排班
	 * @see https://developer.work.weixin.qq.com/document/path/93454
	 */
	async setCheckinScheduleList(body: S.SetCheckinScheduleListRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: '/cgi-bin/checkin/setcheckinschedulist',
			body,
			...opts,
		});
	}
	/**
	 * 获取加入企业二维码
	 * @see https://developer.work.weixin.qq.com/document/path/91714
	 */
	async getJoinQrcode(params: S.GetJoinQrcodeRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetJoinQrcodeResponse>({
			url: '/cgi-bin/corp/get_join_qrcode',
			params,
			...opts,
		});
	}
	/**
	 * 获取审批数据（旧）
	 * @see https://developer.work.weixin.qq.com/document/path/91530
	 */
	async getApprovalData(body: S.GetApprovalDataRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetApprovalDataResponse>({
			method: 'POST',
			url: '/cgi-bin/corp/getapprovaldata',
			body,
			...opts,
		});
	}
	/**
	 * 查询自建应用审批单当前状态
	 * @see https://developer.work.weixin.qq.com/document/path/90090
	 */
	async getOpenApprovalData(body: S.GetOpenApprovalDataRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetOpenApprovalDataResponse>({
			method: 'POST',
			url: '/cgi-bin/corp/getopenapprovaldata',
			body,
			...opts,
		});
	}
	/**
	 * 获取上下游信息
	 * @see https://developer.work.weixin.qq.com/document/path/95820
	 */
	async getChainList(opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetChainListResponse>({
			url: '/cgi-bin/corpgroup/corp/get_chain_list',
			...opts,
		});
	}
	/**
	 * 查询成员自定义id
	 * @see https://developer.work.weixin.qq.com/document/path/97441
	 */
	async getChainUserCustomId(body: S.GetChainUserCustomIdRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetChainUserCustomIdResponse>({
			method: 'POST',
			url: '/cgi-bin/corpgroup/corp/get_chain_user_custom_id',
			body,
			...opts,
		});
	}
	/**
	 * 获取下级/下游企业的access_token
	 * @see https://developer.work.weixin.qq.com/document/path/95313
	 */
	async getCorpGroupToken(body: S.GetCorpGroupTokenRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetCorpGroupTokenResponse>({
			method: 'POST',
			url: '/cgi-bin/corpgroup/corp/gettoken',
			body,
			...opts,
		});
	}
	/**
	 * 获取应用共享信息
	 * @see https://developer.work.weixin.qq.com/document/path/95813
	 */
	async listCorpGroupAppShare(body: S.ListCorpGroupAppShareRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.ListCorpGroupAppShareResponse>({
			method: 'POST',
			url: '/cgi-bin/corpgroup/corp/list_app_share_info',
			body,
			...opts,
		});
	}
	/**
	 * 移除企业
	 * @see https://developer.work.weixin.qq.com/document/path/95822
	 */
	async removeCorpFromGroup(body: S.RemoveCorpFromGroupRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({ method: 'POST', url: '/cgi-bin/corpgroup/corp/remove_corp', body, ...opts });
	}
	/**
	 * 获取下级企业加入的上下游
	 * @see https://developer.work.weixin.qq.com/document/path/97442
	 */
	async getCorpSharedChainList(body: S.GetCorpSharedChainListRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetCorpSharedChainListResponse>({
			method: 'POST',
			url: '/cgi-bin/corpgroup/get_corp_shared_chain_list',
			body,
			...opts,
		});
	}
	/**
	 * 获取异步任务结果
	 * @see https://developer.work.weixin.qq.com/document/path/95823
	 */
	async getAsyncJobResult(params: S.GetAsyncJobResultRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetAsyncJobResultResponse>({
			url: '/cgi-bin/corpgroup/getresult',
			params,
			...opts,
		});
	}
	/**
	 * 批量导入上下游联系人
	 * @see https://developer.work.weixin.qq.com/document/path/95821
	 */
	async importChainContact(body: S.ImportChainContactRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.ImportChainContactResponse>({
			method: 'POST',
			url: '/cgi-bin/corpgroup/import_chain_contact',
			body,
			...opts,
		});
	}
	/**
	 * 新增对接规则
	 * @see https://developer.work.weixin.qq.com/document/path/95664
	 */
	async addCorpGroupRule(body: S.AddCorpGroupRuleRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.AddCorpGroupRuleResponse>({
			method: 'POST',
			url: '/cgi-bin/corpgroup/rule/add_rule',
			body,
			...opts,
		});
	}
	/**
	 * 删除对接规则
	 * @see https://developer.work.weixin.qq.com/document/path/95663
	 */
	async deleteCorpGroupRule(body: S.DeleteCorpGroupRuleRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({ method: 'POST', url: '/cgi-bin/corpgroup/rule/delete_rule', body, ...opts });
	}
	/**
	 * 获取对接规则详情
	 * @see https://developer.work.weixin.qq.com/document/path/95667
	 */
	async getRuleInfo(body: S.GetRuleInfoRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetRuleInfoResponse>({
			method: 'POST',
			url: '/cgi-bin/corpgroup/rule/get_rule_info',
			body,
			...opts,
		});
	}
	/**
	 * 获取对接规则id列表
	 * @see https://developer.work.weixin.qq.com/document/path/95631
	 */
	async listRuleId(body: S.ListRuleIdRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.ListRuleIdResponse>({
			method: 'POST',
			url: '/cgi-bin/corpgroup/rule/list_ids',
			body,
			...opts,
		});
	}
	/**
	 * 更新对接规则
	 * @see https://developer.work.weixin.qq.com/document/path/95666
	 */
	async modifyRule(body: S.ModifyRuleRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({ method: 'POST', url: '/cgi-bin/corpgroup/rule/modify_rule', body, ...opts });
	}
	/**
	 * 上下游关联客户信息-已添加客户
	 * @see https://developer.work.weixin.qq.com/document/path/95818
	 */
	async linkUnionidToExternalUserid(body: S.LinkUnionidToExternalUseridRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.LinkUnionidToExternalUseridResponse>({
			method: 'POST',
			url: '/cgi-bin/corpgroup/unionid_to_external_userid',
			body,
			...opts,
		});
	}
	/**
	 * unionid查询pending_id
	 * @see https://developer.work.weixin.qq.com/document/path/98039
	 */
	async unionidToPendingId(body: S.UnionidToPendingIdRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.UnionidToPendingIdResponse>({
			method: 'POST',
			url: '/cgi-bin/corpgroup/unionid_to_pending_id',
			body,
			...opts,
		});
	}
	/**
	 * 获取部门列表
	 * @see https://developer.work.weixin.qq.com/document/path/90036
	 */
	async listDepartment(params: S.ListDepartmentRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.ListDepartmentResponse>({
			url: '/cgi-bin/department/list',
			params,
			...opts,
		});
	}
	/**
	 * 获取公费电话拨打记录
	 * @see https://developer.work.weixin.qq.com/document/path/93662
	 */
	async getDialRecord(body: S.GetDialRecordRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetDialRecordResponse>({
			method: 'POST',
			url: '/cgi-bin/dial/get_dial_record',
			body,
			...opts,
		});
	}
	/**
	 * 禁用/启用邮箱账号
	 * @see https://developer.work.weixin.qq.com/document/path/97683
	 */
	async actEmailAccount(body: S.ActEmailAccountRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({ method: 'POST', url: '/cgi-bin/exmail/account/act_email', body, ...opts });
	}
	/**
	 * 发送普通邮件
	 * @see https://developer.work.weixin.qq.com/document/path/97445
	 */
	async sendExmail(body: S.SendExmailRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({ method: 'POST', url: '/cgi-bin/exmail/app/compose_send', body, ...opts });
	}
	/**
	 * 查询应用邮箱账号
	 * @see https://developer.work.weixin.qq.com/document/path/97991
	 */
	async getEmailAlias(body?: Record<string, any>, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetEmailAliasResponse>({
			method: 'POST',
			url: '/cgi-bin/exmail/app/get_email_alias',
			body,
			...opts,
		});
	}
	/**
	 * 获取收件箱邮件列表
	 * @see https://developer.work.weixin.qq.com/document/path/97681
	 */
	async listMail(body: S.ListMailRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.ListMailResponse>({
			method: 'POST',
			url: '/cgi-bin/exmail/app/get_mail_list',
			body,
			...opts,
		});
	}
	/**
	 * 获取邮件内容
	 * @see https://developer.work.weixin.qq.com/document/path/97979
	 */
	async readMail(body: S.ReadMailRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.ReadMailResponse>({
			method: 'POST',
			url: '/cgi-bin/exmail/app/read_mail',
			body,
			...opts,
		});
	}
	/**
	 * 更新应用邮箱账号
	 * @see https://developer.work.weixin.qq.com/document/path/97682
	 */
	async updateAppEmailAlias(body: S.UpdateAppEmailAliasRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: '/cgi-bin/exmail/app/update_email_alias',
			body,
			...opts,
		});
	}
	/**
	 * 创建邮件群组
	 * @see https://developer.work.weixin.qq.com/document/path/95510
	 */
	async createMailGroup(body: S.CreateMailGroupRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({ method: 'POST', url: '/cgi-bin/exmail/group/create', body, ...opts });
	}
	/**
	 * 删除邮件群组
	 * @see https://developer.work.weixin.qq.com/document/path/97996
	 */
	async deleteMailGroup(body: S.DeleteMailGroupRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({ method: 'POST', url: '/cgi-bin/exmail/group/delete', body, ...opts });
	}
	/**
	 * 获取邮件群组详情
	 * @see https://developer.work.weixin.qq.com/document/path/97997
	 */
	async getMailGroup(params: S.GetMailGroupRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetMailGroupResponse>({
			url: '/cgi-bin/exmail/group/get',
			params,
			...opts,
		});
	}
	/**
	 * 模糊搜索邮件群组
	 * @see https://developer.work.weixin.qq.com/document/path/97998
	 */
	async searchMailGroup(params: S.SearchMailGroupRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.SearchMailGroupResponse>({
			url: '/cgi-bin/exmail/group/search',
			params,
			...opts,
		});
	}
	/**
	 * 更新邮件群组
	 * @see https://developer.work.weixin.qq.com/document/path/97995
	 */
	async updateMailGroup(body: S.UpdateMailGroupRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({ method: 'POST', url: '/cgi-bin/exmail/group/update', body, ...opts });
	}
	/**
	 * 获取邮件未读数
	 * @see https://developer.work.weixin.qq.com/document/path/97685
	 */
	async getMailUnreadCount(body: S.GetMailUnreadCountRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetMailUnreadCountResponse>({
			method: 'POST',
			url: '/cgi-bin/exmail/mail/get_newcount',
			body,
			...opts,
		});
	}
	/**
	 * 创建公共邮箱
	 * @see https://developer.work.weixin.qq.com/document/path/100185
	 */
	async createPublicMail(body: S.CreatePublicMailRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.CreatePublicMailResponse>({
			method: 'POST',
			url: '/cgi-bin/exmail/publicmail/create',
			body,
			...opts,
		});
	}
	/**
	 * 删除公共邮箱
	 * @see https://developer.work.weixin.qq.com/document/path/100187
	 */
	async deletePublicMail(body: S.DeletePublicMailRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({ method: 'POST', url: '/cgi-bin/exmail/publicmail/delete', body, ...opts });
	}
	/**
	 * 删除客户端专用密码
	 * @see https://developer.work.weixin.qq.com/document/path/100242
	 */
	async deletePublicMailAuthCode(body: S.DeletePublicMailAuthCodeRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: '/cgi-bin/exmail/publicmail/delete_auth_code',
			body,
			...opts,
		});
	}
	/**
	 * 获取公共邮箱详情
	 * @see https://developer.work.weixin.qq.com/document/path/100188
	 */
	async getPublicMailDetail(body: S.GetPublicMailDetailRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetPublicMailDetailResponse>({
			method: 'POST',
			url: '/cgi-bin/exmail/publicmail/get',
			body,
			...opts,
		});
	}
	/**
	 * 获取客户端专用密码列表
	 * @see https://developer.work.weixin.qq.com/document/path/100241
	 */
	async listPublicMailAuthCode(body: S.ListPublicMailAuthCodeRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.ListPublicMailAuthCodeResponse>({
			method: 'POST',
			url: '/cgi-bin/exmail/publicmail/get_auth_code_list',
			body,
			...opts,
		});
	}
	/**
	 * 模糊搜索公共邮箱
	 * @see https://developer.work.weixin.qq.com/document/path/100189
	 */
	async searchPublicMail(params: S.SearchPublicMailRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.SearchPublicMailResponse>({
			url: '/cgi-bin/exmail/publicmail/search',
			params,
			...opts,
		});
	}
	/**
	 * 更新公共邮箱
	 * @see https://developer.work.weixin.qq.com/document/path/100186
	 */
	async updatePublicMail(body: S.UpdatePublicMailRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.UpdatePublicMailResponse>({
			method: 'POST',
			url: '/cgi-bin/exmail/publicmail/update',
			body,
			...opts,
		});
	}
	/**
	 * 获取用户功能属性
	 * @see https://developer.work.weixin.qq.com/document/path/97684
	 */
	async getUserOption(body: S.GetUserOptionRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetUserOptionResponse>({
			method: 'POST',
			url: '/cgi-bin/exmail/useroption/get',
			body,
			...opts,
		});
	}
	/**
	 * 更改用户功能属性
	 * @see https://developer.work.weixin.qq.com/document/path/98008
	 */
	async updateUserOption(body: S.UpdateUserOptionRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({ method: 'POST', url: '/cgi-bin/exmail/useroption/update', body, ...opts });
	}
	/**
	 * 分配高级功能账号
	 * @see https://developer.work.weixin.qq.com/document/path/99320
	 */
	async batchAddVip(body: S.BatchAddVipRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.BatchAddVipResponse>({
			method: 'POST',
			url: '/cgi-bin/exmail/vip/batch_add',
			body,
			...opts,
		});
	}
	/**
	 * 取消高级功能账号
	 * @see https://developer.work.weixin.qq.com/document/path/99321
	 */
	async batchDelVip(body: S.BatchDelVipRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.BatchDelVipResponse>({
			method: 'POST',
			url: '/cgi-bin/exmail/vip/batch_del',
			body,
			...opts,
		});
	}
	/**
	 * 获取高级功能账号列表
	 * @see https://developer.work.weixin.qq.com/document/path/99322
	 */
	async listExmailVip(body: S.ListExmailVipRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.ListExmailVipResponse>({
			method: 'POST',
			url: '/cgi-bin/exmail/vip/list',
			body,
			...opts,
		});
	}
	/**
	 * 导出部门
	 * @see https://developer.work.weixin.qq.com/document/path/94852
	 */
	async exportDepartment(body: S.ExportDepartmentRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.ExportDepartmentResponse>({
			method: 'POST',
			url: '/cgi-bin/export/department',
			body,
			...opts,
		});
	}
	/**
	 * 获取导出结果
	 * @see https://developer.work.weixin.qq.com/document/path/94854
	 */
	async getExportResult(params: S.GetExportResultRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetExportResultResponse>({
			url: '/cgi-bin/export/get_result',
			params,
			...opts,
		});
	}
	/**
	 * 导出成员
	 * @see https://developer.work.weixin.qq.com/document/path/94849
	 */
	async exportSimpleUser(body: S.ExportSimpleUserRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.ExportSimpleUserResponse>({
			method: 'POST',
			url: '/cgi-bin/export/simple_user',
			body,
			...opts,
		});
	}
	/**
	 * 导出标签成员
	 * @see https://developer.work.weixin.qq.com/document/path/94853
	 */
	async exportTagUser(body: S.ExportTagUserRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.ExportTagUserResponse>({
			method: 'POST',
			url: '/cgi-bin/export/taguser',
			body,
			...opts,
		});
	}
	/**
	 * 导出成员详情
	 * @see https://developer.work.weixin.qq.com/document/path/94851
	 */
	async exportUser(body: S.ExportUserRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.ExportUserResponse>({
			method: 'POST',
			url: '/cgi-bin/export/user',
			body,
			...opts,
		});
	}
	/**
	 * 配置客户联系「联系我」方式
	 * @see https://developer.work.weixin.qq.com/document/path/92228
	 */
	async addContactWay(body: S.AddContactWayRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.AddContactWayResponse>({
			method: 'POST',
			url: '/cgi-bin/externalcontact/add_contact_way',
			body,
			...opts,
		});
	}
	/**
	 * 新建敏感词规则
	 * @see https://developer.work.weixin.qq.com/document/path/95100
	 */
	async addInterceptRule(body: S.AddInterceptRuleRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.AddInterceptRuleResponse>({
			method: 'POST',
			url: '/cgi-bin/externalcontact/add_intercept_rule',
			body,
			...opts,
		});
	}
	/**
	 * 企业发表内容到客户的朋友圈
	 * @see https://developer.work.weixin.qq.com/document/path/95173
	 */
	async addMomentTask(body: S.AddMomentTaskRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.AddMomentTaskResponse>({
			method: 'POST',
			url: '/cgi-bin/externalcontact/add_moment_task',
			body,
			...opts,
		});
	}
	/**
	 * 创建企业群发
	 * @see https://developer.work.weixin.qq.com/document/path/93537
	 */
	async addMessageTemplate(body: S.AddMessageTemplateRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.AddMessageTemplateResponse>({
			method: 'POST',
			url: '/cgi-bin/externalcontact/add_msg_template',
			body,
			...opts,
		});
	}
	/**
	 * 创建商品图册
	 * @see https://developer.work.weixin.qq.com/document/path/95101
	 */
	async addProductAlbum(body: S.AddProductAlbumRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.AddProductAlbumResponse>({
			method: 'POST',
			url: '/cgi-bin/externalcontact/add_product_album',
			body,
			...opts,
		});
	}
	/**
	 * 停止企业群发
	 * @see https://developer.work.weixin.qq.com/document/path/97611
	 */
	async cancelGroupMsgSend(body: S.CancelGroupMsgSendRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: '/cgi-bin/externalcontact/cancel_groupmsg_send',
			body,
			...opts,
		});
	}
	/**
	 * 停止发表企业朋友圈
	 * @see https://developer.work.weixin.qq.com/document/path/97612
	 */
	async cancelMomentTask(body: S.CancelMomentTaskRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: '/cgi-bin/externalcontact/cancel_moment_task',
			body,
			...opts,
		});
	}
	/**
	 * 获取已服务的外部联系人
	 * @see https://developer.work.weixin.qq.com/document/path/99445
	 */
	async listExternalContact(body: S.ListExternalContactRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.ListExternalContactResponse>({
			method: 'POST',
			url: '/cgi-bin/externalcontact/contact_list',
			body,
			...opts,
		});
	}
	/**
	 * 获客助手额度管理与使用统计
	 * @see https://developer.work.weixin.qq.com/document/path/99337
	 */
	async getCustomerAcquisitionQuota(opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetCustomerAcquisitionQuotaResponse>({
			url: '/cgi-bin/externalcontact/customer_acquisition_quota',
			...opts,
		});
	}
	/**
	 * 获取获客客户列表
	 * @see https://developer.work.weixin.qq.com/document/path/97305
	 */
	async listCustomerAcquisition(body: S.ListCustomerAcquisitionRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.ListCustomerAcquisitionResponse>({
			method: 'POST',
			url: '/cgi-bin/externalcontact/customer_acquisition/customer',
			body,
			...opts,
		});
	}
	/**
	 * 获取成员多次收消息详情
	 * @see https://developer.work.weixin.qq.com/document/path/100254
	 */
	async getCustomerAcquisitionChatInfo(
		body: S.GetCustomerAcquisitionChatInfoRequest,
		opts?: Partial<RequestOptions<any>>,
	) {
		return this.request<GeneralResponse & S.GetCustomerAcquisitionChatInfoResponse>({
			method: 'POST',
			url: '/cgi-bin/externalcontact/customer_acquisition/get_chat_info',
			body,
			...opts,
		});
	}
	/**
	 * 获取企业的全部群发记录
	 * @see https://developer.work.weixin.qq.com/document/path/93539
	 */
	async listGroupMsg(body: S.ListGroupMsgRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.ListGroupMsgResponse>({
			method: 'POST',
			url: '/cgi-bin/externalcontact/get_groupmsg_list_v2',
			body,
			...opts,
		});
	}
	/**
	 * 获取客户朋友圈全部的发表记录
	 * @see https://developer.work.weixin.qq.com/document/path/93545
	 */
	async listMoment(body: S.ListMomentRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.ListMomentResponse>({
			method: 'POST',
			url: '/cgi-bin/externalcontact/get_moment_list',
			body,
			...opts,
		});
	}
	/**
	 * 管理企业规则组下的客户标签
	 * @see https://developer.work.weixin.qq.com/document/path/94882
	 */
	async getStrategyTagList(body: S.GetStrategyTagListRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetStrategyTagListResponse>({
			method: 'POST',
			url: '/cgi-bin/externalcontact/get_strategy_tag_list',
			body,
			...opts,
		});
	}
	/**
	 * 获取「学校通知」二维码
	 * @see https://developer.work.weixin.qq.com/document/path/92320
	 */
	async getSubscribeQrCode(opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetSubscribeQrCodeResponse>({
			url: '/cgi-bin/externalcontact/get_subscribe_qr_code',
			...opts,
		});
	}
	/**
	 * 获取待分配的离职成员列表
	 * @see https://developer.work.weixin.qq.com/document/path/94091
	 */
	async getUnassignedList(body: S.GetUnassignedListRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetUnassignedListResponse>({
			method: 'POST',
			url: '/cgi-bin/externalcontact/get_unassigned_list',
			body,
			...opts,
		});
	}
	/**
	 * 获取「联系客户统计」数据
	 * @see https://developer.work.weixin.qq.com/document/path/93557
	 */
	async getUserBehaviorData(body: S.GetUserBehaviorDataRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetUserBehaviorDataResponse>({
			method: 'POST',
			url: '/cgi-bin/externalcontact/get_user_behavior_data',
			body,
			...opts,
		});
	}
	/**
	 * 添加入群欢迎语素材
	 * @see https://developer.work.weixin.qq.com/document/path/93353
	 */
	async addGroupWelcomeTemplate(body: S.AddGroupWelcomeTemplateRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.AddGroupWelcomeTemplateResponse>({
			method: 'POST',
			url: '/cgi-bin/externalcontact/group_welcome_template/add',
			body,
			...opts,
		});
	}
	/**
	 * 配置客户群进群方式
	 * @see https://developer.work.weixin.qq.com/document/path/92569
	 */
	async addJoinWay(body: S.AddJoinWayRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.AddJoinWayResponse>({
			method: 'POST',
			url: '/cgi-bin/externalcontact/groupchat/add_join_way',
			body,
			...opts,
		});
	}
	/**
	 * 分配在职成员的客户群
	 * @see https://developer.work.weixin.qq.com/document/path/95703
	 */
	async transferGroupChatOwner(body: S.TransferGroupChatOwnerRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.TransferGroupChatOwnerResponse>({
			method: 'POST',
			url: '/cgi-bin/externalcontact/groupchat/onjob_transfer',
			body,
			...opts,
		});
	}
	/**
	 * 获取「群聊数据统计」数据（按群主聚合）
	 * @see https://developer.work.weixin.qq.com/document/path/93559
	 */
	async getGroupChatStatistic(body: S.GetGroupChatStatisticRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetGroupChatStatisticResponse>({
			method: 'POST',
			url: '/cgi-bin/externalcontact/groupchat/statistic',
			body,
			...opts,
		});
	}
	/**
	 * 分配离职成员的客户群
	 * @see https://developer.work.weixin.qq.com/document/path/93542
	 */
	async transferGroupChat(body: S.TransferGroupChatRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.TransferGroupChatResponse>({
			method: 'POST',
			url: '/cgi-bin/externalcontact/groupchat/transfer',
			body,
			...opts,
		});
	}
	/**
	 * 编辑客户企业标签
	 * @see https://developer.work.weixin.qq.com/document/path/92118
	 */
	async markTagExternalContact(body: S.MarkTagExternalContactRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({ method: 'POST', url: '/cgi-bin/externalcontact/mark_tag', body, ...opts });
	}
	/**
	 * 发送「学校通知」
	 * @see https://developer.work.weixin.qq.com/document/path/91609
	 */
	async sendExternalContactMessage(body: S.SendExternalContactMessageRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.SendExternalContactMessageResponse>({
			method: 'POST',
			url: '/cgi-bin/externalcontact/message/send',
			body,
			...opts,
		});
	}
	/**
	 * 获取规则组列表
	 * @see https://developer.work.weixin.qq.com/document/path/94891
	 */
	async listMomentStrategy(body: S.ListMomentStrategyRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.ListMomentStrategyResponse>({
			method: 'POST',
			url: '/cgi-bin/externalcontact/moment_strategy/list',
			body,
			...opts,
		});
	}
	/**
	 * 修改客户备注信息
	 * @see https://developer.work.weixin.qq.com/document/path/92115
	 */
	async remarkExternalContact(body: S.RemarkExternalContactRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({ method: 'POST', url: '/cgi-bin/externalcontact/remark', body, ...opts });
	}
	/**
	 * 提醒成员群发
	 * @see https://developer.work.weixin.qq.com/document/path/97610
	 */
	async remindGroupMsgSend(body: S.RemindGroupMsgSendRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: '/cgi-bin/externalcontact/remind_groupmsg_send',
			body,
			...opts,
		});
	}
	/**
	 * 分配离职成员的客户
	 * @see https://developer.work.weixin.qq.com/document/path/94081
	 */
	async transferCustomerResigned(body: S.TransferCustomerResignedRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.TransferCustomerResignedResponse>({
			method: 'POST',
			url: '/cgi-bin/externalcontact/resigned/transfer_customer',
			body,
			...opts,
		});
	}
	/**
	 * 查询客户接替状态
	 * @see https://developer.work.weixin.qq.com/document/path/94090
	 */
	async transferResultResigned(body: S.TransferResultResignedRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.TransferResultResignedResponse>({
			method: 'POST',
			url: '/cgi-bin/externalcontact/resigned/transfer_result',
			body,
			...opts,
		});
	}
	/**
	 * 发送新客户欢迎语
	 * @see https://developer.work.weixin.qq.com/document/path/92137
	 */
	async sendWelcomeMessage(body: S.SendWelcomeMessageRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: '/cgi-bin/externalcontact/send_welcome_msg',
			body,
			...opts,
		});
	}
	/**
	 * 设置关注「学校通知」的模式
	 * @see https://developer.work.weixin.qq.com/document/path/92318
	 */
	async setExternalContactSubscribeMode(
		body: S.SetExternalContactSubscribeModeRequest,
		opts?: Partial<RequestOptions<any>>,
	) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: '/cgi-bin/externalcontact/set_subscribe_mode',
			body,
			...opts,
		});
	}
	/**
	 * 分配在职成员的客户
	 * @see https://developer.work.weixin.qq.com/document/path/92125
	 */
	async transferCustomerExternalContact(
		body: S.TransferCustomerExternalContactRequest,
		opts?: Partial<RequestOptions<any>>,
	) {
		return this.request<GeneralResponse & S.TransferCustomerExternalContactResponse>({
			method: 'POST',
			url: '/cgi-bin/externalcontact/transfer_customer',
			body,
			...opts,
		});
	}
	/**
	 * 查询客户接替状态
	 * @see https://developer.work.weixin.qq.com/document/path/94089
	 */
	async transferResultExternalContact(
		body: S.TransferResultExternalContactRequest,
		opts?: Partial<RequestOptions<any>>,
	) {
		return this.request<GeneralResponse & S.TransferResultExternalContactResponse>({
			method: 'POST',
			url: '/cgi-bin/externalcontact/transfer_result',
			body,
			...opts,
		});
	}
	/**
	 * 获取对外收款记录
	 * @see https://developer.work.weixin.qq.com/document/path/93667
	 */
	async listExternalPayBill(body: S.ListExternalPayBillRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.ListExternalPayBillResponse>({
			method: 'POST',
			url: '/cgi-bin/externalpay/get_bill_list',
			body,
			...opts,
		});
	}
	/**
	 * 获取资金流水
	 * @see https://developer.work.weixin.qq.com/document/path/98100
	 */
	async getFundFlow(body: S.GetFundFlowRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetFundFlowResponse>({
			method: 'POST',
			url: '/cgi-bin/externalpay/get_fund_flow',
			body,
			...opts,
		});
	}
	/**
	 * 获取收款项目的商户单号
	 * @see https://developer.work.weixin.qq.com/document/path/96076
	 */
	async getPaymentInfo(body: S.GetPaymentInfoRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetPaymentInfoResponse>({
			method: 'POST',
			url: '/cgi-bin/externalpay/get_payment_info',
			body,
			...opts,
		});
	}
	/**
	 * 查询商户号详情
	 * @see https://developer.work.weixin.qq.com/document/path/93666
	 */
	async getMerchantDetail(body: S.GetMerchantDetailRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetMerchantDetailResponse>({
			method: 'POST',
			url: '/cgi-bin/externalpay/getmerchant',
			body,
			...opts,
		});
	}
	/**
	 * 获取唤起企业微信 code
	 * @see https://developer.work.weixin.qq.com/document/path/94345
	 */
	async getLaunchCode(body: S.GetLaunchCodeRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetLaunchCodeResponse>({
			method: 'POST',
			url: '/cgi-bin/get_launch_code',
			body,
			...opts,
		});
	}
	/**
	 * 获取设备打卡数据
	 * @see https://developer.work.weixin.qq.com/document/path/94126
	 */
	async getHardwareCheckinData(body: S.GetHardwareCheckinDataRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetHardwareCheckinDataResponse>({
			method: 'POST',
			url: '/cgi-bin/hardware/get_hardware_checkin_data',
			body,
			...opts,
		});
	}
	/**
	 * 获取健康上报使用统计
	 * @see https://developer.work.weixin.qq.com/document/path/93676
	 */
	async getHealthReportStat(body: S.GetHealthReportStatRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetHealthReportStatResponse>({
			method: 'POST',
			url: '/cgi-bin/health/get_health_report_stat',
			body,
			...opts,
		});
	}
	/**
	 * 获取用户填写答案
	 * @see https://developer.work.weixin.qq.com/document/path/93679
	 */
	async getReportAnswer(body: S.GetReportAnswerRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetReportAnswerResponse>({
			method: 'POST',
			url: '/cgi-bin/health/get_report_answer',
			body,
			...opts,
		});
	}
	/**
	 * 获取健康上报任务详情
	 * @see https://developer.work.weixin.qq.com/document/path/93678
	 */
	async getHealthReportJobInfo(body: S.GetHealthReportJobInfoRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetHealthReportJobInfoResponse>({
			method: 'POST',
			url: '/cgi-bin/health/get_report_job_info',
			body,
			...opts,
		});
	}
	/**
	 * 获取健康上报任务ID列表
	 * @see https://developer.work.weixin.qq.com/document/path/93677
	 */
	async getHealthReportJobIds(body: S.GetHealthReportJobIdsRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetHealthReportJobIdsResponse>({
			method: 'POST',
			url: '/cgi-bin/health/get_report_jobids',
			body,
			...opts,
		});
	}
	/**
	 * 获取员工字段配置
	 * @see https://developer.work.weixin.qq.com/document/path/99131
	 */
	async getEmployeeFieldConfig(opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetEmployeeFieldConfigResponse>({ url: '/cgi-bin/hr/get_fields', ...opts });
	}
	/**
	 * 获取员工花名册信息
	 * @see https://developer.work.weixin.qq.com/document/path/99132
	 */
	async getStaffInfo(body: S.GetStaffInfoRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetStaffInfoResponse>({
			method: 'POST',
			url: '/cgi-bin/hr/get_staff_info',
			body,
			...opts,
		});
	}
	/**
	 * 更新员工花名册信息
	 * @see https://developer.work.weixin.qq.com/document/path/99133
	 */
	async updateStaffInfo(body: S.UpdateStaffInfoRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.UpdateStaffInfoResponse>({
			method: 'POST',
			url: '/cgi-bin/hr/update_staff_info',
			body,
			...opts,
		});
	}
	/**
	 * 临时外部用户ID转换
	 * @see https://developer.work.weixin.qq.com/document/path/98729
	 */
	async convertTmpExternalUserid(body: S.ConvertTmpExternalUseridRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.ConvertTmpExternalUseridResponse>({
			method: 'POST',
			url: '/cgi-bin/idconvert/convert_tmp_external_userid',
			body,
			...opts,
		});
	}
	/**
	 * 添加客服账号
	 * @see https://developer.work.weixin.qq.com/document/path/94662
	 */
	async addKfAccount(body: S.AddKfAccountRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.AddKfAccountResponse>({
			method: 'POST',
			url: '/cgi-bin/kf/account/add',
			body,
			...opts,
		});
	}
	/**
	 * 删除客服账号
	 * @see https://developer.work.weixin.qq.com/document/path/94663
	 */
	async deleteKfAccount(body: S.DeleteKfAccountRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({ method: 'POST', url: '/cgi-bin/kf/account/del', body, ...opts });
	}
	/**
	 * 获取客服账号列表
	 * @see https://developer.work.weixin.qq.com/document/path/94706
	 */
	async listKfAccount(body: S.ListKfAccountRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.ListKfAccountResponse>({
			method: 'POST',
			url: '/cgi-bin/kf/account/list',
			body,
			...opts,
		});
	}
	/**
	 * 修改客服账号
	 * @see https://developer.work.weixin.qq.com/document/path/94682
	 */
	async updateKfAccount(body: S.UpdateKfAccountRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({ method: 'POST', url: '/cgi-bin/kf/account/update', body, ...opts });
	}
	/**
	 * 获取客户基础信息
	 * @see https://developer.work.weixin.qq.com/document/path/95171
	 */
	async batchGetCustomer(body: S.BatchGetCustomerRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.BatchGetCustomerResponse>({
			method: 'POST',
			url: '/cgi-bin/kf/customer/batchget',
			body,
			...opts,
		});
	}
	/**
	 * 获取配置的专员与客户群
	 * @see https://developer.work.weixin.qq.com/document/path/94763
	 */
	async getUpgradeServiceConfig(opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetUpgradeServiceConfigResponse>({
			url: '/cgi-bin/kf/customer/get_upgrade_service_config',
			...opts,
		});
	}
	/**
	 * 获取「客户数据统计」企业汇总数据
	 * @see https://developer.work.weixin.qq.com/document/path/95489
	 */
	async getCorpStatistic(body: S.GetCorpStatisticRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetCorpStatisticResponse>({
			method: 'POST',
			url: '/cgi-bin/kf/get_corp_statistic',
			body,
			...opts,
		});
	}
	/**
	 * 获取「客户数据统计」接待人员明细数据
	 * @see https://developer.work.weixin.qq.com/document/path/95490
	 */
	async getServicerStatistic(body: S.GetServicerStatisticRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetServicerStatisticResponse>({
			method: 'POST',
			url: '/cgi-bin/kf/get_servicer_statistic',
			body,
			...opts,
		});
	}
	/**
	 * 添加知识库分组
	 * @see https://developer.work.weixin.qq.com/document/path/95971
	 */
	async addKnowledgeGroup(body: S.AddKnowledgeGroupRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.AddKnowledgeGroupResponse>({
			method: 'POST',
			url: '/cgi-bin/kf/knowledge/add_group',
			body,
			...opts,
		});
	}
	/**
	 * 添加问答
	 * @see https://developer.work.weixin.qq.com/document/path/95972
	 */
	async addKnowledgeIntent(body: S.AddKnowledgeIntentRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.AddKnowledgeIntentResponse>({
			method: 'POST',
			url: '/cgi-bin/kf/knowledge/add_intent',
			body,
			...opts,
		});
	}
	/**
	 * 发送消息
	 * @see https://developer.work.weixin.qq.com/document/path/94677
	 */
	async sendKfMsg(body: S.SendKfMsgRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.SendKfMsgResponse>({
			method: 'POST',
			url: '/cgi-bin/kf/send_msg',
			body,
			...opts,
		});
	}
	/**
	 * 发送欢迎语等事件响应消息
	 * @see https://developer.work.weixin.qq.com/document/path/95122
	 */
	async sendKfEventMsg(body: S.SendKfEventMsgRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.SendKfEventMsgResponse>({
			method: 'POST',
			url: '/cgi-bin/kf/send_msg_on_event',
			body,
			...opts,
		});
	}
	/**
	 * 变更会话状态
	 * @see https://developer.work.weixin.qq.com/document/path/94669
	 */
	async transferServiceState(body: S.TransferServiceStateRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.TransferServiceStateResponse>({
			method: 'POST',
			url: '/cgi-bin/kf/service_state/trans',
			body,
			...opts,
		});
	}
	/**
	 * 添加接待人员
	 * @see https://developer.work.weixin.qq.com/document/path/94722
	 */
	async addServicer(body: S.AddServicerRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.AddServicerResponse>({
			method: 'POST',
			url: '/cgi-bin/kf/servicer/add',
			body,
			...opts,
		});
	}
	/**
	 * 删除接待人员
	 * @see https://developer.work.weixin.qq.com/document/path/94723
	 */
	async deleteServiceUser(body: S.DeleteServiceUserRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.DeleteServiceUserResponse>({
			method: 'POST',
			url: '/cgi-bin/kf/servicer/del',
			body,
			...opts,
		});
	}
	/**
	 * 获取接待人员列表
	 * @see https://developer.work.weixin.qq.com/document/path/94724
	 */
	async listServicer(params: S.ListServicerRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.ListServicerResponse>({
			url: '/cgi-bin/kf/servicer/list',
			params,
			...opts,
		});
	}
	/**
	 * 接收消息和事件
	 * @see https://developer.work.weixin.qq.com/document/path/94670
	 */
	async syncMsg(body: S.SyncMsgRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.SyncMsgResponse>({
			method: 'POST',
			url: '/cgi-bin/kf/sync_msg',
			body,
			...opts,
		});
	}
	/**
	 * 取消预约直播
	 * @see https://developer.work.weixin.qq.com/document/path/93789
	 */
	async cancelLiving(body: S.CancelLivingRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({ method: 'POST', url: '/cgi-bin/living/cancel', body, ...opts });
	}
	/**
	 * 创建预约直播
	 * @see https://developer.work.weixin.qq.com/document/path/93788
	 */
	async createLiving(body: S.CreateLivingRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.CreateLivingResponse>({
			method: 'POST',
			url: '/cgi-bin/living/create',
			body,
			...opts,
		});
	}
	/**
	 * 删除直播回放
	 * @see https://developer.work.weixin.qq.com/document/path/93743
	 */
	async deleteLivingReplayData(body: S.DeleteLivingReplayDataRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({ method: 'POST', url: '/cgi-bin/living/delete_replay_data', body, ...opts });
	}
	/**
	 * 获取微信观看直播凭证
	 * @see https://developer.work.weixin.qq.com/document/path/93838
	 */
	async getLivingCode(body: S.GetLivingCodeRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetLivingCodeResponse>({
			method: 'POST',
			url: '/cgi-bin/living/get_living_code',
			body,
			...opts,
		});
	}
	/**
	 * 获取直播详情
	 * @see https://developer.work.weixin.qq.com/document/path/93635
	 */
	async getLivingInfo(params: S.GetLivingInfoRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetLivingInfoResponse>({
			url: '/cgi-bin/living/get_living_info',
			params,
			...opts,
		});
	}
	/**
	 * 获取跳转小程序商城的直播观众信息
	 * @see https://developer.work.weixin.qq.com/document/path/94487
	 */
	async getLivingShareInfo(body: S.GetLivingShareInfoRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetLivingShareInfoResponse>({
			method: 'POST',
			url: '/cgi-bin/living/get_living_share_info',
			body,
			...opts,
		});
	}
	/**
	 * 获取老师直播ID列表
	 * @see https://developer.work.weixin.qq.com/document/path/93739
	 */
	async listUserLivingId(body: S.ListUserLivingIdRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.ListUserLivingIdResponse>({
			method: 'POST',
			url: '/cgi-bin/living/get_user_all_livingid',
			body,
			...opts,
		});
	}
	/**
	 * 获取直播观看明细
	 * @see https://developer.work.weixin.qq.com/document/path/93787
	 */
	async getLivingWatchStat(body: S.GetLivingWatchStatRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetLivingWatchStatResponse>({
			method: 'POST',
			url: '/cgi-bin/living/get_watch_stat',
			body,
			...opts,
		});
	}
	/**
	 * 修改预约直播
	 * @see https://developer.work.weixin.qq.com/document/path/93790
	 */
	async modifyLiving(body: S.ModifyLivingRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({ method: 'POST', url: '/cgi-bin/living/modify', body, ...opts });
	}
	/**
	 * 获取临时素材
	 * @see https://developer.work.weixin.qq.com/document/path/90077
	 */
	async getTempMedia(params: S.GetTempMediaRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({ url: '/cgi-bin/media/get', params, ...opts });
	}
	/**
	 * 获取高清语音素材
	 * @see https://developer.work.weixin.qq.com/document/path/90078
	 */
	async getMediaVoice(params: S.GetMediaVoiceRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({ url: '/cgi-bin/media/get/jssdk', params, ...opts });
	}
	/**
	 * 上传临时素材
	 * @see https://developer.work.weixin.qq.com/document/path/90076
	 */
	async uploadMedia(body: S.UploadMediaRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.UploadMediaResponse>({
			method: 'POST',
			url: '/cgi-bin/media/upload',
			body,
			...opts,
		});
	}
	/**
	 * 上传附件资源
	 * @see https://developer.work.weixin.qq.com/document/path/95105
	 */
	async uploadAttachment(body: S.UploadAttachmentRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.UploadAttachmentResponse>({
			method: 'POST',
			url: '/cgi-bin/media/upload_attachment',
			body,
			...opts,
		});
	}
	/**
	 * 异步上传临时素材
	 * @see https://developer.work.weixin.qq.com/document/path/97078
	 */
	async uploadMediaByUrl(body: S.UploadMediaByUrlRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.UploadMediaByUrlResponse>({
			method: 'POST',
			url: '/cgi-bin/media/upload_by_url',
			body,
			...opts,
		});
	}
	/**
	 * 上传图片
	 * @see https://developer.work.weixin.qq.com/document/path/90079
	 */
	async uploadImage(body: S.UploadImageRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.UploadImageResponse>({
			method: 'POST',
			url: '/cgi-bin/media/uploadimg',
			body,
			...opts,
		});
	}
	/**
	 * 添加会议高级布局
	 * @see https://developer.work.weixin.qq.com/document/path/99302
	 */
	async addMeetingAdvancedLayout(body: S.AddMeetingAdvancedLayoutRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.AddMeetingAdvancedLayoutResponse>({
			method: 'POST',
			url: '/cgi-bin/meeting/advanced_layout/add',
			body,
			...opts,
		});
	}
	/**
	 * 设置高级布局
	 * @see https://developer.work.weixin.qq.com/document/path/99304
	 */
	async applyMeetingAdvancedLayout(body: S.ApplyMeetingAdvancedLayoutRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: '/cgi-bin/meeting/advanced_layout/apply',
			body,
			...opts,
		});
	}
	/**
	 * 批量删除布局
	 * @see https://developer.work.weixin.qq.com/document/path/99261
	 */
	async batchDeleteLayout(body: S.BatchDeleteLayoutRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: '/cgi-bin/meeting/advanced_layout/batch_delete',
			body,
			...opts,
		});
	}
	/**
	 * 获取用户布局
	 * @see https://developer.work.weixin.qq.com/document/path/99260
	 */
	async getUserLayout(body: S.GetUserLayoutRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetUserLayoutResponse>({
			method: 'POST',
			url: '/cgi-bin/meeting/advanced_layout/get_user_layout',
			body,
			...opts,
		});
	}
	/**
	 * 获取会议布局列表
	 * @see https://developer.work.weixin.qq.com/document/path/99259
	 */
	async listMeetingAdvancedLayout(body: S.ListMeetingAdvancedLayoutRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.ListMeetingAdvancedLayoutResponse>({
			method: 'POST',
			url: '/cgi-bin/meeting/advanced_layout/list',
			body,
			...opts,
		});
	}
	/**
	 * 修改会议高级布局
	 * @see https://developer.work.weixin.qq.com/document/path/99303
	 */
	async updateMeetingAdvancedLayout(body: S.UpdateMeetingAdvancedLayoutRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: '/cgi-bin/meeting/advanced_layout/update',
			body,
			...opts,
		});
	}
	/**
	 * 取消预约会议
	 * @see https://developer.work.weixin.qq.com/document/path/98990
	 */
	async cancelMeeting(body: S.CancelMeetingRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({ method: 'POST', url: '/cgi-bin/meeting/cancel', body, ...opts });
	}
	/**
	 * 获取成员设备是否入会
	 * @see https://developer.work.weixin.qq.com/document/path/99013
	 */
	async checkMeetingDevice(body: S.CheckMeetingDeviceRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.CheckMeetingDeviceResponse>({
			method: 'POST',
			url: '/cgi-bin/meeting/check_device_in_meeting',
			body,
			...opts,
		});
	}
	/**
	 * 创建预约会议
	 * @see https://developer.work.weixin.qq.com/document/path/99104
	 */
	async createMeeting(body: S.CreateMeetingRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.CreateMeetingResponse>({
			method: 'POST',
			url: '/cgi-bin/meeting/create',
			body,
			...opts,
		});
	}
	/**
	 * 创建用户专属参会链接
	 * @see https://developer.work.weixin.qq.com/document/path/98818
	 */
	async createCustomerShortUrl(body: S.CreateCustomerShortUrlRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.CreateCustomerShortUrlResponse>({
			method: 'POST',
			url: '/cgi-bin/meeting/create_customer_short_url',
			body,
			...opts,
		});
	}
	/**
	 * 审批会议报名信息
	 * @see https://developer.work.weixin.qq.com/document/path/98807
	 */
	async approveMeetingEnroll(body: S.ApproveMeetingEnrollRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.ApproveMeetingEnrollResponse>({
			method: 'POST',
			url: '/cgi-bin/meeting/enroll/approve',
			body,
			...opts,
		});
	}
	/**
	 * 删除会议报名信息
	 * @see https://developer.work.weixin.qq.com/document/path/98817
	 */
	async deleteMeetingEnroll(body: S.DeleteMeetingEnrollRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.DeleteMeetingEnrollResponse>({
			method: 'POST',
			url: '/cgi-bin/meeting/enroll/delete',
			body,
			...opts,
		});
	}
	/**
	 * 获取会议报名配置
	 * @see https://developer.work.weixin.qq.com/document/path/99055
	 */
	async getMeetingEnrollConfig(body: S.GetMeetingEnrollConfigRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetMeetingEnrollConfigResponse>({
			method: 'POST',
			url: '/cgi-bin/meeting/enroll/get_config',
			body,
			...opts,
		});
	}
	/**
	 * 导入会议报名信息
	 * @see https://developer.work.weixin.qq.com/document/path/98816
	 */
	async importMeetingEnroll(body: S.ImportMeetingEnrollRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.ImportMeetingEnrollResponse>({
			method: 'POST',
			url: '/cgi-bin/meeting/enroll/import',
			body,
			...opts,
		});
	}
	/**
	 * 获取会议报名信息
	 * @see https://developer.work.weixin.qq.com/document/path/99054
	 */
	async listMeetingEnroll(body: S.ListMeetingEnrollRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.ListMeetingEnrollResponse>({
			method: 'POST',
			url: '/cgi-bin/meeting/enroll/list',
			body,
			...opts,
		});
	}
	/**
	 * 获取会议成员报名 ID
	 * @see https://developer.work.weixin.qq.com/document/path/99014
	 */
	async queryMeetingEnrollIdByTmpOpenid(
		body: S.QueryMeetingEnrollIdByTmpOpenidRequest,
		opts?: Partial<RequestOptions<any>>,
	) {
		return this.request<GeneralResponse & S.QueryMeetingEnrollIdByTmpOpenidResponse>({
			method: 'POST',
			url: '/cgi-bin/meeting/enroll/query_by_tmp_openid',
			body,
			...opts,
		});
	}
	/**
	 * 修改会议报名配置
	 * @see https://developer.work.weixin.qq.com/document/path/98797
	 */
	async setMeetingEnrollConfig(body: S.SetMeetingEnrollConfigRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.SetMeetingEnrollConfigResponse>({
			method: 'POST',
			url: '/cgi-bin/meeting/enroll/set_config',
			body,
			...opts,
		});
	}
	/**
	 * 获取已参会成员列表
	 * @see https://developer.work.weixin.qq.com/document/path/99295
	 */
	async listAttendee(body: S.ListAttendeeRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.ListAttendeeResponse>({
			method: 'POST',
			url: '/cgi-bin/meeting/get_attendee_list',
			body,
			...opts,
		});
	}
	/**
	 * 获取用户专属参会链接
	 * @see https://developer.work.weixin.qq.com/document/path/98819
	 */
	async getCustomerShortUrl(body: S.GetCustomerShortUrlRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetCustomerShortUrlResponse>({
			method: 'POST',
			url: '/cgi-bin/meeting/get_customer_short_url',
			body,
			...opts,
		});
	}
	/**
	 * 获取会议嘉宾列表
	 * @see https://developer.work.weixin.qq.com/document/path/99077
	 */
	async listMeetingGuests(body: S.ListMeetingGuestsRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.ListMeetingGuestsResponse>({
			method: 'POST',
			url: '/cgi-bin/meeting/get_guests',
			body,
			...opts,
		});
	}
	/**
	 * 获取会议详情
	 * @see https://developer.work.weixin.qq.com/document/path/99015
	 */
	async getMeetingInfo(body: S.GetMeetingInfoRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetMeetingInfoResponse>({
			method: 'POST',
			url: '/cgi-bin/meeting/get_info',
			body,
			...opts,
		});
	}
	/**
	 * 获取会议受邀成员列表
	 * @see https://developer.work.weixin.qq.com/document/path/98160
	 */
	async listMeetingInvitees(body: S.ListMeetingInviteesRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.ListMeetingInviteesResponse>({
			method: 'POST',
			url: '/cgi-bin/meeting/get_invitees',
			body,
			...opts,
		});
	}
	/**
	 * 获取会议健康度
	 * @see https://developer.work.weixin.qq.com/document/path/99053
	 */
	async getMeetingQuality(body: S.GetMeetingQualityRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetMeetingQualityResponse>({
			method: 'POST',
			url: '/cgi-bin/meeting/get_quality',
			body,
			...opts,
		});
	}
	/**
	 * 获取实时会中成员列表
	 * @see https://developer.work.weixin.qq.com/document/path/99012
	 */
	async listRealtimeAttendee(body: S.ListRealtimeAttendeeRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.ListRealtimeAttendeeResponse>({
			method: 'POST',
			url: '/cgi-bin/meeting/get_realtime_attendee_list',
			body,
			...opts,
		});
	}
	/**
	 * 获取成员会议ID列表
	 * @see https://developer.work.weixin.qq.com/document/path/99050
	 */
	async getUserMeetingId(body: S.GetUserMeetingIdRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetUserMeetingIdResponse>({
			method: 'POST',
			url: '/cgi-bin/meeting/get_user_meetingid',
			body,
			...opts,
		});
	}
	/**
	 * 添加会议基础布局
	 * @see https://developer.work.weixin.qq.com/document/path/99300
	 */
	async addMeetingLayout(body: S.AddMeetingLayoutRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.AddMeetingLayoutResponse>({
			method: 'POST',
			url: '/cgi-bin/meeting/layout/add',
			body,
			...opts,
		});
	}
	/**
	 * 添加会议背景
	 * @see https://developer.work.weixin.qq.com/document/path/98851
	 */
	async addMeetingBackground(body: S.AddMeetingBackgroundRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.AddMeetingBackgroundResponse>({
			method: 'POST',
			url: '/cgi-bin/meeting/layout/add_background',
			body,
			...opts,
		});
	}
	/**
	 * 批量删除会议背景
	 * @see https://developer.work.weixin.qq.com/document/path/98854
	 */
	async batchDeleteMeetingBackground(body: S.BatchDeleteMeetingBackgroundRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: '/cgi-bin/meeting/layout/batch_delete_background',
			body,
			...opts,
		});
	}
	/**
	 * 删除会议背景
	 * @see https://developer.work.weixin.qq.com/document/path/98853
	 */
	async deleteMeetingBackground(body: S.DeleteMeetingBackgroundRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: '/cgi-bin/meeting/layout/delete_background',
			body,
			...opts,
		});
	}
	/**
	 * 获取会议背景列表
	 * @see https://developer.work.weixin.qq.com/document/path/99224
	 */
	async listMeetingBackgrounds(body: S.ListMeetingBackgroundsRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.ListMeetingBackgroundsResponse>({
			method: 'POST',
			url: '/cgi-bin/meeting/layout/list_background',
			body,
			...opts,
		});
	}
	/**
	 * 获取布局模板列表
	 * @see https://developer.work.weixin.qq.com/document/path/99299
	 */
	async listMeetingLayoutTemplate(opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.ListMeetingLayoutTemplateResponse>({
			url: '/cgi-bin/meeting/layout/list_template',
			...opts,
		});
	}
	/**
	 * 设置会议默认布局
	 * @see https://developer.work.weixin.qq.com/document/path/98847
	 */
	async setMeetingDefaultLayout(body: S.SetMeetingDefaultLayoutRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({ method: 'POST', url: '/cgi-bin/meeting/layout/set_default', body, ...opts });
	}
	/**
	 * 设置会议默认背景
	 * @see https://developer.work.weixin.qq.com/document/path/98852
	 */
	async setMeetingDefaultBackground(body: S.SetMeetingDefaultBackgroundRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: '/cgi-bin/meeting/layout/set_default_background',
			body,
			...opts,
		});
	}
	/**
	 * 修改会议基础布局
	 * @see https://developer.work.weixin.qq.com/document/path/99301
	 */
	async updateMeetingLayout(body: S.UpdateMeetingLayoutRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({ method: 'POST', url: '/cgi-bin/meeting/layout/update', body, ...opts });
	}
	/**
	 * 挂断 MRA 呼叫
	 * @see https://developer.work.weixin.qq.com/document/path/99036
	 */
	async hangupMraCall(body: S.HangupMraCallRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({ method: 'POST', url: '/cgi-bin/meeting/mra/hangup', body, ...opts });
	}
	/**
	 * 获取 MRA 状态信息
	 * @see https://developer.work.weixin.qq.com/document/path/99033
	 */
	async queryMraStatus(body: S.QueryMraStatusRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.QueryMraStatusResponse>({
			method: 'POST',
			url: '/cgi-bin/meeting/mra/query_status',
			body,
			...opts,
		});
	}
	/**
	 * 设置 MRA 举手或手放下
	 * @see https://developer.work.weixin.qq.com/document/path/98788
	 */
	async setMRAHand(body: S.SetMRAHandRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({ method: 'POST', url: '/cgi-bin/meeting/mra/set_raise_hand', body, ...opts });
	}
	/**
	 * 批量外呼
	 * @see https://developer.work.weixin.qq.com/document/path/98823
	 */
	async batchPhoneCallout(body: S.BatchPhoneCalloutRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.BatchPhoneCalloutResponse>({
			method: 'POST',
			url: '/cgi-bin/meeting/phone/callout',
			body,
			...opts,
		});
	}
	/**
	 * 获取会议的外呼状态
	 * @see https://developer.work.weixin.qq.com/document/path/99096
	 */
	async getMeetingCalloutStatus(body: S.GetMeetingCalloutStatusRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetMeetingCalloutStatusResponse>({
			method: 'POST',
			url: '/cgi-bin/meeting/phone/get_callout_status',
			body,
			...opts,
		});
	}
	/**
	 * 获取电话入会的成员ID
	 * @see https://developer.work.weixin.qq.com/document/path/99097
	 */
	async getMeetingPhoneTmpOpenId(body: S.GetMeetingPhoneTmpOpenIdRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetMeetingPhoneTmpOpenIdResponse>({
			method: 'POST',
			url: '/cgi-bin/meeting/phone/get_tmp_openid',
			body,
			...opts,
		});
	}
	/**
	 * 创建会议投票主题
	 * @see https://developer.work.weixin.qq.com/document/path/98834
	 */
	async createMeetingPollTheme(body: S.CreateMeetingPollThemeRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.CreateMeetingPollThemeResponse>({
			method: 'POST',
			url: '/cgi-bin/meeting/poll/create_theme',
			body,
			...opts,
		});
	}
	/**
	 * 删除会议投票
	 * @see https://developer.work.weixin.qq.com/document/path/98839
	 */
	async deleteMeetingPoll(body: S.DeleteMeetingPollRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({ method: 'POST', url: '/cgi-bin/meeting/poll/delete', body, ...opts });
	}
	/**
	 * 结束会议投票
	 * @see https://developer.work.weixin.qq.com/document/path/98841
	 */
	async finishMeetingPoll(body: S.FinishMeetingPollRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({ method: 'POST', url: '/cgi-bin/meeting/poll/finish', body, ...opts });
	}
	/**
	 * 获取会议投票详情
	 * @see https://developer.work.weixin.qq.com/document/path/99218
	 */
	async getPollDetail(body: S.GetPollDetailRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetPollDetailResponse>({
			method: 'POST',
			url: '/cgi-bin/meeting/poll/get_poll_detail',
			body,
			...opts,
		});
	}
	/**
	 * 获取会议投票列表
	 * @see https://developer.work.weixin.qq.com/document/path/99216
	 */
	async listMeetingPoll(body: S.ListMeetingPollRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.ListMeetingPollResponse>({
			method: 'POST',
			url: '/cgi-bin/meeting/poll/get_poll_list',
			body,
			...opts,
		});
	}
	/**
	 * 获取会议投票主题信息
	 * @see https://developer.work.weixin.qq.com/document/path/99217
	 */
	async getMeetingPollThemeInfo(body: S.GetMeetingPollThemeInfoRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetMeetingPollThemeInfoResponse>({
			method: 'POST',
			url: '/cgi-bin/meeting/poll/get_theme_info',
			body,
			...opts,
		});
	}
	/**
	 * 发起会议投票
	 * @see https://developer.work.weixin.qq.com/document/path/98840
	 */
	async startMeetingPoll(body: S.StartMeetingPollRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.StartMeetingPollResponse>({
			method: 'POST',
			url: '/cgi-bin/meeting/poll/start',
			body,
			...opts,
		});
	}
	/**
	 * 修改会议投票主题
	 * @see https://developer.work.weixin.qq.com/document/path/98835
	 */
	async updateMeetingPollTheme(body: S.UpdateMeetingPollThemeRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({ method: 'POST', url: '/cgi-bin/meeting/poll/update_theme', body, ...opts });
	}
	/**
	 * 关闭成员屏幕共享
	 * @see https://developer.work.weixin.qq.com/document/path/99094
	 */
	async closeScreenShare(body: S.CloseScreenShareRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: '/cgi-bin/meeting/realcontrol/close_screen_share',
			body,
			...opts,
		});
	}
	/**
	 * 结束会议
	 * @see https://developer.work.weixin.qq.com/document/path/98187
	 */
	async dismissMeeting(body: S.DismissMeetingRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: '/cgi-bin/meeting/realcontrol/dismiss',
			body,
			...opts,
		});
	}
	/**
	 * 移出成员
	 * @see https://developer.work.weixin.qq.com/document/path/99051
	 */
	async kickoutMeetingUsers(body: S.KickoutMeetingUsersRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: '/cgi-bin/meeting/realcontrol/kickout_users',
			body,
			...opts,
		});
	}
	/**
	 * 管理等候室成员
	 * @see https://developer.work.weixin.qq.com/document/path/99018
	 */
	async manageWaitingRoomUsers(body: S.ManageWaitingRoomUsersRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: '/cgi-bin/meeting/realcontrol/manage_waiting_room_users',
			body,
			...opts,
		});
	}
	/**
	 * 静音成员
	 * @see https://developer.work.weixin.qq.com/document/path/99025
	 */
	async muteMeetingUser(body: S.MuteMeetingUserRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: '/cgi-bin/meeting/realcontrol/mute_user',
			body,
			...opts,
		});
	}
	/**
	 * 管理会中设置
	 * @see https://developer.work.weixin.qq.com/document/path/99016
	 */
	async setMeetingConfig(body: S.SetMeetingConfigRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({ method: 'POST', url: '/cgi-bin/meeting/realcontrol/set', body, ...opts });
	}
	/**
	 * 管理联席主持人
	 * @see https://developer.work.weixin.qq.com/document/path/99017
	 */
	async setMeetingCohost(body: S.SetMeetingCohostRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: '/cgi-bin/meeting/realcontrol/set_cohost',
			body,
			...opts,
		});
	}
	/**
	 * 修改成员在会中显示的昵称
	 * @see https://developer.work.weixin.qq.com/document/path/99095
	 */
	async setMeetingNicknames(body: S.SetMeetingNicknamesRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: '/cgi-bin/meeting/realcontrol/set_nicknames',
			body,
			...opts,
		});
	}
	/**
	 * 关闭或开启成员视频
	 * @see https://developer.work.weixin.qq.com/document/path/99026
	 */
	async switchUserVideo(body: S.SwitchUserVideoRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: '/cgi-bin/meeting/realcontrol/switch_user_video',
			body,
			...opts,
		});
	}
	/**
	 * 删除会议录制
	 * @see https://developer.work.weixin.qq.com/document/path/98206
	 */
	async deleteMeetingRecord(body: S.DeleteMeetingRecordRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({ method: 'POST', url: '/cgi-bin/meeting/record/delete', body, ...opts });
	}
	/**
	 * 删除单个录制文件
	 * @see https://developer.work.weixin.qq.com/document/path/98207
	 */
	async deleteMeetingRecordFile(body: S.DeleteMeetingRecordFileRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({ method: 'POST', url: '/cgi-bin/meeting/record/delete_file', body, ...opts });
	}
	/**
	 * 获取单个录制文件详情
	 * @see https://developer.work.weixin.qq.com/document/path/100916
	 */
	async getRecordFileDetail(body: S.GetRecordFileDetailRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetRecordFileDetailResponse>({
			method: 'POST',
			url: '/cgi-bin/meeting/record/get_file',
			body,
			...opts,
		});
	}
	/**
	 * 获取会议录制地址
	 * @see https://developer.work.weixin.qq.com/document/path/100917
	 */
	async getMeetingRecordFileList(body: S.GetMeetingRecordFileListRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetMeetingRecordFileListResponse>({
			method: 'POST',
			url: '/cgi-bin/meeting/record/get_file_list',
			body,
			...opts,
		});
	}
	/**
	 * 获取录制文件访问统计
	 * @see https://developer.work.weixin.qq.com/document/path/99263
	 */
	async listMeetingRecordStatistics(body: S.ListMeetingRecordStatisticsRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.ListMeetingRecordStatisticsResponse>({
			method: 'POST',
			url: '/cgi-bin/meeting/record/get_statistics',
			body,
			...opts,
		});
	}
	/**
	 * 获取会议录制列表
	 * @see https://developer.work.weixin.qq.com/document/path/99236
	 */
	async listMeetingRecord(body: S.ListMeetingRecordRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.ListMeetingRecordResponse>({
			method: 'POST',
			url: '/cgi-bin/meeting/record/list',
			body,
			...opts,
		});
	}
	/**
	 * 获取录制转写详情
	 * @see https://developer.work.weixin.qq.com/document/path/100926
	 */
	async getTranscriptDetail(body: S.GetTranscriptDetailRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetTranscriptDetailResponse>({
			method: 'POST',
			url: '/cgi-bin/meeting/record/transcript/get_detail',
			body,
			...opts,
		});
	}
	/**
	 * 获取录制转写段落信息
	 * @see https://developer.work.weixin.qq.com/document/path/100925
	 */
	async getTranscriptParagraphList(body: S.GetTranscriptParagraphListRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetTranscriptParagraphListResponse>({
			method: 'POST',
			url: '/cgi-bin/meeting/record/transcript/get_paragraph_list',
			body,
			...opts,
		});
	}
	/**
	 * 获取录制转写搜索结果
	 * @see https://developer.work.weixin.qq.com/document/path/100927
	 */
	async searchTranscript(body: S.SearchTranscriptRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.SearchTranscriptResponse>({
			method: 'POST',
			url: '/cgi-bin/meeting/record/transcript/search',
			body,
			...opts,
		});
	}
	/**
	 * 修改会议录制共享设置
	 * @see https://developer.work.weixin.qq.com/document/path/98208
	 */
	async updateMeetingRecordSharingConfig(
		body: S.UpdateMeetingRecordSharingConfigRequest,
		opts?: Partial<RequestOptions<any>>,
	) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: '/cgi-bin/meeting/record/update_sharing_config',
			body,
			...opts,
		});
	}
	/**
	 * 预定Rooms会议室
	 * @see https://developer.work.weixin.qq.com/document/path/99273
	 */
	async bookMeetingRooms(body: S.BookMeetingRoomsRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.BookMeetingRoomsResponse>({
			method: 'POST',
			url: '/cgi-bin/meeting/rooms/book',
			body,
			...opts,
		});
	}
	/**
	 * 呼叫Rooms会议室
	 * @see https://developer.work.weixin.qq.com/document/path/99276
	 */
	async callMeetingRoom(body: S.CallMeetingRoomRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.CallMeetingRoomResponse>({
			method: 'POST',
			url: '/cgi-bin/meeting/rooms/call',
			body,
			...opts,
		});
	}
	/**
	 * 取消呼叫Rooms会议室
	 * @see https://developer.work.weixin.qq.com/document/path/99275
	 */
	async cancelRoomCall(body: S.CancelRoomCallRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({ method: 'POST', url: '/cgi-bin/meeting/rooms/cancel_call', body, ...opts });
	}
	/**
	 * 获取Rooms会议室配置项
	 * @see https://developer.work.weixin.qq.com/document/path/99277
	 */
	async getMeetingRoomConfig(body: S.GetMeetingRoomConfigRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetMeetingRoomConfigResponse>({
			method: 'POST',
			url: '/cgi-bin/meeting/rooms/get_config',
			body,
			...opts,
		});
	}
	/**
	 * 获取Rooms会议室详情
	 * @see https://developer.work.weixin.qq.com/document/path/99279
	 */
	async getRoomInfo(body: S.GetRoomInfoRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetRoomInfoResponse>({
			method: 'POST',
			url: '/cgi-bin/meeting/rooms/get_info',
			body,
			...opts,
		});
	}
	/**
	 * 获取Rooms会议室资源
	 * @see https://developer.work.weixin.qq.com/document/path/99298
	 */
	async getMeetingRoomInventory(body?: Record<string, any>, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetMeetingRoomInventoryResponse>({
			method: 'POST',
			url: '/cgi-bin/meeting/rooms/get_inventory',
			body,
			...opts,
		});
	}
	/**
	 * 获取Rooms会议室应答状态
	 * @see https://developer.work.weixin.qq.com/document/path/99274
	 */
	async getRoomResponseStatus(body: S.GetRoomResponseStatusRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetRoomResponseStatusResponse>({
			method: 'POST',
			url: '/cgi-bin/meeting/rooms/get_response_status',
			body,
			...opts,
		});
	}
	/**
	 * 获取Rooms会议室列表
	 * @see https://developer.work.weixin.qq.com/document/path/99280
	 */
	async listMeetingRoom(body: S.ListMeetingRoomRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.ListMeetingRoomResponse>({
			method: 'POST',
			url: '/cgi-bin/meeting/rooms/list',
			body,
			...opts,
		});
	}
	/**
	 * 获取控制器列表
	 * @see https://developer.work.weixin.qq.com/document/path/99231
	 */
	async listMeetingRoomControllers(body: S.ListMeetingRoomControllersRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.ListMeetingRoomControllersResponse>({
			method: 'POST',
			url: '/cgi-bin/meeting/rooms/list_controllers',
			body,
			...opts,
		});
	}
	/**
	 * 获取设备列表
	 * @see https://developer.work.weixin.qq.com/document/path/99230
	 */
	async listMeetingRoomDevices(body: S.ListMeetingRoomDevicesRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.ListMeetingRoomDevicesResponse>({
			method: 'POST',
			url: '/cgi-bin/meeting/rooms/list_devices',
			body,
			...opts,
		});
	}
	/**
	 * 获取Rooms会议室下的会议列表
	 * @see https://developer.work.weixin.qq.com/document/path/99278
	 */
	async listRoomMeetings(body: S.ListRoomMeetingsRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.ListRoomMeetingsResponse>({
			method: 'POST',
			url: '/cgi-bin/meeting/rooms/list_meetings',
			body,
			...opts,
		});
	}
	/**
	 * 释放Rooms会议室
	 * @see https://developer.work.weixin.qq.com/document/path/99281
	 */
	async releaseMeetingRooms(body: S.ReleaseMeetingRoomsRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({ method: 'POST', url: '/cgi-bin/meeting/rooms/release', body, ...opts });
	}
	/**
	 * 更新会议嘉宾列表
	 * @see https://developer.work.weixin.qq.com/document/path/99042
	 */
	async setMeetingGuests(body: S.SetMeetingGuestsRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({ method: 'POST', url: '/cgi-bin/meeting/set_guests', body, ...opts });
	}
	/**
	 * 更新会议受邀成员列表
	 * @see https://developer.work.weixin.qq.com/document/path/98997
	 */
	async setMeetingInvitees(body: S.SetMeetingInviteesRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({ method: 'POST', url: '/cgi-bin/meeting/set_invitees', body, ...opts });
	}
	/**
	 * 获取会议发起记录
	 * @see https://developer.work.weixin.qq.com/document/path/99651
	 */
	async listMeetingStart(body: S.ListMeetingStartRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.ListMeetingStartResponse>({
			method: 'POST',
			url: '/cgi-bin/meeting/statistics/get_start_list',
			body,
			...opts,
		});
	}
	/**
	 * 修改预约会议
	 * @see https://developer.work.weixin.qq.com/document/path/99047
	 */
	async updateMeeting(body: S.UpdateMeetingRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.UpdateMeetingResponse>({
			method: 'POST',
			url: '/cgi-bin/meeting/update',
			body,
			...opts,
		});
	}
	/**
	 * 获取高级功能账号列表
	 * @see https://developer.work.weixin.qq.com/document/path/99510
	 */
	async listMeetingVip(body: S.ListMeetingVipRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.ListMeetingVipResponse>({
			method: 'POST',
			url: '/cgi-bin/meeting/vip/list',
			body,
			...opts,
		});
	}
	/**
	 * 分配高级功能账号
	 * @see https://developer.work.weixin.qq.com/document/path/99508
	 */
	async batchAddMeetingVip(body: S.BatchAddMeetingVipRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.BatchAddMeetingVipResponse>({
			method: 'POST',
			url: '/cgi-bin/meeting/vip/submit_batch_add_job',
			body,
			...opts,
		});
	}
	/**
	 * 取消高级功能账号
	 * @see https://developer.work.weixin.qq.com/document/path/99509
	 */
	async batchDeleteMeetingVipJob(body: S.BatchDeleteMeetingVipJobRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.BatchDeleteMeetingVipJobResponse>({
			method: 'POST',
			url: '/cgi-bin/meeting/vip/submit_batch_del_job',
			body,
			...opts,
		});
	}
	/**
	 * 获取实时等候室成员列表
	 * @see https://developer.work.weixin.qq.com/document/path/98163
	 */
	async listMeetingWaitingRoomUser(body: S.ListMeetingWaitingRoomUserRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.ListMeetingWaitingRoomUserResponse>({
			method: 'POST',
			url: '/cgi-bin/meeting/waitingroom/get_current_user_list',
			body,
			...opts,
		});
	}
	/**
	 * 获取等候室成员记录
	 * @see https://developer.work.weixin.qq.com/document/path/99065
	 */
	async listWaitingRoomUser(body: S.ListWaitingRoomUserRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.ListWaitingRoomUserResponse>({
			method: 'POST',
			url: '/cgi-bin/meeting/waitingroom/get_user_list',
			body,
			...opts,
		});
	}
	/**
	 * 取消网络研讨会
	 * @see https://developer.work.weixin.qq.com/document/path/98870
	 */
	async cancelWebinar(body: S.CancelWebinarRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({ method: 'POST', url: '/cgi-bin/meeting/webinar/cancel', body, ...opts });
	}
	/**
	 * 创建网络研讨会
	 * @see https://developer.work.weixin.qq.com/document/path/98842
	 */
	async createWebinar(body: S.CreateWebinarRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.CreateWebinarResponse>({
			method: 'POST',
			url: '/cgi-bin/meeting/webinar/create',
			body,
			...opts,
		});
	}
	/**
	 * 审批网络研讨会报名信息
	 * @see https://developer.work.weixin.qq.com/document/path/98877
	 */
	async approveWebinarEnroll(body: S.ApproveWebinarEnrollRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.ApproveWebinarEnrollResponse>({
			method: 'POST',
			url: '/cgi-bin/meeting/webinar/enroll/approve',
			body,
			...opts,
		});
	}
	/**
	 * 删除网络研讨会报名信息
	 * @see https://developer.work.weixin.qq.com/document/path/98881
	 */
	async deleteWebinarEnroll(body: S.DeleteWebinarEnrollRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.DeleteWebinarEnrollResponse>({
			method: 'POST',
			url: '/cgi-bin/meeting/webinar/enroll/delete',
			body,
			...opts,
		});
	}
	/**
	 * 获取网络研讨会报名配置
	 * @see https://developer.work.weixin.qq.com/document/path/99297
	 */
	async getWebinarEnrollConfig(body: S.GetWebinarEnrollConfigRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetWebinarEnrollConfigResponse>({
			method: 'POST',
			url: '/cgi-bin/meeting/webinar/enroll/get_config',
			body,
			...opts,
		});
	}
	/**
	 * 导入网络研讨会报名信息
	 * @see https://developer.work.weixin.qq.com/document/path/98880
	 */
	async importWebinarEnroll(body: S.ImportWebinarEnrollRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.ImportWebinarEnrollResponse>({
			method: 'POST',
			url: '/cgi-bin/meeting/webinar/enroll/import',
			body,
			...opts,
		});
	}
	/**
	 * 获取网络研讨会报名信息
	 * @see https://developer.work.weixin.qq.com/document/path/99023
	 */
	async listWebinarEnroll(body: S.ListWebinarEnrollRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.ListWebinarEnrollResponse>({
			method: 'POST',
			url: '/cgi-bin/meeting/webinar/enroll/list',
			body,
			...opts,
		});
	}
	/**
	 * 获取网络研讨会成员报名 ID
	 * @see https://developer.work.weixin.qq.com/document/path/99021
	 */
	async queryWebinarEnrollIdByTmpOpenid(
		body: S.QueryWebinarEnrollIdByTmpOpenidRequest,
		opts?: Partial<RequestOptions<any>>,
	) {
		return this.request<GeneralResponse & S.QueryWebinarEnrollIdByTmpOpenidResponse>({
			method: 'POST',
			url: '/cgi-bin/meeting/webinar/enroll/query_by_tmp_openid',
			body,
			...opts,
		});
	}
	/**
	 * 修改网络研讨会报名配置
	 * @see https://developer.work.weixin.qq.com/document/path/99029
	 */
	async setWebinarEnrollConfig(body: S.SetWebinarEnrollConfigRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.SetWebinarEnrollConfigResponse>({
			method: 'POST',
			url: '/cgi-bin/meeting/webinar/enroll/set_config',
			body,
			...opts,
		});
	}
	/**
	 * 获取网络研讨会详情
	 * @see https://developer.work.weixin.qq.com/document/path/99020
	 */
	async getWebinarDetail(body: S.GetWebinarDetailRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetWebinarDetailResponse>({
			method: 'POST',
			url: '/cgi-bin/meeting/webinar/get',
			body,
			...opts,
		});
	}
	/**
	 * 获取网络研讨会嘉宾列表
	 * @see https://developer.work.weixin.qq.com/document/path/99019
	 */
	async listWebinarGuest(body: S.ListWebinarGuestRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.ListWebinarGuestResponse>({
			method: 'POST',
			url: '/cgi-bin/meeting/webinar/list_guest',
			body,
			...opts,
		});
	}
	/**
	 * 修改网络研讨会
	 * @see https://developer.work.weixin.qq.com/document/path/98843
	 */
	async updateWebinar(body: S.UpdateWebinarRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({ method: 'POST', url: '/cgi-bin/meeting/webinar/update', body, ...opts });
	}
	/**
	 * 更新网络研讨会嘉宾列表
	 * @see https://developer.work.weixin.qq.com/document/path/99091
	 */
	async updateWebinarGuestList(body: S.UpdateWebinarGuestListRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: '/cgi-bin/meeting/webinar/update_guest_list',
			body,
			...opts,
		});
	}
	/**
	 * 管理网络研讨会暖场配置
	 * @see https://developer.work.weixin.qq.com/document/path/99030
	 */
	async updateWebinarWarmUpConfig(body: S.UpdateWebinarWarmUpConfigRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: '/cgi-bin/meeting/webinar/update_warm_up',
			body,
			...opts,
		});
	}
	/**
	 * 更新模版卡片消息
	 * @see https://developer.work.weixin.qq.com/document/path/94963
	 */
	async updateTemplateCard(body: S.UpdateTemplateCardRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: '/cgi-bin/message/update_template_card',
			body,
			...opts,
		});
	}
	/**
	 * 提交创建对外收款账户的申请单
	 * @see https://developer.work.weixin.qq.com/document/path/99106
	 */
	async applyMch(body: S.ApplyMchRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({ method: 'POST', url: '/cgi-bin/miniapppay/apply_mch', body, ...opts });
	}
	/**
	 * 关闭订单
	 * @see https://developer.work.weixin.qq.com/document/path/97324
	 */
	async closeMiniAppPayOrder(body: S.CloseMiniAppPayOrderRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({ method: 'POST', url: '/cgi-bin/miniapppay/close_order', body, ...opts });
	}
	/**
	 * 小程序下单
	 * @see https://developer.work.weixin.qq.com/document/path/97322
	 */
	async createMiniAppOrder(body: S.CreateMiniAppOrderRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.CreateMiniAppOrderResponse>({
			method: 'POST',
			url: '/cgi-bin/miniapppay/create_order',
			body,
			...opts,
		});
	}
	/**
	 * 查询申请单状态
	 * @see https://developer.work.weixin.qq.com/document/path/98974
	 */
	async getApplymentStatus(body: S.GetApplymentStatusRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetApplymentStatusResponse>({
			method: 'POST',
			url: '/cgi-bin/miniapppay/get_applyment_status',
			body,
			...opts,
		});
	}
	/**
	 * 查询订单
	 * @see https://developer.work.weixin.qq.com/document/path/97323
	 */
	async getOrder(body: S.GetOrderRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetOrderResponse>({
			method: 'POST',
			url: '/cgi-bin/miniapppay/get_order',
			body,
			...opts,
		});
	}
	/**
	 * 查询退款
	 * @see https://developer.work.weixin.qq.com/document/path/97352
	 */
	async getRefundDetail(body: S.GetRefundDetailRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetRefundDetailResponse>({
			method: 'POST',
			url: '/cgi-bin/miniapppay/get_refund_detail',
			body,
			...opts,
		});
	}
	/**
	 * 获取支付签名
	 * @see https://developer.work.weixin.qq.com/document/path/98130
	 */
	async getMiniAppPaySign(body: S.GetMiniAppPaySignRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetMiniAppPaySignResponse>({
			method: 'POST',
			url: '/cgi-bin/miniapppay/get_sign',
			body,
			...opts,
		});
	}
	/**
	 * 提交图片
	 * @see https://developer.work.weixin.qq.com/document/path/98972
	 */
	async uploadMiniAppImage(body: S.UploadMiniAppImageRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.UploadMiniAppImageResponse>({
			method: 'POST',
			url: '/cgi-bin/miniapppay/upload_image',
			body,
			...opts,
		});
	}
	/**
	 * 获取下级/下游企业小程序session
	 * @see https://developer.work.weixin.qq.com/document/path/95317
	 */
	async transferMiniProgramSession(body: S.TransferMiniProgramSessionRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.TransferMiniProgramSessionResponse>({
			method: 'POST',
			url: '/cgi-bin/miniprogram/transfer_session',
			body,
			...opts,
		});
	}
	/**
	 * 提交审批申请
	 * @see https://developer.work.weixin.qq.com/document/path/91853
	 */
	async submitApprovalEvent(body: S.SubmitApprovalEventRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.SubmitApprovalEventResponse>({
			method: 'POST',
			url: '/cgi-bin/oa/applyevent',
			body,
			...opts,
		});
	}
	/**
	 * 创建审批模板
	 * @see https://developer.work.weixin.qq.com/document/path/97437
	 */
	async createApprovalTemplate(body: S.CreateApprovalTemplateRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.CreateApprovalTemplateResponse>({
			method: 'POST',
			url: '/cgi-bin/oa/approval/create_template',
			body,
			...opts,
		});
	}
	/**
	 * 更新审批模板
	 * @see https://developer.work.weixin.qq.com/document/path/97438
	 */
	async updateApprovalTemplate(body: S.UpdateApprovalTemplateRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: '/cgi-bin/oa/approval/update_template',
			body,
			...opts,
		});
	}
	/**
	 * 创建日历
	 * @see https://developer.work.weixin.qq.com/document/path/97719
	 */
	async createCalendar(body: S.CreateCalendarRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.CreateCalendarResponse>({
			method: 'POST',
			url: '/cgi-bin/oa/calendar/add',
			body,
			...opts,
		});
	}
	/**
	 * 删除日历
	 * @see https://developer.work.weixin.qq.com/document/path/97718
	 */
	async deleteCalendar(body: S.DeleteCalendarRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({ method: 'POST', url: '/cgi-bin/oa/calendar/del', body, ...opts });
	}
	/**
	 * 获取日历详情
	 * @see https://developer.work.weixin.qq.com/document/path/97717
	 */
	async getCalendarDetail(body: S.GetCalendarDetailRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetCalendarDetailResponse>({
			method: 'POST',
			url: '/cgi-bin/oa/calendar/get',
			body,
			...opts,
		});
	}
	/**
	 * 更新日历
	 * @see https://developer.work.weixin.qq.com/document/path/97716
	 */
	async updateCalendar(body: S.UpdateCalendarRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.UpdateCalendarResponse>({
			method: 'POST',
			url: '/cgi-bin/oa/calendar/update',
			body,
			...opts,
		});
	}
	/**
	 * 获取审批申请详情
	 * @see https://developer.work.weixin.qq.com/document/path/91983
	 */
	async getApprovalDetail(body: S.GetApprovalDetailRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetApprovalDetailResponse>({
			method: 'POST',
			url: '/cgi-bin/oa/getapprovaldetail',
			body,
			...opts,
		});
	}
	/**
	 * 获取审批模板详情
	 * @see https://developer.work.weixin.qq.com/document/path/91982
	 */
	async getApprovalTemplateDetail(body: S.GetApprovalTemplateDetailRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetApprovalTemplateDetailResponse>({
			method: 'POST',
			url: '/cgi-bin/oa/gettemplatedetail',
			body,
			...opts,
		});
	}
	/**
	 * 下载微盘文件
	 * @see https://developer.work.weixin.qq.com/document/path/98021
	 */
	async downloadWeDriveFile(body: S.DownloadWeDriveFileRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.DownloadWeDriveFileResponse>({
			method: 'POST',
			url: '/cgi-bin/oa/journal/download_wedrive_file',
			body,
			...opts,
		});
	}
	/**
	 * 获取汇报记录详情
	 * @see https://developer.work.weixin.qq.com/document/path/93394
	 */
	async getJournalDetail(body: S.GetJournalDetailRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetJournalDetailResponse>({
			method: 'POST',
			url: '/cgi-bin/oa/journal/get_record_detail',
			body,
			...opts,
		});
	}
	/**
	 * 批量获取汇报记录单号
	 * @see https://developer.work.weixin.qq.com/document/path/93474
	 */
	async listJournalRecord(body: S.ListJournalRecordRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.ListJournalRecordResponse>({
			method: 'POST',
			url: '/cgi-bin/oa/journal/get_record_list',
			body,
			...opts,
		});
	}
	/**
	 * 获取汇报统计数据
	 * @see https://developer.work.weixin.qq.com/document/path/93475
	 */
	async listJournalStat(body: S.ListJournalStatRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.ListJournalStatResponse>({
			method: 'POST',
			url: '/cgi-bin/oa/journal/get_stat_list',
			body,
			...opts,
		});
	}
	/**
	 * 添加会议室
	 * @see https://developer.work.weixin.qq.com/document/path/93619
	 */
	async addMeetingRoom(body: S.AddMeetingRoomRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.AddMeetingRoomResponse>({
			method: 'POST',
			url: '/cgi-bin/oa/meetingroom/add',
			body,
			...opts,
		});
	}
	/**
	 * 查询会议室的预定信息
	 * @see https://developer.work.weixin.qq.com/document/path/93620
	 */
	async getMeetingRoomBookingInfo(body: S.GetMeetingRoomBookingInfoRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetMeetingRoomBookingInfoResponse>({
			method: 'POST',
			url: '/cgi-bin/oa/meetingroom/get_booking_info',
			body,
			...opts,
		});
	}
	/**
	 * 创建日程
	 * @see https://developer.work.weixin.qq.com/document/path/97726
	 */
	async createSchedule(body: S.CreateScheduleRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.CreateScheduleResponse>({
			method: 'POST',
			url: '/cgi-bin/oa/schedule/add',
			body,
			...opts,
		});
	}
	/**
	 * 新增日程参与者
	 * @see https://developer.work.weixin.qq.com/document/path/97721
	 */
	async addScheduleAttendees(body: S.AddScheduleAttendeesRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({ method: 'POST', url: '/cgi-bin/oa/schedule/add_attendees', body, ...opts });
	}
	/**
	 * 取消日程
	 * @see https://developer.work.weixin.qq.com/document/path/97725
	 */
	async deleteSchedule(body: S.DeleteScheduleRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({ method: 'POST', url: '/cgi-bin/oa/schedule/del', body, ...opts });
	}
	/**
	 * 删除日程参与者
	 * @see https://developer.work.weixin.qq.com/document/path/97722
	 */
	async deleteScheduleAttendees(body: S.DeleteScheduleAttendeesRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({ method: 'POST', url: '/cgi-bin/oa/schedule/del_attendees', body, ...opts });
	}
	/**
	 * 获取日程详情
	 * @see https://developer.work.weixin.qq.com/document/path/97724
	 */
	async getSchedule(body: S.GetScheduleRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetScheduleResponse>({
			method: 'POST',
			url: '/cgi-bin/oa/schedule/get',
			body,
			...opts,
		});
	}
	/**
	 * 获取日历下的日程列表
	 * @see https://developer.work.weixin.qq.com/document/path/97723
	 */
	async getScheduleListByCalendar(body: S.GetScheduleListByCalendarRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetScheduleListByCalendarResponse>({
			method: 'POST',
			url: '/cgi-bin/oa/schedule/get_by_calendar',
			body,
			...opts,
		});
	}
	/**
	 * 更新日程
	 * @see https://developer.work.weixin.qq.com/document/path/97720
	 */
	async updateSchedule(body: S.UpdateScheduleRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.UpdateScheduleResponse>({
			method: 'POST',
			url: '/cgi-bin/oa/schedule/update',
			body,
			...opts,
		});
	}
	/**
	 * 获取企业假期管理配置
	 * @see https://developer.work.weixin.qq.com/document/path/93388
	 */
	async getCorpVacationConfig(opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetCorpVacationConfigResponse>({
			url: '/cgi-bin/oa/vacation/getcorpconf',
			...opts,
		});
	}
	/**
	 * 获取成员假期余额
	 * @see https://developer.work.weixin.qq.com/document/path/93376
	 */
	async getUserVacationQuota(body: S.GetUserVacationQuotaRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetUserVacationQuotaResponse>({
			method: 'POST',
			url: '/cgi-bin/oa/vacation/getuservacationquota',
			body,
			...opts,
		});
	}
	/**
	 * 修改成员假期余额
	 * @see https://developer.work.weixin.qq.com/document/path/93389
	 */
	async setUserQuota(body: S.SetUserQuotaRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: '/cgi-bin/oa/vacation/setoneuserquota',
			body,
			...opts,
		});
	}
	/**
	 * 发起语音电话
	 * @see https://developer.work.weixin.qq.com/document/path/91627
	 */
	async callPstnCc(body: S.CallPstnCcRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.CallPstnCcResponse>({
			method: 'POST',
			url: '/cgi-bin/pstncc/call',
			body,
			...opts,
		});
	}
	/**
	 * 获取接听状态
	 * @see https://developer.work.weixin.qq.com/document/path/91628
	 */
	async getPstnccState(body: S.GetPstnccStateRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetPstnccStateResponse>({
			method: 'POST',
			url: '/cgi-bin/pstncc/getstates',
			body,
			...opts,
		});
	}
	/**
	 * 添加网格
	 * @see https://developer.work.weixin.qq.com/document/path/94556
	 */
	async addGrid(body: S.AddGridRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.AddGridResponse>({
			method: 'POST',
			url: '/cgi-bin/report/grid/add',
			body,
			...opts,
		});
	}
	/**
	 * 添加事件类别
	 * @see https://developer.work.weixin.qq.com/document/path/94563
	 */
	async addEventCategory(body: S.AddEventCategoryRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.AddEventCategoryResponse>({
			method: 'POST',
			url: '/cgi-bin/report/grid/add_cata',
			body,
			...opts,
		});
	}
	/**
	 * 删除网格
	 * @see https://developer.work.weixin.qq.com/document/path/94559
	 */
	async deleteGrid(body: S.DeleteGridRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({ method: 'POST', url: '/cgi-bin/report/grid/delete', body, ...opts });
	}
	/**
	 * 删除事件类别
	 * @see https://developer.work.weixin.qq.com/document/path/94565
	 */
	async deleteReportCategory(body: S.DeleteReportCategoryRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({ method: 'POST', url: '/cgi-bin/report/grid/delete_cata', body, ...opts });
	}
	/**
	 * 获取用户负责及参与的网格列表
	 * @see https://developer.work.weixin.qq.com/document/path/94567
	 */
	async getUserGridInfo(body: S.GetUserGridInfoRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetUserGridInfoResponse>({
			method: 'POST',
			url: '/cgi-bin/report/grid/get_user_grid_info',
			body,
			...opts,
		});
	}
	/**
	 * 获取网格列表
	 * @see https://developer.work.weixin.qq.com/document/path/94560
	 */
	async listGrid(body: S.ListGridRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.ListGridResponse>({
			method: 'POST',
			url: '/cgi-bin/report/grid/list',
			body,
			...opts,
		});
	}
	/**
	 * 获取事件类别列表
	 * @see https://developer.work.weixin.qq.com/document/path/94566
	 */
	async listEventCategory(body?: Record<string, any>, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.ListEventCategoryResponse>({
			method: 'POST',
			url: '/cgi-bin/report/grid/list_cata',
			body,
			...opts,
		});
	}
	/**
	 * 编辑网格
	 * @see https://developer.work.weixin.qq.com/document/path/94558
	 */
	async updateGrid(body: S.UpdateGridRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.UpdateGridResponse>({
			method: 'POST',
			url: '/cgi-bin/report/grid/update',
			body,
			...opts,
		});
	}
	/**
	 * 修改事件类别
	 * @see https://developer.work.weixin.qq.com/document/path/94564
	 */
	async updateCategory(body: S.UpdateCategoryRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({ method: 'POST', url: '/cgi-bin/report/grid/update_cata', body, ...opts });
	}
	/**
	 * 获取上报事件分类统计
	 * @see https://developer.work.weixin.qq.com/document/path/93606
	 */
	async getPatrolCategoryStatistic(body: S.GetPatrolCategoryStatisticRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetPatrolCategoryStatisticResponse>({
			method: 'POST',
			url: '/cgi-bin/report/patrol/category_statistic',
			body,
			...opts,
		});
	}
	/**
	 * 获取单位巡查上报数据统计
	 * @see https://developer.work.weixin.qq.com/document/path/93604
	 */
	async getPatrolCorpStatus(body: S.GetPatrolCorpStatusRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetPatrolCorpStatusResponse>({
			method: 'POST',
			url: '/cgi-bin/report/patrol/get_corp_status',
			body,
			...opts,
		});
	}
	/**
	 * 获取配置的网格及网格负责人
	 * @see https://developer.work.weixin.qq.com/document/path/93599
	 */
	async getGridInfo(opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetGridInfoResponse>({
			url: '/cgi-bin/report/patrol/get_grid_info',
			...opts,
		});
	}
	/**
	 * 获取巡查上报的事件详情信息
	 * @see https://developer.work.weixin.qq.com/document/path/93608
	 */
	async getPatrolOrderInfo(body: S.GetPatrolOrderInfoRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetPatrolOrderInfoResponse>({
			method: 'POST',
			url: '/cgi-bin/report/patrol/get_order_info',
			body,
			...opts,
		});
	}
	/**
	 * 获取巡查上报事件列表
	 * @see https://developer.work.weixin.qq.com/document/path/93607
	 */
	async listPatrolOrder(body: S.ListPatrolOrderRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.ListPatrolOrderResponse>({
			method: 'POST',
			url: '/cgi-bin/report/patrol/get_order_list',
			body,
			...opts,
		});
	}
	/**
	 * 获取个人巡查上报数据统计
	 * @see https://developer.work.weixin.qq.com/document/path/93605
	 */
	async getPatrolUserStatus(body: S.GetPatrolUserStatusRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetPatrolUserStatusResponse>({
			method: 'POST',
			url: '/cgi-bin/report/patrol/get_user_status',
			body,
			...opts,
		});
	}
	/**
	 * 获取上报事件分类统计
	 * @see https://developer.work.weixin.qq.com/document/path/93612
	 */
	async getReportCategoryStatistic(body: S.GetReportCategoryStatisticRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetReportCategoryStatisticResponse>({
			method: 'POST',
			url: '/cgi-bin/report/resident/category_statistic',
			body,
			...opts,
		});
	}
	/**
	 * 获取单位居民上报数据统计
	 * @see https://developer.work.weixin.qq.com/document/path/93610
	 */
	async getCorpResidentStatus(body: S.GetCorpResidentStatusRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetCorpResidentStatusResponse>({
			method: 'POST',
			url: '/cgi-bin/report/resident/get_corp_status',
			body,
			...opts,
		});
	}
	/**
	 * 获取居民上报的事件详情信息
	 * @see https://developer.work.weixin.qq.com/document/path/93614
	 */
	async getResidentOrderInfo(body: S.GetResidentOrderInfoRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetResidentOrderInfoResponse>({
			method: 'POST',
			url: '/cgi-bin/report/resident/get_order_info',
			body,
			...opts,
		});
	}
	/**
	 * 获取居民上报事件列表
	 * @see https://developer.work.weixin.qq.com/document/path/93613
	 */
	async listResidentOrder(body: S.ListResidentOrderRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.ListResidentOrderResponse>({
			method: 'POST',
			url: '/cgi-bin/report/resident/get_order_list',
			body,
			...opts,
		});
	}
	/**
	 * 获取个人居民上报数据统计
	 * @see https://developer.work.weixin.qq.com/document/path/93611
	 */
	async getResidentUserStatus(body: S.GetResidentUserStatusRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetResidentUserStatusResponse>({
			method: 'POST',
			url: '/cgi-bin/report/resident/get_user_status',
			body,
			...opts,
		});
	}
	/**
	 * 获取可使用的家长范围
	 * @see https://developer.work.weixin.qq.com/document/path/94895
	 */
	async getSchoolAgentAllowScope(params: S.GetSchoolAgentAllowScopeRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetSchoolAgentAllowScopeResponse>({
			url: '/cgi-bin/school/agent/get_allow_scope',
			params,
			...opts,
		});
	}
	/**
	 * 获取部门列表
	 * @see https://developer.work.weixin.qq.com/document/path/92343
	 */
	async listSchoolDepartment(params: S.ListSchoolDepartmentRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.ListSchoolDepartmentResponse>({
			url: '/cgi-bin/school/department/list',
			params,
			...opts,
		});
	}
	/**
	 * 更新部门
	 * @see https://developer.work.weixin.qq.com/document/path/92341
	 */
	async updateSchoolDepartment(body: S.UpdateSchoolDepartmentRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({ method: 'POST', url: '/cgi-bin/school/department/update', body, ...opts });
	}
	/**
	 * 获取学生付款结果
	 * @see https://developer.work.weixin.qq.com/document/path/94470
	 */
	async getPaymentResult(body: S.GetPaymentResultRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetPaymentResultResponse>({
			method: 'POST',
			url: '/cgi-bin/school/get_payment_result',
			body,
			...opts,
		});
	}
	/**
	 * 获取订单详情
	 * @see https://developer.work.weixin.qq.com/document/path/94471
	 */
	async getTradeDetail(body: S.GetTradeDetailRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetTradeDetailResponse>({
			method: 'POST',
			url: '/cgi-bin/school/get_trade',
			body,
			...opts,
		});
	}
	/**
	 * 获取家校访问用户身份
	 * @see https://developer.work.weixin.qq.com/document/path/95791
	 */
	async getSchoolUserInfo(params: S.GetSchoolUserInfoRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetSchoolUserInfoResponse>({
			url: '/cgi-bin/school/getuserinfo',
			params,
			...opts,
		});
	}
	/**
	 * 获取未观看直播统计
	 * @see https://developer.work.weixin.qq.com/document/path/93742
	 */
	async getUnwatchLivingStat(body: S.GetUnwatchLivingStatRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetUnwatchLivingStatResponse>({
			method: 'POST',
			url: '/cgi-bin/school/living/get_unwatch_stat',
			body,
			...opts,
		});
	}
	/**
	 * 获取未观看直播统计V2
	 * @see https://developer.work.weixin.qq.com/document/path/95795
	 */
	async getUnwatchStatV2(body: S.GetUnwatchStatV2Request, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetUnwatchStatV2Response>({
			method: 'POST',
			url: '/cgi-bin/school/living/get_unwatch_stat_v2',
			body,
			...opts,
		});
	}
	/**
	 * 获取观看直播统计V2
	 * @see https://developer.work.weixin.qq.com/document/path/95793
	 */
	async getWatchStatV2(body: S.GetWatchStatV2Request, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetWatchStatV2Response>({
			method: 'POST',
			url: '/cgi-bin/school/living/get_watch_stat_v2',
			body,
			...opts,
		});
	}
	/**
	 * 设置家校通讯录自动同步模式
	 * @see https://developer.work.weixin.qq.com/document/path/92345
	 */
	async setArchSyncMode(body: S.SetArchSyncModeRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({ method: 'POST', url: '/cgi-bin/school/set_arch_sync_mode', body, ...opts });
	}
	/**
	 * 修改自动升年级的配置
	 * @see https://developer.work.weixin.qq.com/document/path/92949
	 */
	async setSchoolUpgradeInfo(body: S.SetSchoolUpgradeInfoRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.SetSchoolUpgradeInfoResponse>({
			method: 'POST',
			url: '/cgi-bin/school/set_upgrade_info',
			body,
			...opts,
		});
	}
	/**
	 * 批量创建家长
	 * @see https://developer.work.weixin.qq.com/document/path/92334
	 */
	async batchCreateParent(body: S.BatchCreateParentRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.BatchCreateParentResponse>({
			method: 'POST',
			url: '/cgi-bin/school/user/batch_create_parent',
			body,
			...opts,
		});
	}
	/**
	 * 批量创建学生
	 * @see https://developer.work.weixin.qq.com/document/path/92328
	 */
	async batchCreateStudent(body: S.BatchCreateStudentRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.BatchCreateStudentResponse>({
			method: 'POST',
			url: '/cgi-bin/school/user/batch_create_student',
			body,
			...opts,
		});
	}
	/**
	 * 批量删除家长
	 * @see https://developer.work.weixin.qq.com/document/path/92335
	 */
	async batchDeleteParent(body: S.BatchDeleteParentRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.BatchDeleteParentResponse>({
			method: 'POST',
			url: '/cgi-bin/school/user/batch_delete_parent',
			body,
			...opts,
		});
	}
	/**
	 * 批量删除学生
	 * @see https://developer.work.weixin.qq.com/document/path/92329
	 */
	async batchDeleteSchoolStudent(body: S.BatchDeleteSchoolStudentRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.BatchDeleteSchoolStudentResponse>({
			method: 'POST',
			url: '/cgi-bin/school/user/batch_delete_student',
			body,
			...opts,
		});
	}
	/**
	 * 批量更新家长
	 * @see https://developer.work.weixin.qq.com/document/path/92336
	 */
	async batchUpdateParent(body: S.BatchUpdateParentRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.BatchUpdateParentResponse>({
			method: 'POST',
			url: '/cgi-bin/school/user/batch_update_parent',
			body,
			...opts,
		});
	}
	/**
	 * 批量更新学生
	 * @see https://developer.work.weixin.qq.com/document/path/92330
	 */
	async batchUpdateStudent(body: S.BatchUpdateStudentRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.BatchUpdateStudentResponse>({
			method: 'POST',
			url: '/cgi-bin/school/user/batch_update_student',
			body,
			...opts,
		});
	}
	/**
	 * 创建家长
	 * @see https://developer.work.weixin.qq.com/document/path/92331
	 */
	async createParentUser(body: S.CreateParentUserRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({ method: 'POST', url: '/cgi-bin/school/user/create_parent', body, ...opts });
	}
	/**
	 * 创建学生
	 * @see https://developer.work.weixin.qq.com/document/path/92325
	 */
	async createStudent(body: S.CreateStudentRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({ method: 'POST', url: '/cgi-bin/school/user/create_student', body, ...opts });
	}
	/**
	 * 删除家长
	 * @see https://developer.work.weixin.qq.com/document/path/92332
	 */
	async deleteParent(params: S.DeleteParentRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({ url: '/cgi-bin/school/user/delete_parent', params, ...opts });
	}
	/**
	 * 删除学生
	 * @see https://developer.work.weixin.qq.com/document/path/92326
	 */
	async deleteStudent(params: S.DeleteStudentRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({ url: '/cgi-bin/school/user/delete_student', params, ...opts });
	}
	/**
	 * 读取学生或家长
	 * @see https://developer.work.weixin.qq.com/document/path/92337
	 */
	async getSchoolUser(params: S.GetSchoolUserRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetSchoolUserResponse>({
			url: '/cgi-bin/school/user/get',
			params,
			...opts,
		});
	}
	/**
	 * 获取部门学生详情
	 * @see https://developer.work.weixin.qq.com/document/path/96119
	 */
	async listSchoolUser(params: S.ListSchoolUserRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.ListSchoolUserResponse>({
			url: '/cgi-bin/school/user/list',
			params,
			...opts,
		});
	}
	/**
	 * 获取部门家长详情
	 * @see https://developer.work.weixin.qq.com/document/path/92446
	 */
	async listSchoolParent(params: S.ListSchoolParentRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.ListSchoolParentResponse>({
			url: '/cgi-bin/school/user/list_parent',
			params,
			...opts,
		});
	}
	/**
	 * 更新家长
	 * @see https://developer.work.weixin.qq.com/document/path/92333
	 */
	async updateParent(body: S.UpdateParentRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({ method: 'POST', url: '/cgi-bin/school/user/update_parent', body, ...opts });
	}
	/**
	 * 更新学生
	 * @see https://developer.work.weixin.qq.com/document/path/92327
	 */
	async updateStudent(body: S.UpdateStudentRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({ method: 'POST', url: '/cgi-bin/school/user/update_student', body, ...opts });
	}
	/**
	 * 获取管理端操作日志
	 * @see https://developer.work.weixin.qq.com/document/path/100179
	 */
	async listAdminOperLog(body: S.ListAdminOperLogRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.ListAdminOperLogResponse>({
			method: 'POST',
			url: '/cgi-bin/security/admin_oper_log/list',
			body,
			...opts,
		});
	}
	/**
	 * 文件防泄漏
	 * @see https://developer.work.weixin.qq.com/document/path/98883
	 */
	async getFileOperRecord(body: S.GetFileOperRecordRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetFileOperRecordResponse>({
			method: 'POST',
			url: '/cgi-bin/security/get_file_oper_record',
			body,
			...opts,
		});
	}
	/**
	 * 截屏/录屏管理
	 * @see https://developer.work.weixin.qq.com/document/path/100128
	 */
	async getScreenOperRecord(body: S.GetScreenOperRecordRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetScreenOperRecordResponse>({
			method: 'POST',
			url: '/cgi-bin/security/get_screen_oper_record',
			body,
			...opts,
		});
	}
	/**
	 * 获取企业微信域名IP信息
	 * @see https://developer.work.weixin.qq.com/document/path/100079
	 */
	async getServerDomainIp(opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetServerDomainIpResponse>({
			url: '/cgi-bin/security/get_server_domain_ip',
			...opts,
		});
	}
	/**
	 * 获取成员操作记录
	 * @see https://developer.work.weixin.qq.com/document/path/100178
	 */
	async listMemberOperLog(body: S.ListMemberOperLogRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.ListMemberOperLogResponse>({
			method: 'POST',
			url: '/cgi-bin/security/member_oper_log/list',
			body,
			...opts,
		});
	}
	/**
	 * 导入可信企业设备
	 * @see https://developer.work.weixin.qq.com/document/path/98920
	 */
	async importTrustDevice(body: S.ImportTrustDeviceRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.ImportTrustDeviceResponse>({
			method: 'POST',
			url: '/cgi-bin/security/trustdevice/import',
			body,
			...opts,
		});
	}
	/**
	 * 获取高级功能账号列表
	 * @see https://developer.work.weixin.qq.com/document/path/99506
	 */
	async listSecurityVip(body: S.ListSecurityVipRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.ListSecurityVipResponse>({
			method: 'POST',
			url: '/cgi-bin/security/vip/list',
			body,
			...opts,
		});
	}
	/**
	 * 分配高级功能账号
	 * @see https://developer.work.weixin.qq.com/document/path/99503
	 */
	async submitBatchAddJob(body: S.SubmitBatchAddJobRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.SubmitBatchAddJobResponse>({
			method: 'POST',
			url: '/cgi-bin/security/vip/submit_batch_add_job',
			body,
			...opts,
		});
	}
	/**
	 * 取消高级功能账号
	 * @see https://developer.work.weixin.qq.com/document/path/99505
	 */
	async batchDelSecurityVip(body: S.BatchDelSecurityVipRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.BatchDelSecurityVipResponse>({
			method: 'POST',
			url: '/cgi-bin/security/vip/submit_batch_del_job',
			body,
			...opts,
		});
	}
	/**
	 * 登录二次验证
	 * @see https://developer.work.weixin.qq.com/document/path/90031
	 */
	async authSuccess(params: S.AuthSuccessRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({ url: '/cgi-bin/user/authsucc', params, ...opts });
	}
	/**
	 * 通过邮箱获取userid
	 * @see https://developer.work.weixin.qq.com/document/path/95895
	 */
	async getUserIdByEmail(body: S.GetUserIdByEmailRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetUserIdByEmailResponse>({
			method: 'POST',
			url: '/cgi-bin/user/get_userid_by_email',
			body,
			...opts,
		});
	}
	/**
	 * 手机号获取userid
	 * @see https://developer.work.weixin.qq.com/document/path/95402
	 */
	async getUserIDByMobile(body: S.GetUserIDByMobileRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetUserIDByMobileResponse>({
			method: 'POST',
			url: '/cgi-bin/user/getuserid',
			body,
			...opts,
		});
	}
	/**
	 * 通过code获取用户信息
	 * @see https://developer.work.weixin.qq.com/document/path/101021
	 */
	async getUserInfoByCode(params: S.GetUserInfoByCodeRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetUserInfoByCodeResponse>({
			url: '/cgi-bin/user/getuserinfo',
			params,
			...opts,
		});
	}
	/**
	 * 获取部门成员详情
	 * @see https://developer.work.weixin.qq.com/document/path/90029
	 */
	async listUser(params: S.ListUserRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.ListUserResponse>({ url: '/cgi-bin/user/list', params, ...opts });
	}
	/**
	 * 使用二次验证
	 * @see https://developer.work.weixin.qq.com/document/path/99523
	 */
	async submitTfaSuccess(body: S.SubmitTfaSuccessRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({ method: 'POST', url: '/cgi-bin/user/tfa_succ', body, ...opts });
	}
	/**
	 * 消息推送配置说明
	 * @see https://developer.work.weixin.qq.com/document/path/101066
	 */
	async sendWebhookMessage(body: S.SendWebhookMessageRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({ method: 'POST', url: '/cgi-bin/webhook/send', body, ...opts });
	}
	/**
	 * 新建文档
	 * @see https://developer.work.weixin.qq.com/document/path/97658
	 */
	async createDoc(body: S.CreateDocRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.CreateDocResponse>({
			method: 'POST',
			url: '/cgi-bin/wedoc/create_doc',
			body,
			...opts,
		});
	}
	/**
	 * 创建收集表
	 * @see https://developer.work.weixin.qq.com/document/path/97668
	 */
	async createForm(body: S.CreateFormRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.CreateFormResponse>({
			method: 'POST',
			url: '/cgi-bin/wedoc/create_form',
			body,
			...opts,
		});
	}
	/**
	 * 删除文档
	 * @see https://developer.work.weixin.qq.com/document/path/99930
	 */
	async deleteDoc(body: S.DeleteDocRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({ method: 'POST', url: '/cgi-bin/wedoc/del_doc', body, ...opts });
	}
	/**
	 * 获取文档权限信息
	 * @see https://developer.work.weixin.qq.com/document/path/97811
	 */
	async getDocAuth(body: S.GetDocAuthRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetDocAuthResponse>({
			method: 'POST',
			url: '/cgi-bin/wedoc/doc_get_auth',
			body,
			...opts,
		});
	}
	/**
	 * 分享文档
	 * @see https://developer.work.weixin.qq.com/document/path/97733
	 */
	async shareDoc(body: S.ShareDocRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.ShareDocResponse>({
			method: 'POST',
			url: '/cgi-bin/wedoc/doc_share',
			body,
			...opts,
		});
	}
	/**
	 * 编辑文档内容
	 * @see https://developer.work.weixin.qq.com/document/path/97626
	 */
	async batchUpdateDocument(body: S.BatchUpdateDocumentRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: '/cgi-bin/wedoc/document/batch_update',
			body,
			...opts,
		});
	}
	/**
	 * 获取文档数据
	 * @see https://developer.work.weixin.qq.com/document/path/101161
	 */
	async getWedocDocument(body: S.GetWedocDocumentRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetWedocDocumentResponse>({
			method: 'POST',
			url: '/cgi-bin/wedoc/document/get',
			body,
			...opts,
		});
	}
	/**
	 * 获取文档基础信息
	 * @see https://developer.work.weixin.qq.com/document/path/97734
	 */
	async getDocBaseInfo(body: S.GetDocBaseInfoRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetDocBaseInfoResponse>({
			method: 'POST',
			url: '/cgi-bin/wedoc/get_doc_base_info',
			body,
			...opts,
		});
	}
	/**
	 * 读取收集表答案
	 * @see https://developer.work.weixin.qq.com/document/path/97819
	 */
	async getWedocFormAnswer(body: S.GetWedocFormAnswerRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetWedocFormAnswerResponse>({
			method: 'POST',
			url: '/cgi-bin/wedoc/get_form_answer',
			body,
			...opts,
		});
	}
	/**
	 * 获取收集表信息
	 * @see https://developer.work.weixin.qq.com/document/path/97817
	 */
	async getFormInfo(body: S.GetFormInfoRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetFormInfoResponse>({
			method: 'POST',
			url: '/cgi-bin/wedoc/get_form_info',
			body,
			...opts,
		});
	}
	/**
	 * 收集表的统计信息查询
	 * @see https://developer.work.weixin.qq.com/document/path/97818
	 */
	async getFormStatistic(body: S.GetFormStatisticRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetFormStatisticResponse>({
			method: 'POST',
			url: '/cgi-bin/wedoc/get_form_statistic',
			body,
			...opts,
		});
	}
	/**
	 * 上传文档图片
	 * @see https://developer.work.weixin.qq.com/document/path/99933
	 */
	async uploadWedocImage(body: S.UploadWedocImageRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.UploadWedocImageResponse>({
			method: 'POST',
			url: '/cgi-bin/wedoc/image_upload',
			body,
			...opts,
		});
	}
	/**
	 * 修改文档加入规则
	 * @see https://developer.work.weixin.qq.com/document/path/101477
	 */
	async updateDocJoinRule(body: S.UpdateDocJoinRuleRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({ method: 'POST', url: '/cgi-bin/wedoc/mod_doc_join_rule', body, ...opts });
	}
	/**
	 * 修改文档成员与权限
	 * @see https://developer.work.weixin.qq.com/document/path/101476
	 */
	async updateDocMember(body: S.UpdateDocMemberRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({ method: 'POST', url: '/cgi-bin/wedoc/mod_doc_member', body, ...opts });
	}
	/**
	 * 修改文档安全设置
	 * @see https://developer.work.weixin.qq.com/document/path/97782
	 */
	async updateDocSafetySetting(body: S.UpdateDocSafetySettingRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: '/cgi-bin/wedoc/mod_doc_safty_setting',
			body,
			...opts,
		});
	}
	/**
	 * 编辑收集表
	 * @see https://developer.work.weixin.qq.com/document/path/97816
	 */
	async modifyForm(body: S.ModifyFormRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({ method: 'POST', url: '/cgi-bin/wedoc/modify_form', body, ...opts });
	}
	/**
	 * 重命名文档
	 * @see https://developer.work.weixin.qq.com/document/path/99894
	 */
	async renameDoc(body: S.RenameDocRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({ method: 'POST', url: '/cgi-bin/wedoc/rename_doc', body, ...opts });
	}
	/**
	 * 添加编组
	 * @see https://developer.work.weixin.qq.com/document/path/101100
	 */
	async addFieldGroup(body: S.AddFieldGroupRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.AddFieldGroupResponse>({
			method: 'POST',
			url: '/cgi-bin/wedoc/smartsheet/add_field_group',
			body,
			...opts,
		});
	}
	/**
	 * 添加字段
	 * @see https://developer.work.weixin.qq.com/document/path/99904
	 */
	async addSmartsheetFields(body: S.AddSmartsheetFieldsRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.AddSmartsheetFieldsResponse>({
			method: 'POST',
			url: '/cgi-bin/wedoc/smartsheet/add_fields',
			body,
			...opts,
		});
	}
	/**
	 * 添加记录
	 * @see https://developer.work.weixin.qq.com/document/path/99907
	 */
	async addRecords(body: S.AddRecordsRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.AddRecordsResponse>({
			method: 'POST',
			url: '/cgi-bin/wedoc/smartsheet/add_records',
			body,
			...opts,
		});
	}
	/**
	 * 添加子表
	 * @see https://developer.work.weixin.qq.com/document/path/99896
	 */
	async addSmartSheet(body: S.AddSmartSheetRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.AddSmartSheetResponse>({
			method: 'POST',
			url: '/cgi-bin/wedoc/smartsheet/add_sheet',
			body,
			...opts,
		});
	}
	/**
	 * 添加视图
	 * @see https://developer.work.weixin.qq.com/document/path/99900
	 */
	async addView(body: S.AddViewRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.AddViewResponse>({
			method: 'POST',
			url: '/cgi-bin/wedoc/smartsheet/add_view',
			body,
			...opts,
		});
	}
	/**
	 * 查询智能表格子表权限
	 * @see https://developer.work.weixin.qq.com/document/path/99935
	 */
	async getSheetPriv(body: S.GetSheetPrivRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetSheetPrivResponse>({
			method: 'POST',
			url: '/cgi-bin/wedoc/smartsheet/content_priv/get_sheet_priv',
			body,
			...opts,
		});
	}
	/**
	 * 删除编组
	 * @see https://developer.work.weixin.qq.com/document/path/101102
	 */
	async deleteSmartsheetFieldGroups(body: S.DeleteSmartsheetFieldGroupsRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: '/cgi-bin/wedoc/smartsheet/delete_field_groups',
			body,
			...opts,
		});
	}
	/**
	 * 删除字段
	 * @see https://developer.work.weixin.qq.com/document/path/99905
	 */
	async deleteSmartsheetFields(body: S.DeleteSmartsheetFieldsRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: '/cgi-bin/wedoc/smartsheet/delete_fields',
			body,
			...opts,
		});
	}
	/**
	 * 删除记录
	 * @see https://developer.work.weixin.qq.com/document/path/99908
	 */
	async deleteSmartsheetRecords(body: S.DeleteSmartsheetRecordsRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: '/cgi-bin/wedoc/smartsheet/delete_records',
			body,
			...opts,
		});
	}
	/**
	 * 删除子表
	 * @see https://developer.work.weixin.qq.com/document/path/99899
	 */
	async deleteSheet(body: S.DeleteSheetRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: '/cgi-bin/wedoc/smartsheet/delete_sheet',
			body,
			...opts,
		});
	}
	/**
	 * 删除视图
	 * @see https://developer.work.weixin.qq.com/document/path/99901
	 */
	async deleteViews(body: S.DeleteViewsRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: '/cgi-bin/wedoc/smartsheet/delete_views',
			body,
			...opts,
		});
	}
	/**
	 * 获取编组
	 * @see https://developer.work.weixin.qq.com/document/path/101103
	 */
	async getFieldGroups(body: S.GetFieldGroupsRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetFieldGroupsResponse>({
			method: 'POST',
			url: '/cgi-bin/wedoc/smartsheet/get_field_groups',
			body,
			...opts,
		});
	}
	/**
	 * 查询字段
	 * @see https://developer.work.weixin.qq.com/document/path/101157
	 */
	async getSmartSheetFields(body: S.GetSmartSheetFieldsRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetSmartSheetFieldsResponse>({
			method: 'POST',
			url: '/cgi-bin/wedoc/smartsheet/get_fields',
			body,
			...opts,
		});
	}
	/**
	 * 查询记录
	 * @see https://developer.work.weixin.qq.com/document/path/101158
	 */
	async getSmartsheetRecords(body: S.GetSmartsheetRecordsRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetSmartsheetRecordsResponse>({
			method: 'POST',
			url: '/cgi-bin/wedoc/smartsheet/get_records',
			body,
			...opts,
		});
	}
	/**
	 * 查询子表
	 * @see https://developer.work.weixin.qq.com/document/path/101154
	 */
	async getSheet(body: S.GetSheetRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetSheetResponse>({
			method: 'POST',
			url: '/cgi-bin/wedoc/smartsheet/get_sheet',
			body,
			...opts,
		});
	}
	/**
	 * 查询视图
	 * @see https://developer.work.weixin.qq.com/document/path/101155
	 */
	async getSmartsheetViews(body: S.GetSmartsheetViewsRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetSmartsheetViewsResponse>({
			method: 'POST',
			url: '/cgi-bin/wedoc/smartsheet/get_views',
			body,
			...opts,
		});
	}
	/**
	 * 获取群聊会话
	 * @see https://developer.work.weixin.qq.com/document/path/101043
	 */
	async getGroupChat(body: S.GetGroupChatRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetGroupChatResponse>({
			method: 'POST',
			url: '/cgi-bin/wedoc/smartsheet/groupchat/get',
			body,
			...opts,
		});
	}
	/**
	 * 获取群聊列表
	 * @see https://developer.work.weixin.qq.com/document/path/101042
	 */
	async listGroupChat(body: S.ListGroupChatRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.ListGroupChatResponse>({
			method: 'POST',
			url: '/cgi-bin/wedoc/smartsheet/groupchat/list',
			body,
			...opts,
		});
	}
	/**
	 * 修改群聊会话
	 * @see https://developer.work.weixin.qq.com/document/path/101044
	 */
	async updateGroupChat(body: S.UpdateGroupChatRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: '/cgi-bin/wedoc/smartsheet/groupchat/update',
			body,
			...opts,
		});
	}
	/**
	 * 更新编组
	 * @see https://developer.work.weixin.qq.com/document/path/101101
	 */
	async updateFieldGroup(body: S.UpdateFieldGroupRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.UpdateFieldGroupResponse>({
			method: 'POST',
			url: '/cgi-bin/wedoc/smartsheet/update_field_group',
			body,
			...opts,
		});
	}
	/**
	 * 更新字段
	 * @see https://developer.work.weixin.qq.com/document/path/99906
	 */
	async updateSmartSheetFields(body: S.UpdateSmartSheetFieldsRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.UpdateSmartSheetFieldsResponse>({
			method: 'POST',
			url: '/cgi-bin/wedoc/smartsheet/update_fields',
			body,
			...opts,
		});
	}
	/**
	 * 更新记录
	 * @see https://developer.work.weixin.qq.com/document/path/99909
	 */
	async updateSmartsheetRecords(body: S.UpdateSmartsheetRecordsRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.UpdateSmartsheetRecordsResponse>({
			method: 'POST',
			url: '/cgi-bin/wedoc/smartsheet/update_records',
			body,
			...opts,
		});
	}
	/**
	 * 更新子表
	 * @see https://developer.work.weixin.qq.com/document/path/99898
	 */
	async updateSmartsheetSubSheet(body: S.UpdateSmartsheetSubSheetRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: '/cgi-bin/wedoc/smartsheet/update_sheet',
			body,
			...opts,
		});
	}
	/**
	 * 更新视图
	 * @see https://developer.work.weixin.qq.com/document/path/99902
	 */
	async updateView(body: S.UpdateViewRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.UpdateViewResponse>({
			method: 'POST',
			url: '/cgi-bin/wedoc/smartsheet/update_view',
			body,
			...opts,
		});
	}
	/**
	 * 更新记录
	 * @see https://developer.work.weixin.qq.com/document/path/101260
	 */
	async updateSmartSheetRecord(body: S.UpdateSmartSheetRecordRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.UpdateSmartSheetRecordResponse>({
			method: 'POST',
			url: '/cgi-bin/wedoc/smartsheet/webhook',
			body,
			...opts,
		});
	}
	/**
	 * 编辑表格内容
	 * @see https://developer.work.weixin.qq.com/document/path/101168
	 */
	async batchUpdateSpreadsheet(body: S.BatchUpdateSpreadsheetRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.BatchUpdateSpreadsheetResponse>({
			method: 'POST',
			url: '/cgi-bin/wedoc/spreadsheet/batch_update',
			body,
			...opts,
		});
	}
	/**
	 * 获取表格行列信息
	 * @see https://developer.work.weixin.qq.com/document/path/97711
	 */
	async getSpreadsheetProperties(body: S.GetSpreadsheetPropertiesRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetSpreadsheetPropertiesResponse>({
			method: 'POST',
			url: '/cgi-bin/wedoc/spreadsheet/get_sheet_properties',
			body,
			...opts,
		});
	}
	/**
	 * 获取表格数据
	 * @see https://developer.work.weixin.qq.com/document/path/97661
	 */
	async getSheetRangeData(body: S.GetSheetRangeDataRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetSheetRangeDataResponse>({
			method: 'POST',
			url: '/cgi-bin/wedoc/spreadsheet/get_sheet_range_data',
			body,
			...opts,
		});
	}
	/**
	 * 分配高级功能账号
	 * @see https://developer.work.weixin.qq.com/document/path/99516
	 */
	async batchAddWedDocVip(body: S.BatchAddWedDocVipRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.BatchAddWedDocVipResponse>({
			method: 'POST',
			url: '/cgi-bin/wedoc/vip/batch_add',
			body,
			...opts,
		});
	}
	/**
	 * 取消高级功能账号
	 * @see https://developer.work.weixin.qq.com/document/path/99517
	 */
	async batchDeleteDocVip(body: S.BatchDeleteDocVipRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.BatchDeleteDocVipResponse>({
			method: 'POST',
			url: '/cgi-bin/wedoc/vip/batch_del',
			body,
			...opts,
		});
	}
	/**
	 * 获取高级功能账号列表
	 * @see https://developer.work.weixin.qq.com/document/path/99518
	 */
	async listVipAccount(body: S.ListVipAccountRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.ListVipAccountResponse>({
			method: 'POST',
			url: '/cgi-bin/wedoc/vip/list',
			body,
			...opts,
		});
	}
	/**
	 * 新增成员
	 * @see https://developer.work.weixin.qq.com/document/path/97893
	 */
	async addFileMember(body: S.AddFileMemberRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({ method: 'POST', url: '/cgi-bin/wedrive/file_acl_add', body, ...opts });
	}
	/**
	 * 删除文件权限成员
	 * @see https://developer.work.weixin.qq.com/document/path/97888
	 */
	async deleteMemberAcl(body: S.DeleteMemberAclRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({ method: 'POST', url: '/cgi-bin/wedrive/file_acl_del', body, ...opts });
	}
	/**
	 * 新建文件夹/文档
	 * @see https://developer.work.weixin.qq.com/document/path/97882
	 */
	async createFile(body: S.CreateFileRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.CreateFileResponse>({
			method: 'POST',
			url: '/cgi-bin/wedrive/file_create',
			body,
			...opts,
		});
	}
	/**
	 * 删除文件
	 * @see https://developer.work.weixin.qq.com/document/path/97885
	 */
	async deleteFile(body: S.DeleteFileRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({ method: 'POST', url: '/cgi-bin/wedrive/file_delete', body, ...opts });
	}
	/**
	 * 下载文件
	 * @see https://developer.work.weixin.qq.com/document/path/97881
	 */
	async downloadFile(body: S.DownloadFileRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.DownloadFileResponse>({
			method: 'POST',
			url: '/cgi-bin/wedrive/file_download',
			body,
			...opts,
		});
	}
	/**
	 * 获取文件信息
	 * @see https://developer.work.weixin.qq.com/document/path/97886
	 */
	async getDriveFileInfo(body: S.GetDriveFileInfoRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetDriveFileInfoResponse>({
			method: 'POST',
			url: '/cgi-bin/wedrive/file_info',
			body,
			...opts,
		});
	}
	/**
	 * 获取文件列表
	 * @see https://developer.work.weixin.qq.com/document/path/97887
	 */
	async listDriveFile(body: S.ListDriveFileRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.ListDriveFileResponse>({
			method: 'POST',
			url: '/cgi-bin/wedrive/file_list',
			body,
			...opts,
		});
	}
	/**
	 * 移动文件
	 * @see https://developer.work.weixin.qq.com/document/path/97884
	 */
	async moveFile(body: S.MoveFileRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.MoveFileResponse>({
			method: 'POST',
			url: '/cgi-bin/wedrive/file_move',
			body,
			...opts,
		});
	}
	/**
	 * 重命名文件
	 * @see https://developer.work.weixin.qq.com/document/path/97883
	 */
	async renameFile(body: S.RenameFileRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.RenameFileResponse>({
			method: 'POST',
			url: '/cgi-bin/wedrive/file_rename',
			body,
			...opts,
		});
	}
	/**
	 * 修改文件安全设置
	 * @see https://developer.work.weixin.qq.com/document/path/97892
	 */
	async updateFileSecureSetting(body: S.UpdateFileSecureSettingRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: '/cgi-bin/wedrive/file_secure_setting',
			body,
			...opts,
		});
	}
	/**
	 * 分享设置
	 * @see https://developer.work.weixin.qq.com/document/path/97889
	 */
	async setFileShareSetting(body: S.SetFileShareSettingRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({ method: 'POST', url: '/cgi-bin/wedrive/file_setting', body, ...opts });
	}
	/**
	 * 获取分享链接
	 * @see https://developer.work.weixin.qq.com/document/path/97890
	 */
	async getFileShareUrl(body: S.GetFileShareUrlRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetFileShareUrlResponse>({
			method: 'POST',
			url: '/cgi-bin/wedrive/file_share',
			body,
			...opts,
		});
	}
	/**
	 * 上传文件
	 * @see https://developer.work.weixin.qq.com/document/path/97880
	 */
	async uploadFile(body: S.UploadFileRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.UploadFileResponse>({
			method: 'POST',
			url: '/cgi-bin/wedrive/file_upload',
			body,
			...opts,
		});
	}
	/**
	 * 文件分块上传初始化
	 * @see https://developer.work.weixin.qq.com/document/path/98004
	 */
	async initWedriveFileUpload(body: S.InitWedriveFileUploadRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.InitWedriveFileUploadResponse>({
			method: 'POST',
			url: '/cgi-bin/wedrive/file_upload_init',
			body,
			...opts,
		});
	}
	/**
	 * 获取文件权限信息
	 * @see https://developer.work.weixin.qq.com/document/path/97891
	 */
	async getFilePermission(body: S.GetFilePermissionRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetFilePermissionResponse>({
			method: 'POST',
			url: '/cgi-bin/wedrive/get_file_permission',
			body,
			...opts,
		});
	}
	/**
	 * 获取盘专业版信息
	 * @see https://developer.work.weixin.qq.com/document/path/95856
	 */
	async getWeDriveProInfo(body?: Record<string, any>, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetWeDriveProInfoResponse>({
			method: 'POST',
			url: '/cgi-bin/wedrive/mng_pro_info',
			body,
			...opts,
		});
	}
	/**
	 * 获取空间信息
	 * @see https://developer.work.weixin.qq.com/document/path/97878
	 */
	async getSpaceInfo(body: S.GetSpaceInfoRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetSpaceInfoResponse>({
			method: 'POST',
			url: '/cgi-bin/wedrive/new_space_info',
			body,
			...opts,
		});
	}
	/**
	 * 添加成员/部门
	 * @see https://developer.work.weixin.qq.com/document/path/97879
	 */
	async addSpaceMemberDepartment(body: S.AddSpaceMemberDepartmentRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({ method: 'POST', url: '/cgi-bin/wedrive/space_acl_add', body, ...opts });
	}
	/**
	 * 移除成员/部门
	 * @see https://developer.work.weixin.qq.com/document/path/97875
	 */
	async removeSpaceMemberOrDept(body: S.RemoveSpaceMemberOrDeptRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({ method: 'POST', url: '/cgi-bin/wedrive/space_acl_del', body, ...opts });
	}
	/**
	 * 新建空间
	 * @see https://developer.work.weixin.qq.com/document/path/97860
	 */
	async createSpace(body: S.CreateSpaceRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.CreateSpaceResponse>({
			method: 'POST',
			url: '/cgi-bin/wedrive/space_create',
			body,
			...opts,
		});
	}
	/**
	 * 解散空间
	 * @see https://developer.work.weixin.qq.com/document/path/97857
	 */
	async dismissSpace(body: S.DismissSpaceRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({ method: 'POST', url: '/cgi-bin/wedrive/space_dismiss', body, ...opts });
	}
	/**
	 * 重命名空间
	 * @see https://developer.work.weixin.qq.com/document/path/97856
	 */
	async renameSpace(body: S.RenameSpaceRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({ method: 'POST', url: '/cgi-bin/wedrive/space_rename', body, ...opts });
	}
	/**
	 * 安全设置
	 * @see https://developer.work.weixin.qq.com/document/path/97876
	 */
	async updateSpaceSetting(body: S.UpdateSpaceSettingRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({ method: 'POST', url: '/cgi-bin/wedrive/space_setting', body, ...opts });
	}
	/**
	 * 获取邀请链接
	 * @see https://developer.work.weixin.qq.com/document/path/97877
	 */
	async getSpaceShareLink(body: S.GetSpaceShareLinkRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetSpaceShareLinkResponse>({
			method: 'POST',
			url: '/cgi-bin/wedrive/space_share',
			body,
			...opts,
		});
	}
	/**
	 * 分配高级功能账号
	 * @see https://developer.work.weixin.qq.com/document/path/99512
	 */
	async batchAddDriveVip(body: S.BatchAddDriveVipRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.BatchAddDriveVipResponse>({
			method: 'POST',
			url: '/cgi-bin/wedrive/vip/batch_add',
			body,
			...opts,
		});
	}
	/**
	 * 取消高级功能账号
	 * @see https://developer.work.weixin.qq.com/document/path/99513
	 */
	async batchDelDriveVip(body: S.BatchDelDriveVipRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.BatchDelDriveVipResponse>({
			method: 'POST',
			url: '/cgi-bin/wedrive/vip/batch_del',
			body,
			...opts,
		});
	}
	/**
	 * 获取高级功能账号列表
	 * @see https://developer.work.weixin.qq.com/document/path/99514
	 */
	async listDriveVip(body: S.ListDriveVipRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.ListDriveVipResponse>({
			method: 'POST',
			url: '/cgi-bin/wedrive/vip/list',
			body,
			...opts,
		});
	}
	/**
	 * 向员工付款
	 * @see https://developer.work.weixin.qq.com/document/path/90097
	 */
	async payEmployee(body: S.PayEmployeeRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.PayEmployeeResponse>({
			method: 'POST',
			url: '/mmpaymkttransfers/promotion/paywwsptrans2pocket',
			body,
			...opts,
		});
	}
	/**
	 * 查询付款记录
	 * @see https://developer.work.weixin.qq.com/document/path/90098
	 */
	async queryWxPaymentRecord(body: S.QueryWxPaymentRecordRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.QueryWxPaymentRecordResponse>({
			method: 'POST',
			url: '/mmpaymkttransfers/promotion/querywwsptrans2pocket',
			body,
			...opts,
		});
	}
	/**
	 * 查询红包记录
	 * @see https://developer.work.weixin.qq.com/document/path/90095
	 */
	async queryWorkWxRedpack(body: S.QueryWorkWxRedpackRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.QueryWorkWxRedpackResponse>({
			method: 'POST',
			url: '/mmpaymkttransfers/queryworkwxredpack',
			body,
			...opts,
		});
	}
	/**
	 * 发放企业红包
	 * @see https://developer.work.weixin.qq.com/document/path/90094
	 */
	async sendWorkWxRedPacket(body: S.SendWorkWxRedPacketRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.SendWorkWxRedPacketResponse>({
			method: 'POST',
			url: '/mmpaymkttransfers/sendworkwxredpack',
			body,
			...opts,
		});
	}
	// prettier-ignore-end
	// endregion generated-apis
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

const _AgentTypes = {
	3010185: { title: '人事助手' },
	3010115: { title: '对外收款' },
	3010011: { title: '打卡' },
	3010040: { title: '审批' },
	3010041: { title: '汇报' },
	3010097: { title: '直播' }, // https://developer.work.weixin.qq.com/document/path/93633
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

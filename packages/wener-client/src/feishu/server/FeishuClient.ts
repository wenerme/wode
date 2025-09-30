import type { FetchLike } from '@wener/utils';
import dayjs from 'dayjs';
import type { ExpiryValue } from '../../ExpiryValue';
import { MessageType } from '../../local/feishu/message-common';
import { getAppAccessTokenInternal } from './getAppAccessTokenInternal';
import { getExpiryValueOrRequest } from './getExpiryValueOrRequest';
import { getTenantAccessTokenInternal } from './getTenantAccessTokenInternal';
import { refreshAccessToken } from './refreshAccessToken';
import { request, type RequestOptions } from './request';

type IdType = 'open_id' | 'union_id' | 'user_id' | 'email' | 'chat_id';

function getIdType(s: string): IdType | undefined {
	if (!s) return;
	if (s.startsWith('ou_')) {
		return 'user_id';
	}
	if (s.startsWith('oc_')) {
		return 'chat_id';
	}
	if (s.includes('@')) {
		return 'email';
	}
	// 'cli_' app_id
	return;
}

type FeishuClientInit = FeishuClientOptions & {
	fetch?: FetchLike;
};
type FeishuClientOptions = {
	appId?: string;
	appSecret?: string;
	appTicket?: string;
	tenetAccessToken?: ExpiryValue;
	appAccessToken?: ExpiryValue;
	userAccessToken?: ExpiryValue;
	refreshToken?: ExpiryValue;
};

export class FeishuClient {
	options: FeishuClientOptions = {};
	fetch: FetchLike;

	constructor({ fetch = globalThis.fetch, ...options }: FeishuClientInit = {}) {
		this.options = {
			...options,
		};
		this.fetch = fetch;
	}

	sendMessage({
		body,
		params = { receive_id_type: getIdType(body.receive_id) || fail(`unknown receive_id_type`) },
	}: {
		body: {
			receive_id: string;
			msg_type: MessageType;
			content: string | object;
			uuid?: string;
		};
		params?: { receive_id_type: IdType };
	}) {
		if (typeof body.content !== 'string') {
			body.content = JSON.stringify(body.content);
		}
		return this.request({
			url: 'im/v1/messages',
			body,
			params,
			debug: true,
		});
	}

	async request(req: RequestOptions) {
		let headers = {
			...req.headers,
		};
		headers['authorization'] = `Bearer ${(await this.getTenetAccessToken()).value}`;
		return request({
			fetch: this.fetch,
			...req,
			headers: headers,
		});
	}

	getUserAccessToken() {
		return getExpiryValueOrRequest(this.options.userAccessToken, async () => {
			await this.refreshUserAccessToken();
			return this.options.userAccessToken!;
		});
	}

	async refreshUserAccessToken({
		body = {
			refresh_token: this.options.refreshToken?.value || fail('invalid refresh token'),
			client_id: this.options.appId || '',
			client_secret: this.options.appSecret || '',
		},
	}: {
		body?: {
			refresh_token: string;
			client_id: string;
			client_secret: string;
			scope?: string;
		};
	} = {}) {
		const out = await refreshAccessToken({
			grant_type: 'refresh_token',
			...body,
		});
		this.options.userAccessToken = {
			value: out.access_token,
			expiresAt: dayjs().add(out.expires_in, 'seconds').toDate(),
		};
		return out;
	}

	getAppAccessToken() {
		return getExpiryValueOrRequest(this.options.appAccessToken, () => this.requestAppAccessToken());
	}

	async requestAppAccessToken({
		body = {
			app_id: this.options.appId || '',
			app_secret: this.options.appSecret || '',
		},
	}: {
		body?: { app_id: string; app_secret: string };
	} = {}) {
		let val = await getAppAccessTokenInternal(body);
		if (val.tenant_access_token) {
			this.options.tenetAccessToken = getExpiryValueOrRequest(this.options.tenetAccessToken, () => {
				return {
					value: val.tenant_access_token,
					expiresAt: dayjs().add(val.expire, 'seconds').toDate(),
				};
			});
		}
		return (this.options.appAccessToken = {
			value: val.app_access_token,
			expiresAt: dayjs().add(val.expire, 'seconds').toDate(),
		});
	}

	getTenetAccessToken() {
		return getExpiryValueOrRequest(this.options.tenetAccessToken, () => this.requestTenantAccessToken());
	}
	async requestTenantAccessToken({
		body = {
			app_id: this.options.appId || '',
			app_secret: this.options.appSecret || '',
		},
	}: {
		body?: { app_id: string; app_secret: string };
	} = {}) {
		let val = await getTenantAccessTokenInternal(body);
		return (this.options.tenetAccessToken = {
			value: val.tenant_access_token,
			expiresAt: dayjs().add(val.expire, 'seconds').toDate(),
		});
	}
}
type AccessTokenType = 'tenant_access_token' | 'user_access_token' | 'app_access_token';
function getTokenType(s: string): AccessTokenType | undefined {
	if (!s) return;
	if (s.startsWith('t-')) {
		return 'tenant_access_token';
	}
	if (s.endsWith('a-')) {
		// 使用场景比较少（一般用于 商店应用获取 tenant_access_token）
		return 'app_access_token';
	}
	return 'user_access_token';
}

function fail(msg: string): never {
	throw new Error(msg);
}

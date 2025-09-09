import { request } from './request';

/**
 * @see https://open.feishu.cn/document/server-docs/authentication-management/access-token/app_access_token_internal
 */
export async function getAppAccessTokenInternal(body: { app_id: string; app_secret: string }) {
	return request<{ code: number; msg: string; app_access_token: string; tenant_access_token: string; expire: number }>({
		url: 'https://open.feishu.cn/open-apis/auth/v3/app_access_token/internal',
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body),
	});
}

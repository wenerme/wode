import { request } from './request';

/**
 * 刷新 user_access_token
 * @see https://open.feishu.cn/document/authentication-management/access-token/refresh-user-access-token
 */
export async function refreshAccessToken(body: {
	grant_type: 'refresh_token';
	client_id: string;
	client_secret: string;
	refresh_token: string;
	scope?: string;
}) {
	return await request<{
		access_token: string;
		expires_in: number;
		refresh_token: string;
		refresh_token_expires_in: number;
		token_type: string;
		scope: string;
	}>({
		url: 'https://open.feishu.cn/open-apis/authen/v2/oauth/token',
		body: JSON.stringify(body),
	});
}

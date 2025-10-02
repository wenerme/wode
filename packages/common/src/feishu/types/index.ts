/**
 * Common types and interfaces for Feishu/Lark API integration
 */

export type IdType = 'open_id' | 'union_id' | 'user_id' | 'email' | 'chat_id';

export interface FeishuConfig {
	/** Application ID */
	appId: string;
	/** Application Secret */
	appSecret: string;
	/** API domain (Feishu China or Lark International) */
	domain?: string;
	/** Request timeout in milliseconds */
	timeout?: number;
}

export interface FeishuTokens {
	/** Tenant access token (app-level) */
	tenantAccessToken?: string;
	/** User access token (user-level) */
	userAccessToken?: string;
	/** App access token (app-level, no tenant) */
	appAccessToken?: string;
	/** Refresh token for user access token */
	refreshToken?: string;
}

export interface FeishuTokenResponse {
	access_token: string;
	token_type: string;
	expires_in: number;
	refresh_token?: string;
	scope?: string;
}

export interface FeishuError {
	code: number;
	msg?: string;
	error?:
		| string
		| {
				message?: string;
				log_id?: string;
				troubleshooter?: string;
				permission_violations?: Array<{ type: string; subject: string }>;
		  };
	error_description?: string;
}

export interface FeishuApiResponse<T = any> {
	code: number;
	msg?: string;
	data?: T;
	error?: FeishuError['error'];
}

export interface FeishuDocument {
	doc_token: string;
	doc_type: 'docx' | 'sheet' | 'slides' | 'bitable' | 'mindnote' | 'file';
	title: string;
	owner_id?: string;
	create_time?: string;
	update_time?: string;
	url?: string;
}

export interface FeishuDocumentSearchRequest {
	search_key: string;
	count?: number;
	offset?: number;
	owner_ids?: string[];
	chat_ids?: string[];
	docs_types?: FeishuDocument['doc_type'][];
}

export interface FeishuDocumentSearchResponse {
	docs_entity?: FeishuDocument[];
	has_more?: boolean;
	page_token?: string;
}

export interface FeishuDocumentContent {
	content: string;
	revision: number;
}

/**
 * OAuth related types
 */
export interface FeishuOAuthConfig {
	appId: string;
	appSecret: string;
	redirectUri: string;
	scopes?: string[];
	domain?: string;
}

export interface FeishuOAuthTokenRequest {
	grant_type: 'authorization_code' | 'refresh_token';
	code?: string;
	refresh_token?: string;
}

/**
 * Utility function to determine ID type from string format
 */
export function getIdType(s: string): IdType | undefined {
	if (!s) return undefined;
	if (s.startsWith('ou_')) {
		return 'user_id';
	}
	if (s.startsWith('oc_')) {
		return 'chat_id';
	}
	if (s.includes('@')) {
		return 'email';
	}
	return undefined;
}

/**
 * Feishu domain constants
 */
export const FeishuDomains = {
	China: 'https://open.feishu.cn',
	Intl: 'https://open.larksuite.com',
} as const;

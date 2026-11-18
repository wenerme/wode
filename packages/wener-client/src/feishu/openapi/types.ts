import type { z } from 'zod';

export type FeishuApiRisk = 'read' | 'write' | 'high-risk-write';
export type FeishuApiAccessToken = 'tenant' | 'user';
export type FeishuApiHttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface FeishuApiServiceInfo {
	name: string;
	version: string;
	title: string;
}

export interface FeishuApiSummary {
	/** `<service>.<resource>.<method>`; resource may contain dots. */
	id: string;
	service: string;
	resource: string;
	method: string;
	httpMethod: string;
	/** Full path starting with `/open-apis/`, path params as `{name}`. */
	path: string;
	risk: string;
	accessTokens: readonly string[];
	scopes: readonly string[];
	summary: string;
	docUrl: string;
	/** Request body contains file fields and must be sent as multipart/form-data. */
	multipart?: boolean;
}

export interface FeishuApiSchemas {
	pathParams?: z.ZodType;
	query?: z.ZodType;
	body?: z.ZodType;
	/** Schema of the `data` payload of the response envelope. */
	response?: z.ZodType;
}

export interface FeishuApiDefinition extends FeishuApiSummary, FeishuApiSchemas {}

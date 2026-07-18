import { defineEntity, p } from '@mikro-orm/core';
import type { Bytes } from '@wener/utils';
import { setEntitySchemaClass } from './defineEntitySchemaClass';
import { StandardBaseEntity } from './StandardBaseEntity';

export const BaseHttpRequestLogEntitySchema = defineEntity({
	name: 'BaseHttpRequestLogEntity',
	abstract: true,
	extends: StandardBaseEntity,
	properties: {
		tid: p.string().nullable(),
		method: p.string(),
		origin: p.string(),
		pathname: p.string(),
		url: p.string(),
		query: p.json<Record<string, any>>().nullable(),
		requestHeaders: p.json<Record<string, any>>().nullable(),
		requestPayload: p.json<any>().nullable(),
		requestBody: p.blob().$type<Bytes>().nullable(),
		responseHeaders: p.json<Record<string, any>>().nullable(),
		responsePayload: p.json<any>().nullable(),
		responseBody: p.blob().$type<Bytes>().nullable(),
		contentLength: p.integer().nullable(),
		contentType: p.string().nullable(),
		requestId: p.string().nullable(),
		responseId: p.string().nullable(),
		ok: p.boolean().nullable(),
		statusCode: p.integer().nullable(),
		statusText: p.string().nullable(),
		duration: p.integer().nullable(),
		hit: p.integer().default(0),
	},
});

export class BaseHttpRequestLogEntity extends BaseHttpRequestLogEntitySchema.class {
	fromUrl(o: string) {
		const u = new URL(o);
		u.searchParams.sort();
		this.assign({
			origin: u.origin,
			pathname: u.pathname,
			url: u.href,
			query: Object.fromEntries(u.searchParams.entries()),
		} as any);
		return this;
	}

	fromRequest(u: RequestInfo | URL | string, init: RequestInit = {}) {
		if (typeof u === 'string') {
			this.fromUrl(u);
		} else if ('url' in u) {
			this.fromUrl(u.url);
		} else {
			this.fromUrl(u.toString());
		}
		let hdrs = Object.fromEntries(new Headers(init.headers).entries());
		this.assign({
			method: init.method || 'GET',
			requestHeaders: hdrs,
			requestId: hdrs['x-request-id'] || hdrs['x-amzn-requestid'],
			// requestPayload: init.body,
		} as any);
		return this;
	}

	fromResponse(resp: Response) {
		const headers = Object.fromEntries(new Headers(resp.headers).entries());
		this.assign({
			statusCode: resp.status,
			statusText: resp.statusText,
			responseHeaders: headers,
			contentLength: headers['content-length'] ? Number.parseInt(headers['content-length'], 10) : undefined,
			contentType: headers['content-type'],
			// responsePayload: resp.body,
		} as any);
		this.responseId ||= headers['x-request-id'] || headers['x-amzn-requestid'];
		return this;
	}

	toResponse(): Response {
		const { responsePayload, responseBody, responseHeaders: headers } = this;
		return new Response(responseBody || JSON.stringify(responsePayload), {
			status: this.statusCode ?? undefined,
			headers: headers ?? undefined,
		});
	}
}
setEntitySchemaClass(BaseHttpRequestLogEntitySchema, BaseHttpRequestLogEntity, StandardBaseEntity);

import { createHash, createHmac } from 'crypto';
import type { FetchLike } from '@wener/utils';
import { resolveRequest } from '../../utils/resolveRequest';

export type RequestOptions = {
	url: string;
	baseUrl?: string;
	params?: Record<string, any>;
	data?: any;
	headers?: Record<string, string>;
	method?: string;
	fetch?: FetchLike;
	signal?: AbortSignal;
};

export type SignOptions = {
	clientId: string;
	clientKey: string;
	service: string;
	region: string;
	action: string;
	version: string;
	timestamp: number;
	payload: string;
	method: string;
	host: string;
	uri: string;
};

export async function request<O = any>(options: RequestOptions): Promise<O> {
	const { fetch = globalThis.fetch, method = 'POST', ...restOptions } = options;

	// Resolve base request
	const { url, init, headers } = resolveRequest({
		...restOptions,
		method,
	});

	const response = await fetch(url.toString(), init);

	if (!response.ok) {
		throw new Error(`HTTP ${response.status}: ${response.statusText}`);
	}
	let text = await response.text();
	let out: GeneralResponse<O>;
	try {
		out = JSON.parse(text) as GeneralResponse<O>;
	} catch (e) {
		console.log(`Failed to parse response as JSON: ${text}`);
		throw Object.assign(new Error(`HTTP ${response.status}: ${response.statusText}`), {
			code: response.status,
			requestId: undefined,
			body: text,
		});
	}
	if ('Error' in out.Response) {
		const { Code, Message } = out.Response.Error;
		const RequestId = out.Response.RequestId;
		throw Object.assign(new Error(`${Code}: ${Message} (RequestId: ${RequestId})`), {
			code: Code,
			requestId: RequestId,
			body: out,
		});
	}
	return out.Response;
}

type GeneralResponse<T> = {
	Response:
		| (T & { RequestId: string })
		| {
				Error: {
					Code: string;
					Message: string;
				};
				RequestId: string;
		  };
};

export function sign(options: SignOptions): { authorization: string; timestamp: string } {
	const { clientId, clientKey, service, region, action, version, timestamp, payload, method, host, uri } = options;

	// 步骤 1：拼接规范请求串
	const canonicalHeaders = `content-type:application/json\nhost:${host}\n`;
	const signedHeaders = 'content-type;host';
	const hashedRequestPayload = createHash('sha256').update(payload).digest('hex');

	const canonicalRequest = [method, uri, '', canonicalHeaders, signedHeaders, hashedRequestPayload].join('\n');

	// 步骤 2：拼接待签名字符串
	const algorithm = 'TC3-HMAC-SHA256';
	const date = new Date(timestamp * 1000).toISOString().split('T')[0];
	const credentialScope = `${date}/${service}/tc3_request`;
	const hashedCanonicalRequest = createHash('sha256').update(canonicalRequest).digest('hex');

	const stringToSign = [algorithm, timestamp.toString(), credentialScope, hashedCanonicalRequest].join('\n');

	// 步骤 3：计算签名
	const kDate = createHmac('sha256', `TC3${clientKey}`).update(date).digest();
	const kService = createHmac('sha256', kDate).update(service).digest();
	const kSigning = createHmac('sha256', kService).update('tc3_request').digest();
	const signature = createHmac('sha256', kSigning).update(stringToSign).digest('hex');

	// 步骤 4：拼接 Authorization
	const authorization = `${algorithm} Credential=${clientId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

	return {
		authorization,
		timestamp: timestamp.toString(),
	};
}

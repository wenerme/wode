import { createHash, createHmac } from 'crypto';
import type { FetchLike } from '@wener/utils';

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
	secretId: string;
	secretKey: string;
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
	let {
		url,
		baseUrl = '',
		params = {},
		data,
		headers = {},
		method = 'POST',
		fetch = globalThis.fetch,
		signal,
	} = options;

	let u: URL;
	if (baseUrl && !/^https?:\/\//.test(url)) {
		if (!baseUrl.endsWith('/')) {
			baseUrl += '/';
		}
		if (url.startsWith('/')) {
			url = url.slice(1);
		}
		u = new URL(baseUrl + url);
	} else {
		u = new URL(url);
	}

	if (params) {
		for (const [k, v] of Object.entries(params)) {
			if (v === null || v === undefined) continue;
			if (Array.isArray(v)) {
				for (const vv of v) {
					u.searchParams.append(k, String(vv));
				}
				continue;
			}
			u.searchParams.set(k, String(v));
		}
	}
	u.searchParams.sort();

	const req: RequestInit = {
		method,
		signal,
		headers: {
			'Content-Type': 'application/json',
			...headers,
		},
	};

	if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
		req.body = JSON.stringify(data);
	}

	const response = await fetch(u.toString(), req);

	if (!response.ok) {
		throw new Error(`HTTP ${response.status}: ${response.statusText}`);
	}

	let out = (await response.json()) as GeneralResponse<O>;
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
	const { secretId, secretKey, service, region, action, version, timestamp, payload, method, host, uri } = options;

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
	const kDate = createHmac('sha256', `TC3${secretKey}`).update(date).digest();
	const kService = createHmac('sha256', kDate).update(service).digest();
	const kSigning = createHmac('sha256', kService).update('tc3_request').digest();
	const signature = createHmac('sha256', kSigning).update(stringToSign).digest('hex');

	// 步骤 4：拼接 Authorization
	const authorization = `${algorithm} Credential=${secretId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

	return {
		authorization,
		timestamp: timestamp.toString(),
	};
}

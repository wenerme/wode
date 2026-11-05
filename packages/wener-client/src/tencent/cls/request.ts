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
	let text = await response.text();
	let out: GeneralResponse<O>;
	try {
		out = JSON.parse(text) as GeneralResponse<O>;
	} catch {
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

async function hmacSha256(key: ArrayBuffer | Uint8Array<ArrayBuffer>, data: string): Promise<ArrayBuffer> {
	const cryptoKey = await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
	return crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(data));
}

function toHex(data: ArrayBuffer): string {
	return [...new Uint8Array(data)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function sha256Hex(data: string): Promise<string> {
	const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(data));
	return toHex(digest);
}

export async function sign(options: SignOptions): Promise<{ authorization: string; timestamp: string }> {
	const {
		clientId,
		clientKey,
		service,
		region: _region,
		action: _action,
		version: _version,
		timestamp,
		payload,
		method,
		host,
		uri,
	} = options;

	// 步骤 1：拼接规范请求串
	const canonicalHeaders = `content-type:application/json\nhost:${host}\n`;
	const signedHeaders = 'content-type;host';
	const hashedRequestPayload = await sha256Hex(payload);

	const canonicalRequest = [method, uri, '', canonicalHeaders, signedHeaders, hashedRequestPayload].join('\n');

	// 步骤 2：拼接待签名字符串
	const algorithm = 'TC3-HMAC-SHA256';
	const date = new Date(timestamp * 1000).toISOString().split('T')[0];
	const credentialScope = `${date}/${service}/tc3_request`;
	const hashedCanonicalRequest = await sha256Hex(canonicalRequest);

	const stringToSign = [algorithm, timestamp.toString(), credentialScope, hashedCanonicalRequest].join('\n');

	// 步骤 3：计算签名
	const kDate = await hmacSha256(new TextEncoder().encode(`TC3${clientKey}`), date);
	const kService = await hmacSha256(kDate, service);
	const kSigning = await hmacSha256(kService, 'tc3_request');
	const signature = toHex(await hmacSha256(kSigning, stringToSign));

	// 步骤 4：拼接 Authorization
	const authorization = `${algorithm} Credential=${clientId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

	return {
		authorization,
		timestamp: timestamp.toString(),
	};
}

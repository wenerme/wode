import { type DoRequestOptions, doRequest } from '../../utils/doRequest';

export type RequestOptions<OUT = any, IN = OUT> = DoRequestOptions<OUT, IN>;
export function request<OUT = any, IN = OUT>(opts: RequestOptions<OUT, IN>) {
	return doRequest({
		baseUrl: 'https://open.feishu.cn/open-apis/',
		...opts,
		parseResponse: requireSuccessResponse,
	});
}

type GeneralResponse = {
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
};

async function requireSuccessResponse(r: Response, _ctx?: { url: string; req: RequestInit }) {
	const contentType = r.headers.get('content-type')?.split(';')[0];
	if (!contentType?.includes('json')) {
		if (!r.ok) {
			throw Object.assign(new Error(r.statusText), { code: r.status, response: r });
		}
		return r;
	}

	let out = await r.json();
	let res = out as GeneralResponse;
	if (res.code || !r.ok) {
		let msg = res.msg || r.statusText;
		if (!msg && typeof res.error_description === 'string') {
			msg = res.error_description;
		}
		if (!msg && typeof res.error === 'string') {
			msg = res.error;
		}
		if (!msg && res.error && typeof res.error === 'object' && typeof res.error.message === 'string') {
			msg = res.error.message;
		}
		throw Object.assign(new Error(msg), { code: res.code, body: res });
	}
	return out;
}

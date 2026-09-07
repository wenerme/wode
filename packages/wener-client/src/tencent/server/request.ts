import { type DoRequestOptions, doRequest } from '../../utils/doRequest';

export type RequestOptions<OUT = any, IN = OUT> = DoRequestOptions<OUT, IN> & {};

export async function request<OUT = any, IN = OUT>({
	baseUrl = 'https://docs.qq.com',
	...opts
}: RequestOptions<OUT, IN>) {
	return doRequest({ ...opts, baseUrl, parseResponse: requireSuccessResponse });
}

async function requireSuccessResponse(res: Response) {
	if (!res.ok) {
		throw Object.assign(new Error(`tencent-docs: failed ${res.status} ${res.statusText}`), {});
	}
	const data = (await res.json()) as TencentDocsResponse;
	if (data.ret !== 0) {
		throw Object.assign(new Error(`tencent-docs: failed ${data.ret} ${data.msg}`), {
			code: data.ret,
		});
	}
	return (data.data ?? data) as any;
}

interface TencentDocsResponse {
	ret: number;
	msg: string;
	data?: any;
}

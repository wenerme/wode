import { doRequest, type DoRequestOptions } from '../../utils/doRequest';
import { parseErrorMessage } from '../../wecom/server/parseErrorMessage';

export type RequestOptions<OUT = any, IN = OUT> = DoRequestOptions<OUT, IN> & {};

export async function request<OUT = any, IN = OUT>({
  baseUrl = 'https://api.weixin.qq.com/cgi-bin/',
  ...opts
}: RequestOptions<OUT, IN>) {
  return doRequest({
    ...opts,
    baseUrl,
    parseResponse: requireSuccessResponse,
  });
}

async function requireSuccessResponse(res: Response) {
  if (!res.ok) {
    throw Object.assign(new Error(`wechat: failed ${res.status} ${res.statusText}`), {
      // response: resp
    });
  }
  const data = (await res.json()) as ErrorResponse;
  if (data.errcode) {
    // 40125 invalid appsecret rid: 661379b9-1cee61f3-7188e075
    throw Object.assign(new Error(`wechat: failed ${data.errcode} ${data.errmsg}`), {
      code: data.errcode,
    });
  }
  return data as any;
}

interface ErrorResponse {
  errcode: number;
  errmsg: string;
}

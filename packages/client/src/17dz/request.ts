import { doRequest, DoRequestOptions } from '../utils/doRequest';
import { UnauthenticatedError } from './errors';

export type RequestOptions<OUT = any, IN = OUT> = DoRequestOptions<OUT, IN>;

export async function request<OUT = any, IN = OUT>(opts: RequestOptions<OUT, IN>) {
  return doRequest({
    ...opts,
    parseResponse: requireSuccessResponse,
  });
}

export async function requireSuccessResponse(
  r: Response,
  ctx?: {
    url: string;
    req: RequestInit;
  },
) {
  if (!r.ok) {
    throw Object.assign(new Error(r.statusText), { code: r.status, response: r });
  }

  const contentType = r.headers.get('content-type')?.split(';')[0];
  if (!contentType?.includes('json')) {
    return r;
  }

  return r.json().then((v) => {
    if (v.head?.status === 'N') {
      const message = v.head.msg;
      let E: new (msg: string) => Error = YqdzRequestError;
      const code = v.head.code;
      // 11111114 会话过期，请重新登录！
      if (code === '11111114') {
        E = UnauthenticatedError;
      }
      console.warn(`YQDZ ${ctx?.req?.method || ''} ${ctx?.url || ''} ${code}: ${message}`);
      throw Object.assign(new E(message), { code, response: r, url: ctx?.url });
    }

    return v.body;
  });
}

export class YqdzRequestError extends Error {
  code?: string;
  response?: Response;

  constructor(public message: string) {
    super(message);
  }

  toString() {
    return `YQDZ ${this.code}: ${this.message}`;
  }
}

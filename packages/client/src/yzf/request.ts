import { type FetchLike, type MaybePromise } from '@wener/utils';
import { doRequest, DoRequestOptions } from '../utils/doRequest';
import type { ResultResponse } from './types';

export interface Token {
  refresh_token: string;
  access_token: string;
  expiresAt?: Date;
}

export type TokenProvider = Token | (() => MaybePromise<Token | undefined>);

export type RequestOptions<OUT = any, IN = OUT> = DoRequestOptions<OUT, IN> & {
  token?: TokenProvider;
};

export async function request<OUT = any, IN = OUT>({ token, ...opts }: RequestOptions<OUT, IN>) {
  return doRequest({
    baseUrl: 'https://daizhang.yunzhangfang.com',
    ...opts,
    parseResponse: requireSuccessResponse,
    onRequest: async (ctx) => {
      const {
        req: { headers },
      } = ctx;
      if (token) {
        const { access_token, refresh_token } = (await (token instanceof Function ? token() : token)) || {};
        if (access_token) {
          headers.set('Cookie', `refresh_token=${refresh_token}; access_token=${access_token}`);
        }
      }
      return opts.onRequest?.(ctx);
    },
  });
}

export async function requireSuccessResponse(r: Response) {
  if (r.status >= 400) {
    throw Object.assign(new Error(r.statusText), { code: r.status, response: r });
  }

  const contentType = r.headers.get('content-type')?.split(';')[0];
  if (contentType?.includes('text/html')) {
    // maybe token expire
    return r.text().then((data) => {
      // <script>try{document.cookie="access_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT;";document.cookie="refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT;";} catch(e) {} window.top.location.href="https://sso.yunzhangfang.com?url=http://daizhang.yunzhangfang.com:9001/api/fintax/application/dz/notice/xx/findUnReadNoticeNum"</script>
      if (data.includes('access_token=;')) {
        throw Object.assign(new Error('token expired'), { code: '401', body: data, response: r });
      }

      console.error('invalid result text/html', data);
      throw Object.assign(new Error('request failed'), { code: '404', body: data, response: r });
    });
  }

  if (!contentType?.includes('json')) {
    return r;
  }

  return r.json().then((v: ResultResponse<any>) => {
    if ('result' in v) {
      if (v.code !== '0') {
        console.warn(`request failed: ${v.code} ${v.message} ${v.cause}`);
        throw Object.assign(new Error(v.message), { code: v.code, response: r });
      }

      return v.result;
    }

    return v;
  });
}

function serializeCookie(o: Record<string, any>) {
  return Object.entries(o)
    .map(([k, v]) => `${k}=${v}`)
    .join('; ');
}

import { MaybePromise } from '@wener/utils';
import { request, RequestOptions } from '../request';

export type SessionRequestOptions<T> = RequestOptions<T> & {
  cookie?: MaybePromise<string | undefined> | (() => MaybePromise<string | undefined>);
};

export async function requestFromSession<T>({ cookie, ...opts }: SessionRequestOptions<T>): Promise<T> {
  const Cookie = await (cookie instanceof Function ? cookie() : cookie);
  if (!Cookie) {
    throw new Error('missing cookie');
  }
  // extract xsrf-token
  const xsrfToken = Cookie.match(/xsrf-token=([0-9A-F]+)/i)?.[1];
  const headers: Record<string, any> = {
    Accept: 'application/json, text/plain, */*',
    'User-Agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
    'Content-Type': 'application/json;charset=utf-8',
    'Accept-Language': 'zh-CN,zh;q=0.9',
    'sec-ch-ua': '"Not?A_Brand";v="8", "Chromium";v="108", "Google Chrome";v="108"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"macOS"',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'cross-site',
    'x-requested-with': 'XMLHttpRequest',
    ...opts.headers,
    Cookie,
  };
  if (xsrfToken && !headers['xsrf-token']) {
    headers['xsrf-token'] = xsrfToken;
  }
  // eslint-disable-next-line
  return request<T>(
    {
      ...opts,
      headers,
    },
  );
}

function serializeCookie(o: Record<string, any>) {
  return Object.entries(o)
    .map(([k, v]) => `${k}=${v}`)
    .join('; ');
}

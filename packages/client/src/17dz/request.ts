import { FetchLike, type MaybePromise } from '@wener/utils';
import { UnauthenticatedError } from './errors';

export type RequestOptions<T = any> = {
  url: string;
  body?: any;
  params?: any;
  transform?: (ctx: { data: T; res: Response }) => MaybePromise<T>;
  onSuccess?: (ctx: { data: T; res: Response }) => void;
  headers?: Record<string, any>;
  fetch?: FetchLike;
} & Omit<RequestInit, 'body' | 'headers'>;

export async function request<T>({
  fetch = globalThis.fetch,
  url,
  body,
  params,
  method = body ? 'POST' : 'GET',
  onSuccess,
  transform,
  ...init
}: RequestOptions<T>) {
  const headers = new Headers(init.headers);
  if (method !== 'GET' && body) {
    if (body instanceof URLSearchParams) {
      headers.set('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
      body = body.toString();
    } else if (typeof body === 'object') {
      headers.set('Content-Type', 'application/json; charset=utf-8');
      body = JSON.stringify(body);
    }
  }
  if (params) {
    const search = new URLSearchParams(params);
    const u = new URL(url);
    search.forEach((v, k) => {
      u.searchParams.set(k, v);
    });
    url = u.toString();
  }
  const res = await fetch(url, {
    ...init,
    method,
    body,
    headers,
  });
  let data: T;
  try {
    data = await requireSuccessResponse(res);
  } catch (e) {
    let json: any;
    try {
      json = await res.json();
    } catch (e) {}
    console.warn(`request failed: ${method} ${url}`, { status: res.status, json, body, headers }, e);
    throw e;
  }
  if (transform) {
    data = await transform({ data, res });
  }
  onSuccess?.({ data, res });
  return data;
}

export function requireSuccessResponse(r: Response) {
  if (!r.ok) {
    return Promise.reject(Object.assign(new Error(r.statusText), { code: r.status, response: r }));
  }
  const contentType = r.headers.get('content-type')?.split(';')[0];
  if (!contentType?.includes('json')) {
    return r;
  }
  return r.json().then((v) => {
    if (v.head?.status === 'N') {
      const message = v.head.msg;
      let E: new (msg: string) => Error = Error;
      const code = v.head.code;
      // 11111114 会话过期，请重新登录！
      if (code === '11111114') {
        E = UnauthenticatedError;
      }
      return Promise.reject(Object.assign(new E(message), { code, response: r }));
    }
    return v.body;
  });
}

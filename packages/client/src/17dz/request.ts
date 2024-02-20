import { MaybePromise } from '@wener/utils';

export type RequestOptions<T = any> = {
  url: string;
  body?: any;
  params?: any;
  transform?: (ctx: { data: T; res: Response }) => MaybePromise<T>;
  onSuccess?: (ctx: { data: T; res: Response }) => void;
  headers?: Record<string, any>;
} & Omit<RequestInit, 'body' | 'headers'>;

export async function request<T>(
  { url, body, params, method = body ? 'POST' : 'GET', onSuccess, transform, ...init }: RequestOptions<T>,
  fetch = globalThis.fetch,
) {
  const headers = new Headers(init.headers);
  if (body && typeof body === 'object') {
    headers.set('Content-Type', 'application/json; charset=utf-8');
    body = JSON.stringify(body);
  }
  if (params) {
    const search = new URLSearchParams(params);
    const u = new URL(url);
    search.forEach((v, k) => u.searchParams.set(k, v));
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
  if (r.status >= 400) {
    return Promise.reject(Object.assign(new Error(r.statusText), { code: r.status, response: r }));
  }
  return r.json().then((v) => {
    if (v.head?.status === 'N') {
      return Promise.reject(Object.assign(new Error(v.head.msg), { code: v.head.code, response: r }));
    }
    return v.body;
  });
}

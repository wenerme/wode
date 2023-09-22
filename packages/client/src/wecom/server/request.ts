import { FetchLike, MaybePromise } from '@wener/utils';
import { requireSuccessResponse } from './requireSuccessResponse';

export interface RequestOptions<T> {
  method?: string;
  baseUrl?: string;
  url: string;
  params?: Record<string, any>;
  body?: string | Record<string, any>;
  headers?: Record<string, any>;
  fetch?: FetchLike;
  onSuccess?: (ctx: { res: Response; data: T }) => MaybePromise<T | void>;
}

export async function request<T>({
  baseUrl = 'https://qyapi.weixin.qq.com',
  url,
  params = {},
  fetch = globalThis.fetch,
  body,
  headers,
  method = body ? 'POST' : 'GET',
  onSuccess,
}: RequestOptions<T>): Promise<T> {
  const u = new URL(url, baseUrl);
  Object.entries(params).forEach(([k, v]) => {
    u.searchParams.set(k, v);
  });
  u.searchParams.sort();
  if (body && typeof body === 'object') {
    body = JSON.stringify(body);
    headers = {
      ...headers,
      'Content-Type': 'application/json',
    };
  }

  let res = await fetch(u.toString(), {
    method,
    headers,
    body,
  });
  let data: T = await requireSuccessResponse(res);
  if (onSuccess) {
    data = (await onSuccess({ res, data })) ?? data;
  }
  return data;
}

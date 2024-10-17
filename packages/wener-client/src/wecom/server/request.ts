import type { FetchLike, MaybePromise } from '@wener/utils';
import { WecomClientError } from './WecomClientError';

export interface RequestOptions<T> {
  method?: string;
  baseUrl?: string;
  url: string;
  params?: Record<string, any>;
  body?: string | Record<string, any>;
  headers?: Record<string, any>;
  fetch?: FetchLike;
  onSuccess?: (ctx: { res: Response; data: T }) => MaybePromise<T | void>;
  onResponse?: (ctx: { res: Response; req: RequestInit; data?: T; err?: any }) => MaybePromise<void>;
}

export async function request<T>({
  baseUrl = 'https://qyapi.weixin.qq.com',
  url: path,
  params = {},
  fetch = globalThis.fetch,
  body,
  headers,
  method = body ? 'POST' : 'GET',
  onResponse,
  onSuccess,
}: RequestOptions<T>): Promise<T> {
  const u = new URL(path, baseUrl);
  for (const [k, v] of Object.entries(params)) {
    u.searchParams.set(k, v);
  }

  u.searchParams.sort();
  if (body && typeof body === 'object') {
    body = JSON.stringify(body);
    headers = {
      ...headers,
      'Content-Type': 'application/json',
    };
  }

  const req = {
    method,
    headers,
    body,
  };
  const url = u.toString();

  const res = await fetch(url, req);

  let data: T;
  try {
    data = await WecomClientError.ok(res);
  } catch (error) {
    if (onResponse) {
      await onResponse({ res, req, err: error });
    }

    throw error;
  }

  if (onResponse) {
    await onResponse({ res, req, data });
  }

  if (onSuccess) {
    data = (await onSuccess({ res, data })) ?? data;
  }

  return data;
}

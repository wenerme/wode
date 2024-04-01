import { type FetchLike, getGlobalThis } from '@wener/utils';
import { OpenAiClientError } from './OpenAiClientError';
import { buildRequest } from './buildRequest';

export interface OpenAiRequestOptions<T> {
  fetch?: FetchLike;
  baseUrl?: string;
  method?: string;
  url: string;
  params?: Record<string, any>;
  body?: string | Record<string, any>;
  headers?: Record<string, any>;
}

export async function request<T>({
  fetch = getGlobalThis().fetch,
  baseUrl = 'https://api.openai.com/v1/',
  ...opts
}: OpenAiRequestOptions<T>): Promise<T> {
  const { url, ...init } = buildRequest({
    baseUrl,
    ...opts,
  });

  const res = await fetch(url, init);
  let data: T;
  try {
    data = (await res.json()) as T;
  } catch (error) {
    throw error;
  }

  if (!res.ok) {
    const r = data as ErrorResponse;
    throw new OpenAiClientError(r.error);
  }

  return data;
}

export interface ErrorResponse {
  error: {
    message: string;
    type: string;
    param: string | undefined;
    code: string;
  };
}

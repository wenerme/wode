/*
https://help.aliyun.com/zh/sdk/product-overview/v3-request-structure-and-signature
*/
import { FetchLike, getGlobalThis, MaybePromise } from '@wener/utils';
import { signv3 } from './signv3';

export interface AliCloudRequestOptions<T> {
  accessKeyId?: string;
  accessKeySecret?: string;
  endpoint?: string;
  action?: string;
  version?: string;
  fetch?: FetchLike;
  headers?: Record<string, any>;
  method?: string;
  url?: string;
  params?: Record<string, any>;
  body?: string | Record<string, any>;
  sign?: (
    init: RequestInit & { url: string },
    o: AliCloudRequestOptions<any>,
  ) => MaybePromise<{
    headers: Record<string, any>;
  }>;
  onSuccess?: (ctx: {
    res: Response;
    req: RequestInit;
    payload: AliCloudResponse<T>;
    data: T;
  }) => MaybePromise<T | void>;
  onResponse?: (ctx: {
    res: Response;
    req: RequestInit;
    payload?: AliCloudResponse<T>;
    data?: T;
    error?: any;
  }) => MaybePromise<void>;
}

/**
 * @see https://github.com/aliyun/aliyun-openapi-nodejs-sdk
 * @see https://github.com/aliyun/alibabacloud-typescript-sdk/
 */
export async function request<T>(options: AliCloudRequestOptions<T>) {
  let {
    endpoint,
    fetch = getGlobalThis().fetch,
    body,
    method = body ? 'POST' : 'GET',
    url,
    action,
    version,
    headers,
    params,
    sign = signv3,
    onResponse,
    onSuccess,
  } = options;
  let u: URL;
  {
    if (!url) {
      if (!endpoint) {
        throw new Error(`Missing endpoint`);
      }
      url = `https://${endpoint}`;
    }
    u = new URL(url);
  }
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      u.searchParams.append(k, v);
    });
  }

  let init = {
    method,
    headers: {
      'user-agent': 'github.com/wenerme/wode',
      accept: 'application/json; charset=utf-8',
      'x-acs-action': action,
      'x-acs-version': version,
      ...headers,
    } as Record<string, any>,
    body: body ? JSON.stringify(body) : undefined,
  };
  if (body) {
    init.headers['content-type'] ||= 'application/json; charset=utf-8';
  }
  {
    const { headers } = await sign(
      {
        ...init,
        url: u.toString(),
      },
      options as any,
    );
    (init as any).headers = headers;
  }

  const res = await fetch(u, init);
  let payload: AliCloudResponse<T> | undefined;
  try {
    payload = await requirePayload(res);
  } catch (e) {
    if (onResponse) {
      await onResponse({ res, req: init, payload, error: e });
    }
    throw e;
  }

  await onResponse?.({ res, req: init, payload, data: payload?.Data });
  if (!payload.Success) {
    throw new AliCloudClientError(payload.Code, payload.Message, payload.RequestId);
  }

  let data = payload.Data;
  data = (await onSuccess?.({ res, req: init, payload, data: data })) ?? data;
  return data;
}

async function requirePayload(res: Response) {
  let body;
  let last;
  try {
    const type = res.headers.get('content-type');
    if (type?.includes('application/json')) {
      body = await res.json();
    } else if (type?.includes('text/')) {
      body = await res.text();
    } else {
      body = res.body;
    }
  } catch (e) {
    last = e;
  }
  if (last) {
    throw last;
  }

  if (body && 'Success' in body) {
    return body as AliCloudResponse;
  }
  throw new Error(`Invalid response: ${res.status} ${res.statusText} ${res.headers.get('content-type')} ${body}`);
}

export class AliCloudClientError extends Error {
  constructor(
    public code: string,
    public message: string,
    public requestId: string,
  ) {
    super(`${code} ${message} ${requestId}`);
  }
}

export interface AliCloudResponse<T = any> {
  RequestId: string;
  Message: string;
  Code: string;
  Success: boolean;
  Data: T;
}

interface KnownHeaders {
  'x-acs-action'?: string;
  'x-acs-version'?: string;
  'x-acs-signature-nonce'?: string;
  'x-acs-date'?: string;
  'x-acs-content-sha256'?: string;
  'x-acs-content-sm3'?: string;
  'x-acs-security-token'?: string;
  Authorization?: string;
}

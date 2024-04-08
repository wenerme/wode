import type { FetchLike, MaybePromise } from '@wener/utils';
import { isPlainObject, dumpRequest } from '@wener/utils';

type DoRequestContext = {
  url: string;
  req: RequestInit;
  res: Response;
};
type DoRequestInit = Omit<RequestInit, 'method' | 'headers'> & {
  method: string;
  headers: Headers;
};

export type DoRequestOptions<OUT = any, IN = OUT> = {
  url: string;
  baseUrl?: string;
  body?: any;
  params?: any;
  transform?: (ctx: { data: IN } & DoRequestContext) => MaybePromise<OUT>;
  onRequest?: (ctx: { url: string; req: DoRequestInit }) => MaybePromise<void>;
  onSuccess?: (ctx: { data: OUT } & DoRequestContext) => MaybePromise<void>;
  onError?: (ctx: { error: any } & DoRequestContext) => MaybePromise<void>;
  onResponse?: (ctx: { data?: OUT; error?: any } & DoRequestContext) => MaybePromise<void>;
  parseResponse?: (res: Response, ctx: DoRequestContext) => MaybePromise<IN>;
  headers?: Record<string, any>;
  fetch?: FetchLike;
  debug?: boolean;
} & Omit<RequestInit, 'body' | 'headers'>;

export async function doRequest<OUT = any, IN = OUT>(opts: DoRequestOptions<OUT, IN>) {
  const {
    //
    debug,
    fetch = globalThis.fetch,
    onSuccess,
    onResponse,
    onError,
    parseResponse = _parseResponse,
    transform,
    onRequest,
    ...init
  } = opts;
  const { req, url } = buildRequest(init);

  onRequest && (await onRequest({ url, req }));

  debug && (await dumpRequest({ url, req }));
  const res = await fetch(url, req);
  debug && (await dumpResponse({ url, req: new Response(res.body, res), res }));

  let input: IN;
  let output: OUT;
  let ctx = { res, req, url } as DoRequestContext & { data: any; error: any };
  try {
    input = await parseResponse(ctx.res, ctx);
  } catch (e) {
    ctx.error = e;

    //
    if (onError) {
      await onError(ctx);
    }
    if (onResponse) {
      await onResponse(ctx);
    }
    throw e;
  }

  ctx.data = input;

  if (transform) {
    output = await transform(ctx);
  } else {
    output = input as any;
  }
  ctx.data = output;

  //
  if (onSuccess) {
    await onSuccess(ctx);
  }
  if (onResponse) {
    await onResponse(ctx);
  }

  return output;
}

export function buildRequest({
  body,
  method = body ? 'POST' : 'GET',
  url,
  baseUrl,
  params,
  signal,
  cache,
  credentials,
  ...init
}: DoRequestOptions) {
  const headers = new Headers(init.headers);
  if (method !== 'GET' && body) {
    if (typeof body === 'string') {
      // ok
    } else if (body instanceof URLSearchParams) {
      headers.set('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
      body = body.toString();
    } else if (isPlainObject(body)) {
      headers.set('Content-Type', 'application/json; charset=utf-8');
      body = JSON.stringify(body);
    } else {
      throw new Error(`Invalid body type: ${typeof body}`);
    }
  }

  if (baseUrl) {
    url = new URL(url, baseUrl).toString();
  }

  if (params) {
    const search = new URLSearchParams(params);
    const u = new URL(url);
    for (const [k, v] of search.entries()) {
      u.searchParams.set(k, v);
    }

    url = u.toString();
  }

  let req = {
    signal,
    method,
    body,
    cache,
    credentials,
    headers,
  } as DoRequestInit;

  return {
    req,
    url,
  };
}

function _parseResponse(res: Response): Promise<any> {
  if (!res.ok) {
    throw Object.assign(new Error(`Request failed: ${res.status} ${res.statusText}`), {
      response: res,
      status: res.status,
    });
  }
  return res.json();
}

async function dumpResponse({
  res,
  url,
  req,
  log = console.log,
}: {
  res: Response;
  url: string;
  req: RequestInit;
  log?: (s: string) => void;
}) {
  res = res.clone();
  let out = `<- ${res.status} ${res.statusText} ${req.method} ${url}
${Array.from(res.headers.entries())
  .map(([k, v]) => `${k}: ${v}`)
  .join('\n')}
   `;
  let contentType = res.headers.get('content-type');
  // TODO text/event-stream
  if (contentType?.includes('application/json') || contentType?.includes('text/plain')) {
    const body = await res.text();
    out += `\n${body}\n`;
  }

  log(out);
}

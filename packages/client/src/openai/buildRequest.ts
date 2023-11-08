export function buildRequest({
  url: path,
  params = {},
  body,
  headers,
  method = body ? 'POST' : 'GET',
  baseUrl,
}: {
  baseUrl?: string;
  method?: string;
  url: string;
  params?: Record<string, any>;
  body?: string | Record<string, any>;
  headers?: Record<string, any>;
}) {
  const url = new URL(path, baseUrl);
  Object.entries(params).forEach(([k, v]) => {
    url.searchParams.set(k, v);
  });
  url.searchParams.sort();
  if (body) {
    if (body instanceof ReadableStream) {
    } else {
      body = JSON.stringify(body);
      headers = {
        ...headers,
        'Content-Type': 'application/json',
      };
    }
  }

  return {
    method,
    headers,
    body,
    url,
  };
}

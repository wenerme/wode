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
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  url.searchParams.sort();
  if (body) {
    if (body instanceof ReadableStream) {
    } else if (body instanceof FormData) {
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

export function buildFormData(o: Record<string, any>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(o)) {
    fd.append(k, v);
  }

  return fd;
}

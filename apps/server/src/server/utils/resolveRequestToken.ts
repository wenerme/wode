import { firstOfMaybeArray } from '@wener/utils';

export function resolveRequestToken({
  url,
  header,
  headers = header,
  query,
}: {
  url?: string;
  header?: Headers | Record<string, any>;
  headers?: Headers | Record<string, any>;
  query?: Record<string, any>;
}):
  | {
      type?: string;
      token: string;
      in: 'header' | 'query';
    }
  | undefined {
  if (headers) {
    let auth: string | undefined | null;
    if (headers instanceof Headers) {
      auth = headers.get('authorization');
    } else {
      auth = firstOfMaybeArray(headers.authorization);
    }
    if (auth) {
      const [type, token] = auth.trim().split(' ', 2) ?? [];
      return {
        type,
        token,
        in: 'header',
      };
    }
  }
  if (query) {
    if (url) {
      query = Object.fromEntries(new URL(url, 'http://localhost').searchParams.entries());
    }
  }
  if (query) {
    let token = firstOfMaybeArray(query.token);
    if (token) {
      return {
        token,
        in: 'query',
      };
    }
  }
}

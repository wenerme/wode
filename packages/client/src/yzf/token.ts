import { type FetchLike } from '@wener/utils';
import Cookie from 'cookie';
import { request } from './request';

export async function ping({
  access_token,
  refresh_token,
  fetch,
}: {
  refresh_token: string;
  access_token: string;
  fetch?: FetchLike;
}): Promise<string | undefined> {
  return request({
    fetch,
    url: '/api/fintax/application/dz/notice/xx/findUnReadNoticeNum',
    headers: {
      Cookie: `refresh_token=${refresh_token}; access_token=${access_token}`,
    },
    transform({ res }) {
      const s = res.headers.get('set-cookie');
      if (s) {
        const p = Cookie.parse(s);
        if ('access_token' in p) {
          return p.access_token;
        }
      }

      return undefined;
    },
  });
}

export function createRefreshableTokenProvider({
  getToken,
  setToken,
}: {
  getToken: () => Promise<{ access_token: string; refresh_token: string; expiresAt?: Date | undefined }>;
  setToken: (token: { access_token: string; refresh_token: string; expiresAt?: Date | undefined }) => Promise<void>;
}) {
  let token: { access_token: string; refresh_token: string; expiresAt: Date } = {
    access_token: '',
    refresh_token: '',
    expiresAt: new Date(0),
  };
  let lastRefreshAt = 0;

  const refresh = async () => {
    token = { ...token };
    if (!token.refresh_token) {
      token = { ...(await getToken()), expiresAt: new Date(0) };
      token.expiresAt = getTokenExpiresAt(token.access_token) || new Date(0);
    }

    if (
      lastRefreshAt - Date.now() > 1000 * 60 * 3 || // 3min
      token.expiresAt.getTime() - Date.now() > 1000 * 60 * 5 // 5min
    ) {
      // use provider token instead cached
      const neo = await ping(await getToken());
      if (neo) {
        token.access_token = neo;
        token.expiresAt = getTokenExpiresAt(token.access_token) || new Date(0);
        await setToken(token);
      }

      lastRefreshAt = Date.now();
    }
  };

  return async () => {
    if (!token.expiresAt || token.expiresAt.getTime() - Date.now() < 1000 * 60 * 5) {
      lastRefreshAt = Date.now();
      await refresh();
    } else if (lastRefreshAt - Date.now() < 1000 * 60 * 5) {
      lastRefreshAt = Date.now();
      void refresh();
    }

    return token;
  };
}

export function getTokenPayload(s: string | undefined) {
  if (!s) {
    return undefined;
  }

  const payload = s.split('.').at(1);
  if (payload) {
    return JSON.parse(atob(payload)) as TokenPayload;
  }

  return undefined;
}

export function getTokenExpiresAt(s: string | undefined | TokenPayload) {
  const p = typeof s === 'string' ? getTokenPayload(s) : s;
  const exp = p?.exp;
  if (exp) {
    return new Date(exp * 1000);
  }

  return undefined;
}

export interface TokenPayload {
  set: string;
  phone: string;
  gsId: string;
  iss: string;
  userName: string;
  exp: number;
  userId: string;
}

import type { IncomingMessage, ServerResponse } from 'http';
import type { Session } from 'next-auth';
import type { NextApiRequestCookies } from 'next/dist/server/api-utils';
import { getInternalAuthBaseUrl } from '../runtime/withBasePath';

function getSessionToken(
  req: IncomingMessage & {
    cookies: NextApiRequestCookies;
  },
): { type: string | 'Cookie' | 'Bearer'; token: string; Cookie: string } | undefined {
  let [type, token] = req.headers.authorization?.split(' ') ?? ([] as Array<string | undefined>);
  if (type && token) {
    return { type, token, Cookie: buildSessionCookie({ token }) };
  }
  token = req?.cookies['__Secure-next-auth.session-token'] || req?.cookies['next-auth.session-token'];
  if (token) {
    return {
      type: 'Cookie',
      token,
      Cookie: req.headers.cookie || buildSessionCookie({ token }),
    };
  }
  return undefined;
}

function buildSessionCookie({ token }: { token: string }) {
  return `__Secure-next-auth.session-token=${token}; next-auth.session-token=${token};`;
}

export async function getRemoteServerSession({
  req,
  res,
}: {
  req: IncomingMessage & {
    cookies: NextApiRequestCookies;
  };
  res: ServerResponse;
}): Promise<undefined | Session> {
  const { token, type, Cookie } = getSessionToken(req) ?? {};
  const url = getInternalAuthBaseUrl();

  let session: Session | undefined;
  try {
    if (!token || !Cookie) {
      return;
    }

    session = await fetch(`${url}/session`, {
      method: 'GET',
      headers: {
        Cookie,
      },
    }).then((v) => {
      if (v.status >= 400) {
        throw new Error(`failed to get session (${v.status}): ${v.statusText}`);
      }
      return v.json();
    });

    if (!session?.expires) {
      return undefined;
    }
    return session;
  } catch (e) {
    console.error(`getRemoteServerSession: ${type} ${token} -> ${url}`, e);
    return undefined;
  } finally {
    process.env.NODE_ENV === 'development' &&
      console.log('getRemoteServerSession', {
        type,
        token,
        path: req?.url,
        auth: url,
        session,
      });
  }
}

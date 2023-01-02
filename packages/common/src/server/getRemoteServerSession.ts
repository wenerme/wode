import { IncomingMessage, ServerResponse } from 'http';
import { Session } from 'next-auth';
import { NextApiRequestCookies } from 'next/dist/server/api-utils';
import { getInternalAuthBaseUrl } from '../runtime/withBasePath';

export async function getRemoteServerSession({
  req,
  res,
}: {
  req: IncomingMessage & {
    cookies: NextApiRequestCookies;
  };
  res: ServerResponse;
}): Promise<undefined | Session> {
  const token = req?.cookies['__Secure-next-auth.session-token'] || req?.cookies['next-auth.session-token'];
  const url = getInternalAuthBaseUrl();

  process.env.NODE_ENV === 'development' && console.log('getRemoteServerSession', { token, path: req.url, auth: url });
  if (!token) {
    return;
  }
  try {
    const session: Session = await fetch(`${url}/session`, {
      method: 'GET',
      headers: {
        Cookie: req.headers.cookie as string,
      },
    }).then((v) => {
      if (v.status >= 400) {
        throw new Error(`failed to get session (${v.status}): ${v.statusText}`);
      }
      return v.json();
    });
    // process.env.NODE_ENV === 'development' && console.log('getRemoteServerSession', { session });

    if (!session?.expires) {
      return undefined;
    }
    return session;
  } catch (e) {
    console.error(`getRemoteServerSession: from ${url}`, e);
    return undefined;
  }
}

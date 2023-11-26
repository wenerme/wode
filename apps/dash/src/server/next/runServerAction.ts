import { Logger } from '@nestjs/common';
import { Currents } from '@wener/nestjs';
import { MaybePromise } from '@wener/utils';
import { cookies, headers } from 'next/headers';
import { runContext } from '../runContext';

export function runServerAction<R>(f: () => MaybePromise<R>): Promise<R> {
  // nextjs middleware do not support nodejs runtime
  return runContext(f);
}

export const ActionContexts = {
  Auth: Currents.create<any>('ResolveAccessTokenResponse'),
};

const log = new Logger('runServerAction');

export function setAccessTokenToCookie({ accessToken, refreshToken }: { accessToken?: string; refreshToken?: string }) {
  let cs = cookies();
  accessToken &&
    cs.set({
      name: 'access_token',
      value: accessToken,
      httpOnly: true,
    });
  refreshToken &&
    cs.set({
      name: 'refresh_token',
      value: refreshToken,
      httpOnly: true,
    });
}

export function getAccessToken() {
  let accessToken = cookies().get('access_token')?.value;
  let refreshToken = cookies().get('refresh_token')?.value;
  accessToken ||= headers().get('authorization')?.split(' ')?.[1];
  return {
    accessToken,
    refreshToken,
  };
}

// export function runUserServerAction<R>(
//   f: () => MaybePromise<R>,
//   {
//     require = true,
//   }: {
//     require?: boolean;
//   } = {},
// ): Promise<R> {
//   return runServerAction(async () => {
//     let svc = getContext(RemoteAuthService);
//     const { accessToken, refreshToken } = getAccessToken();
//     let auth: ResolveAccessTokenResponse | undefined;
//     if (isDev()) {
//       log.debug(`accessToken=${accessToken} refreshToken=${refreshToken}`);
//     }
//     if (accessToken) {
//       try {
//         auth = await svc.resolveAccessToken({ accessToken, refreshToken, refresh: 'auto' });
//         ActionContexts.Auth.set(auth);
//         const {
//           token: { tid, clientId, subjectId, sessionId },
//         } = auth;
//         //
//         if (auth.refreshed) {
//           log.log(`refreshed token ${auth.token.expiresAt}`);
//           if (accessToken !== auth.token.accessToken || refreshToken !== auth.token.refreshToken) {
//             setAccessTokenToCookie({
//               accessToken: auth.token.accessToken,
//               refreshToken: auth.token.refreshToken,
//             });
//           }
//         }
//         setCurrentContext({
//           tenantId: tid ?? undefined,
//           clientId,
//           sessionId,
//           userId: subjectId,
//         });
//
//         log.log(
//           `Current userId=${auth.subject?.id} sessionId=${auth.token.sessionId} expiresAt=${auth.token.expiresAt}`,
//         );
//       } catch (e) {
//         console.log(`resolve token failed ${accessToken}`, e);
//         if (require) {
//           throw Errors.Unauthorized.asError({
//             message: '认证失败',
//             cause: e,
//           });
//         }
//       }
//     }
//     if (!auth && require) {
//       throw Errors.Unauthorized.asError({
//         message: '缺少认证信息',
//       });
//     }
//
//     return f();
//   });
// }

import { getContext } from '@wener/nestjs';
import consola from 'consola';
import type { ConsolaInstance } from 'consola/core';
import { isDevelopment } from 'std-env';
import { AuthService } from '@/foundation/Auth/AuthService';
import type { AccessTokenEntity } from '@/foundation/Auth/entity';
import type { TenantEntity } from '@/foundation/Tenant/entity/TenantEntity';
import { checkUserAllowed } from '@/foundation/User/actions/checkUserAllowed';
import type { UserEntity } from '@/foundation/User/UserEntity';
import { setServerContext } from '@/server/context';
import { resolveRequestToken } from '@/server/utils/resolveRequestToken';

export async function runAccessTokenInterceptor({
	req,
	allowBasicAuth,
	log = consola,
}: {
	req: {};
	allowBasicAuth?: () => boolean;
	log?: ConsolaInstance;
}) {
	const { token, type, username, password } = resolveRequestToken(req) || {};
	let authService = getContext(AuthService);
	let user: UserEntity | undefined;
	let accessToken: AccessTokenEntity | undefined;
	let tenant: TenantEntity | undefined;
	let canBasicAuth = allowBasicAuth?.() ?? false;

	try {
		if (canBasicAuth && username && password) {
			user = (await authService.checkPassword({ username, password }))?.user;
		} else if (token) {
			// 不考虑 bearer 或 token 类型
			({ subject: user, accessToken: accessToken } = await authService.resolveAccessToken({ accessToken: token }));
		}

		checkUserAllowed(user);

		setServerContext({
			user,
			subject: user,
			token: accessToken,
		});
	} catch (e) {
		log.error(`Auth Error ${token}: ${e}`);
	}

	if (isDevelopment) {
		// let headers = c.req.raw.headers;
		// if (parseBoolean(headers.get('x-debug'))) {
		//   ServerContexts.debug.set(true);
		// }
	}

	return {
		user,
		accessToken,
		tenant,
	};
}

import { Errors } from '@wener/utils';
import { isUserAllowed } from '@/foundation/User/actions/isUserAllowed';
import type { UserEntity } from '@/foundation/User/UserEntity';

export function checkUserAllowed(user: UserEntity | undefined) {
	Errors.Forbidden.check(!user || isUserAllowed(user), `用户禁止访问: ${user?.status}`);
}

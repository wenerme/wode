import { Contexts, getCurrentTenantId } from '@wener/server/app';
import { Errors } from '@wener/utils';

export {
	getCurrentTenantId as getTenantId,
	getCurrentUserId as getUserId,
	getFallbackTenantId,
	getStaticTenantId,
	requireTenantId,
} from '@wener/server/app';

export function requireUserId() {
	const uid = Contexts.userId.get();
	Errors.InternalServerError.check(uid, 'Missing user id');
	return uid;
}

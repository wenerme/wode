import { Contexts, getCurrentTenantId } from '@wener/nestjs/app';
import { Errors } from '@wener/utils';

export {
	getCurrentTenantId as getTenantId,
	getCurrentUserId as getUserId,
	getFallbackTenantId,
	getStaticTenantId,
	requireTenantId,
} from '@wener/nestjs/app';

export function requireUserId() {
	const uid = Contexts.userId.get();
	Errors.InternalServerError.check(uid, 'Missing user id');
	return uid;
}

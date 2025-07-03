import { ResourceStatus } from '@wener/common/resource/schema';
import type { UserEntity } from '@/foundation/User/UserEntity';

export function isUserAllowed(user: UserEntity) {
	return user.status === ResourceStatus.Active;
}

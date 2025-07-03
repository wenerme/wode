import type { EntityManager } from '@mikro-orm/postgresql';
import { isEntityTypeId } from '@wener/nestjs/entity';
import { resolveEntity } from '@wener/nestjs/entity/service';
import { getEntityManager } from '@wener/nestjs/mikro-orm';
import { Errors } from '@wener/utils';
import consola from 'consola';
import type { ConsolaInstance } from 'consola/core';
import { isDevelopment } from 'std-env';
import { checkUserAllowed } from '@/foundation/User/actions/checkUserAllowed';
import { hashPassword } from '@/foundation/User/actions/hashPassword';
import { validatePassword } from '@/foundation/User/actions/validatePassword';
import { UserEntity } from '@/foundation/User/UserEntity';

export async function checkUserPassword({
	username,
	user: userOrId = username,
	password,
	em = getEntityManager<EntityManager>(),
	log = consola.withTag(checkUserPassword.name),
	shouldMigration,
}: {
	user?: UserEntity | string;
	password: string;
	username?: string;
	em?: EntityManager;
	log?: ConsolaInstance;
	shouldMigration?: boolean;
}) {
	Errors.BadRequest.check(password, `无效密码`);

	let user = typeof userOrId === 'string' ? undefined : userOrId;
	if (typeof userOrId === 'string') {
		Errors.BadRequest.check(userOrId, `无效用户名`);
		let where: Record<string, any> = {};
		if (isEntityTypeId(userOrId)) {
			where['id'] = userOrId;
		} else {
			where['loginName'] = userOrId;
		}
		const { entity } = await resolveEntity<UserEntity>(
			{
				where: where,
			},
			{
				em,
				Entity: UserEntity,
			},
		);
		user = entity ?? undefined;
	}
	if (!user) {
		log.warn(`UserNotFound: trying to login user with ${JSON.stringify(userOrId)}`);
	}
	Errors.NotFound.check(user, '用户不存在');
	checkUserAllowed(user);
	Errors.BadRequest.check(user.password, `用户不允许密码登陆`);
	const result = await validatePassword({ hash: user.password, password });
	// logging & audit
	if (!result.success) {
		log.warn(`IncorrectPassword: trying to login user ${user.id}`);
		if (isDevelopment) {
			log.debug(`user ${user.id} password not match ${JSON.stringify(user.password)} <-> ${JSON.stringify(password)}`);
		}
	}
	Errors.Forbidden.check(result.success, '密码错误');

	if (shouldMigration) {
		if (!user.password.startsWith('$')) {
			log.debug(`user ${user.id} migration password`);
			user.password = await hashPassword(password);
			await em.persistAndFlush(user);
		}
	}

	return {
		user,
	};
}

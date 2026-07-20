import { Injectable, Logger } from '@nestjs/common';
import { getCurrentTenantId, getCurrentUserId } from '@wener/server/app';
import { GeneralResponseObject } from '@wener/server/type-graphql';
import { Authorized, Ctx, Query, Resolver } from 'type-graphql';
import { SystemRole } from '@/graph/const';

@Resolver()
@Injectable()
export class PingResolver {
	private log = new Logger(this.constructor.name);

	@Authorized(SystemRole.Public)
	@Query(() => GeneralResponseObject)
	async ping(@Ctx() ctx: any) {
		this.log.log(`PING with Context tid=${getCurrentTenantId()} userId=${getCurrentUserId()}`);
		return { message: 'OK' };
	}
}

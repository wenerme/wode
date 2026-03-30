import type { StandardBaseEntity } from '@wener/server/entity';
import type { EntityBaseService } from '@wener/server/entity/service';
import { runRelayClientMutation } from '@wener/server/type-graphql';
import type { BaseEntityResolver, CreateResourceInput, UpdateResourceInput } from '@wener/server/type-graphql/resource';

export function runResolverUpdate<T, O, E extends StandardBaseEntity, SVC extends EntityBaseService<E>>(
	resolver: BaseEntityResolver<O, E, SVC>,
	input: UpdateResourceInput<T>,
) {
	return runRelayClientMutation(input, async () => {
		const data = await resolver.svc.patch(input);
		return { data };
	});
}

export function runResolverCreate<T, O, E extends StandardBaseEntity, SVC extends EntityBaseService<E>>(
	resolver: BaseEntityResolver<O, E, SVC>,
	input: CreateResourceInput<T>,
) {
	return runRelayClientMutation(input, async () => {
		const data = await resolver.svc.create(input);
		return { data };
	});
}

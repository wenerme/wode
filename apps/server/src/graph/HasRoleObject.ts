import { RelayNode } from '@wener/server/type-graphql';
import { InterfaceType } from 'type-graphql';

@InterfaceType('HasRole', {
	autoRegisterImplementations: false,
	implements: [RelayNode],
	resolveType: (...args) => {
		return RelayNode.resolveType(...args);
	},
})
export class HasRoleObject extends RelayNode {}

import type { Provider } from '@nestjs/common';
import { isClass, type Constructor } from '@wener/utils';
import { getMetadataStorage } from 'type-graphql';

type ServiceClass = Constructor & { name: `${string}Service` | `${string}Impl` };

type ResolverClass = Constructor & { name: `${string}Resolver` };
type EntityClass = Constructor & { name: `${string}Entity` };

type AnyConstructor = Constructor<any> & { EntityType?: Function; ServiceType?: Function };

type Provide = AnyConstructor | Provider;

export function resolveProvides(_all: Array<AnyConstructor | Provider>): {
	resolvers: Constructor<any>[]; // type graphql
	entities: Constructor<any>[]; // mikro orm
	services: Constructor<any>[];
	controllers: Constructor<any>[];
	provides: Constructor<any>[]; // all
	providers: Provider[];
} {
	const providers: Provider[] = [];
	const all: AnyConstructor[] = _all.filter((v) => {
		if (isClass(v)) {
			return true;
		}
		providers.push(v);
		return false;
	}) as AnyConstructor[];

	const resolverSet = new Set(getMetadataStorage().resolverClasses.map((v) => v.target));
	const resolvers = all.filter((v) => {
		return v.name.endsWith('Resolver') || resolverSet.has(v);
	});

	const entities = all.flatMap((v) => {
		// check @Entity
		if (v.name.endsWith('Entity')) {
			return v;
		}
		if (v.EntityType) {
			return v.EntityType;
		}
		return [];
	}) as Constructor<any>[];

	const services = all.flatMap((v) => {
		if (v.name.endsWith('Service') || v.name.endsWith('Impl')) {
			return v;
		}
		if (v.ServiceType) {
			return v.ServiceType;
		}
		return [];
	}) as Constructor<any>[];

	const controllers = all.filter((v) => {
		// fixme check @Controller
		return v.name.endsWith('Controller');
	});

	{
		let a = new Set(all);
		resolvers.forEach((v) => a.delete(v));
		entities.forEach((v) => a.delete(v));
		services.forEach((v) => a.delete(v));
		if (a.size) {
			throw new Error(
				`Unresolved Provides: ${Array.from(a)
					.map((v) => v.name)
					.join(', ')}`,
			);
		}
	}

	const provides = services.concat(entities, resolvers);
	return {
		resolvers: unique(resolvers),
		entities: unique(entities),
		services: unique(services),
		provides: unique(provides),
		controllers: unique(controllers),
		providers,
	};
}

function unique<T>(arr: T[]): T[] {
	return Array.from(new Set(arr));
}

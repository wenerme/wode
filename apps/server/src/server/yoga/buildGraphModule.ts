import { type DynamicModule, Module } from '@nestjs/common';
import type { ModuleMetadata } from '@nestjs/common/interfaces/modules/module-metadata.interface';
import type { Constructor } from '@wener/server';
import { OrmModule } from '@wener/server/mikro-orm';

export interface BuildGraphModuleOptions {
	resolvers: Constructor<any>[];
	entities: Constructor<any>[];
	services: Constructor<any>[];
	providers?: ModuleMetadata['providers'];
	imports?: ModuleMetadata['imports'];
}

export function buildGraphModule(...ctx: BuildGraphModuleOptions[]) {
	let providers = ctx.flatMap((v) => v.providers || []);
	let services = ctx.flatMap((v) => v.services || []);
	let entities = ctx.flatMap((v) => v.entities || []);
	let resolvers = ctx.flatMap((v) => v.resolvers || []);
	let imports = ctx.flatMap((v) => v.imports || []);
	return {
		resolvers,
		entities,
		services,
		providers,
		get module() {
			return {
				module: GraphContextModule,
				providers: [...providers, ...services, ...resolvers],
				imports: [...(entities.length ? [OrmModule.forFeature(entities), ...imports] : [])],
			} as DynamicModule;
		},
	} satisfies BuildGraphModuleOptions & { module: DynamicModule };
}

@Module({})
class GraphContextModule {}

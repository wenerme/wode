import { type DynamicModule, Module } from '@nestjs/common';
import type { ModuleMetadata } from '@nestjs/common/interfaces/modules/module-metadata.interface';
import { OrmModule } from '@wener/server/mikro-orm';
import type { Constructor } from '@wener/utils';

export interface BuildDynamicModuleOptions {
	resolvers: Constructor<any>[];
	entities: Constructor<any>[];
	services: Constructor<any>[];
	provides: Constructor<any>[];
	controllers: Constructor<any>[];
	providers: ModuleMetadata['providers'];
	imports: ModuleMetadata['imports'];
	exports: ModuleMetadata['exports'];
}

export function buildDynamicModule(...all: Partial<BuildDynamicModuleOptions>[]) {
	let providers = all.flatMap((v) => v.providers || []);
	let services = all.flatMap((v) => v.services || []);
	let entities = all.flatMap((v) => v.entities || []);
	let resolvers = all.flatMap((v) => v.resolvers || []);
	let imports = all.flatMap((v) => v.imports || []);
	let exports = all.flatMap((v) => v.exports || []);
	let controllers = all.flatMap((v) => v.controllers || []);
	let provides = services.concat(entities).concat(resolvers);
	return {
		resolvers,
		entities,
		services,
		provides,
		imports,
		controllers,
		providers,
		exports,
		get module() {
			return {
				module: DynamicContextModule,
				imports: [...(entities.length ? [OrmModule.forFeature(entities), ...imports] : [])],
				controllers,
				providers: [...providers, ...services, ...resolvers],
				exports,
			} as DynamicModule;
		},
	} satisfies BuildDynamicModuleOptions & { module: DynamicModule };
}

@Module({})
class DynamicContextModule {}

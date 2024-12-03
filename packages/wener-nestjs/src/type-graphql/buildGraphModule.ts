import { Module, type DynamicModule, type ModuleMetadata } from '@nestjs/common';
import type { Constructor } from '@wener/utils';
import { OrmModule } from '../mikro-orm';

export interface BuildGraphModuleOptions {
  resolvers: Constructor<any>[];
  entities: Constructor<any>[];
  services: Constructor<any>[];
  provides: Constructor<any>[];
  providers?: ModuleMetadata['providers'];
  imports?: ModuleMetadata['imports'];
}

export function buildGraphModule(...ctx: Array<Partial<BuildGraphModuleOptions>>): BuildGraphModuleOptions & {
  module: DynamicModule;
} {
  let providers = ctx.flatMap((v) => v.providers || []);
  let services = ctx.flatMap((v) => v.services || []);
  let entities = ctx.flatMap((v) => v.entities || []);
  let resolvers = ctx.flatMap((v) => v.resolvers || []);
  let imports = ctx.flatMap((v) => v.imports || []);
  let provides = services.concat(entities).concat(resolvers);
  return {
    resolvers,
    entities,
    services,
    providers,
    provides,
    get module() {
      return {
        module: TypeGraphModule,
        providers: [...providers, ...services, ...resolvers],
        imports: [...(entities.length ? [OrmModule.forFeature(entities), ...imports] : [])],
      } as DynamicModule;
    },
  } satisfies BuildGraphModuleOptions & { module: DynamicModule };
}

@Module({})
export class TypeGraphModule {}

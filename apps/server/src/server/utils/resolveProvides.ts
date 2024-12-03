import type { Constructor } from '@wener/utils';

type ServiceClass = Constructor & {
  name: `${string}Service` | `${string}Impl`;
};

type ResolverClass = Constructor & {
  name: `${string}Resolver`;
};

type EntityClass = Constructor & {
  name: `${string}Entity`;
};

type AnyConstructor = Constructor<any> & {
  EntityType?: Function;
  ServiceType?: Function;
};

type Provides = {
  resolvers: Constructor<any>[];
  entities: Constructor<any>[];
  services: Constructor<any>[];
  provides: Constructor<any>[];
};

export function resolveProvides(all: Array<AnyConstructor>): Provides {
  // fixme should not make Resolve as special case
  const resolvers = all.filter((v) => {
    // fixme check @Resolver
    return v.name.endsWith('Resolver');
  });

  const entities = all.flatMap((v) => {
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

  const provides = services.concat(entities).concat(resolvers);
  return {
    resolvers: unique(resolvers),
    entities: unique(entities),
    services: unique(services),
    provides: unique(provides),
  };
}

function unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

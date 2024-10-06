import type { Constructor } from '@wener/utils';

export function resolveProvides(
  all: Array<
    Constructor<any> & {
      EntityType?: Function;
      ServiceType?: Function;
    }
  >,
): {
  resolvers: Constructor<any>[];
  entities: Constructor<any>[];
  services: Constructor<any>[];
} {
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
    if (v.name.endsWith('Service')) {
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
        `Unresolved Types: ${Array.from(a)
          .map((v) => v.name)
          .join(', ')}`,
      );
    }
  }

  return {
    resolvers: unique(resolvers),
    entities: unique(entities),
    services: unique(services),
  };
}

function unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

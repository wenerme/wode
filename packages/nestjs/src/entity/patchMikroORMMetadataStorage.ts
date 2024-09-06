import { EntityMetadata, MetadataStorage, Utils, type Dictionary } from '@mikro-orm/core';

export function patchMikroORMMetadataStorage() {
  if (patchMikroORMMetadataStorage.original) {
    return;
  }
  patchMikroORMMetadataStorage.original = MetadataStorage.getMetadataFromDecorator;

  {
    // https://github.com/mikro-orm/mikro-orm/blob/master/packages/core/src/metadata/MetadataStorage.ts
    let _idMap = new WeakMap();
    let nameMap = new Map<string, number>();
    MetadataStorage.getMetadataFromDecorator = <T = any>(
      target: T &
        Dictionary & {
          [MetadataStorage.PATH_SYMBOL]?: string;
        },
    ): EntityMetadata<T> => {
      if (!Object.hasOwn(target, MetadataStorage.PATH_SYMBOL)) {
        Object.defineProperty(target, MetadataStorage.PATH_SYMBOL, {
          value: Utils.lookupPathFromDecorator(target.name),
          writable: true,
        });
      }

      // rename mixin entity to allow mixin entity in the middle
      let name = target.name;
      // restrict to mixin entity
      if (name && !name.endsWith('__') && name.endsWith('MixinEntity')) {
        let id = _idMap.get(target);
        if (!id) {
          id = (nameMap.get(target.name) || 0) + 1;
          nameMap.set(target.name, id);
          _idMap.set(target, id);
        }

        name = `${target.name}__${id}__`;
      }
      const path = Utils.lookupPathFromDecorator(name);
      const meta = MetadataStorage.getMetadata(name, path);

      // change class name
      name !== target.name && Object.defineProperty(target, 'name', { value: name, writable: true });
      return meta;
    };
  }
}

patchMikroORMMetadataStorage.original = null as typeof MetadataStorage.getMetadataFromDecorator | null;

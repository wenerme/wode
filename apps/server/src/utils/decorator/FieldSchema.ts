import { MetadataStorage, type EntityMetadata, type EntityProperty, type Type } from '@mikro-orm/core';
import type { AbstractConstructor } from '@wener/nestjs';
import { computeIfAbsent, type Constructor } from '@wener/utils';

export type FieldSchemaOptions = {
  search?: boolean | 'exact';
  format?: string;
  redact?: boolean;
  pattern?: string | RegExp;
};
export const FieldSchema = (options: FieldSchemaOptions = {}): PropertyDecorator => {
  return Reflect.metadata(FIELD_SCHEMA_METADATA_KEY, options);
  // return (target, key) => {
  //   Reflect.defineMetadata(FIELD_SCHEMA_METADATA_KEY, options, target, key);
  // };
};

export const FIELD_SCHEMA_METADATA_KEY = 'Field:Schema:Metadata:Options';

let _cache = new WeakMap<object, any>();

export function getEntitySchema<T = unknown>(type: Constructor<T> | AbstractConstructor<T>): EntitySchema {
  return computeIfAbsent(_cache, type, () => {
    let lookup = computeIfAbsent<object, Map<any, EntityMetadata>>(_cache, MetadataStorage, () => {
      return new Map(Object.values(MetadataStorage.getMetadata()).map((v) => [v.className, v]));
    });

    let protos = [];

    {
      let proto = type;
      while (proto) {
        protos.push(proto);
        proto = Object.getPrototypeOf(proto);
      }
    }

    let meta = lookup.get(type.name)!;
    const sc: EntitySchema = {
      className: meta.className,
      tableName: meta.tableName,
      fields: [],
    };
    protos.reverse();
    for (const proto of protos) {
      let meta = lookup.get(proto.name);
      if (!meta) continue;
      for (let [k, p] of Object.entries((meta.properties ?? {}) as Record<string, EntityProperty>)) {
        if (!p) continue;
        let fso = proto.prototype ? Reflect.getMetadata(FIELD_SCHEMA_METADATA_KEY, proto.prototype, k) : undefined;
        let fs: EntityFieldSchema = {
          name: k,
          type: '',
          nullable: p.nullable ?? true,
        };
        if (typeof p.type !== 'string') {
          let t: Type = new (p.type as any)();
          switch (t.runtimeType) {
            case 'Date':
              fs.type = 'string';
              fs.format = 'date-time';
              break;
            case 'any':
              fs.type = 'object';
              break;
            default:
              fs.type = t.runtimeType;
          }
        }
        if (p.hidden) {
          if (fs.name !== 'deletedAt') {
            fs.redact = true;
          }
        }
        if (fso) {
          Object.assign(fs, fso);
        }
        sc.fields.push(fs);
      }
    }
    return sc;
  });
}

export type EntitySchema = {
  className: string;
  tableName: string;
  fields: EntityFieldSchema[];
};

type EntityFieldSchema = {
  name: string;
  type: string;
  format?: string;
  nullable: boolean;
} & FieldSchemaOptions;

// type ClassPropertyDecorator = (
//   target: undefined,
//   context: {
//     kind: 'field';
//     name: string | symbol;
//     access: { get(): unknown; set(value: unknown): void };
//     static: boolean;
//     private: boolean;
//   },
// ) => (initialValue: unknown) => unknown | void;

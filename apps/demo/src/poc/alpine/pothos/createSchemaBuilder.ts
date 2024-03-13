import SchemaBuilder from '@pothos/core';
import DataloaderPlugin from '@pothos/plugin-dataloader';
import RelayPlugin from '@pothos/plugin-relay';
import ScopeAuthPlugin from '@pothos/plugin-scope-auth';
import SimpleObjectsPlugin from '@pothos/plugin-simple-objects';
import ValidationPlugin from '@pothos/plugin-validation';
import { DateTimeResolver } from 'graphql-scalars';

export type SchemaBuilderType = ReturnType<typeof createSchemaBuilder>;

export function createSchemaBuilder() {
  const builder = new SchemaBuilder<{
    Scalars: {
      ID: {
        Output: number | string;
        Input: string;
      };
      DateTime: {
        Output: Date;
        Input: Date;
      };
    };
    Context: {
      user?: {
        id: string;
      };
    };
  }>({
    plugins: [ScopeAuthPlugin, RelayPlugin, DataloaderPlugin, SimpleObjectsPlugin, ValidationPlugin],
    authScopes: () => ({}),
    relayOptions: {
      clientMutationId: 'omit',
      cursorType: 'String',
    },
  });
  builder.addScalarType('DateTime', DateTimeResolver);

  return builder;
}

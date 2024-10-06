import type { CodegenConfig } from '@graphql-codegen/cli';
import { addTypenameSelectionDocumentTransform, type ClientPresetConfig } from '@graphql-codegen/client-preset';
import dotenv from 'dotenv';

dotenv.config({ path: ['.env.local', '.env'] });

let schema: CodegenConfig['schema'] = 'graphql.schema.json';

let downloadSchema = process.env.DOWNLOAD_SCHEMA;

{
  if (downloadSchema) {
    let headers: Record<string, string> = process.env.GRAPHQL_TOKEN
      ? {
          Authorization: `Bearer ${process.env.GRAPHQL_TOKEN}`,
        }
      : {};

    schema = {
      [process.env.GRAPHQL_URL || 'http://localhost:1337/graphql']: {
        headers: headers,
      },
    };
  }
}

const config: CodegenConfig = {
  overwrite: true,
  schema,
  documents: 'src/**/!(*.d).{ts,tsx}',
  ignoreNoDocuments: true,
  hooks: {},
  generates: {
    ...(downloadSchema
      ? {
          './graphql.schema.json': {
            plugins: ['introspection'],
          },
          // https://the-guild.dev/graphql/codegen/plugins/other/urql-introspection
          // https://commerce.nearform.com/open-source/urql/docs/graphcache/schema-awareness
          // full 232k, urql 124k
          './src/gql/urql.schema.json': {
            plugins: ['urql-introspection'],
            config: {
              // for custom scalars
              includeScalars: true,
            },
          },
        }
      : {}),
    // 'src/gen/gql.ts': { plugins: ['typescript'] },
    // 'src/': {
    //   preset: 'near-operation-file',
    //   presetConfig: {
    //     extension: '.gen.ts',
    //     baseTypesPath: '~@/gen/gql',
    //   },
    //   plugins: ['typescript-operations', 'typescript-document-nodes', 'typescript-graphql-request'],
    //   config: {
    //     // # URQL 生成 useQuery, useMutation
    //     withHooks: true,
    //     useTypeImports: true,
    //   },
    // },
    './src/gql/': {
      preset: 'client',
      presetConfig: {
        fragmentMasking: { unmaskFunctionName: 'getFragmentData' },
        persistedDocuments: true,
        useTypeImports: true,
        skipTypename: true,
        dedupeFragments: true,
      } as ClientPresetConfig,
      documentTransforms: [addTypenameSelectionDocumentTransform],
    },
  },
  // 'src/gql/request.ts': {
  //   plugins: ['typescript-graphql-request'],
  // },
};

export default config;

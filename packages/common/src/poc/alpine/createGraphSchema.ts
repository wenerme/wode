import { getContext } from '@wener/nestjs';
import { getEntityManager } from '@wener/nestjs/mikro-orm';
import { createSchemaBuilder, SchemaBuilderType } from '@/poc/alpine/pothos/createSchemaBuilder';
import { fetchApkIndex } from '@/poc/alpine/repo/fetchApkIndex';
import { ApkIndexEntity } from './entity/ApkIndexEntity';
import { ApkIndexService } from './service/ApkIndexService';

export function createGraphSchema() {
  const builder = createSchemaBuilder();

  builder.queryType({});
  builder.mutationType({});

  builder.queryField('hello', (t) => {
    return t.string({
      args: {
        name: t.arg.string(),
      },
      resolve: (parent, { name }) => `Hello, ${name || 'World'}`,
    });
  });

  createApkIndexSchema({ builder });

  return {
    builder,
  };
}

function createApkIndexSchema({ builder }: { builder: SchemaBuilderType }) {
  const ApkIndex = builder.loadableObject(ApkIndexEntity, {
    name: 'ApkIndex',
    description: 'Alpine Repo Index.',
    fields: (t) => ({
      // StandardBaseEntity
      id: t.exposeID('id'),
      uid: t.exposeString('uid'),
      createdAt: t.expose('createdAt', { type: 'DateTime' }),
      updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
      //
      path: t.exposeString('path'),
      branch: t.exposeString('branch'),
      repo: t.exposeString('repo'),
      arch: t.exposeString('arch'),
      description: t.exposeString('description', { nullable: true }),
      lastModifiedTime: t.expose('lastModifiedTime', { type: 'DateTime' }),
    }),
    //
    toKey: (v) => v.id,
    cacheResolved: true,
    sort: true,
    load: (ids: string[]) => {
      return getContext(ApkIndexService).find({ ids });
    },
  });

  builder.queryFields((t) => {
    return {
      findApkIndexConnection: t.connection({
        type: ApkIndexEntity,
        resolve: async (parent, args, ctx) => {
          let svc = getContext(ApkIndexService);
          const { first, last } = args;
          /*
          first?: number | null | undefined;
          last?: number | null | undefined;
          before?: string | null | undefined;
          after?: string | null | undefined;
           */
          const out = await svc.list({
            limit: first || 30,
          });
          return {
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: false,
              startCursor: 'abc',
              endCursor: 'def',
            },
            edges: out.data.map((v) => {
              return {
                node: v,
                cursor: `A${v.id}`,
              };
            }),
          };
        },
      }),
    };
  });

  builder.mutationFields((t) => {
    return {
      fetchApkIndex: t.field({
        type: ApkIndex,
        args: {
          branch: t.arg.string({ required: true }),
          arch: t.arg.string({ required: true }),
          repo: t.arg.string({ required: true }),
        },
        resolve: async (root, { branch, arch, repo }) => {
          const { found, changed } = await fetchApkIndex({
            em: getEntityManager(),
            variants: [
              {
                branches: [branch],
                architectures: [arch],
                repos: [repo],
              },
            ],
          });

          let { id } = changed[0] || found[0];
          return getContext(ApkIndexService).get({ id });
        },
      }),
    };
  });
}

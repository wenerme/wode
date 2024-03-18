import { DynamicModule, Injectable } from '@nestjs/common';
import { ModuleRef, ModulesContainer } from '@nestjs/core';
import { getContext } from '@wener/nestjs';
import { getEntityManager } from '@wener/nestjs/mikro-orm';
import { Constructor } from '@wener/utils';
import { GraphQLSchema } from 'graphql';
import { GraphQLDateTime } from 'graphql-scalars';
import {
  Args,
  ArgsType,
  buildSchema,
  ContainerType,
  Field,
  Float,
  GraphQLTimestamp,
  Mutation,
  NonEmptyArray,
  ObjectType,
  Resolver,
  ResolverData,
} from 'type-graphql';
import { ApkIndexEntity } from '@/poc/alpine/entity/ApkIndexEntity';
import { ApkIndexPkgEntity } from '@/poc/alpine/entity/ApkIndexPkgEntity';
import { AlpineArchitectures, AlpineRepos, getLatestAlpineBranch } from '@/poc/alpine/repo/const';
import { fetchApkIndex } from '@/poc/alpine/repo/fetchApkIndex';
import { BaseObject } from '@/type-graphql';
import { BaseResolverOf } from '@/type-graphql/BaseResolver';
import { PageResponseOf } from '@/type-graphql/PageResponse';

@ObjectType(`ApkIndex`)
class ApkIndexObject extends BaseObject {
  @Field(() => String)
  path!: string; // ${branch}/${repo}/${arch}

  @Field(() => String)
  branch!: string;

  @Field(() => String)
  repo!: string;

  @Field(() => String)
  arch!: string;

  @Field(() => String, { nullable: true })
  description?: string;

  @Field(() => String)
  content!: string;

  @Field(() => Date)
  lastModifiedTime!: Date;

  @Field(() => Float)
  size!: number;
}

@ObjectType(`ApkIndexPkg`)
class ApkIndexPkgObject extends BaseObject {
  @Field(() => String)
  path!: string;

  @Field(() => String)
  branch!: string;

  @Field(() => String)
  repo!: string;

  @Field(() => String)
  arch!: string;

  @Field(() => String)
  pkg!: string;

  @Field(() => String)
  version!: string;

  @Field(() => String)
  checksum!: string;

  @Field(() => String)
  description!: string;

  @Field(() => Number)
  size!: number;

  @Field(() => Number)
  installSize!: number;

  @Field(() => String)
  maintainer!: string;

  @Field(() => String)
  origin!: string;

  @Field(() => Number)
  buildTime!: number;

  @Field(() => String)
  commit!: string;

  @Field(() => String)
  license!: string;

  @Field(() => Number)
  providerPriority!: number;

  @Field(() => String)
  url!: string;

  @Field(() => [String])
  depends!: string[];

  @Field(() => [String])
  provides!: string[];

  @Field(() => [String])
  installIf!: string[];
}

@ObjectType()
class ApkIndexPageResponse extends PageResponseOf(ApkIndexObject) {}

@Injectable()
@Resolver(ApkIndexObject)
class ApkIndexResolver extends BaseResolverOf({
  ObjectType: ApkIndexObject,
  EntityType: ApkIndexEntity,
  PageResponseType: ApkIndexPageResponse,
}) {}

@ObjectType()
class FetchApkIndexResponse {
  @Field(() => Number)
  total!: number;
  @Field(() => Number)
  changed!: number;
}

@ArgsType()
class FetchApkIndexArgs {
  @Field(() => [String], { nullable: true })
  branches: string[] = [getLatestAlpineBranch()];
  @Field(() => [String], { nullable: true })
  architectures: string[] = AlpineArchitectures;
  @Field(() => [String], { nullable: true })
  repos: string[] = AlpineRepos;
}

@Injectable()
@Resolver(ApkIndexObject)
class ApkIndexPkgResolver extends BaseResolverOf({
  ObjectType: ApkIndexPkgObject,
  EntityType: ApkIndexPkgEntity,
}) {
  @Mutation(() => FetchApkIndexResponse)
  async fetchApkIndex(@Args(() => FetchApkIndexArgs) args: FetchApkIndexArgs) {
    const out = await fetchApkIndex({
      em: getEntityManager(),
      variants: [args],
    });

    return {
      total: out.stats.total,
      changed: out.stats.changed,
    } as FetchApkIndexResponse;
  }
}

/*

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
 */

export async function createTypeGraphSchema() {
  let resolvers: NonEmptyArray<Constructor> = [ApkIndexResolver, ApkIndexPkgResolver];
  let schema = await buildSchema({
    resolvers: resolvers,
    container: new NestContainer(),
    scalarsMap: [{ type: Date, scalar: GraphQLDateTime }],
  });

  return {
    schema,
    providers: resolvers,
  };
}

class TypeGraphSchemaModule {
  static forRoot(): DynamicModule {
    return {
      module: TypeGraphSchemaModule,
      providers: [
        {
          provide: GraphQLSchema,
          useFactory: () => {
            //
          },
        },
      ],
    };
  }
}

function resolverContainer({ moduleRef, container }: { moduleRef: ModuleRef; container: ModulesContainer }) {}

class NestContainer implements ContainerType {
  get(someClass: any, resolverData: ResolverData<any>): any | Promise<any> {
    let ref = getContext(ModuleRef);
    return ref.get(someClass, { strict: false });
  }
}

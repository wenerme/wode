import { Inject } from '@nestjs/common';
import { RelayMutationInput, RelayMutationPayload, runRelayClientMutation } from '@wener/nestjs/type-graphql';
import { Arg, Authorized, Field, InputType, Mutation, ObjectType, Resolver } from 'type-graphql';
import { TenantService } from '@/foundation/Tenant';
import { SystemRole } from '@/graph/const';

@ObjectType('SiteConf')
class SiteConfObject {
  @Field(() => String)
  tid!: string;
  @Field(() => String)
  title!: string;

  @Field(() => String, { nullable: true })
  serverUrl?: string;
  @Field(() => String, { nullable: true })
  baseUrl?: string;
  @Field(() => [String], { defaultValue: [] })
  features: string[] = [];

  @Field(() => Object, { defaultValue: {} })
  metadata: Record<string, any> = {};
}

@InputType()
class ResolveSiteConfInput extends RelayMutationInput {
  @Field(() => String, { nullable: true })
  tid?: string;
}

@ObjectType()
class ResolveSiteConfPayload extends RelayMutationPayload {
  @Field(() => SiteConfObject, { nullable: true })
  data?: SiteConfObject;
}

@Resolver()
export class SiteResolver {
  @Inject(TenantService) ts!: TenantService;

  @Authorized(SystemRole.Public)
  @Mutation(() => ResolveSiteConfPayload)
  resolveSiteConf(@Arg('input', () => ResolveSiteConfInput) input: ResolveSiteConfInput) {
    return runRelayClientMutation(input, async () => {
      const ent = await this.ts.resolveTenant({});
      if (!ent) {
        return {};
      }
      const { tid, fullName } = ent;
      return {
        data: {
          tid,
          title: fullName,
          features: [],
          metadata: {},
        },
      };
    });
  }
}

import { Inject, Injectable } from '@nestjs/common';
import { Contexts } from '@wener/nestjs/app';
import {
  GeneralResponseObject,
  RelayMutationInput,
  RelayMutationPayload,
  runRelayClientMutation,
} from '@wener/nestjs/type-graphql';
import { Errors } from '@wener/utils';
import { Arg, Authorized, Field, InputType, Int, Mutation, ObjectType, Resolver } from 'type-graphql';
import { AuthService } from '@/foundation/Auth/AuthService';
import { SystemRole } from '@/graph/const';

@InputType()
export class ChangePasswordInput extends RelayMutationInput {
  @Field(() => String)
  currentPassword!: string;
  @Field(() => String)
  password!: string;
  @Field(() => String)
  passwordConfirmation!: string;
}

@InputType()
export class RefreshAccessTokenInput extends RelayMutationInput {
  @Field(() => String)
  accessToken!: string;
  @Field(() => String)
  refreshToken!: string;
}

@ObjectType()
export class AccessTokenResponse {
  @Field(() => String)
  accessToken!: string;
  @Field(() => String)
  refreshToken!: string;
  @Field(() => Date)
  expiresAt!: Date;
  @Field(() => Int)
  expiresIn!: number;
}

@ObjectType()
class SignInPayload extends RelayMutationPayload {
  @Field(() => AccessTokenResponse)
  data!: AccessTokenResponse;
}

@InputType()
class SignInByPasswordInput extends RelayMutationInput {
  @Field(() => String, { nullable: true })
  tid?: string;
  @Field(() => String, { nullable: true })
  org?: string;
  @Field(() => String)
  username!: string;
  @Field(() => String)
  password!: string;
  @Field(() => Boolean, { defaultValue: false })
  remember!: boolean;
  @Field(() => String, { nullable: true })
  ticket?: string;
  @Field(() => String, { nullable: true })
  state?: string;
}

@ObjectType()
class RefreshAccessTokenPayload extends RelayMutationPayload {
  @Field(() => AccessTokenResponse)
  data!: AccessTokenResponse;
}

@InputType()
class SignOutInput extends RelayMutationInput {}

@Injectable()
@Resolver()
export class AuthResolver {
  constructor(@Inject(AuthService) private readonly as: AuthService) {}

  @Authorized(SystemRole.Public)
  @Mutation(() => SignInPayload)
  async signInByPassword(@Arg('input', () => SignInByPasswordInput) input: SignInByPasswordInput) {
    return runRelayClientMutation(input, async () => {
      const out = await this.as.login(input);
      return {
        data: {
          accessToken: out.token.accessToken,
          refreshToken: out.token.refreshToken,
          expiresIn: out.token.expiresIn,
          expiresAt: out.token.expiresAt,
        },
      };
    });
  }

  @Authorized(SystemRole.Public)
  @Mutation(() => RefreshAccessTokenPayload)
  async refreshAccessToken(@Arg('input', () => RefreshAccessTokenInput) input: RefreshAccessTokenInput) {
    return runRelayClientMutation(input, async () => {
      const { token } = await this.as.resolveAccessToken({
        accessToken: input.accessToken,
        refreshToken: input.refreshToken,
      });
      return {
        data: {
          accessToken: token.accessToken,
          refreshToken: token.refreshToken,
          expiresIn: token.expiresIn,
          expiresAt: token.expiresAt,
        },
      };
    });
  }

  @Authorized(SystemRole.Public)
  @Mutation(() => RelayMutationPayload)
  async signOut(@Arg('input', () => SignOutInput, { nullable: true }) input: SignOutInput) {
    return runRelayClientMutation(input, async () => {
      let sessionId = Contexts.sessionId.get();
      if (sessionId) {
        await this.as.logout({
          sessionId: sessionId,
        });
      }
      return {};
    });
  }

  @Authorized()
  @Mutation(() => GeneralResponseObject)
  async changePassword(@Arg('input', () => ChangePasswordInput) input: ChangePasswordInput) {
    Errors.NotImplemented.throw('changePassword');
  }
}

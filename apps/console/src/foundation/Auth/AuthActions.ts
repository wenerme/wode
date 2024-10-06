import { gqlr } from '@wener/console/client/graphql';
import {
  AccessTokenFragment,
  RefreshAccessTokenMutation,
  SignInByPasswordMutation,
  SignOutMutation,
} from '@/foundation/Auth/query';
import { getFragmentData } from '@/gql';
import type { SignInByPasswordInput } from '@/gql/graphql';

export namespace AuthActions {
  export async function refreshAccessToken({
    accessToken = '',
    refreshToken = '',
  }: {
    accessToken?: string;
    refreshToken?: string;
  }) {
    const { data: out } = await gqlr(RefreshAccessTokenMutation, {
      input: {
        accessToken,
        refreshToken,
      },
    });
    return getFragmentData(AccessTokenFragment, out.data);
  }

  export const signInByPassword = async (data: SignInByPasswordInput) => {
    const { data: out } = await gqlr(SignInByPasswordMutation, {
      input: data,
    });
    return getFragmentData(AccessTokenFragment, out.data);
  };

  export const signOut = async () => {
    await gqlr(SignOutMutation, {
      input: {},
    });
  };
}

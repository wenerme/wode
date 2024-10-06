import { graphql } from '@/gql';

export const AccessTokenFragment = graphql(`
  fragment AccessTokenFragment on AccessTokenResponse {
    accessToken
    refreshToken
    expiresIn
    expiresAt
  }
`);

export const RefreshAccessTokenMutation = graphql(`
  mutation refreshAccessToken($input: RefreshAccessTokenInput!) {
    data: refreshAccessToken(input: $input) {
      data {
        ...AccessTokenFragment
      }
    }
  }
`);

export const SignInByPasswordMutation = graphql(`
  mutation SignInByPasswordMutation($input: SignInByPasswordInput!) {
    data: signInByPassword(input: $input) {
      data {
        ...AccessTokenFragment
      }
    }
  }
`);

export const SignOutMutation = graphql(`
  mutation signOut($input: SignOutInput) {
    data: signOut(input: $input) {
      clientMutationId
    }
  }
`);

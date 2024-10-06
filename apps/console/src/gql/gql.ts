/* eslint-disable */
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
import * as types from './graphql';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
const documents = {
  '\n  fragment AccessTokenFragment on AccessTokenResponse {\n    accessToken\n    refreshToken\n    expiresIn\n    expiresAt\n  }\n':
    types.AccessTokenFragmentFragmentDoc,
  '\n  mutation refreshAccessToken($input: RefreshAccessTokenInput!) {\n    data: refreshAccessToken(input: $input) {\n      data {\n        ...AccessTokenFragment\n      }\n    }\n  }\n':
    types.RefreshAccessTokenDocument,
  '\n  mutation SignInByPasswordMutation($input: SignInByPasswordInput!) {\n    data: signInByPassword(input: $input) {\n      data {\n        ...AccessTokenFragment\n      }\n    }\n  }\n':
    types.SignInByPasswordMutationDocument,
  '\n  mutation signOut($input: SignOutInput) {\n    data: signOut(input: $input) {\n      clientMutationId\n    }\n  }\n':
    types.SignOutDocument,
  '\n  query PingQuery {\n    data: ping {\n      message\n    }\n  }\n': types.PingQueryDocument,
  '\n  mutation ResolveSiteConfMutation($input: ResolveSiteConfInput!) {\n    data: resolveSiteConf(input: $input) {\n      data {\n        tid\n        title\n        serverUrl\n        baseUrl\n        features\n        metadata\n      }\n    }\n  }\n':
    types.ResolveSiteConfMutationDocument,
  '\n  fragment CurrentUserFragment on CurrentUser {\n    id\n    fullName\n    displayName\n    photoUrl\n    loginName\n    email\n    joinDate\n    #    roles: allRoles {\n    #      id\n    #      title\n    #      code\n    #    }\n  }\n':
    types.CurrentUserFragmentFragmentDoc,
  '\n  query CurrentUserQuery {\n    data: currentUser {\n      id\n      ...CurrentUserFragment\n    }\n  }\n':
    types.CurrentUserQueryDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = graphql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function graphql(source: string): unknown;

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  fragment AccessTokenFragment on AccessTokenResponse {\n    accessToken\n    refreshToken\n    expiresIn\n    expiresAt\n  }\n',
): (typeof documents)['\n  fragment AccessTokenFragment on AccessTokenResponse {\n    accessToken\n    refreshToken\n    expiresIn\n    expiresAt\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  mutation refreshAccessToken($input: RefreshAccessTokenInput!) {\n    data: refreshAccessToken(input: $input) {\n      data {\n        ...AccessTokenFragment\n      }\n    }\n  }\n',
): (typeof documents)['\n  mutation refreshAccessToken($input: RefreshAccessTokenInput!) {\n    data: refreshAccessToken(input: $input) {\n      data {\n        ...AccessTokenFragment\n      }\n    }\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  mutation SignInByPasswordMutation($input: SignInByPasswordInput!) {\n    data: signInByPassword(input: $input) {\n      data {\n        ...AccessTokenFragment\n      }\n    }\n  }\n',
): (typeof documents)['\n  mutation SignInByPasswordMutation($input: SignInByPasswordInput!) {\n    data: signInByPassword(input: $input) {\n      data {\n        ...AccessTokenFragment\n      }\n    }\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  mutation signOut($input: SignOutInput) {\n    data: signOut(input: $input) {\n      clientMutationId\n    }\n  }\n',
): (typeof documents)['\n  mutation signOut($input: SignOutInput) {\n    data: signOut(input: $input) {\n      clientMutationId\n    }\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  query PingQuery {\n    data: ping {\n      message\n    }\n  }\n',
): (typeof documents)['\n  query PingQuery {\n    data: ping {\n      message\n    }\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  mutation ResolveSiteConfMutation($input: ResolveSiteConfInput!) {\n    data: resolveSiteConf(input: $input) {\n      data {\n        tid\n        title\n        serverUrl\n        baseUrl\n        features\n        metadata\n      }\n    }\n  }\n',
): (typeof documents)['\n  mutation ResolveSiteConfMutation($input: ResolveSiteConfInput!) {\n    data: resolveSiteConf(input: $input) {\n      data {\n        tid\n        title\n        serverUrl\n        baseUrl\n        features\n        metadata\n      }\n    }\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  fragment CurrentUserFragment on CurrentUser {\n    id\n    fullName\n    displayName\n    photoUrl\n    loginName\n    email\n    joinDate\n    #    roles: allRoles {\n    #      id\n    #      title\n    #      code\n    #    }\n  }\n',
): (typeof documents)['\n  fragment CurrentUserFragment on CurrentUser {\n    id\n    fullName\n    displayName\n    photoUrl\n    loginName\n    email\n    joinDate\n    #    roles: allRoles {\n    #      id\n    #      title\n    #      code\n    #    }\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  query CurrentUserQuery {\n    data: currentUser {\n      id\n      ...CurrentUserFragment\n    }\n  }\n',
): (typeof documents)['\n  query CurrentUserQuery {\n    data: currentUser {\n      id\n      ...CurrentUserFragment\n    }\n  }\n'];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> =
  TDocumentNode extends DocumentNode<infer TType, any> ? TType : never;

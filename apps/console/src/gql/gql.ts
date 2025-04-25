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
type Documents = {
	'\n\tfragment AccessTokenFragment on AccessTokenResponse {\n\t\taccessToken\n\t\trefreshToken\n\t\texpiresIn\n\t\texpiresAt\n\t}\n': typeof types.AccessTokenFragmentFragmentDoc;
	'\n\tmutation refreshAccessToken($input: RefreshAccessTokenInput!) {\n\t\tdata: refreshAccessToken(input: $input) {\n\t\t\tdata {\n\t\t\t\t...AccessTokenFragment\n\t\t\t}\n\t\t}\n\t}\n': typeof types.RefreshAccessTokenDocument;
	'\n\tmutation SignInByPasswordMutation($input: SignInByPasswordInput!) {\n\t\tdata: signInByPassword(input: $input) {\n\t\t\tdata {\n\t\t\t\t...AccessTokenFragment\n\t\t\t}\n\t\t}\n\t}\n': typeof types.SignInByPasswordMutationDocument;
	'\n\tmutation signOut($input: SignOutInput) {\n\t\tdata: signOut(input: $input) {\n\t\t\tclientMutationId\n\t\t}\n\t}\n': typeof types.SignOutDocument;
	'\n\tquery PingQuery {\n\t\tdata: ping {\n\t\t\tmessage\n\t\t}\n\t}\n': typeof types.PingQueryDocument;
	'\n\tmutation ResolveSiteConfMutation($input: ResolveSiteConfInput!) {\n\t\tdata: resolveSiteConf(input: $input) {\n\t\t\tdata {\n\t\t\t\ttid\n\t\t\t\ttitle\n\t\t\t\tserverUrl\n\t\t\t\tbaseUrl\n\t\t\t\tfeatures\n\t\t\t\tmetadata\n\t\t\t}\n\t\t}\n\t}\n': typeof types.ResolveSiteConfMutationDocument;
	'\n\tfragment CurrentUserFragment on CurrentUser {\n\t\tid\n\t\tfullName\n\t\tdisplayName\n\t\tphotoUrl\n\t\tloginName\n\t\temail\n\t\tjoinDate\n\t\t#    roles: allRoles {\n\t\t#      id\n\t\t#      title\n\t\t#      code\n\t\t#    }\n\t}\n': typeof types.CurrentUserFragmentFragmentDoc;
	'\n\tquery CurrentUserQuery {\n\t\tdata: currentUser {\n\t\t\tid\n\t\t\t...CurrentUserFragment\n\t\t}\n\t}\n': typeof types.CurrentUserQueryDocument;
};
const documents: Documents = {
	'\n\tfragment AccessTokenFragment on AccessTokenResponse {\n\t\taccessToken\n\t\trefreshToken\n\t\texpiresIn\n\t\texpiresAt\n\t}\n':
		types.AccessTokenFragmentFragmentDoc,
	'\n\tmutation refreshAccessToken($input: RefreshAccessTokenInput!) {\n\t\tdata: refreshAccessToken(input: $input) {\n\t\t\tdata {\n\t\t\t\t...AccessTokenFragment\n\t\t\t}\n\t\t}\n\t}\n':
		types.RefreshAccessTokenDocument,
	'\n\tmutation SignInByPasswordMutation($input: SignInByPasswordInput!) {\n\t\tdata: signInByPassword(input: $input) {\n\t\t\tdata {\n\t\t\t\t...AccessTokenFragment\n\t\t\t}\n\t\t}\n\t}\n':
		types.SignInByPasswordMutationDocument,
	'\n\tmutation signOut($input: SignOutInput) {\n\t\tdata: signOut(input: $input) {\n\t\t\tclientMutationId\n\t\t}\n\t}\n':
		types.SignOutDocument,
	'\n\tquery PingQuery {\n\t\tdata: ping {\n\t\t\tmessage\n\t\t}\n\t}\n': types.PingQueryDocument,
	'\n\tmutation ResolveSiteConfMutation($input: ResolveSiteConfInput!) {\n\t\tdata: resolveSiteConf(input: $input) {\n\t\t\tdata {\n\t\t\t\ttid\n\t\t\t\ttitle\n\t\t\t\tserverUrl\n\t\t\t\tbaseUrl\n\t\t\t\tfeatures\n\t\t\t\tmetadata\n\t\t\t}\n\t\t}\n\t}\n':
		types.ResolveSiteConfMutationDocument,
	'\n\tfragment CurrentUserFragment on CurrentUser {\n\t\tid\n\t\tfullName\n\t\tdisplayName\n\t\tphotoUrl\n\t\tloginName\n\t\temail\n\t\tjoinDate\n\t\t#    roles: allRoles {\n\t\t#      id\n\t\t#      title\n\t\t#      code\n\t\t#    }\n\t}\n':
		types.CurrentUserFragmentFragmentDoc,
	'\n\tquery CurrentUserQuery {\n\t\tdata: currentUser {\n\t\t\tid\n\t\t\t...CurrentUserFragment\n\t\t}\n\t}\n':
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
	source: '\n\tfragment AccessTokenFragment on AccessTokenResponse {\n\t\taccessToken\n\t\trefreshToken\n\t\texpiresIn\n\t\texpiresAt\n\t}\n',
): (typeof documents)['\n\tfragment AccessTokenFragment on AccessTokenResponse {\n\t\taccessToken\n\t\trefreshToken\n\t\texpiresIn\n\t\texpiresAt\n\t}\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
	source: '\n\tmutation refreshAccessToken($input: RefreshAccessTokenInput!) {\n\t\tdata: refreshAccessToken(input: $input) {\n\t\t\tdata {\n\t\t\t\t...AccessTokenFragment\n\t\t\t}\n\t\t}\n\t}\n',
): (typeof documents)['\n\tmutation refreshAccessToken($input: RefreshAccessTokenInput!) {\n\t\tdata: refreshAccessToken(input: $input) {\n\t\t\tdata {\n\t\t\t\t...AccessTokenFragment\n\t\t\t}\n\t\t}\n\t}\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
	source: '\n\tmutation SignInByPasswordMutation($input: SignInByPasswordInput!) {\n\t\tdata: signInByPassword(input: $input) {\n\t\t\tdata {\n\t\t\t\t...AccessTokenFragment\n\t\t\t}\n\t\t}\n\t}\n',
): (typeof documents)['\n\tmutation SignInByPasswordMutation($input: SignInByPasswordInput!) {\n\t\tdata: signInByPassword(input: $input) {\n\t\t\tdata {\n\t\t\t\t...AccessTokenFragment\n\t\t\t}\n\t\t}\n\t}\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
	source: '\n\tmutation signOut($input: SignOutInput) {\n\t\tdata: signOut(input: $input) {\n\t\t\tclientMutationId\n\t\t}\n\t}\n',
): (typeof documents)['\n\tmutation signOut($input: SignOutInput) {\n\t\tdata: signOut(input: $input) {\n\t\t\tclientMutationId\n\t\t}\n\t}\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
	source: '\n\tquery PingQuery {\n\t\tdata: ping {\n\t\t\tmessage\n\t\t}\n\t}\n',
): (typeof documents)['\n\tquery PingQuery {\n\t\tdata: ping {\n\t\t\tmessage\n\t\t}\n\t}\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
	source: '\n\tmutation ResolveSiteConfMutation($input: ResolveSiteConfInput!) {\n\t\tdata: resolveSiteConf(input: $input) {\n\t\t\tdata {\n\t\t\t\ttid\n\t\t\t\ttitle\n\t\t\t\tserverUrl\n\t\t\t\tbaseUrl\n\t\t\t\tfeatures\n\t\t\t\tmetadata\n\t\t\t}\n\t\t}\n\t}\n',
): (typeof documents)['\n\tmutation ResolveSiteConfMutation($input: ResolveSiteConfInput!) {\n\t\tdata: resolveSiteConf(input: $input) {\n\t\t\tdata {\n\t\t\t\ttid\n\t\t\t\ttitle\n\t\t\t\tserverUrl\n\t\t\t\tbaseUrl\n\t\t\t\tfeatures\n\t\t\t\tmetadata\n\t\t\t}\n\t\t}\n\t}\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
	source: '\n\tfragment CurrentUserFragment on CurrentUser {\n\t\tid\n\t\tfullName\n\t\tdisplayName\n\t\tphotoUrl\n\t\tloginName\n\t\temail\n\t\tjoinDate\n\t\t#    roles: allRoles {\n\t\t#      id\n\t\t#      title\n\t\t#      code\n\t\t#    }\n\t}\n',
): (typeof documents)['\n\tfragment CurrentUserFragment on CurrentUser {\n\t\tid\n\t\tfullName\n\t\tdisplayName\n\t\tphotoUrl\n\t\tloginName\n\t\temail\n\t\tjoinDate\n\t\t#    roles: allRoles {\n\t\t#      id\n\t\t#      title\n\t\t#      code\n\t\t#    }\n\t}\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
	source: '\n\tquery CurrentUserQuery {\n\t\tdata: currentUser {\n\t\t\tid\n\t\t\t...CurrentUserFragment\n\t\t}\n\t}\n',
): (typeof documents)['\n\tquery CurrentUserQuery {\n\t\tdata: currentUser {\n\t\t\tid\n\t\t\t...CurrentUserFragment\n\t\t}\n\t}\n'];

export function graphql(source: string) {
	return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> =
	TDocumentNode extends DocumentNode<infer TType, any> ? TType : never;

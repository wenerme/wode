/* eslint-disable */
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
	ID: { input: string; output: string };
	String: { input: string; output: string };
	Boolean: { input: boolean; output: boolean };
	Int: { input: number; output: number };
	Float: { input: number; output: number };
	/** A date-time string at UTC, such as 2007-12-03T10:15:30Z, compliant with the `date-time` format outlined in section 5.6 of the RFC 3339 profile of the ISO 8601 standard for representation of dates and times using the Gregorian calendar. */
	DateTime: { input: any; output: any };
	/** The `JSON` scalar type represents JSON values as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
	JSON: { input: any; output: any };
	/** The `JSONObject` scalar type represents JSON objects as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
	JSONObject: { input: any; output: any };
};

export type AccessTokenResponse = {
	__typename?: 'AccessTokenResponse';
	accessToken: Scalars['String']['output'];
	expiresAt: Scalars['DateTime']['output'];
	expiresIn: Scalars['Int']['output'];
	refreshToken: Scalars['String']['output'];
};

/** 为资源分配负责人 */
export type AssignOwnerInput = {
	clientMutationId?: InputMaybe<Scalars['String']['input']>;
	id?: InputMaybe<Scalars['ID']['input']>;
	ownerId: Scalars['String']['input'];
	ownerType?: InputMaybe<Scalars['String']['input']>;
};

export type BaseNode = {
	attributes?: Maybe<Scalars['JSON']['output']>;
	createdAt: Scalars['DateTime']['output'];
	deletedAt?: Maybe<Scalars['DateTime']['output']>;
	eid?: Maybe<Scalars['String']['output']>;
	id: Scalars['ID']['output'];
	properties?: Maybe<Scalars['JSON']['output']>;
	uid: Scalars['String']['output'];
	updatedAt: Scalars['DateTime']['output'];
};

/** 为实体绑定用户 */
export type BindCustomerInput = {
	clientMutationId?: InputMaybe<Scalars['String']['input']>;
	customerId: Scalars['ID']['input'];
	id?: InputMaybe<Scalars['ID']['input']>;
};

/** 为资源绑定实体/entityId */
export type BindEntityInput = {
	clientMutationId?: InputMaybe<Scalars['String']['input']>;
	entityId: Scalars['ID']['input'];
	id?: InputMaybe<Scalars['ID']['input']>;
};

/** 为实体绑定用户 */
export type BindUserInput = {
	clientMutationId?: InputMaybe<Scalars['String']['input']>;
	id?: InputMaybe<Scalars['ID']['input']>;
	userId: Scalars['ID']['input'];
};

export type ChangePasswordInput = {
	clientMutationId?: InputMaybe<Scalars['String']['input']>;
	currentPassword: Scalars['String']['input'];
	password: Scalars['String']['input'];
	passwordConfirmation: Scalars['String']['input'];
};

/** 认领资源 */
export type ClaimOwnerInput = {
	clientMutationId?: InputMaybe<Scalars['String']['input']>;
	id?: InputMaybe<Scalars['ID']['input']>;
};

export type CurrentUser = BaseNode &
	HasRole &
	Node &
	OwnerNode & {
		__typename?: 'CurrentUser';
		attributes?: Maybe<Scalars['JSON']['output']>;
		birthDate?: Maybe<Scalars['DateTime']['output']>;
		createdAt: Scalars['DateTime']['output'];
		deletedAt?: Maybe<Scalars['DateTime']['output']>;
		displayName?: Maybe<Scalars['String']['output']>;
		eid?: Maybe<Scalars['String']['output']>;
		email?: Maybe<Scalars['String']['output']>;
		fullName: Scalars['String']['output'];
		homePhone?: Maybe<Scalars['String']['output']>;
		id: Scalars['ID']['output'];
		jobNumber?: Maybe<Scalars['String']['output']>;
		jobTitle?: Maybe<Scalars['String']['output']>;
		joinDate?: Maybe<Scalars['DateTime']['output']>;
		loginName?: Maybe<Scalars['String']['output']>;
		mobilePhone?: Maybe<Scalars['String']['output']>;
		photoUrl?: Maybe<Scalars['String']['output']>;
		properties?: Maybe<Scalars['JSON']['output']>;
		uid: Scalars['String']['output'];
		updatedAt: Scalars['DateTime']['output'];
	};

export type CurrentUserAttributesArgs = {
	default?: InputMaybe<Scalars['JSON']['input']>;
	path?: InputMaybe<Scalars['String']['input']>;
};

export type CurrentUserPropertiesArgs = {
	default?: InputMaybe<Scalars['JSON']['input']>;
	path?: InputMaybe<Scalars['String']['input']>;
};

export type DeleteResourceInput = {
	clientMutationId?: InputMaybe<Scalars['String']['input']>;
	id?: InputMaybe<Scalars['ID']['input']>;
};

export type DeleteResourcePayload = {
	__typename?: 'DeleteResourcePayload';
	clientMutationId?: Maybe<Scalars['String']['output']>;
	data?: Maybe<Node>;
};

export type GeneralResponse = {
	__typename?: 'GeneralResponse';
	clientMutationId?: Maybe<Scalars['String']['output']>;
	data?: Maybe<Scalars['JSON']['output']>;
	message: Scalars['String']['output'];
};

export type GeneralResponseDataArgs = {
	default?: InputMaybe<Scalars['JSON']['input']>;
	path?: InputMaybe<Scalars['String']['input']>;
};

export type HasCustomerNode = {
	accountId?: Maybe<Scalars['String']['output']>;
	attributes?: Maybe<Scalars['JSON']['output']>;
	contactId?: Maybe<Scalars['String']['output']>;
	createdAt: Scalars['DateTime']['output'];
	customerId?: Maybe<Scalars['String']['output']>;
	customerType?: Maybe<Scalars['String']['output']>;
	deletedAt?: Maybe<Scalars['DateTime']['output']>;
	eid?: Maybe<Scalars['String']['output']>;
	id: Scalars['ID']['output'];
	properties?: Maybe<Scalars['JSON']['output']>;
	uid: Scalars['String']['output'];
	updatedAt: Scalars['DateTime']['output'];
};

export type HasCustomerNodePayload = {
	__typename?: 'HasCustomerNodePayload';
	clientMutationId?: Maybe<Scalars['String']['output']>;
	data: HasCustomerNode;
};

export type HasOwnerNodePayload = {
	__typename?: 'HasOwnerNodePayload';
	clientMutationId?: Maybe<Scalars['String']['output']>;
	data: HasOwnerRefNode;
};

export type HasOwnerRefNode = {
	attributes?: Maybe<Scalars['JSON']['output']>;
	createdAt: Scalars['DateTime']['output'];
	deletedAt?: Maybe<Scalars['DateTime']['output']>;
	eid?: Maybe<Scalars['String']['output']>;
	id: Scalars['ID']['output'];
	ownerId?: Maybe<Scalars['ID']['output']>;
	ownerType?: Maybe<Scalars['String']['output']>;
	ownerUserId?: Maybe<Scalars['ID']['output']>;
	properties?: Maybe<Scalars['JSON']['output']>;
	uid: Scalars['String']['output'];
	updatedAt: Scalars['DateTime']['output'];
};

export type HasRole = {
	id: Scalars['ID']['output'];
};

export type HasStateStatusNode = {
	attributes?: Maybe<Scalars['JSON']['output']>;
	createdAt: Scalars['DateTime']['output'];
	deletedAt?: Maybe<Scalars['DateTime']['output']>;
	eid?: Maybe<Scalars['String']['output']>;
	id: Scalars['ID']['output'];
	properties?: Maybe<Scalars['JSON']['output']>;
	state: Scalars['String']['output'];
	status: Scalars['String']['output'];
	uid: Scalars['String']['output'];
	updatedAt: Scalars['DateTime']['output'];
};

export type HasUserNode = {
	attributes?: Maybe<Scalars['JSON']['output']>;
	createdAt: Scalars['DateTime']['output'];
	createdBy?: Maybe<User>;
	createdById?: Maybe<Scalars['ID']['output']>;
	deletedAt?: Maybe<Scalars['DateTime']['output']>;
	deletedBy?: Maybe<User>;
	deletedById?: Maybe<Scalars['ID']['output']>;
	eid?: Maybe<Scalars['String']['output']>;
	id: Scalars['ID']['output'];
	owner?: Maybe<OwnerNode>;
	ownerId?: Maybe<Scalars['ID']['output']>;
	ownerType?: Maybe<Scalars['String']['output']>;
	ownerUserId?: Maybe<Scalars['ID']['output']>;
	properties?: Maybe<Scalars['JSON']['output']>;
	state: Scalars['String']['output'];
	status: Scalars['String']['output'];
	uid: Scalars['String']['output'];
	updatedAt: Scalars['DateTime']['output'];
	updatedBy?: Maybe<User>;
	updatedById?: Maybe<Scalars['ID']['output']>;
	userId?: Maybe<Scalars['ID']['output']>;
};

export type HasUserNodePayload = {
	__typename?: 'HasUserNodePayload';
	clientMutationId?: Maybe<Scalars['String']['output']>;
	data: HasUserNode;
};

export type ListQueryInput = {
	/** 游标 */
	cursor?: InputMaybe<Scalars['String']['input']>;
	/** 是否包含已删除 */
	deleted?: InputMaybe<Scalars['Boolean']['input']>;
	/** 筛选 */
	filter?: InputMaybe<Scalars['String']['input']>;
	/** 筛选 */
	filters?: InputMaybe<Array<Scalars['String']['input']>>;
	/** Filter by ids */
	ids?: InputMaybe<Array<Scalars['String']['input']>>;
	/** 每页大小 */
	limit?: InputMaybe<Scalars['Int']['input']>;
	/** 偏移量 */
	offset?: InputMaybe<Scalars['Int']['input']>;
	/** 顺序 */
	order?: InputMaybe<Array<Scalars['String']['input']>>;
	/** 页码 - 0 开始 */
	pageIndex?: InputMaybe<Scalars['Int']['input']>;
	/** 页号 - 1 开始 */
	pageNumber?: InputMaybe<Scalars['Int']['input']>;
	/** 每页大小 */
	pageSize?: InputMaybe<Scalars['Int']['input']>;
	/** 搜索 */
	search?: InputMaybe<Scalars['String']['input']>;
};

export type Mutation = {
	__typename?: 'Mutation';
	assignOwner: HasOwnerNodePayload;
	bindCustomer: HasCustomerNodePayload;
	bindEntity: HasOwnerNodePayload;
	bindUser: HasUserNodePayload;
	changePassword: GeneralResponse;
	claimOwner: HasOwnerNodePayload;
	deleteResource: DeleteResourcePayload;
	purgeResource: DeleteResourcePayload;
	refreshAccessToken: RefreshAccessTokenPayload;
	releaseOwner: HasOwnerNodePayload;
	resolveSiteConf: ResolveSiteConfPayload;
	runSystemMaintenance: GeneralResponse;
	setResourceNotes: MutationNodePayload;
	setResourceStatus: SetResourceStatusPayload;
	signInByPassword: SignInPayload;
	signOut: RelayMutationPayload;
	unbindCustomer: HasCustomerNodePayload;
	unbindEntity: HasOwnerNodePayload;
	unbindUser: HasUserNodePayload;
	undeleteResource: RelayMutationPayload;
};

export type MutationAssignOwnerArgs = {
	input: AssignOwnerInput;
};

export type MutationBindCustomerArgs = {
	input: BindCustomerInput;
};

export type MutationBindEntityArgs = {
	input: BindEntityInput;
};

export type MutationBindUserArgs = {
	input: BindUserInput;
};

export type MutationChangePasswordArgs = {
	input: ChangePasswordInput;
};

export type MutationClaimOwnerArgs = {
	input: ClaimOwnerInput;
};

export type MutationDeleteResourceArgs = {
	input: DeleteResourceInput;
};

export type MutationPurgeResourceArgs = {
	input: DeleteResourceInput;
};

export type MutationRefreshAccessTokenArgs = {
	input: RefreshAccessTokenInput;
};

export type MutationReleaseOwnerArgs = {
	input: ReleaseOwnerInput;
};

export type MutationResolveSiteConfArgs = {
	input: ResolveSiteConfInput;
};

export type MutationRunSystemMaintenanceArgs = {
	input: RelayMutationInput;
};

export type MutationSetResourceNotesArgs = {
	input: SetResourceNotesInput;
};

export type MutationSetResourceStatusArgs = {
	input: SetResourceStatusInput;
};

export type MutationSignInByPasswordArgs = {
	input: SignInByPasswordInput;
};

export type MutationSignOutArgs = {
	input?: InputMaybe<SignOutInput>;
};

export type MutationUnbindCustomerArgs = {
	input: UnbindCustomerInput;
};

export type MutationUnbindEntityArgs = {
	input: UnbindEntityInput;
};

export type MutationUnbindUserArgs = {
	input: UnbindUserInput;
};

export type MutationUndeleteResourceArgs = {
	input: DeleteResourceInput;
};

export type MutationNodePayload = {
	__typename?: 'MutationNodePayload';
	clientMutationId?: Maybe<Scalars['String']['output']>;
	data: Node;
};

/** An object with a global ID. */
export type Node = {
	id: Scalars['ID']['output'];
};

export type OwnerNode = {
	attributes?: Maybe<Scalars['JSON']['output']>;
	createdAt: Scalars['DateTime']['output'];
	deletedAt?: Maybe<Scalars['DateTime']['output']>;
	eid?: Maybe<Scalars['String']['output']>;
	id: Scalars['ID']['output'];
	properties?: Maybe<Scalars['JSON']['output']>;
	uid: Scalars['String']['output'];
	updatedAt: Scalars['DateTime']['output'];
};

export type Query = {
	__typename?: 'Query';
	currentUser: CurrentUser;
	findUser: UserListPayload;
	getUser: User;
	node: Node;
	ping: GeneralResponse;
	resolveResource?: Maybe<Node>;
};

export type QueryFindUserArgs = {
	query?: InputMaybe<ListQueryInput>;
};

export type QueryGetUserArgs = {
	id?: InputMaybe<Scalars['ID']['input']>;
};

export type QueryNodeArgs = {
	id: Scalars['ID']['input'];
};

export type QueryResolveResourceArgs = {
	query: ResolveResourceQueryInput;
};

export type RefreshAccessTokenInput = {
	accessToken: Scalars['String']['input'];
	clientMutationId?: InputMaybe<Scalars['String']['input']>;
	refreshToken: Scalars['String']['input'];
};

export type RefreshAccessTokenPayload = {
	__typename?: 'RefreshAccessTokenPayload';
	clientMutationId?: Maybe<Scalars['String']['output']>;
	data: AccessTokenResponse;
};

export type RelayMutationInput = {
	clientMutationId?: InputMaybe<Scalars['String']['input']>;
};

export type RelayMutationPayload = {
	__typename?: 'RelayMutationPayload';
	clientMutationId?: Maybe<Scalars['String']['output']>;
};

/** 释放资源负责人 */
export type ReleaseOwnerInput = {
	clientMutationId?: InputMaybe<Scalars['String']['input']>;
	id?: InputMaybe<Scalars['ID']['input']>;
};

export type ResolveResourceQueryInput = {
	cid?: InputMaybe<Scalars['String']['input']>;
	deleted?: InputMaybe<Scalars['Boolean']['input']>;
	eid?: InputMaybe<Scalars['String']['input']>;
	id?: InputMaybe<Scalars['ID']['input']>;
	rid?: InputMaybe<Scalars['String']['input']>;
	sid?: InputMaybe<Scalars['Float']['input']>;
	uid?: InputMaybe<Scalars['String']['input']>;
};

export type ResolveSiteConfInput = {
	clientMutationId?: InputMaybe<Scalars['String']['input']>;
	tid?: InputMaybe<Scalars['String']['input']>;
};

export type ResolveSiteConfPayload = {
	__typename?: 'ResolveSiteConfPayload';
	clientMutationId?: Maybe<Scalars['String']['output']>;
	data?: Maybe<SiteConf>;
};

export type ResourceNode = {
	attributes?: Maybe<Scalars['JSON']['output']>;
	createdAt: Scalars['DateTime']['output'];
	createdBy?: Maybe<User>;
	createdById?: Maybe<Scalars['ID']['output']>;
	deletedAt?: Maybe<Scalars['DateTime']['output']>;
	deletedBy?: Maybe<User>;
	deletedById?: Maybe<Scalars['ID']['output']>;
	eid?: Maybe<Scalars['String']['output']>;
	id: Scalars['ID']['output'];
	owner?: Maybe<OwnerNode>;
	ownerId?: Maybe<Scalars['ID']['output']>;
	ownerType?: Maybe<Scalars['String']['output']>;
	ownerUserId?: Maybe<Scalars['ID']['output']>;
	properties?: Maybe<Scalars['JSON']['output']>;
	state: Scalars['String']['output'];
	status: Scalars['String']['output'];
	uid: Scalars['String']['output'];
	updatedAt: Scalars['DateTime']['output'];
	updatedBy?: Maybe<User>;
	updatedById?: Maybe<Scalars['ID']['output']>;
};

export type SetResourceNotesInput = {
	clientMutationId?: InputMaybe<Scalars['String']['input']>;
	id?: InputMaybe<Scalars['ID']['input']>;
	notes: Scalars['String']['input'];
};

export type SetResourceStatusInput = {
	clientMutationId?: InputMaybe<Scalars['String']['input']>;
	comment?: InputMaybe<Scalars['String']['input']>;
	id?: InputMaybe<Scalars['ID']['input']>;
	status: Scalars['String']['input'];
};

export type SetResourceStatusPayload = {
	__typename?: 'SetResourceStatusPayload';
	clientMutationId?: Maybe<Scalars['String']['output']>;
	data: HasStateStatusNode;
};

export type SignInByPasswordInput = {
	clientMutationId?: InputMaybe<Scalars['String']['input']>;
	org?: InputMaybe<Scalars['String']['input']>;
	password: Scalars['String']['input'];
	remember?: Scalars['Boolean']['input'];
	state?: InputMaybe<Scalars['String']['input']>;
	ticket?: InputMaybe<Scalars['String']['input']>;
	tid?: InputMaybe<Scalars['String']['input']>;
	username: Scalars['String']['input'];
};

export type SignInPayload = {
	__typename?: 'SignInPayload';
	clientMutationId?: Maybe<Scalars['String']['output']>;
	data: AccessTokenResponse;
};

export type SignOutInput = {
	clientMutationId?: InputMaybe<Scalars['String']['input']>;
};

export type SiteConf = {
	__typename?: 'SiteConf';
	baseUrl?: Maybe<Scalars['String']['output']>;
	features: Array<Scalars['String']['output']>;
	metadata: Scalars['JSONObject']['output'];
	serverUrl?: Maybe<Scalars['String']['output']>;
	tid: Scalars['String']['output'];
	title: Scalars['String']['output'];
};

export type Subscription = {
	__typename?: 'Subscription';
	watchResource: Node;
};

export type SubscriptionWatchResourceArgs = {
	input: WatchResourceInput;
};

export type UnbindCustomerInput = {
	clientMutationId?: InputMaybe<Scalars['String']['input']>;
	id?: InputMaybe<Scalars['ID']['input']>;
};

export type UnbindEntityInput = {
	clientMutationId?: InputMaybe<Scalars['String']['input']>;
	entityId?: InputMaybe<Scalars['ID']['input']>;
	id?: InputMaybe<Scalars['ID']['input']>;
};

export type UnbindUserInput = {
	clientMutationId?: InputMaybe<Scalars['String']['input']>;
	id?: InputMaybe<Scalars['ID']['input']>;
	userId?: InputMaybe<Scalars['ID']['input']>;
};

export type User = BaseNode &
	HasRole &
	Node &
	OwnerNode & {
		__typename?: 'User';
		attributes?: Maybe<Scalars['JSON']['output']>;
		birthDate?: Maybe<Scalars['DateTime']['output']>;
		createdAt: Scalars['DateTime']['output'];
		deletedAt?: Maybe<Scalars['DateTime']['output']>;
		displayName?: Maybe<Scalars['String']['output']>;
		eid?: Maybe<Scalars['String']['output']>;
		email?: Maybe<Scalars['String']['output']>;
		fullName: Scalars['String']['output'];
		homePhone?: Maybe<Scalars['String']['output']>;
		id: Scalars['ID']['output'];
		jobNumber?: Maybe<Scalars['String']['output']>;
		jobTitle?: Maybe<Scalars['String']['output']>;
		joinDate?: Maybe<Scalars['DateTime']['output']>;
		loginName?: Maybe<Scalars['String']['output']>;
		mobilePhone?: Maybe<Scalars['String']['output']>;
		photoUrl?: Maybe<Scalars['String']['output']>;
		properties?: Maybe<Scalars['JSON']['output']>;
		uid: Scalars['String']['output'];
		updatedAt: Scalars['DateTime']['output'];
	};

export type UserAttributesArgs = {
	default?: InputMaybe<Scalars['JSON']['input']>;
	path?: InputMaybe<Scalars['String']['input']>;
};

export type UserPropertiesArgs = {
	default?: InputMaybe<Scalars['JSON']['input']>;
	path?: InputMaybe<Scalars['String']['input']>;
};

export type UserListPayload = {
	__typename?: 'UserListPayload';
	data: Array<User>;
	total: Scalars['Int']['output'];
};

export type WatchResourceInput = {
	id: Scalars['ID']['input'];
};

export type AccessTokenFragmentFragment = {
	__typename: 'AccessTokenResponse';
	accessToken: string;
	refreshToken: string;
	expiresIn: number;
	expiresAt: any;
} & { ' $fragmentName'?: 'AccessTokenFragmentFragment' };

export type RefreshAccessTokenMutationVariables = Exact<{
	input: RefreshAccessTokenInput;
}>;

export type RefreshAccessTokenMutation = {
	__typename: 'Mutation';
	data: {
		__typename: 'RefreshAccessTokenPayload';
		data: { __typename: 'AccessTokenResponse' } & {
			' $fragmentRefs'?: { AccessTokenFragmentFragment: AccessTokenFragmentFragment };
		};
	};
};

export type SignInByPasswordMutationMutationVariables = Exact<{
	input: SignInByPasswordInput;
}>;

export type SignInByPasswordMutationMutation = {
	__typename: 'Mutation';
	data: {
		__typename: 'SignInPayload';
		data: { __typename: 'AccessTokenResponse' } & {
			' $fragmentRefs'?: { AccessTokenFragmentFragment: AccessTokenFragmentFragment };
		};
	};
};

export type SignOutMutationVariables = Exact<{
	input?: InputMaybe<SignOutInput>;
}>;

export type SignOutMutation = {
	__typename: 'Mutation';
	data: { __typename: 'RelayMutationPayload'; clientMutationId?: string | null };
};

export type PingQueryQueryVariables = Exact<{ [key: string]: never }>;

export type PingQueryQuery = { __typename: 'Query'; data: { __typename: 'GeneralResponse'; message: string } };

export type ResolveSiteConfMutationMutationVariables = Exact<{
	input: ResolveSiteConfInput;
}>;

export type ResolveSiteConfMutationMutation = {
	__typename: 'Mutation';
	data: {
		__typename: 'ResolveSiteConfPayload';
		data?: {
			__typename: 'SiteConf';
			tid: string;
			title: string;
			serverUrl?: string | null;
			baseUrl?: string | null;
			features: Array<string>;
			metadata: any;
		} | null;
	};
};

export type CurrentUserFragmentFragment = {
	__typename: 'CurrentUser';
	id: string;
	fullName: string;
	displayName?: string | null;
	photoUrl?: string | null;
	loginName?: string | null;
	email?: string | null;
	joinDate?: any | null;
} & { ' $fragmentName'?: 'CurrentUserFragmentFragment' };

export type CurrentUserQueryQueryVariables = Exact<{ [key: string]: never }>;

export type CurrentUserQueryQuery = {
	__typename: 'Query';
	data: { __typename: 'CurrentUser'; id: string } & {
		' $fragmentRefs'?: { CurrentUserFragmentFragment: CurrentUserFragmentFragment };
	};
};

export const AccessTokenFragmentFragmentDoc = {
	kind: 'Document',
	definitions: [
		{
			kind: 'FragmentDefinition',
			name: { kind: 'Name', value: 'AccessTokenFragment' },
			typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'AccessTokenResponse' } },
			selectionSet: {
				kind: 'SelectionSet',
				selections: [
					{ kind: 'Field', name: { kind: 'Name', value: '__typename' } },
					{ kind: 'Field', name: { kind: 'Name', value: 'accessToken' } },
					{ kind: 'Field', name: { kind: 'Name', value: 'refreshToken' } },
					{ kind: 'Field', name: { kind: 'Name', value: 'expiresIn' } },
					{ kind: 'Field', name: { kind: 'Name', value: 'expiresAt' } },
				],
			},
		},
	],
} as unknown as DocumentNode<AccessTokenFragmentFragment, unknown>;
export const CurrentUserFragmentFragmentDoc = {
	kind: 'Document',
	definitions: [
		{
			kind: 'FragmentDefinition',
			name: { kind: 'Name', value: 'CurrentUserFragment' },
			typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'CurrentUser' } },
			selectionSet: {
				kind: 'SelectionSet',
				selections: [
					{ kind: 'Field', name: { kind: 'Name', value: '__typename' } },
					{ kind: 'Field', name: { kind: 'Name', value: 'id' } },
					{ kind: 'Field', name: { kind: 'Name', value: 'fullName' } },
					{ kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
					{ kind: 'Field', name: { kind: 'Name', value: 'photoUrl' } },
					{ kind: 'Field', name: { kind: 'Name', value: 'loginName' } },
					{ kind: 'Field', name: { kind: 'Name', value: 'email' } },
					{ kind: 'Field', name: { kind: 'Name', value: 'joinDate' } },
				],
			},
		},
	],
} as unknown as DocumentNode<CurrentUserFragmentFragment, unknown>;
export const RefreshAccessTokenDocument = {
	__meta__: { hash: '7b14183e61851378096c226ed335714bca24a767' },
	kind: 'Document',
	definitions: [
		{
			kind: 'OperationDefinition',
			operation: 'mutation',
			name: { kind: 'Name', value: 'refreshAccessToken' },
			variableDefinitions: [
				{
					kind: 'VariableDefinition',
					variable: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
					type: {
						kind: 'NonNullType',
						type: { kind: 'NamedType', name: { kind: 'Name', value: 'RefreshAccessTokenInput' } },
					},
				},
			],
			selectionSet: {
				kind: 'SelectionSet',
				selections: [
					{ kind: 'Field', name: { kind: 'Name', value: '__typename' } },
					{
						kind: 'Field',
						alias: { kind: 'Name', value: 'data' },
						name: { kind: 'Name', value: 'refreshAccessToken' },
						arguments: [
							{
								kind: 'Argument',
								name: { kind: 'Name', value: 'input' },
								value: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
							},
						],
						selectionSet: {
							kind: 'SelectionSet',
							selections: [
								{ kind: 'Field', name: { kind: 'Name', value: '__typename' } },
								{
									kind: 'Field',
									name: { kind: 'Name', value: 'data' },
									selectionSet: {
										kind: 'SelectionSet',
										selections: [
											{ kind: 'Field', name: { kind: 'Name', value: '__typename' } },
											{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'AccessTokenFragment' } },
										],
									},
								},
							],
						},
					},
				],
			},
		},
		{
			kind: 'FragmentDefinition',
			name: { kind: 'Name', value: 'AccessTokenFragment' },
			typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'AccessTokenResponse' } },
			selectionSet: {
				kind: 'SelectionSet',
				selections: [
					{ kind: 'Field', name: { kind: 'Name', value: '__typename' } },
					{ kind: 'Field', name: { kind: 'Name', value: 'accessToken' } },
					{ kind: 'Field', name: { kind: 'Name', value: 'refreshToken' } },
					{ kind: 'Field', name: { kind: 'Name', value: 'expiresIn' } },
					{ kind: 'Field', name: { kind: 'Name', value: 'expiresAt' } },
				],
			},
		},
	],
} as unknown as DocumentNode<RefreshAccessTokenMutation, RefreshAccessTokenMutationVariables>;
export const SignInByPasswordMutationDocument = {
	__meta__: { hash: '6f271077e8e54835056c94dea5aa5f1b6be3e045' },
	kind: 'Document',
	definitions: [
		{
			kind: 'OperationDefinition',
			operation: 'mutation',
			name: { kind: 'Name', value: 'SignInByPasswordMutation' },
			variableDefinitions: [
				{
					kind: 'VariableDefinition',
					variable: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
					type: {
						kind: 'NonNullType',
						type: { kind: 'NamedType', name: { kind: 'Name', value: 'SignInByPasswordInput' } },
					},
				},
			],
			selectionSet: {
				kind: 'SelectionSet',
				selections: [
					{ kind: 'Field', name: { kind: 'Name', value: '__typename' } },
					{
						kind: 'Field',
						alias: { kind: 'Name', value: 'data' },
						name: { kind: 'Name', value: 'signInByPassword' },
						arguments: [
							{
								kind: 'Argument',
								name: { kind: 'Name', value: 'input' },
								value: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
							},
						],
						selectionSet: {
							kind: 'SelectionSet',
							selections: [
								{ kind: 'Field', name: { kind: 'Name', value: '__typename' } },
								{
									kind: 'Field',
									name: { kind: 'Name', value: 'data' },
									selectionSet: {
										kind: 'SelectionSet',
										selections: [
											{ kind: 'Field', name: { kind: 'Name', value: '__typename' } },
											{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'AccessTokenFragment' } },
										],
									},
								},
							],
						},
					},
				],
			},
		},
		{
			kind: 'FragmentDefinition',
			name: { kind: 'Name', value: 'AccessTokenFragment' },
			typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'AccessTokenResponse' } },
			selectionSet: {
				kind: 'SelectionSet',
				selections: [
					{ kind: 'Field', name: { kind: 'Name', value: '__typename' } },
					{ kind: 'Field', name: { kind: 'Name', value: 'accessToken' } },
					{ kind: 'Field', name: { kind: 'Name', value: 'refreshToken' } },
					{ kind: 'Field', name: { kind: 'Name', value: 'expiresIn' } },
					{ kind: 'Field', name: { kind: 'Name', value: 'expiresAt' } },
				],
			},
		},
	],
} as unknown as DocumentNode<SignInByPasswordMutationMutation, SignInByPasswordMutationMutationVariables>;
export const SignOutDocument = {
	__meta__: { hash: '5f2d2f4780afb85043174adccc8ae6ba39068ed4' },
	kind: 'Document',
	definitions: [
		{
			kind: 'OperationDefinition',
			operation: 'mutation',
			name: { kind: 'Name', value: 'signOut' },
			variableDefinitions: [
				{
					kind: 'VariableDefinition',
					variable: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
					type: { kind: 'NamedType', name: { kind: 'Name', value: 'SignOutInput' } },
				},
			],
			selectionSet: {
				kind: 'SelectionSet',
				selections: [
					{ kind: 'Field', name: { kind: 'Name', value: '__typename' } },
					{
						kind: 'Field',
						alias: { kind: 'Name', value: 'data' },
						name: { kind: 'Name', value: 'signOut' },
						arguments: [
							{
								kind: 'Argument',
								name: { kind: 'Name', value: 'input' },
								value: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
							},
						],
						selectionSet: {
							kind: 'SelectionSet',
							selections: [
								{ kind: 'Field', name: { kind: 'Name', value: '__typename' } },
								{ kind: 'Field', name: { kind: 'Name', value: 'clientMutationId' } },
							],
						},
					},
				],
			},
		},
	],
} as unknown as DocumentNode<SignOutMutation, SignOutMutationVariables>;
export const PingQueryDocument = {
	__meta__: { hash: '7707e5e82f95fb5ebd4a36e24df0a9585e1f451b' },
	kind: 'Document',
	definitions: [
		{
			kind: 'OperationDefinition',
			operation: 'query',
			name: { kind: 'Name', value: 'PingQuery' },
			selectionSet: {
				kind: 'SelectionSet',
				selections: [
					{ kind: 'Field', name: { kind: 'Name', value: '__typename' } },
					{
						kind: 'Field',
						alias: { kind: 'Name', value: 'data' },
						name: { kind: 'Name', value: 'ping' },
						selectionSet: {
							kind: 'SelectionSet',
							selections: [
								{ kind: 'Field', name: { kind: 'Name', value: '__typename' } },
								{ kind: 'Field', name: { kind: 'Name', value: 'message' } },
							],
						},
					},
				],
			},
		},
	],
} as unknown as DocumentNode<PingQueryQuery, PingQueryQueryVariables>;
export const ResolveSiteConfMutationDocument = {
	__meta__: { hash: '28a01feb8952d4e1f6372133e7574ea7a63cbd58' },
	kind: 'Document',
	definitions: [
		{
			kind: 'OperationDefinition',
			operation: 'mutation',
			name: { kind: 'Name', value: 'ResolveSiteConfMutation' },
			variableDefinitions: [
				{
					kind: 'VariableDefinition',
					variable: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
					type: {
						kind: 'NonNullType',
						type: { kind: 'NamedType', name: { kind: 'Name', value: 'ResolveSiteConfInput' } },
					},
				},
			],
			selectionSet: {
				kind: 'SelectionSet',
				selections: [
					{ kind: 'Field', name: { kind: 'Name', value: '__typename' } },
					{
						kind: 'Field',
						alias: { kind: 'Name', value: 'data' },
						name: { kind: 'Name', value: 'resolveSiteConf' },
						arguments: [
							{
								kind: 'Argument',
								name: { kind: 'Name', value: 'input' },
								value: { kind: 'Variable', name: { kind: 'Name', value: 'input' } },
							},
						],
						selectionSet: {
							kind: 'SelectionSet',
							selections: [
								{ kind: 'Field', name: { kind: 'Name', value: '__typename' } },
								{
									kind: 'Field',
									name: { kind: 'Name', value: 'data' },
									selectionSet: {
										kind: 'SelectionSet',
										selections: [
											{ kind: 'Field', name: { kind: 'Name', value: '__typename' } },
											{ kind: 'Field', name: { kind: 'Name', value: 'tid' } },
											{ kind: 'Field', name: { kind: 'Name', value: 'title' } },
											{ kind: 'Field', name: { kind: 'Name', value: 'serverUrl' } },
											{ kind: 'Field', name: { kind: 'Name', value: 'baseUrl' } },
											{ kind: 'Field', name: { kind: 'Name', value: 'features' } },
											{ kind: 'Field', name: { kind: 'Name', value: 'metadata' } },
										],
									},
								},
							],
						},
					},
				],
			},
		},
	],
} as unknown as DocumentNode<ResolveSiteConfMutationMutation, ResolveSiteConfMutationMutationVariables>;
export const CurrentUserQueryDocument = {
	__meta__: { hash: '79501c9d17db61eb4b14c5d1e69d397393709c03' },
	kind: 'Document',
	definitions: [
		{
			kind: 'OperationDefinition',
			operation: 'query',
			name: { kind: 'Name', value: 'CurrentUserQuery' },
			selectionSet: {
				kind: 'SelectionSet',
				selections: [
					{ kind: 'Field', name: { kind: 'Name', value: '__typename' } },
					{
						kind: 'Field',
						alias: { kind: 'Name', value: 'data' },
						name: { kind: 'Name', value: 'currentUser' },
						selectionSet: {
							kind: 'SelectionSet',
							selections: [
								{ kind: 'Field', name: { kind: 'Name', value: '__typename' } },
								{ kind: 'Field', name: { kind: 'Name', value: 'id' } },
								{ kind: 'FragmentSpread', name: { kind: 'Name', value: 'CurrentUserFragment' } },
							],
						},
					},
				],
			},
		},
		{
			kind: 'FragmentDefinition',
			name: { kind: 'Name', value: 'CurrentUserFragment' },
			typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'CurrentUser' } },
			selectionSet: {
				kind: 'SelectionSet',
				selections: [
					{ kind: 'Field', name: { kind: 'Name', value: '__typename' } },
					{ kind: 'Field', name: { kind: 'Name', value: 'id' } },
					{ kind: 'Field', name: { kind: 'Name', value: 'fullName' } },
					{ kind: 'Field', name: { kind: 'Name', value: 'displayName' } },
					{ kind: 'Field', name: { kind: 'Name', value: 'photoUrl' } },
					{ kind: 'Field', name: { kind: 'Name', value: 'loginName' } },
					{ kind: 'Field', name: { kind: 'Name', value: 'email' } },
					{ kind: 'Field', name: { kind: 'Name', value: 'joinDate' } },
				],
			},
		},
	],
} as unknown as DocumentNode<CurrentUserQueryQuery, CurrentUserQueryQueryVariables>;

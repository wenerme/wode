import { ApolloServiceError, ApolloServiceErrorCodes } from './errors';
import { type ApolloOperationScope, encodeApolloPathPart, isRecord } from './operations';
import type { ApolloServiceOperationContext } from './service-context';

export type ApolloNamespacePermissionKind = 'modify' | 'release';

export interface ApolloNamespacePermission {
	/** Signed-in Portal user; Portal WebAPI writes run as this identity. */
	user?: string;
	modify?: boolean;
	release?: boolean;
	/** The user may grant namespace roles in this app (app master or AssignRole). */
	assignRole?: boolean;
}

const NamespacePermissionType = { modify: 'ModifyNamespace', release: 'ReleaseNamespace' } as const;
const ClusterPermissionType = { modify: 'ModifyNamespacesInCluster', release: 'ReleaseNamespacesInCluster' } as const;
const PermissionLabel = { modify: 'ModifyNamespace (修改)', release: 'ReleaseNamespace (发布)' } as const;

async function probe(
	context: ApolloServiceOperationContext,
	path: string,
	missingMeansDenied = false,
): Promise<boolean | undefined> {
	try {
		const value = await context.portal(path);
		return isRecord(value) && typeof value.hasPermission === 'boolean' ? value.hasPermission : undefined;
	} catch (error) {
		// Older portals have no cluster-level permission endpoint, so that grant cannot exist there.
		if (missingMeansDenied && error instanceof ApolloServiceError && error.http?.status === 404) return false;
		return undefined;
	}
}

/** Mirrors Apollo's validator: namespace-wide, env-specific, or cluster-wide grants all allow the action. */
async function checkPermission(
	context: ApolloServiceOperationContext,
	scope: ApolloOperationScope,
	kind: ApolloNamespacePermissionKind,
): Promise<boolean | undefined> {
	const app = encodeApolloPathPart(scope.appId);
	const env = encodeApolloPathPart(scope.env);
	const namespace = encodeApolloPathPart(scope.namespace);
	const cluster = encodeApolloPathPart(scope.cluster);
	const results = await Promise.all([
		probe(context, `/apps/${app}/envs/${env}/namespaces/${namespace}/permissions/${NamespacePermissionType[kind]}`),
		probe(context, `/apps/${app}/namespaces/${namespace}/permissions/${NamespacePermissionType[kind]}`),
		probe(context, `/apps/${app}/envs/${env}/clusters/${cluster}/ns_permissions/${ClusterPermissionType[kind]}`, true),
	]);
	if (results.includes(true)) return true;
	return results.every((result) => result === false) ? false : undefined;
}

async function currentUser(context: ApolloServiceOperationContext): Promise<string | undefined> {
	try {
		const value = await context.portal('/user');
		return isRecord(value) && typeof value.userId === 'string' ? value.userId : undefined;
	} catch {
		return undefined;
	}
}

/** Best-effort, read-only permission inspection; unknown answers stay `undefined` and never block a write. */
export async function inspectApolloNamespacePermission(
	context: ApolloServiceOperationContext,
	scope: ApolloOperationScope,
	kinds: readonly ApolloNamespacePermissionKind[],
	options: { identity?: boolean } = {},
): Promise<ApolloNamespacePermission> {
	const app = encodeApolloPathPart(scope.appId);
	const [modify, release, user, assignRole] = await Promise.all([
		kinds.includes('modify') ? checkPermission(context, scope, 'modify') : undefined,
		kinds.includes('release') ? checkPermission(context, scope, 'release') : undefined,
		options.identity ? currentUser(context) : undefined,
		options.identity ? probe(context, `/apps/${app}/permissions/AssignRole`) : undefined,
	]);
	return Object.fromEntries(
		Object.entries({ user, modify, release, assignRole }).filter(([, value]) => value !== undefined),
	) as ApolloNamespacePermission;
}

function yesNo(value: boolean | undefined): string {
	return value === undefined ? 'unknown' : value ? 'yes' : 'no';
}

export function formatApolloPermissionHint(
	scope: ApolloOperationScope,
	permission: ApolloNamespacePermission,
	needed: readonly ApolloNamespacePermissionKind[],
): string {
	const user = permission.user ?? 'the configured portal user';
	const missing = needed.filter((kind) => permission[kind] !== true);
	const grant = (missing.length ? missing : needed).map((kind) => PermissionLabel[kind]).join(' + ');
	const target = `${scope.appId}/${scope.namespace} (env ${scope.env}, cluster ${scope.cluster})`;
	const operator = scope.operator ? ` (${scope.operator})` : '';
	return [
		`  portal user: ${user}; Portal writes run as the signed-in portal user (service username), the operator${operator} is only used by OpenAPI calls`,
		`  permission on ${target}: modify=${yesNo(permission.modify)} release=${yesNo(permission.release)}`,
		`  fix: Apollo Portal → app ${scope.appId} → namespace ${scope.namespace} → 授权 → grant ${user} ${grant} for env ${scope.env}${
			permission.assignRole ? `; ${user} can assign roles in ${scope.appId}` : `; ask an app master of ${scope.appId}`
		}`,
		'       or switch the service username/password to a portal account that already has it',
	].join('\n');
}

/** Re-throws Portal 403 errors with the user identity, the missing permission, and where to grant it. */
export async function withApolloPermissionHint<T>(
	context: ApolloServiceOperationContext,
	scope: ApolloOperationScope,
	needed: readonly ApolloNamespacePermissionKind[],
	run: () => Promise<T>,
): Promise<T> {
	try {
		return await run();
	} catch (error) {
		if (!(error instanceof ApolloServiceError) || error.code !== ApolloServiceErrorCodes.PermissionDenied) throw error;
		const permission = await inspectApolloNamespacePermission(context, scope, ['modify', 'release'], {
			identity: true,
		});
		throw new ApolloServiceError(
			error.code,
			`${error.message}\n${formatApolloPermissionHint(scope, permission, needed)}`,
			error.state,
			error.http,
		);
	}
}

/** Refuses before any write when a definitive answer says the write or publish would be rejected. */
export async function assertApolloNamespaceWritable(
	context: ApolloServiceOperationContext,
	scope: ApolloOperationScope,
	needed: readonly ApolloNamespacePermissionKind[],
): Promise<void> {
	if (!needed.length) return;
	const permission = await inspectApolloNamespacePermission(context, scope, needed);
	if (!needed.some((kind) => permission[kind] === false)) return;
	const identity = await inspectApolloNamespacePermission(context, scope, [], { identity: true });
	const full = { ...permission, ...identity };
	throw new ApolloServiceError(
		ApolloServiceErrorCodes.PermissionDenied,
		`Apollo portal user lacks ${needed
			.filter((kind) => permission[kind] === false)
			.map((kind) => PermissionLabel[kind])
			.join(' + ')} permission; nothing was written\n${formatApolloPermissionHint(scope, full, needed)}`,
		'permission-precheck',
	);
}

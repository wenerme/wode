import { parseDocument as parseYamlDocument } from 'yaml';
import type { ApolloConnectionConfig } from './config';
import { encodeApolloUtf8Base64 } from './encoding';
import type { ApolloConfigFormat } from './schema';

export interface ApolloOperationScope {
	appId: string;
	env: string;
	cluster: string;
	namespace: string;
	operator?: string;
}

export function resolveApolloScope(
	config: ApolloConnectionConfig,
	input: { appId?: string; env?: string; cluster?: string; namespace?: string; operator?: string } = {},
): ApolloOperationScope {
	return {
		appId: requireApolloValue(input.appId ?? config.appId, 'appId'),
		env: input.env ?? config.env,
		cluster: input.cluster ?? config.cluster,
		namespace: input.namespace ?? config.namespace,
		operator: input.operator ?? config.operator,
	};
}

export function requireApolloOperator(scope: Pick<ApolloOperationScope, 'operator'>): string {
	return requireApolloValue(scope.operator, 'operator');
}

export function requireApolloValue(value: string | undefined, name: string): string {
	const normalized = value?.trim();
	if (!normalized) throw new Error(`Apollo ${name} is required`);
	return normalized;
}

export function encodeApolloPathPart(value: string): string {
	return encodeURIComponent(value);
}

export function apolloPortalNamespacePath(scope: ApolloOperationScope): string {
	return `/apps/${encodeApolloPathPart(scope.appId)}/envs/${encodeApolloPathPart(scope.env)}/clusters/${encodeApolloPathPart(scope.cluster)}/namespaces/${encodeApolloPathPart(scope.namespace)}`;
}

export function apolloClusterPath(scope: ApolloOperationScope): string {
	return `/openapi/v1/envs/${encodeApolloPathPart(scope.env)}/apps/${encodeApolloPathPart(scope.appId)}/clusters/${encodeApolloPathPart(scope.cluster)}`;
}

export function apolloNamespacePath(scope: ApolloOperationScope): string {
	return `${apolloClusterPath(scope)}/namespaces/${encodeApolloPathPart(scope.namespace)}`;
}

export function apolloItemPath(scope: ApolloOperationScope, key: string): string {
	const itemSegment = /[/?#\\]/u.test(key)
		? `encodedItems/${encodeApolloUtf8Base64(key).replace(/\+/gu, '-').replace(/\//gu, '_').replace(/=+$/u, '')}`
		: `items/${encodeApolloPathPart(key)}`;
	return `${apolloNamespacePath(scope)}/${itemSegment}`;
}

export function apolloReleasePath(scope: ApolloOperationScope): string {
	return `${apolloNamespacePath(scope)}/releases`;
}

export function compactApolloRecord(value: Record<string, unknown>): Record<string, unknown> {
	return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined && item !== ''));
}

export function createApolloAppBody(
	scope: ApolloOperationScope,
	input: {
		appId: string;
		name?: string;
		orgId?: string;
		orgName?: string;
		ownerName?: string;
		ownerEmail?: string;
		body?: Record<string, unknown>;
		assignRoleToSelf?: boolean;
	},
): Record<string, unknown> {
	if (input.body) {
		if ('app' in input.body) return input.body;
		return {
			app: { ...input.body, appId: typeof input.body.appId === 'string' ? input.body.appId : input.appId },
			assignAppRoleToSelf: Boolean(input.assignRoleToSelf),
		};
	}
	return {
		app: compactApolloRecord({
			appId: input.appId,
			name: input.name ?? input.appId,
			orgId: input.orgId,
			orgName: input.orgName,
			ownerName: input.ownerName ?? scope.operator,
			ownerEmail: input.ownerEmail,
			dataChangeCreatedBy: scope.operator,
			dataChangeLastModifiedBy: scope.operator,
		}),
		assignAppRoleToSelf: Boolean(input.assignRoleToSelf),
	};
}

export function updateApolloAppBody(
	scope: ApolloOperationScope,
	input: {
		appId: string;
		name?: string;
		orgId?: string;
		orgName?: string;
		ownerName?: string;
		ownerEmail?: string;
		body?: Record<string, unknown>;
	},
): Record<string, unknown> {
	if (input.body)
		return { ...input.body, appId: typeof input.body.appId === 'string' ? input.body.appId : input.appId };
	return compactApolloRecord({
		appId: input.appId,
		name: input.name ?? input.appId,
		orgId: input.orgId,
		orgName: input.orgName,
		ownerName: input.ownerName ?? scope.operator,
		ownerEmail: input.ownerEmail,
		dataChangeCreatedBy: scope.operator,
		dataChangeLastModifiedBy: scope.operator,
	});
}

export function unwrapApolloItem(value: unknown): Record<string, unknown> | undefined {
	if (!isRecord(value)) return undefined;
	return isRecord(value.item) ? value.item : value;
}

export function parseApolloReleaseConfigurations(value: unknown): unknown {
	if (!isRecord(value)) return {};
	if (typeof value.configurations !== 'string') return value.configurations ?? {};
	try {
		return JSON.parse(value.configurations);
	} catch {
		return value.configurations;
	}
}

export function apolloNamespaceInfoId(value: unknown): number {
	if (!isRecord(value)) throw new Error('Apollo namespace response is not an object');
	const base = isRecord(value.baseInfo) ? value.baseInfo : value;
	const id = typeof base.id === 'number' ? base.id : Number(base.id);
	if (!Number.isFinite(id) || id <= 0) {
		throw new Error('Apollo namespace response missing namespace id; cannot write namespace text safely');
	}
	return id;
}

export function apolloNamespaceInfoFormat(
	value: unknown,
	namespace: string,
	explicit?: ApolloConfigFormat,
): ApolloConfigFormat {
	if (explicit) return explicit;
	if (isRecord(value) && typeof value.format === 'string') return parseApolloConfigFormat(value.format);
	return inferApolloConfigFormat(namespace) ?? 'properties';
}

function parseApolloConfigFormat(value: string): ApolloConfigFormat {
	const normalized = value.trim().toLowerCase();
	if (['json', 'xml', 'yaml', 'yml', 'properties', 'txt'].includes(normalized)) {
		return normalized as ApolloConfigFormat;
	}
	throw new Error(`unsupported Apollo namespace format: ${value}`);
}

function inferApolloConfigFormat(namespace: string): ApolloConfigFormat | undefined {
	const suffix = namespace.split('.').pop()?.toLowerCase();
	return suffix && ['json', 'xml', 'yaml', 'yml', 'properties', 'txt'].includes(suffix)
		? (suffix as ApolloConfigFormat)
		: undefined;
}

export function validateApolloNamespaceText(
	format: ApolloConfigFormat,
	text: string,
	namespace: string,
): { validated: boolean; validator?: string } {
	if (format === 'json') {
		try {
			JSON.parse(text);
		} catch {
			throw new Error(`invalid JSON content for Apollo namespace ${namespace}`);
		}
		return { validated: true, validator: 'json' };
	}
	if (format === 'yaml' || format === 'yml') {
		const firstError = parseYamlDocument(text).errors[0];
		if (firstError) throw new Error(`invalid YAML content for Apollo namespace ${namespace}`);
		return { validated: true, validator: 'yaml' };
	}
	return { validated: false };
}

export function isRecord(value: unknown): value is Record<string, unknown> {
	return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

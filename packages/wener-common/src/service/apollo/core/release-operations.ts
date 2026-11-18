import { sha256 } from '@wener/utils';
import { type ApolloConfigChange, diffApolloConfigurations } from './config-diff';
import { ApolloServiceError, ApolloServiceErrorCodes } from './errors';
import {
	type ApolloOperationScope,
	apolloNamespaceInfoFormat,
	apolloPortalNamespacePath,
	compactApolloRecord,
	isRecord,
	parseApolloReleaseConfigurations,
	resolveApolloScope,
} from './operations';
import {
	assertApolloNamespaceWritable,
	inspectApolloNamespacePermission,
	withApolloPermissionHint,
} from './portal-permission';
import type { ApolloConfigFormat } from './schema';
import { ApolloDiffNamespaceReleaseInputSchema, ApolloPublishNamespaceReleaseInputSchema } from './schema';
import type { ApolloServiceOperationContext } from './service-context';

const PublishOutcome = {
	state: 'publish-outcome-unknown',
	message: 'Apollo publish outcome is unknown',
} as const;

export interface ApolloReleaseRef {
	id?: unknown;
	name?: unknown;
	releasedBy?: unknown;
	releasedTime?: unknown;
}

/** Working copy (draft) of a namespace as returned by the Portal namespace endpoint. */
export interface ApolloNamespaceDraft {
	format: ApolloConfigFormat;
	configurations: Record<string, string>;
	/** key → last modifier, for items that differ from the latest release. */
	modifiedBy: Record<string, string>;
}

export interface ApolloPendingRelease {
	draft: ApolloNamespaceDraft;
	release?: ApolloReleaseRef;
	releaseConfigurations: Record<string, string>;
	/** Latest release → working copy; exactly what a publish would release. */
	changes: ApolloConfigChange[];
	/** Identifies (base release, working copy); changes whenever what a publish would release changes. */
	fingerprint: string;
}

export type ApolloReleaseOperations = {
	diffNamespaceRelease(input: unknown): Promise<unknown>;
	publishNamespaceRelease(input: unknown): Promise<unknown>;
};

export function createApolloReleaseOperations(context: ApolloServiceOperationContext): ApolloReleaseOperations {
	return {
		diffNamespaceRelease: (input) => diffNamespaceRelease(context, input),
		publishNamespaceRelease: (input) => publishNamespaceRelease(context, input),
	};
}

function stringValue(value: unknown): string {
	return typeof value === 'string' ? value : value == null ? '' : JSON.stringify(value);
}

export function readApolloNamespaceDraft(namespaceInfo: unknown, scope: ApolloOperationScope): ApolloNamespaceDraft {
	const format = apolloNamespaceInfoFormat(namespaceInfo, scope.namespace);
	const items = isRecord(namespaceInfo) && Array.isArray(namespaceInfo.items) ? namespaceInfo.items : [];
	const configurations: Record<string, string> = {};
	const modifiedBy: Record<string, string> = {};
	for (const entry of items) {
		if (!isRecord(entry)) continue;
		const item = isRecord(entry.item) ? entry.item : entry;
		// Properties blank lines and comments are items without a key; they are never released.
		if (typeof item.key !== 'string' || !item.key) continue;
		const changed = entry.isModified === true || entry.isDeleted === true;
		const by = item.dataChangeLastModifiedBy;
		if (changed && typeof by === 'string' && by) modifiedBy[item.key] = by;
		if (entry.isDeleted !== true) configurations[item.key] = stringValue(item.value);
	}
	return { format, configurations, modifiedBy };
}

export async function readApolloLatestRelease(
	context: ApolloServiceOperationContext,
	scope: ApolloOperationScope,
): Promise<{ release?: ApolloReleaseRef; configurations: Record<string, string> }> {
	const value = await context.portal(`${apolloPortalNamespacePath(scope)}/releases/active`, { page: 0, size: 1 });
	const latest = Array.isArray(value) ? value.find(isRecord) : undefined;
	if (!latest) return { configurations: {} };
	const parsed = parseApolloReleaseConfigurations(latest);
	const configurations = isRecord(parsed)
		? Object.fromEntries(Object.entries(parsed).map(([key, item]) => [key, stringValue(item)]))
		: {};
	const release = compactApolloRecord({
		id: latest.id,
		name: latest.name,
		releasedBy: latest.dataChangeCreatedBy,
		releasedTime: latest.dataChangeCreatedTime,
	});
	return { release, configurations };
}

/** Attaches draft modifiers: per key for properties, the single `content` item's modifier for documents. */
export function attachApolloModifiers(
	changes: ApolloConfigChange[],
	draft: ApolloNamespaceDraft,
): ApolloConfigChange[] {
	const shared = draft.format === 'properties' ? undefined : draft.modifiedBy.content;
	return changes.map((change) => {
		const by = shared ?? draft.modifiedBy[change.key];
		return by ? { ...change, modifiedBy: by } : change;
	});
}

export function apolloChangeModifiers(changes: readonly ApolloConfigChange[]): string[] {
	return Array.from(new Set(changes.flatMap((change) => (change.modifiedBy ? [change.modifiedBy] : []))));
}

export async function loadApolloPendingRelease(
	context: ApolloServiceOperationContext,
	scope: ApolloOperationScope,
	namespaceInfo?: unknown,
): Promise<ApolloPendingRelease> {
	const [info, latest] = await Promise.all([
		namespaceInfo === undefined ? context.portal(apolloPortalNamespacePath(scope)) : namespaceInfo,
		readApolloLatestRelease(context, scope),
	]);
	const draft = readApolloNamespaceDraft(info, scope);
	const changes = diffApolloConfigurations(draft.format, latest.configurations, draft.configurations);
	const sorted = Object.fromEntries(Object.entries(draft.configurations).sort(([a], [b]) => a.localeCompare(b)));
	const fingerprint = (
		await sha256(JSON.stringify({ release: latest.release?.id ?? null, draft: sorted }), 'hex')
	).slice(0, 12);
	return {
		draft,
		release: latest.release,
		releaseConfigurations: latest.configurations,
		changes: attachApolloModifiers(changes, draft),
		fingerprint,
	};
}

export function describeApolloPendingChanges(changes: readonly ApolloConfigChange[]): string {
	const keys = changes.slice(0, 5).map((change) => change.key);
	if (changes.length > 5) keys.push(`… +${changes.length - 5}`);
	const by = apolloChangeModifiers(changes);
	return `draft already has ${changes.length} unpublished change(s)${by.length ? ` by ${by.join(', ')}` : ''} (${keys.join(', ')})`;
}

/** Refuses a patch+publish that would also release unpublished changes already pending in the working copy. */
export function assertApolloNoPendingChanges(
	scope: ApolloOperationScope,
	pending: readonly ApolloConfigChange[],
	allowUnpublishedDraft: boolean,
): void {
	if (!pending.length || allowUnpublishedDraft) return;
	throw new ApolloServiceError(
		ApolloServiceErrorCodes.InvalidRequest,
		`Apollo namespace ${scope.namespace} ${describeApolloPendingChanges(pending)}; publishing would release them too. Review with \`apollo release diff ${scope.namespace}\`, publish or revert them first, or pass --allow-unpublished-draft; nothing was written`,
	);
}

export function postApolloPortalRelease(
	context: ApolloServiceOperationContext,
	scope: ApolloOperationScope,
	input: { title?: string; comment?: string },
): Promise<unknown> {
	return context.portalMutation(
		`${apolloPortalNamespacePath(scope)}/releases`,
		{
			method: 'POST',
			body: {
				releaseTitle: input.title ?? `Apollo ${scope.namespace} ${new Date().toISOString()}`,
				releaseComment: input.comment,
				isEmergencyPublish: false,
			},
		},
		PublishOutcome,
	);
}

function pendingResult(scope: ApolloOperationScope, pending: ApolloPendingRelease) {
	return {
		ok: true,
		appId: scope.appId,
		env: scope.env,
		cluster: scope.cluster,
		namespace: scope.namespace,
		format: pending.draft.format,
		baseRelease: pending.release ?? null,
		fingerprint: pending.fingerprint,
		count: pending.changes.length,
		modifiedBy: apolloChangeModifiers(pending.changes),
		changes: pending.changes,
	};
}

async function diffNamespaceRelease(context: ApolloServiceOperationContext, input: unknown): Promise<unknown> {
	const scope = resolveApolloScope(context.config, context.parse(ApolloDiffNamespaceReleaseInputSchema, input));
	const result = pendingResult(scope, await loadApolloPendingRelease(context, scope));
	return result.count ? result : { ...result, message: `no unpublished changes in ${scope.namespace}` };
}

async function publishNamespaceRelease(context: ApolloServiceOperationContext, input: unknown): Promise<unknown> {
	const parsed = context.parse(ApolloPublishNamespaceReleaseInputSchema, input);
	if (!parsed.dryRun) context.assertWritable();
	const scope = resolveApolloScope(context.config, parsed);
	const pending = await loadApolloPendingRelease(context, scope);
	const result = { ...pendingResult(scope, pending), dryRun: parsed.dryRun };
	assertApolloFingerprint(scope, parsed.ifMatch, pending.fingerprint, 'since the preview');
	if (!result.count) {
		return { ...result, published: false, message: `no unpublished changes in ${scope.namespace}; nothing to publish` };
	}
	if (parsed.dryRun) {
		const permission = await inspectApolloNamespacePermission(context, scope, ['release'], { identity: true });
		const others = result.modifiedBy.filter((user) => user !== permission.user);
		const warnings = [
			permission.release === false ? 'portal user lacks ReleaseNamespace; publish would be rejected' : '',
			others.length ? `includes unpublished changes by ${others.join(', ')}` : '',
		].filter(Boolean);
		return { ...result, published: false, permission, ...(warnings.length ? { warnings } : {}) };
	}
	await assertApolloNamespaceWritable(context, scope, ['release']);
	// Apollo publishes whatever the draft holds at POST time: re-read right before it to narrow the race window.
	const latest = await loadApolloPendingRelease(context, scope);
	assertApolloFingerprint(scope, pending.fingerprint, latest.fingerprint, 'while preparing the publish');
	const release = await withApolloPermissionHint(context, scope, ['release'], () =>
		postApolloPortalRelease(context, scope, parsed),
	);
	return { ...result, published: true, release };
}

function assertApolloFingerprint(
	scope: ApolloOperationScope,
	expected: string | undefined,
	actual: string,
	when: string,
): void {
	if (!expected || expected === actual) return;
	throw new ApolloServiceError(
		ApolloServiceErrorCodes.InvalidRequest,
		`Apollo namespace ${scope.namespace} working copy or latest release changed ${when} (fingerprint ${expected} → ${actual}); review \`apollo release diff ${scope.namespace}\` again; nothing was published`,
		'fingerprint-mismatch',
	);
}

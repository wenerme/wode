import { diffApolloConfigurations } from './config-diff';
import { editApolloDocument, isApolloDocumentFormat } from './document-edit';
import { ApolloServiceError, ApolloServiceErrorCodes } from './errors';
import { describeApolloHttpError } from './http-error';
import {
	type ApolloOperationScope,
	apolloNamespaceInfoFormat,
	apolloNamespaceInfoId,
	apolloPortalNamespacePath,
	resolveApolloScope,
	validateApolloNamespaceText,
} from './operations';
import {
	type ApolloNamespacePermissionKind,
	assertApolloNamespaceWritable,
	inspectApolloNamespacePermission,
	withApolloPermissionHint,
} from './portal-permission';
import {
	assertApolloNoPendingChanges,
	describeApolloPendingChanges,
	loadApolloPendingRelease,
	postApolloPortalRelease,
	readApolloNamespaceDraft,
} from './release-operations';
import type { ApolloConfigFormat } from './schema';
import { ApolloPatchNamespaceDocumentInputSchema, ApolloWriteNamespaceTextInputSchema } from './schema';
import type { ApolloServiceOperationContext } from './service-context';

const DraftWriteOutcome = {
	state: 'draft-write-outcome-unknown',
	message: 'Apollo namespace draft write outcome is unknown',
} as const;

type PublishOptions = { publish: boolean; releaseTitle?: string; releaseComment?: string };

export type ApolloNamespaceTextOperations = {
	writeNamespaceText(input: unknown): Promise<unknown>;
	patchNamespaceDocument(input: unknown): Promise<unknown>;
};

export function createApolloNamespaceTextOperations(
	context: ApolloServiceOperationContext,
): ApolloNamespaceTextOperations {
	return {
		writeNamespaceText: (input) => writeNamespaceText(context, input),
		patchNamespaceDocument: (input) => patchNamespaceDocument(context, input),
	};
}

function scopeResult(scope: ApolloOperationScope) {
	return { appId: scope.appId, env: scope.env, cluster: scope.cluster, namespace: scope.namespace };
}

function neededPermission(publish: boolean): ApolloNamespacePermissionKind[] {
	return publish ? ['modify', 'release'] : ['modify'];
}

function failureDetail(error: unknown): string {
	if (!(error instanceof ApolloServiceError)) return '';
	if (error.http) return `: ${describeApolloHttpError(error.http)}`;
	const transport = /: (request timed out|network error(?: \([A-Z0-9_]+\))?)(?:;|$)/u.exec(error.message)?.[1];
	return transport ? `: ${transport}` : '';
}

/** Writes the draft text and optionally publishes; a rejected publish is reported separately from an unknown one. */
async function commitNamespaceText(
	context: ApolloServiceOperationContext,
	scope: ApolloOperationScope,
	input: { namespaceId: number; format: ApolloConfigFormat; configText: string } & PublishOptions,
): Promise<{ published: boolean; release?: unknown }> {
	const base = apolloPortalNamespacePath(scope);
	// A rejected draft PUT has no side effect, but a rejected publish would strand the draft: check before writing.
	if (input.publish) await assertApolloNamespaceWritable(context, scope, ['modify', 'release']);
	await withApolloPermissionHint(context, scope, ['modify'], () =>
		context.portalMutation(
			`${base}/items`,
			{
				method: 'PUT',
				body: { namespaceId: input.namespaceId, format: input.format, configText: input.configText },
			},
			DraftWriteOutcome,
		),
	);
	if (!input.publish) return { published: false };
	try {
		const release = await withApolloPermissionHint(context, scope, ['release'], () =>
			postApolloPortalRelease(context, scope, { title: input.releaseTitle, comment: input.releaseComment }),
		);
		return { published: true, release };
	} catch (error) {
		if (error instanceof ApolloServiceError && error.state === 'not-sent') {
			throw new ApolloServiceError(
				error.code,
				`Apollo namespace draft updated but publish was not sent${failureDetail(error)}; retry the publish or revert the draft`,
				'publish-not-sent',
			);
		}
		if (error instanceof ApolloServiceError && error.state === 'rejected') {
			const [, hint = ''] = error.message.split(/\n(.*)/su);
			throw new ApolloServiceError(
				error.code,
				`Apollo namespace draft updated but publish was rejected${failureDetail(error)}; publish the draft in Portal or revert it${hint ? `\n${hint}` : ''}`,
				'publish-rejected',
				error.http,
			);
		}
		throw new ApolloServiceError(
			ApolloServiceErrorCodes.PartialFailure,
			`Apollo namespace draft updated; publish outcome is unknown${failureDetail(error)}`,
			'publish-outcome-unknown',
			error instanceof ApolloServiceError ? error.http : undefined,
		);
	}
}

async function writeNamespaceText(context: ApolloServiceOperationContext, input: unknown): Promise<unknown> {
	const parsed = context.parse(ApolloWriteNamespaceTextInputSchema, input);
	if (!parsed.dryRun) context.assertWritable();
	const scope = resolveApolloScope(context.config, parsed);
	const namespaceInfo = await context.portal(apolloPortalNamespacePath(scope));
	const namespaceId = apolloNamespaceInfoId(namespaceInfo);
	const format = apolloNamespaceInfoFormat(namespaceInfo, scope.namespace, parsed.format);
	const validation = parsed.validate
		? validateApolloNamespaceText(format, parsed.configText, scope.namespace)
		: { validated: false, skipped: true };
	if (parsed.dryRun) {
		return {
			ok: true,
			dryRun: true,
			...scopeResult(scope),
			namespaceId,
			format,
			bytes: new TextEncoder().encode(parsed.configText).byteLength,
			publish: parsed.publish,
			validation,
			permission: await inspectApolloNamespacePermission(context, scope, neededPermission(parsed.publish), {
				identity: true,
			}),
		};
	}
	const committed = await commitNamespaceText(context, scope, { ...parsed, namespaceId, format });
	return { ok: true, ...scopeResult(scope), namespaceId, format, ...committed };
}

async function patchNamespaceDocument(context: ApolloServiceOperationContext, input: unknown): Promise<unknown> {
	const parsed = context.parse(ApolloPatchNamespaceDocumentInputSchema, input);
	if (!parsed.dryRun) context.assertWritable();
	const scope = resolveApolloScope(context.config, parsed);
	const namespaceInfo = await context.portal(apolloPortalNamespacePath(scope));
	const namespaceId = apolloNamespaceInfoId(namespaceInfo);
	const draft = readApolloNamespaceDraft(namespaceInfo, scope);
	const format = draft.format;
	if (!isApolloDocumentFormat(format)) {
		throw new ApolloServiceError(
			ApolloServiceErrorCodes.InvalidRequest,
			`Apollo namespace ${scope.namespace} is ${format}; document patch supports yaml/yml/json, use item patch instead`,
		);
	}
	const content = draft.configurations.content;
	if (content === undefined) {
		throw new ApolloServiceError(
			ApolloServiceErrorCodes.InvalidRequest,
			`Apollo namespace ${scope.namespace} has no content item in this cluster (e.g. an associated public namespace without override); use apollo write with the full text`,
		);
	}
	let edit: ReturnType<typeof editApolloDocument>;
	try {
		edit = editApolloDocument({ format, text: content, ...parsed });
	} catch (error) {
		throw new ApolloServiceError(
			ApolloServiceErrorCodes.InvalidRequest,
			`Apollo namespace ${scope.namespace}: ${error instanceof Error ? error.message : 'document edit failed'}`,
		);
	}
	validateApolloNamespaceText(format, edit.text, scope.namespace);
	// Same diff as `release diff`: what this patch changes in the working copy.
	const changes = diffApolloConfigurations(format, { content }, { content: edit.text });
	const unchanged = edit.changes.filter((change) => !change.changed).map((change) => change.key);
	const pending = parsed.publish ? await loadApolloPendingRelease(context, scope, namespaceInfo) : undefined;
	const result = {
		ok: true,
		dryRun: parsed.dryRun,
		...scopeResult(scope),
		namespaceId,
		format,
		applied: changes.length,
		changes,
		...(unchanged.length ? { unchanged } : {}),
		reformatted: changes.length > 0 && edit.reformatted,
		...(pending
			? {
					baseRelease: pending.release ?? null,
					pending: pending.changes,
					// What `--publish` would release: latest release → edited working copy.
					publishChanges: diffApolloConfigurations(format, pending.releaseConfigurations, { content: edit.text }),
				}
			: {}),
	};
	const blockedByPending = Boolean(pending?.changes.length) && !parsed.allowUnpublishedDraft;
	if (parsed.dryRun) {
		const permission = await inspectApolloNamespacePermission(context, scope, neededPermission(parsed.publish), {
			identity: true,
		});
		const warnings = [
			permission.modify === false ? 'portal user lacks ModifyNamespace; the write would be rejected' : '',
			parsed.publish && permission.release === false
				? 'portal user lacks ReleaseNamespace; publish would be rejected'
				: '',
			pending && blockedByPending
				? `${describeApolloPendingChanges(pending.changes)}; publish requires --allow-unpublished-draft`
				: '',
		].filter(Boolean);
		return { ...result, permission, ...(warnings.length ? { warnings } : {}) };
	}
	if (pending) assertApolloNoPendingChanges(scope, pending.changes, parsed.allowUnpublishedDraft);
	if (!changes.length) return { ...result, dryRun: false, published: false };
	const committed = await commitNamespaceText(context, scope, {
		namespaceId,
		format,
		configText: edit.text,
		publish: parsed.publish,
		releaseTitle: parsed.releaseTitle,
		releaseComment: parsed.releaseComment,
	});
	return { ...result, dryRun: false, ...committed };
}

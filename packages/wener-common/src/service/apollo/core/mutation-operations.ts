import { type ApolloConfigChange, diffApolloConfigurations } from './config-diff';
import { ApolloServiceError, ApolloServiceErrorCodes } from './errors';
import { deleteApolloItem, upsertApolloItem } from './item-mutations';
import { createApolloNamespaceTextOperations } from './namespace-text-operations';
import {
	apolloPortalNamespacePath,
	apolloReleasePath,
	compactApolloRecord,
	requireApolloOperator,
	resolveApolloScope,
	unwrapApolloItem,
} from './operations';
import {
	assertApolloNoPendingChanges,
	createApolloReleaseOperations,
	describeApolloPendingChanges,
	loadApolloPendingRelease,
} from './release-operations';
import { ApolloPatchNamespaceItemInputSchema } from './schema';
import type { ApolloServiceOperationContext } from './service-context';

type ApolloItemSnapshot = {
	key: string;
	value: string;
	comment?: string;
};

type ApolloPatchChange = {
	key: string;
	op: 'create' | 'update' | 'delete';
	oldValue?: string;
	newValue: string;
	changed: 'yes' | '';
	previous?: ApolloItemSnapshot;
};

const PublishOutcome = {
	state: 'publish-outcome-unknown',
	message: 'Apollo publish outcome is unknown',
} as const;

export type ApolloMutationOperations = {
	patchNamespaceItem(input: unknown): Promise<unknown>;
	writeNamespaceText(input: unknown): Promise<unknown>;
	patchNamespaceDocument(input: unknown): Promise<unknown>;
	diffNamespaceRelease(input: unknown): Promise<unknown>;
	publishNamespaceRelease(input: unknown): Promise<unknown>;
};

export function createApolloMutationOperations(context: ApolloServiceOperationContext): ApolloMutationOperations {
	return {
		patchNamespaceItem: (input) => patchNamespaceItem(context, input),
		...createApolloNamespaceTextOperations(context),
		...createApolloReleaseOperations(context),
	};
}

function toConfigChange(change: ApolloPatchChange): ApolloConfigChange {
	if (change.op === 'delete') return { key: change.key, op: 'delete', oldValue: change.oldValue };
	return change.op === 'create'
		? { key: change.key, op: 'create', newValue: change.newValue }
		: { key: change.key, op: 'update', oldValue: change.oldValue, newValue: change.newValue };
}

async function patchNamespaceItem(context: ApolloServiceOperationContext, input: unknown): Promise<unknown> {
	const parsed = context.parse(ApolloPatchNamespaceItemInputSchema, input);
	if (!parsed.dryRun) context.assertWritable();
	const scope = resolveApolloScope(context.config, parsed);
	const currentValue = await context.portal(`${apolloPortalNamespacePath(scope)}/items`, { orderBy: 'lineNum' });
	const current = new Map(
		(Array.isArray(currentValue) ? currentValue : [])
			.map(unwrapApolloItem)
			.map(toApolloItemSnapshot)
			.filter((item): item is ApolloItemSnapshot => Boolean(item))
			.map((item) => [item.key, item] as const),
	);
	const deletes = new Set(parsed.delete);
	const changes: ApolloPatchChange[] = [];
	for (const item of parsed.set) {
		const previous = current.get(item.key);
		changes.push({
			key: item.key,
			op: previous ? 'update' : 'create',
			oldValue: previous?.value,
			newValue: item.value,
			changed: previous?.value === item.value ? '' : 'yes',
			previous,
		});
		deletes.delete(item.key);
	}
	for (const key of deletes) {
		const previous = current.get(key);
		changes.push({
			key,
			op: 'delete',
			oldValue: previous?.value,
			newValue: '',
			changed: previous ? 'yes' : '',
			previous,
		});
	}
	const changed = changes.filter((item) => item.changed === 'yes');
	const unchanged = changes.filter((item) => item.changed !== 'yes').map((item) => item.key);
	const pending = parsed.publish ? await loadApolloPendingRelease(context, scope) : undefined;
	let publishView: Record<string, unknown> = {};
	if (pending) {
		const next = { ...pending.draft.configurations };
		for (const change of changed) {
			if (change.op === 'delete') delete next[change.key];
			else next[change.key] = change.newValue;
		}
		publishView = {
			baseRelease: pending.release ?? null,
			pending: pending.changes,
			publishChanges: diffApolloConfigurations(pending.draft.format, pending.releaseConfigurations, next),
		};
	}
	const blockedByPending = Boolean(pending?.changes.length) && !parsed.allowUnpublishedDraft;
	const result = {
		ok: true,
		dryRun: parsed.dryRun,
		appId: scope.appId,
		env: scope.env,
		cluster: scope.cluster,
		namespace: scope.namespace,
		// Same entry shape as `release diff`; no-op keys are listed separately.
		changes: changed.map(toConfigChange),
		...(unchanged.length ? { unchanged } : {}),
		...publishView,
	};
	if (parsed.dryRun) {
		return pending && blockedByPending
			? {
					...result,
					warnings: [`${describeApolloPendingChanges(pending.changes)}; publish requires --allow-unpublished-draft`],
				}
			: result;
	}
	if (pending) assertApolloNoPendingChanges(scope, pending.changes, parsed.allowUnpublishedDraft);

	const attempted: ApolloPatchChange[] = [];
	let publishAttempted = false;
	try {
		for (const change of changed) {
			attempted.push(change);
			if (change.op === 'delete') {
				await deleteApolloItem(context, { ...parsed, key: change.key });
			} else {
				await upsertApolloItem(context, {
					...parsed,
					key: change.key,
					value: change.newValue,
					comment: parsed.comment,
					release: false,
				});
			}
		}
		let release: unknown;
		if (parsed.publish && changed.length) {
			publishAttempted = true;
			release = await publishNamespaceRelease(context, parsed, scope);
		}
		return { ...result, dryRun: false, applied: changed.length, published: Boolean(release), release };
	} catch {
		const compensated = await compensateApolloItems(context, parsed, attempted);
		if (publishAttempted) {
			throw partialFailure(
				compensated
					? 'Apollo namespace draft restored; publish outcome is unknown'
					: 'Apollo namespace draft partially restored; publish outcome is unknown',
				'publish-outcome-unknown',
			);
		}
		if (!compensated) {
			throw partialFailure(
				'Apollo namespace patch partial failure; draft may contain partial changes',
				'namespace-patch-partial',
			);
		}
		throw new ApolloServiceError(
			ApolloServiceErrorCodes.OperationFailed,
			'Apollo namespace patch failed; applied changes were compensated',
		);
	}
}

async function publishNamespaceRelease(
	context: ApolloServiceOperationContext,
	parsed: { releaseTitle?: string; releaseComment?: string; operator?: string },
	scope: ReturnType<typeof resolveApolloScope>,
): Promise<unknown> {
	return context.adminMutation(
		apolloReleasePath(scope),
		{
			method: 'POST',
			body: compactApolloRecord({
				releaseTitle: parsed.releaseTitle ?? `Apollo ${scope.namespace} ${new Date().toISOString()}`,
				releaseComment: parsed.releaseComment,
				releasedBy: requireApolloOperator(scope),
			}),
		},
		PublishOutcome,
	);
}

async function compensateApolloItems(
	context: ApolloServiceOperationContext,
	input: Record<string, unknown>,
	attempted: readonly ApolloPatchChange[],
): Promise<boolean> {
	let success = true;
	for (const change of [...attempted].reverse()) {
		try {
			if (change.previous) {
				await upsertApolloItem(context, {
					...input,
					key: change.previous.key,
					value: change.previous.value,
					comment: change.previous.comment,
					release: false,
				});
			} else {
				await deleteApolloItem(context, { ...input, key: change.key });
			}
		} catch {
			success = false;
		}
	}
	return success;
}

function toApolloItemSnapshot(value: Record<string, unknown> | undefined): ApolloItemSnapshot | undefined {
	if (!value || typeof value.key !== 'string' || typeof value.value !== 'string') return undefined;
	return {
		key: value.key,
		value: value.value,
		comment: typeof value.comment === 'string' ? value.comment : undefined,
	};
}

function partialFailure(message: string, state: string): ApolloServiceError {
	return new ApolloServiceError(ApolloServiceErrorCodes.PartialFailure, message, state);
}

import {
	apolloItemPath,
	apolloReleasePath,
	compactApolloRecord,
	requireApolloOperator,
	resolveApolloScope,
} from './operations';
import { ApolloDeleteItemInputSchema, ApolloPublishReleaseInputSchema, ApolloUpsertItemInputSchema } from './schema';
import type { ApolloServiceOperationContext } from './service-context';

const ItemWriteOutcome = {
	state: 'item-write-outcome-unknown',
	message: 'Apollo item write outcome is unknown',
} as const;
const PublishOutcome = {
	state: 'publish-outcome-unknown',
	message: 'Apollo publish outcome is unknown',
} as const;

export async function upsertApolloItem(context: ApolloServiceOperationContext, input: unknown): Promise<unknown> {
	const parsed = context.parse(ApolloUpsertItemInputSchema, input);
	const scope = resolveApolloScope(context.config, parsed);
	const operator = requireApolloOperator(scope);
	await context.adminMutation(
		apolloItemPath(scope, parsed.key),
		{
			method: 'PUT',
			query: { createIfNotExists: parsed.createIfNotExists },
			body: compactApolloRecord({
				key: parsed.key,
				value: parsed.value,
				comment: parsed.comment,
				dataChangeCreatedBy: operator,
				dataChangeLastModifiedBy: operator,
			}),
		},
		ItemWriteOutcome,
	);
	const release = parsed.release
		? await publishApolloRelease(context, {
				...parsed,
				title: parsed.releaseTitle,
				comment: parsed.releaseComment ?? parsed.comment,
			})
		: undefined;
	return {
		ok: true,
		appId: scope.appId,
		env: scope.env,
		cluster: scope.cluster,
		namespace: scope.namespace,
		key: parsed.key,
		released: Boolean(release),
		release,
	};
}

export async function deleteApolloItem(context: ApolloServiceOperationContext, input: unknown): Promise<unknown> {
	const parsed = context.parse(ApolloDeleteItemInputSchema, input);
	const scope = resolveApolloScope(context.config, parsed);
	await context.adminMutation(
		apolloItemPath(scope, parsed.key),
		{
			method: 'DELETE',
			query: { operator: requireApolloOperator(scope) },
		},
		ItemWriteOutcome,
	);
	return {
		ok: true,
		appId: scope.appId,
		env: scope.env,
		cluster: scope.cluster,
		namespace: scope.namespace,
		key: parsed.key,
	};
}

export async function publishApolloRelease(
	context: ApolloServiceOperationContext,
	input: unknown = {},
): Promise<unknown> {
	const parsed = context.parse(ApolloPublishReleaseInputSchema, input);
	const scope = resolveApolloScope(context.config, parsed);
	return context.adminMutation(
		apolloReleasePath(scope),
		{
			method: 'POST',
			body: compactApolloRecord({
				releaseTitle: parsed.title ?? `Apollo ${scope.namespace} ${new Date().toISOString()}`,
				releaseComment: parsed.comment,
				releasedBy: requireApolloOperator(scope),
			}),
		},
		PublishOutcome,
	);
}

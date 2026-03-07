import type { GrafanaContext } from '../server';
import { resolveTimeRange, toRecord } from '../utils';

export async function requireDatasource(ctx: GrafanaContext, datasourceUid: string) {
	if (!datasourceUid) throw new Error('datasourceUid is required');
	return ctx.client.getDatasource(datasourceUid);
}

export function buildScopedVars(variables: Record<string, string> = {}) {
	return Object.fromEntries(
		Object.entries(variables).map(([key, value]) => [
			key,
			{
				text: value,
				value,
			},
		]),
	);
}

export async function queryDatasource(
	ctx: GrafanaContext,
	input: {
		datasourceUid: string;
		queries: Array<Record<string, unknown>>;
		from?: string | null;
		to?: string | null;
		variables?: Record<string, string>;
	},
) {
	await requireDatasource(ctx, input.datasourceUid);
	const range = resolveTimeRange({
		from: input.from,
		to: input.to,
	});

	return ctx.client.queryDatasource({
		from: String(range.fromMs),
		to: String(range.toMs),
		queries: input.queries.map((query, index) => ({
			refId: String.fromCharCode(65 + index),
			datasource: {
				type: query.datasourceType,
				uid: input.datasourceUid,
			},
			...query,
		})),
		scopedVars: buildScopedVars(input.variables),
	});
}

export function firstFrameData(response: unknown) {
	const results = toRecord(toRecord(response).results);
	const first = Object.values(results).find(Boolean);
	return toRecord(first);
}

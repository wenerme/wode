import { z } from 'zod';
import type { GrafanaContext } from '../server';
import { registerJsonTool } from '../toolkit';
import { resolveTimeRange } from '../utils';

function normalizeMatchers(matchers?: string | null) {
	const value = (matchers || '{}').trim();
	return value.startsWith('{') ? value : `{${value}}`;
}

function pyroscopeBasePath(datasourceUid: string) {
	return `/api/datasources/proxy/uid/${encodeURIComponent(datasourceUid)}`;
}

export function registerPyroscopeTools(ctx: GrafanaContext) {
	registerJsonTool(
		ctx,
		'list_pyroscope_label_names',
		{
			description: 'List Pyroscope label names',
			inputSchema: z.object({
				data_source_uid: z.string(),
				matchers: z.string().nullish(),
				start_rfc_3339: z.string().nullish(),
				end_rfc_3339: z.string().nullish(),
			}),
			readOnly: true,
		},
		({ data_source_uid, matchers, start_rfc_3339, end_rfc_3339 }) => {
			const range = resolveTimeRange({ from: start_rfc_3339, to: end_rfc_3339 });
			return ctx.client.request({
				path: `${pyroscopeBasePath(data_source_uid)}/pyroscope/labelnames`,
				params: {
					'match[]': normalizeMatchers(matchers),
					start: range.fromMs,
					end: range.toMs,
				},
			});
		},
	);

	registerJsonTool(
		ctx,
		'list_pyroscope_label_values',
		{
			description: 'List Pyroscope label values',
			inputSchema: z.object({
				data_source_uid: z.string(),
				name: z.string(),
				matchers: z.string().nullish(),
				start_rfc_3339: z.string().nullish(),
				end_rfc_3339: z.string().nullish(),
			}),
			readOnly: true,
		},
		({ data_source_uid, name, matchers, start_rfc_3339, end_rfc_3339 }) => {
			const range = resolveTimeRange({ from: start_rfc_3339, to: end_rfc_3339 });
			return ctx.client.request({
				path: `${pyroscopeBasePath(data_source_uid)}/pyroscope/labelvalues`,
				params: {
					label: name,
					'match[]': normalizeMatchers(matchers),
					start: range.fromMs,
					end: range.toMs,
				},
			});
		},
	);

	registerJsonTool(
		ctx,
		'list_pyroscope_profile_types',
		{
			description: 'List Pyroscope profile types',
			inputSchema: z.object({
				data_source_uid: z.string(),
				start_rfc_3339: z.string().nullish(),
				end_rfc_3339: z.string().nullish(),
			}),
			readOnly: true,
		},
		({ data_source_uid, start_rfc_3339, end_rfc_3339 }) => {
			const range = resolveTimeRange({ from: start_rfc_3339, to: end_rfc_3339 });
			return ctx.client.request({
				path: `${pyroscopeBasePath(data_source_uid)}/pyroscope/profileTypes`,
				params: {
					start: range.fromMs,
					end: range.toMs,
				},
			});
		},
	);

	registerJsonTool(
		ctx,
		'fetch_pyroscope_profile',
		{
			description: 'Fetch a rendered Pyroscope profile',
			inputSchema: z.object({
				data_source_uid: z.string(),
				profile_type: z.string(),
				matchers: z.string().nullish(),
				max_node_depth: z.number().int().default(100),
				start_rfc_3339: z.string().nullish(),
				end_rfc_3339: z.string().nullish(),
			}),
			readOnly: true,
		},
		async ({ data_source_uid, profile_type, matchers, max_node_depth, start_rfc_3339, end_rfc_3339 }) => {
			const range = resolveTimeRange({ from: start_rfc_3339, to: end_rfc_3339 });
			return ctx.client.requestText({
				path: `${pyroscopeBasePath(data_source_uid)}/pyroscope/render`,
				params: {
					query: `${profile_type}${normalizeMatchers(matchers)}`,
					from: range.fromMs,
					until: range.toMs,
					format: 'dot',
					'max-nodes': max_node_depth,
				},
			});
		},
	);
}

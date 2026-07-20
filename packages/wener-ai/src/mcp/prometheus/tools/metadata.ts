import { resolveRelativeTime } from '@wener/common/dayjs';
import { GetLabelsInputSchema, GetLabelValuesInputSchema, GetSeriesInputSchema } from '../schemas';
import type { PrometheusContext } from '../server';

export function registerMetadataTools(ctx: PrometheusContext) {
	const { server, request, log } = ctx;

	server.registerTool(
		'get_series',
		{
			description: 'List time series matching label selectors. Useful for discovering available metrics.',
			inputSchema: GetSeriesInputSchema,
			annotations: { readOnlyHint: true },
		},
		async ({ match, startTime, endTime, limit }) => {
			const startDate = resolveRelativeTime(startTime);
			const endDate = resolveRelativeTime(endTime);
			const args = {
				'match[]': match,
				start: startDate?.toISOString(),
				end: endDate?.toISOString(),
				limit,
			};
			log.info(`get_series: ${match?.join(', ') ?? 'all'}`);
			const result = await request({ path: '/api/v1/series', params: args });
			return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
		},
	);

	server.registerTool(
		'get_labels',
		{
			description: 'List all label names. Start here to explore available dimensions for filtering.',
			inputSchema: GetLabelsInputSchema,
			annotations: { readOnlyHint: true },
		},
		async ({ match, startTime, endTime, limit }) => {
			const startDate = resolveRelativeTime(startTime);
			const endDate = resolveRelativeTime(endTime);
			const args = {
				'match[]': match,
				start: startDate?.toISOString(),
				end: endDate?.toISOString(),
				limit,
			};
			log.info(`get_labels: ${match?.join(', ') ?? 'all'}`);
			const result = await request({ path: '/api/v1/labels', params: args });
			return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
		},
	);

	server.registerTool(
		'get_label_values',
		{
			description: 'List all values for a specific label. Useful for finding filter options (e.g., all job names).',
			inputSchema: GetLabelValuesInputSchema,
			annotations: { readOnlyHint: true },
		},
		async ({ name, match, startTime, endTime, limit }) => {
			const startDate = resolveRelativeTime(startTime);
			const endDate = resolveRelativeTime(endTime);
			const args = {
				'match[]': match,
				start: startDate?.toISOString(),
				end: endDate?.toISOString(),
				limit,
			};
			log.info(`get_label_values: ${name}`);
			const result = await request({
				path: `/api/v1/label/${encodeURIComponent(name)}/values`,
				params: args,
			});
			return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
		},
	);
}

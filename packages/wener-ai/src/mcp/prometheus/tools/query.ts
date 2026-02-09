import { resolveRelativeTime } from '@wener/common/dayjs';
import { QueryInputSchema } from '../schemas';
import type { PrometheusContext } from '../server';

export function registerQueryTools(ctx: PrometheusContext) {
	const { server, request, log } = ctx;

	server.registerTool(
		'query',
		{
			description: `Execute a PromQL query. Supports both instant and range queries.
- Instant query: Only provide 'expr' (and optionally 'time')
- Range query: Provide 'expr', 'startTime', and optionally 'endTime' and 'step'
Use resource "promql-guide" for PromQL syntax help.`,
			inputSchema: QueryInputSchema,
			annotations: { readOnlyHint: true },
		},
		async ({ expr, time, startTime, endTime, step }) => {
			// Determine if this is a range query or instant query
			const isRangeQuery = startTime !== undefined && startTime !== null;

			if (isRangeQuery) {
				// Range query
				const startDate = resolveRelativeTime(startTime);
				const endDate = resolveRelativeTime(endTime) ?? new Date();

				if (!startDate) {
					return { content: [{ type: 'text', text: `Error: Invalid start time: ${startTime}` }], isError: true };
				}

				// Calculate step if not provided
				let resolvedStep = step;
				if (!resolvedStep) {
					// Auto-calculate: aim for ~100-200 data points
					const rangeMs = endDate.getTime() - startDate.getTime();
					const targetPoints = 150;
					const stepMs = Math.max(1000, Math.floor(rangeMs / targetPoints));
					resolvedStep = `${Math.floor(stepMs / 1000)}s`;
				}

				const args = {
					query: expr,
					start: startDate.toISOString(),
					end: endDate.toISOString(),
					step: resolvedStep,
				};
				log.info(`query_range: ${expr} from ${startTime} to ${endTime ?? 'now'} step ${resolvedStep}`);
				const result = await request({ path: '/api/v1/query_range', params: args });
				return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
			}

			// Instant query
			const parsedTime = resolveRelativeTime(time);
			const args = {
				query: expr,
				time: parsedTime ? parsedTime.toISOString() : undefined,
			};
			log.info(`query: ${expr}${time ? ` at ${time}` : ''}`);
			const result = await request({ path: '/api/v1/query', params: args });
			return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
		},
	);
}

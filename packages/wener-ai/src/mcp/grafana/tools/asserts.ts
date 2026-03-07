import { z } from 'zod';
import type { GrafanaContext } from '../server';
import { registerJsonTool } from '../toolkit';
import { resolveTimeRange } from '../utils';

export function registerAssertsTools(ctx: GrafanaContext) {
	registerJsonTool(
		ctx,
		'get_assertions',
		{
			description: 'Get assertion summaries from the Grafana Asserts app',
			inputSchema: z.object({
				startTime: z.string(),
				endTime: z.string(),
				entityType: z.string(),
				entityName: z.string(),
				env: z.string().nullish(),
				site: z.string().nullish(),
				namespace: z.string().nullish(),
			}),
			readOnly: true,
		},
		async ({ startTime, endTime, entityType, entityName, env, site, namespace }) => {
			const range = resolveTimeRange({ from: startTime, to: endTime });
			return ctx.client.request({
				path: '/api/plugins/grafana-asserts-app/resources/asserts/api-server/v1/assertions/llm-summary',
				method: 'POST',
				body: {
					startTime: range.fromMs,
					endTime: range.toMs,
					entityKeys: [
						{
							type: entityType,
							name: entityName,
							scope: {
								env: env || undefined,
								site: site || undefined,
								namespace: namespace || undefined,
							},
						},
					],
					suggestionSrcEntities: [],
					alertCategories: ['saturation', 'amend', 'anomaly', 'failure', 'error'],
				},
			});
		},
	);
}

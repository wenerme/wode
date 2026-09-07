import type { GrafanaContext } from '../server';
import { EmptySchema, registerJsonTool } from '../toolkit';

export function registerSystemTools(ctx: GrafanaContext) {
	registerJsonTool(
		ctx,
		'health',
		{
			description: 'Check Grafana health status',
			inputSchema: EmptySchema,
			readOnly: true,
		},
		() => ctx.client.request({ path: '/api/health' }),
	);
}

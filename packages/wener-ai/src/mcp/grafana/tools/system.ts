import { registerJsonTool, EmptySchema } from '../toolkit';
import type { GrafanaContext } from '../server';

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

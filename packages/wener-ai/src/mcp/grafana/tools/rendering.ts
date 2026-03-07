import { z } from 'zod';
import type { GrafanaContext } from '../server';
import { registerJsonTool } from '../toolkit';

const GetPanelImageInputSchema = z.object({
	dashboardUid: z.string().describe('Dashboard UID'),
	panelId: z.number().int().nullish().describe('Optional panel ID, omit to render full dashboard'),
	width: z.number().int().min(100).max(4000).default(1600),
	height: z.number().int().min(100).max(4000).default(900),
	theme: z.enum(['light', 'dark']).default('light'),
	from: z.string().nullish().describe('Start time'),
	to: z.string().nullish().describe('End time'),
	scale: z.number().min(0.1).max(4).default(1),
	variables: z.record(z.string(), z.string()).default({}).describe('Dashboard variables'),
});

export function registerRenderingTools(ctx: GrafanaContext) {
	registerJsonTool(
		ctx,
		'get_panel_image',
		{
			description: 'Render a Grafana panel or dashboard as a PNG image and return base64 payload',
			inputSchema: GetPanelImageInputSchema,
			readOnly: true,
		},
		async ({ dashboardUid, panelId, width, height, theme, from, to, scale, variables }) => {
			const path = panelId ? `/render/d-solo/${dashboardUid}` : `/render/d/${dashboardUid}`;
			const buffer = await ctx.client.requestArrayBuffer({
				path,
				params: {
					viewPanel: panelId,
					width,
					height,
					theme,
					from,
					to,
					scale,
					...Object.fromEntries(Object.entries(variables).map(([key, value]) => [`var-${key}`, value])),
				},
			});
			return {
				mediaType: 'image/png',
				base64: Buffer.from(buffer).toString('base64'),
				bytes: buffer.byteLength,
			};
		},
	);
}

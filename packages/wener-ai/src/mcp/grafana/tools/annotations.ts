import { z } from 'zod';
import type { GrafanaContext } from '../server';
import { registerJsonTool } from '../toolkit';

const GetAnnotationsInputSchema = z.object({
	from: z.string().nullish().describe('Start time'),
	to: z.string().nullish().describe('End time'),
	dashboardUid: z.string().nullish().describe('Dashboard UID'),
	panelId: z.number().int().nullish().describe('Panel ID'),
	tags: z.array(z.string()).default([]).describe('Annotation tags'),
	matchAny: z.boolean().default(false).describe('Match any tag instead of all tags'),
	limit: z.number().int().min(1).max(500).default(100).describe('Maximum results'),
});

const CreateAnnotationInputSchema = z.object({
	dashboardUID: z.string().nullish().describe('Dashboard UID'),
	panelID: z.number().int().nullish().describe('Panel ID'),
	time: z.number().int().nullish().describe('Epoch milliseconds'),
	timeEnd: z.number().int().nullish().describe('Epoch milliseconds'),
	text: z.string().describe('Annotation text'),
	tags: z.array(z.string()).default([]).describe('Annotation tags'),
});

const UpdateAnnotationInputSchema = z.object({
	id: z.union([z.number().int(), z.string()]).describe('Annotation ID'),
	time: z.number().int().nullish().describe('Epoch milliseconds'),
	timeEnd: z.number().int().nullish().describe('Epoch milliseconds'),
	text: z.string().nullish().describe('Annotation text'),
	tags: z.array(z.string()).nullish().describe('Annotation tags'),
});

const GetAnnotationTagsInputSchema = z.object({
	limit: z.number().int().min(1).max(500).default(100).describe('Maximum tags'),
	query: z.string().nullish().describe('Optional tag prefix'),
});

export function registerAnnotationTools(ctx: GrafanaContext) {
	registerJsonTool(
		ctx,
		'get_annotations',
		{
			description: 'Query Grafana annotations with filters',
			inputSchema: GetAnnotationsInputSchema,
			readOnly: true,
		},
		({ from, to, dashboardUid, panelId, tags, matchAny, limit }) =>
			ctx.client.request({
				path: '/api/annotations',
				params: {
					from,
					to,
					dashboardUID: dashboardUid,
					panelId,
					'tags[]': tags,
					matchAny,
					limit,
				},
			}),
	);

	if (ctx.writeEnabled) {
		registerJsonTool(
			ctx,
			'create_annotation',
			{
				description: 'Create a Grafana annotation',
				inputSchema: CreateAnnotationInputSchema,
			},
			(input) =>
				ctx.client.request({
					path: '/api/annotations',
					method: 'POST',
					body: input,
				}),
		);

		registerJsonTool(
			ctx,
			'update_annotation',
			{
				description: 'Update an existing Grafana annotation',
				inputSchema: UpdateAnnotationInputSchema,
			},
			({ id, ...body }) =>
				ctx.client.request({
					path: `/api/annotations/${id}`,
					method: 'PUT',
					body,
				}),
		);
	}

	registerJsonTool(
		ctx,
		'get_annotation_tags',
		{
			description: 'List annotation tags',
			inputSchema: GetAnnotationTagsInputSchema,
			readOnly: true,
		},
		({ limit, query }) =>
			ctx.client.request({
				path: '/api/annotations/tags',
				params: { limit, query },
			}),
	);
}

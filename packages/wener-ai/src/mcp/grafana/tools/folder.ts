import { z } from 'zod';
import type { GrafanaContext } from '../server';
import { registerJsonTool } from '../toolkit';

const CreateFolderInputSchema = z.object({
	title: z.string().describe('Folder title'),
	uid: z.string().nullish().describe('Optional folder UID'),
	parentUid: z.string().nullish().describe('Optional parent folder UID'),
});

export function registerFolderTools(ctx: GrafanaContext) {
	if (!ctx.writeEnabled) return;

	registerJsonTool(
		ctx,
		'create_folder',
		{
			description: 'Create a Grafana folder',
			inputSchema: CreateFolderInputSchema,
		},
		({ title, uid, parentUid }) =>
			ctx.client.request({
				path: '/api/folders',
				method: 'POST',
				body: {
					title,
					uid: uid || undefined,
					parentUid: parentUid || undefined,
				},
			}),
	);
}

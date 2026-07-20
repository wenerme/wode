import { z } from 'zod';
import type { GrafanaContext } from './server';

export type JsonResult = {
	content: { type: 'text'; text: string }[];
	isError?: boolean;
};

export function registerJsonTool<TSchema extends z.ZodTypeAny>(
	ctx: GrafanaContext,
	name: string,
	config: {
		description: string;
		inputSchema: TSchema;
		readOnly?: boolean;
	},
	handler: (input: z.infer<TSchema>) => Promise<unknown> | unknown,
) {
	ctx.server.registerTool(
		name,
		{
			description: config.description,
			inputSchema: config.inputSchema,
			annotations: config.readOnly ? { readOnlyHint: true } : undefined,
		},
		async (input: unknown) => {
			try {
				const data = await handler(input as z.infer<TSchema>);
				if (data && typeof data === 'object' && 'content' in (data as Record<string, unknown>)) {
					return data as any;
				}
				return ctx.jsonResult(data) as any;
			} catch (error) {
				return ctx.textResult(error instanceof Error ? error.message : String(error), true) as any;
			}
		},
	);
}

export const EmptySchema = z.object({});

export const TimeRangeSchema = z.object({
	from: z.string().nullish().describe('Start time, supports RFC3339 or relative time like now-1h'),
	to: z.string().nullish().describe('End time, supports RFC3339 or relative time like now'),
});

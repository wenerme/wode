import { z } from 'zod';

export const StatInputSchema = z.object({
	namespace: z.string().nullish().describe('Namespace name (default: "application")'),
	cluster: z.string().nullish().describe('Cluster name (default: "default")'),
});

export const GetInputSchema = z.object({
	namespace: z
		.string()
		.nullish()
		.describe(
			'Namespace name (default: "application"). Format auto-detected from extension (e.g. "app.json", "app.yaml")',
		),
	cluster: z.string().nullish().describe('Cluster name (default: "default")'),
	format: z
		.string()
		.nullish()
		.describe('Output format: "json", "yaml", "properties", "raw". Auto-detected from namespace extension if omitted'),
});

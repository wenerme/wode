import { z } from 'zod';

export const ListToolsInputSchema = z.object({});

export const CallToolInputSchema = z.object({
	name: z.string().describe('Tool name'),
	arguments: z.record(z.string(), z.any()).default({}).describe('Tool arguments'),
});

export const ListResourcesInputSchema = z.object({});

export const ReadResourceInputSchema = z.object({
	uri: z.string().describe('Resource URI'),
});

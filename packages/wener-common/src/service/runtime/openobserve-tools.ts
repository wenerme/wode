import { z } from 'zod';
import { validateOpenObserveStreamSettingsUpdate } from '@wener/client/openobserve';
import type { ServiceSchema } from './types';

const page = {
	offset: z.number().int().min(0).max(2_147_483_647).optional(),
};
const stream = { organization: z.string().optional(), stream: z.string().min(1), streamType: z.enum(['logs', 'metrics', 'traces']).optional() };
export const OpenObserveWriteOperations = new Set(['updateStreamSettings', 'deleteStream', 'ingestJson', 'ingestMulti']);
export const OpenObserveToolInputs = {
	health: z.strictObject({}),
	status: z.strictObject({
		organization: z.string().optional(),
		streamType: z.enum(['logs', 'metrics', 'traces']).optional(),
	}),
	listStreams: z.strictObject({
		organization: z.string().optional(),
		streamType: z.enum(['logs', 'metrics', 'traces']).optional(),
		...page,
		limit: z.number().int().min(1).max(1000).optional(),
		fetchSchema: z.boolean().optional(),
		keyword: z.string().optional(),
	}),
	getStreamSchema: z.strictObject({
		organization: z.string().optional(),
		stream: z.string().min(1),
		streamType: z.enum(['logs', 'metrics', 'traces']).optional(),
		...page,
		limit: z.number().int().min(1).max(1000).optional(),
		keyword: z.string().optional(),
	}),
	search: z.strictObject({
		organization: z.string().optional(),
		streamType: z.enum(['logs', 'metrics', 'traces']).optional(),
		sql: z.string().min(1).max(65536),
		startTimeMicros: z.number().int().nonnegative(),
		endTimeMicros: z.number().int().nonnegative(),
		from: z.number().int().nonnegative().optional(),
		size: z.number().int().min(1).max(1000).optional(),
		timeoutSeconds: z.number().int().min(1).max(60).optional(),
	}),
	listTraces: z.strictObject({
		organization: z.string().optional(),
		stream: z.string().min(1),
		startTimeMicros: z.number().int().nonnegative(),
		endTimeMicros: z.number().int().nonnegative(),
		from: z.number().int().nonnegative().optional(),
		size: z.number().int().min(1).max(1000).optional(),
		filter: z.string().optional(),
		timeoutSeconds: z.number().int().min(1).max(60).optional(),
		sortBy: z.enum(['start_time', 'duration']).optional(),
		sortOrder: z.enum(['asc', 'desc']).optional(),
	}),
	getStreamSettings: z.strictObject(stream),
	updateStreamSettings: z.strictObject({ ...stream, settings: z.record(z.string(), z.json()).superRefine((value, context) => {
		try { validateOpenObserveStreamSettingsUpdate(value); }
		catch { context.addIssue({ code: 'custom', message: 'Invalid OpenObserve settings' }); }
	}) }),
	deleteStream: z.strictObject({ ...stream, deleteAll: z.boolean().optional() }),
	ingestJson: z.strictObject({ organization: z.string().optional(), stream: z.string().min(1), records: z.array(z.record(z.string(), z.json())).min(1).max(10_000) }),
	ingestMulti: z.strictObject({ organization: z.string().optional(), stream: z.string().min(1), records: z.union([z.string().min(1), z.array(z.record(z.string(), z.json())).min(1).max(10_000)]) }),
	getValues: z.strictObject({ ...stream, fields: z.array(z.string().min(1)).min(1).max(100), startTimeMicros: z.number().int().nonnegative(), endTimeMicros: z.number().int().nonnegative(), size: z.number().int().min(1).max(1000).optional(), keyword: z.string().optional(), noCount: z.boolean().optional() }),
	searchAround: z.strictObject({ ...stream, key: z.number().int().nonnegative(), size: z.number().int().min(1).max(1000).optional() }),
};
export const OpenObserveTools: ServiceSchema['tools'] = Object.fromEntries(
	Object.keys(OpenObserveToolInputs).map((name) => [
		name,
		{
			description: `OpenObserve ${name}`,
			inputSchema: z.toJSONSchema(OpenObserveToolInputs[name as keyof typeof OpenObserveToolInputs]),
			annotations: { readOnlyHint: !OpenObserveWriteOperations.has(name), destructiveHint: name === 'deleteStream' },
		},
	]),
);

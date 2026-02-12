import { oc } from '@orpc/contract';
import { z } from 'zod';

// Audit event schema
export const AuditEventSchema = z.object({
	id: z.string(),
	timestamp: z.string(),
	method: z.string(),
	path: z.string(),
	serverName: z.string().nullish(),
	serverType: z.string().nullish(),
	status: z.number().nullish(),
	durationMs: z.number().nullish(),
	requestHeaders: z.record(z.string(), z.string()).nullish(),
	responseHeaders: z.record(z.string(), z.string()).nullish(),
	requestBody: z.unknown().nullish(),
	responseBody: z.unknown().nullish(),
	error: z.string().nullish(),
	toolName: z.string().nullish(),
	toolArgs: z.unknown().nullish(),
});
export type AuditEvent = z.infer<typeof AuditEventSchema>;

// Query params
export const AuditQuerySchema = z.object({
	limit: z.coerce.number().default(50),
	offset: z.coerce.number().default(0),
	serverName: z.string().nullish(),
	serverType: z.string().nullish(),
	method: z.string().nullish(),
	from: z.string().nullish(),
	to: z.string().nullish(),
});

// Audit stats
export const AuditStatsSchema = z.object({
	totalRequests: z.number(),
	totalErrors: z.number(),
	avgDurationMs: z.number(),
	byServer: z.array(
		z.object({
			name: z.string(),
			count: z.number(),
		}),
	),
	byMethod: z.array(
		z.object({
			method: z.string(),
			count: z.number(),
		}),
	),
});

// Contract definition
export const AuditContract = oc.prefix('/audit').router({
	// List audit events
	list: oc
		.input(AuditQuerySchema)
		.output(
			z.object({
				events: z.array(AuditEventSchema),
				total: z.number(),
			}),
		)
		.route({ method: 'GET', path: '/', summary: 'List audit events' }),

	// Get single event
	get: oc
		.input(z.object({ id: z.string() }))
		.output(AuditEventSchema.nullable())
		.route({ method: 'GET', path: '/{id}', summary: 'Get audit event by ID' }),

	// Get stats
	stats: oc
		.input(
			z.object({
				from: z.string().nullish(),
				to: z.string().nullish(),
			}),
		)
		.output(AuditStatsSchema)
		.route({ method: 'GET', path: '/stats', summary: 'Get audit statistics' }),

	// Clear old events
	clear: oc
		.input(
			z.object({
				before: z.string().describe('Clear events before this timestamp'),
			}),
		)
		.output(z.object({ deleted: z.number() }))
		.route({ method: 'DELETE', path: '/', summary: 'Clear audit events' }),
});

import { z } from 'zod';
import type { ServiceSchema } from './types';

const time = z.union([z.number().refine(Number.isFinite), z.string().min(1).max(256)]);
const match = z.array(z.string().min(1)).min(1).max(10_000);
export const PrometheusToolInputs = {
	query: z.strictObject({ query: z.string().min(1), time: time.optional(), timeout: z.string().min(1).max(256).optional() }),
	queryRange: z.strictObject({ query: z.string().min(1), start: time, end: time, step: time, timeout: z.string().min(1).max(256).optional() }),
	series: z.strictObject({ match, start: time.optional(), end: time.optional() }),
	labels: z.strictObject({ match: match.optional(), start: time.optional(), end: time.optional() }),
	labelValues: z.strictObject({ label: z.string().min(1), match: match.optional(), start: time.optional(), end: time.optional() }),
	metadata: z.strictObject({ limit: z.number().int().min(1).max(1_000_000).optional(), metric: z.string().min(1).optional() }),
};

export const PrometheusTools: ServiceSchema['tools'] = Object.fromEntries(
	Object.keys(PrometheusToolInputs).map((name) => [
		name,
		{
			description: `Prometheus ${name}`,
			inputSchema: z.toJSONSchema(PrometheusToolInputs[name as keyof typeof PrometheusToolInputs]),
			annotations: { readOnlyHint: true, destructiveHint: false },
		},
	]),
);

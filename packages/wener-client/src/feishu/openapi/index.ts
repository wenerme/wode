import { FeishuApiIndex, FeishuApiServiceLoaders } from './generated/index.gen';
import type { FeishuApiDefinition, FeishuApiSchemas, FeishuApiSummary } from './types';

export { FeishuApiIndex, FeishuApiServices, FeishuApiSourceCommit } from './generated/index.gen';
export type * from './types';

let byId: Map<string, FeishuApiSummary> | undefined;

export function getFeishuApiSummary(id: string): FeishuApiSummary | undefined {
	byId ||= new Map(FeishuApiIndex.map((v) => [v.id, v]));
	return byId.get(id);
}

/** Load all schemas of one service; only that service's chunk is imported. */
export async function loadFeishuApiService(service: string): Promise<FeishuApiDefinition[]> {
	const loader = Object.hasOwn(FeishuApiServiceLoaders, service) ? FeishuApiServiceLoaders[service] : undefined;
	if (!loader) throw new Error(`Unknown Feishu API service: ${service}`);
	const schemas = await loader();
	return FeishuApiIndex.filter((v) => v.service === service).map((v) => merge(v, schemas[v.id]));
}

/** Load one API definition (summary + zod schemas) by id. */
export async function loadFeishuApi(id: string): Promise<FeishuApiDefinition> {
	const summary = getFeishuApiSummary(id);
	if (!summary) throw new Error(`Unknown Feishu API: ${id}`);
	const schemas = await FeishuApiServiceLoaders[summary.service]();
	return merge(summary, schemas[id]);
}

function merge(summary: FeishuApiSummary, schemas: FeishuApiSchemas | undefined): FeishuApiDefinition {
	return { ...summary, ...schemas };
}

export interface FeishuApiRequestInput {
	path?: Record<string, unknown>;
	query?: Record<string, unknown>;
	body?: unknown;
}

export interface FeishuApiRequest {
	method: string;
	/** Path with encoded params, starting with `/open-apis/`. */
	path: string;
	query: Record<string, string | string[]>;
	body?: unknown;
}

/**
 * Build a request description from a definition (no network, no validation of query/body;
 * use the definition schemas for that). Path params are required, encoded and must not be
 * empty, `.`, `..` or contain `/`.
 */
export function buildFeishuApiRequest(
	definition: Pick<FeishuApiSummary, 'httpMethod' | 'path'>,
	input: FeishuApiRequestInput = {},
): FeishuApiRequest {
	const params = input.path || {};
	const path = definition.path.replace(/\{([^}]+)\}/g, (_, name: string) => {
		const raw = params[name];
		if (raw === undefined || raw === null) throw new Error(`Missing path parameter: ${name}`);
		if (typeof raw !== 'string' && typeof raw !== 'number') throw new Error(`Invalid path parameter: ${name}`);
		const value = String(raw);
		if (!value || value === '.' || value === '..' || value.includes('/') || value.includes('\\')) {
			throw new Error(`Invalid path parameter: ${name}`);
		}
		return encodeURIComponent(value);
	});
	const query: Record<string, string | string[]> = {};
	for (const [k, v] of Object.entries(input.query || {})) {
		if (v === undefined || v === null) continue;
		query[k] = Array.isArray(v) ? v.map((x) => String(x)) : String(v);
	}
	const out: FeishuApiRequest = { method: definition.httpMethod.toUpperCase(), path, query };
	if (input.body !== undefined) out.body = input.body;
	return out;
}

export function classifyFeishuApiRisk(risk: string): { readOnly: boolean; destructive: boolean } {
	return { readOnly: risk === 'read', destructive: risk === 'high-risk-write' };
}

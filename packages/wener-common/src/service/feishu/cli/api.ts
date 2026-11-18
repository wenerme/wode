import { type ServiceCliOperation, type ServiceCliOptions, serviceCliString, serviceCliStrings } from '../../cli/ServiceCliDefinition';
import { ServiceCliInputError } from '../../cli/ServiceCliInputError';
import { loadFeishuApiCatalog } from '../api';
import * as apiSchema from '../api.schema';
import type { IFeishuService } from '../IFeishuService';
import { sanitizeFeishuOutput } from '../sanitize';
import { feishuParseInput, feishuRequireYes } from './input';
import type { CliTable } from '../../../cli/render/CliTable';

type FeishuCommand = ServiceCliOperation<IFeishuService>;
const MIB = 1024 * 1024;
const RISKS = ['read', 'write', 'high-risk-write'] as const;
const yesOption = { name: 'yes', description: 'Confirm the write operation', type: 'boolean' } as const;

/** Parse repeatable `k=v` options; a repeated key becomes an array (query) or is rejected (path). */
function keyValues(options: ServiceCliOptions, name: string, allowRepeat: boolean): Record<string, string | string[]> | undefined {
	const values = serviceCliStrings(options, name);
	if (!values?.length) return undefined;
	const result: Record<string, string | string[]> = {};
	for (const entry of values) {
		const index = entry.indexOf('=');
		const key = index > 0 ? entry.slice(0, index).trim() : '';
		if (!key) throw new ServiceCliInputError(`--${name} must be key=value`);
		const value = entry.slice(index + 1);
		const existing = result[key];
		if (existing === undefined) result[key] = value;
		else if (!allowRepeat) throw new ServiceCliInputError(`--${name} ${key} is given more than once`);
		else result[key] = Array.isArray(existing) ? [...existing, value] : [existing, value];
	}
	return result;
}

async function readJsonData(context: Parameters<FeishuCommand['prepare']>[0], value: string): Promise<unknown> {
	const text = await context.readText(value, { label: 'Feishu API data', maxBytes: MIB });
	try {
		return JSON.parse(text);
	} catch {
		throw new ServiceCliInputError('--data must contain valid JSON');
	}
}

function apiListTable(value: unknown): CliTable {
	const items = (value as { items?: Array<Record<string, unknown>> })?.items ?? [];
	return {
		kind: 'list',
		headers: ['id', 'risk', 'method', 'path', 'available', 'summary'],
		rows: items.map((item) => [item.id, item.risk, item.httpMethod, item.path, item.available, item.summary]),
		emptyMessage: 'No matching Feishu API',
	};
}

/**
 * `woctl feishu api ...`: generic catalog layer plus the raw passthrough.
 * - `api list|describe` are catalog lookups (no credentials or HTTP).
 * - `api call <id>` routes read APIs to `callReadApi` and others to `callWriteApi`.
 * - `api request <METHOD> <PATH>` is the unchecked raw passthrough.
 */
export function feishuApiCommands(): FeishuCommand[] {
	return [
		{
			group: 'api', name: 'list', aliases: ['ls'],
			description: 'List generic Feishu OpenAPI catalog entries callable with a tenant token',
			examples: [{ command: 'woctl feishu api list --api-service im --risk read' }, { command: 'woctl feishu api list --search pin --all' }],
			options: [
				{ name: 'api-service', description: 'Catalog service, such as im, calendar or drive (--service selects the configured woctl service)' },
				{ name: 'risk', description: 'read, write or high-risk-write' },
				{ name: 'search', description: 'Case-insensitive text filter over id, path and summary' },
				{ name: 'all', description: 'Include APIs this service cannot call (user token or multipart)', type: 'boolean' },
			],
			table: apiListTable,
			prepare({ options }) {
				const risk = serviceCliString(options, 'risk');
				if (risk !== undefined && !(RISKS as readonly string[]).includes(risk))
					throw new ServiceCliInputError(`--risk must be one of ${RISKS.join(', ')}`);
				const input = feishuParseInput(apiSchema.FeishuListApiInputSchema, {
					service: serviceCliString(options, 'api-service'), risk,
					query: serviceCliString(options, 'search'), includeUnavailable: options.all === true || undefined,
				});
				return async (client, { signal }) => client.listApi(input, { signal });
			},
		},
		{
			group: 'api', name: 'describe', argument: 'id',
			description: 'Describe a catalog API with JSON Schemas of its path parameters, query, body and response',
			examples: [{ command: 'woctl feishu api describe im.chats.get --json' }],
			prepare({ args }) {
				const input = feishuParseInput(apiSchema.FeishuDescribeApiInputSchema, { id: args[0]?.trim() });
				return async (client, { signal }) => client.describeApi(input, { signal });
			},
		},
		{
			group: 'api', name: 'call', argument: 'id', supportsDryRun: true,
			description: 'Call a catalog API by id; writes require --yes, high-risk writes also --confirm-high-risk',
			examples: [
				{ command: 'woctl feishu api call im.chats.get --path chat_id=oc_xxx' },
				{ command: 'woctl feishu api call im.pins.create --data \'{"message_id":"om_xxx"}\' --yes' },
				{ command: 'woctl feishu api call im.chats.update --path chat_id=oc_xxx --data @chat.json --dry-run' },
			],
			options: [
				{ name: 'path', description: 'Path parameter key=value', repeatable: true },
				{ name: 'query', description: 'Query parameter key=value; repeat a key for a list', repeatable: true },
				{ name: 'data', description: 'JSON body, @file or - for stdin' },
				{ name: 'dry-run', description: 'Validate and print the request without credentials or HTTP', type: 'boolean' },
				yesOption,
				{ name: 'confirm-high-risk', description: 'Confirm a high-risk-write API in addition to --yes', type: 'boolean' },
			],
			async prepare(context) {
				const { args, options } = context;
				const id = feishuParseInput(apiSchema.FeishuDescribeApiInputSchema, { id: args[0]?.trim() }).id;
				const dryRun = options['dry-run'] === true;
				const summary = (await loadFeishuApiCatalog()).getFeishuApiSummary(id);
				if (!summary) throw new ServiceCliInputError(`Unknown Feishu API: ${id}`);
				const write = summary.risk !== 'read';
				// Confirmation precedes reading --data, credentials and HTTP; dry runs have no effect.
				if (write && !dryRun) {
					feishuRequireYes(options, `Feishu API ${id} is ${summary.risk} and requires --yes`);
					if (summary.risk === 'high-risk-write' && options['confirm-high-risk'] !== true)
						throw new ServiceCliInputError(`Feishu API ${id} is high-risk-write and requires --confirm-high-risk`);
				}
				const path = keyValues(options, 'path', false);
				const query = keyValues(options, 'query', true);
				const dataArgument = serviceCliString(options, 'data');
				const body = dataArgument === undefined ? undefined : await readJsonData(context, dataArgument);
				const base = { id, path, query, ...(body === undefined ? {} : { body }), ...(dryRun ? { dryRun: true } : {}) };
				if (!write) {
					const input = feishuParseInput(apiSchema.FeishuCallReadApiInputSchema, base);
					return async (client, { signal }) => sanitizeFeishuOutput(await client.callReadApi(input, { signal }));
				}
				const input = feishuParseInput(apiSchema.FeishuCallWriteApiInputSchema, {
					...base, ...(options['confirm-high-risk'] === true ? { confirmHighRisk: true } : {}),
				});
				return async (client, { signal }) => sanitizeFeishuOutput(await client.callWriteApi(input, { signal }));
			},
		},
		{
			group: 'api', name: 'request', arguments: '<method> <path>', mutating: true,
			description: 'Raw Feishu OpenAPI request without catalog validation; requires --yes and a writable service',
			examples: [{ command: 'woctl feishu api request GET im/v1/chats --query page_size=20 --yes' }],
			options: [
				{ name: 'query', description: 'Query parameter key=value', repeatable: true },
				{ name: 'data', description: 'JSON body, @file or - for stdin' },
				yesOption,
			],
			async prepare(context) {
				const { args, options } = context;
				const method = args[0]?.trim().toUpperCase();
				const path = args[1]?.trim();
				if (!method || !['GET', 'HEAD', 'OPTIONS', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(method))
					throw new ServiceCliInputError('Method must be GET, HEAD, OPTIONS, POST, PUT, PATCH or DELETE');
				if (!path) throw new ServiceCliInputError('Feishu API path is required');
				feishuRequireYes(options, 'Feishu API request requires --yes');
				const query = keyValues(options, 'query', false) as Record<string, string> | undefined;
				const dataArgument = serviceCliString(options, 'data');
				const body = dataArgument === undefined ? undefined : await readJsonData(context, dataArgument);
				const input = { path, method, ...(query ? { params: query } : {}), ...(body === undefined ? {} : { body }) };
				return async (client, { signal }) => sanitizeFeishuOutput(await client.request(input, { signal }));
			},
		},
	];
}

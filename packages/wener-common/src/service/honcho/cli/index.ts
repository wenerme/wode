import type { CliTable } from '../../../cli/render/CliTable';
import { defineServiceCliBinding } from '../../cli/ServiceCliBinding';
import {
	type ServiceCliDefinition,
	type ServiceCliInputContext,
	type ServiceCliOperation,
	serviceCliString,
	serviceCliStrings,
} from '../../cli/ServiceCliDefinition';
import { ServiceCliInputError } from '../../cli/ServiceCliInputError';
import { createHonchoServiceToolClient, type HonchoServiceClient } from '../client';
import { HonchoRequestMethods, isHonchoWriteMethod, type HonchoServiceInputs } from '../HonchoServiceContract';
import { HonchoServiceProvider } from '../index';

type Operation = ServiceCliOperation<HonchoServiceClient>;

const workspaceOption = { name: 'workspace', aliases: ['w'], description: 'Workspace id; defaults to the configured workspace' } as const;
const yesOption = { name: 'yes', description: 'Confirm a write request', type: 'boolean' } as const;
const limitOption = { name: 'limit', aliases: ['n'], description: 'Page size (1-100)' } as const;
const pageOption = { name: 'page', description: 'Page number, starting at 1' } as const;
const metadataOption = { name: 'metadata', description: 'Metadata JSON object, @file or - for stdin' } as const;
const configurationOption = { name: 'configuration', description: 'Configuration JSON object, @file or - for stdin' } as const;
const ReasoningLevels = ['minimal', 'low', 'medium', 'high', 'max'] as const;

function requireYes(context: ServiceCliInputContext, label: string): void {
	if (context.options.yes !== true) throw new ServiceCliInputError(`Honcho ${label} requires --yes`);
}

function parseInteger(value: string | undefined, option: string, minimum: number, maximum: number): number | undefined {
	if (value === undefined) return undefined;
	const parsed = Number(value);
	if (!/^\d+$/u.test(value) || !Number.isSafeInteger(parsed) || parsed < minimum || parsed > maximum)
		throw new ServiceCliInputError(`--${option} must be an integer between ${minimum} and ${maximum}`);
	return parsed;
}

async function readJson(context: ServiceCliInputContext, option: string, maxBytes = 256 * 1024): Promise<unknown> {
	const value = serviceCliString(context.options, option);
	if (value === undefined) return undefined;
	const text = await context.readText(value, { label: `Honcho --${option}`, maxBytes });
	try {
		return JSON.parse(text) as unknown;
	} catch {
		throw new ServiceCliInputError(`--${option} must contain valid JSON`);
	}
}

async function readObject(context: ServiceCliInputContext, option: string): Promise<Record<string, unknown> | undefined> {
	const value = await readJson(context, option);
	if (value === undefined) return undefined;
	if (value === null || typeof value !== 'object' || Array.isArray(value))
		throw new ServiceCliInputError(`--${option} must be a JSON object`);
	return value as Record<string, unknown>;
}

/** Positional words form the text; a single `-` or `@file` argument is read through the host. */
async function readArgsText(context: ServiceCliInputContext, label: string): Promise<string> {
	const args = context.args;
	if (!args.length) throw new ServiceCliInputError(`Honcho ${label} is required; pass text or - for stdin`);
	const text = args.length === 1 && (args[0] === '-' || args[0]!.startsWith('@'))
		? await context.readText(args[0]!, { label: `Honcho ${label}`, maxBytes: 1024 * 1024 })
		: args.join(' ');
	if (!text.trim()) throw new ServiceCliInputError(`Honcho ${label} must not be empty`);
	return text;
}

function workspaceInput(context: ServiceCliInputContext): { workspaceId?: string } {
	const workspaceId = serviceCliString(context.options, 'workspace');
	return workspaceId === undefined ? {} : { workspaceId };
}

function pageInput(context: ServiceCliInputContext) {
	const size = parseInteger(serviceCliString(context.options, 'limit'), 'limit', 1, 100);
	const page = parseInteger(serviceCliString(context.options, 'page'), 'page', 1, Number.MAX_SAFE_INTEGER);
	return { ...(size === undefined ? {} : { size }), ...(page === undefined ? {} : { page }) };
}

function record(value: unknown): Record<string, unknown> {
	return value !== null && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function cell(value: unknown): string {
	if (value === undefined || value === null) return '';
	return typeof value === 'string' ? value : JSON.stringify(value);
}

function itemsTable(headers: string[]) {
	return (value: unknown): CliTable => {
		const source = Array.isArray(value) ? value : record(value).items;
		const rows = Array.isArray(source) ? source : [];
		return { headers, rows: rows.map((entry) => headers.map((key) => cell(record(entry)[key]))) };
	};
}

function argument(context: ServiceCliInputContext, label: string): string {
	const value = context.args[0];
	if (!value?.trim()) throw new ServiceCliInputError(`Honcho ${label} is required`);
	return value;
}

const resourceTable = itemsTable(['id', 'created_at']);
const messageTable = itemsTable(['id', 'peer_id', 'session_id', 'content', 'created_at']);

const commands: Operation[] = [
	{
		name: 'add', arguments: '[text...]', variadic: true, mutating: true,
		description: 'Append a message to a Honcho session; requires --yes',
		options: [
			workspaceOption,
			{ name: 'peer', description: 'Author peer id; defaults to the configured peer' },
			{ name: 'session', description: 'Session id' },
			metadataOption, yesOption,
		],
		async prepare(context) {
			requireYes(context, 'add');
			const sessionId = serviceCliString(context.options, 'session');
			if (!sessionId) throw new ServiceCliInputError('Honcho add requires --session');
			const content = await readArgsText(context, 'message');
			const metadata = await readObject(context, 'metadata');
			const peerId = serviceCliString(context.options, 'peer');
			const input: HonchoServiceInputs['remember'] = {
				...workspaceInput(context), sessionId, content,
				...(peerId === undefined ? {} : { peerId }), ...(metadata === undefined ? {} : { metadata }),
			};
			return (service, options) => service.remember(input, options);
		},
	},
	{
		name: 'query', arguments: '[query...]', variadic: true,
		description: 'Semantic search over Honcho conclusions',
		options: [
			workspaceOption,
			{ name: 'observer', description: 'observer_id filter; defaults to the configured peer' },
			{ name: 'observed', description: 'observed_id filter; defaults to the observer' },
			{ name: 'session', description: 'session_id filter' },
			{ name: 'limit', aliases: ['n'], description: 'Top K conclusions (1-100)' },
		],
		table: itemsTable(['observer_id', 'observed_id', 'content', 'distance']),
		async prepare(context) {
			const query = await readArgsText(context, 'query');
			const limit = parseInteger(serviceCliString(context.options, 'limit'), 'limit', 1, 100);
			const observerId = serviceCliString(context.options, 'observer');
			const observedId = serviceCliString(context.options, 'observed');
			const sessionId = serviceCliString(context.options, 'session');
			const input: HonchoServiceInputs['query'] = {
				...workspaceInput(context), query,
				...(observerId === undefined ? {} : { observerId }), ...(observedId === undefined ? {} : { observedId }),
				...(sessionId === undefined ? {} : { sessionId }), ...(limit === undefined ? {} : { limit }),
			};
			return (service, options) => service.query(input, options);
		},
	},
	{
		name: 'chat', arguments: '[question...]', variadic: true,
		description: 'Ask the Honcho dialectic chat about a peer',
		options: [
			workspaceOption,
			{ name: 'observer', description: 'Observer peer id; defaults to the configured peer' },
			{ name: 'target', description: 'Observed peer id; defaults to the observer' },
			{ name: 'session', description: 'Session id' },
			{ name: 'reasoning-level', description: `Reasoning level: ${ReasoningLevels.join(', ')}; low by default` },
		],
		async prepare(context) {
			const query = await readArgsText(context, 'question');
			const level = serviceCliString(context.options, 'reasoning-level');
			if (level !== undefined && !(ReasoningLevels as readonly string[]).includes(level))
				throw new ServiceCliInputError(`--reasoning-level must be one of ${ReasoningLevels.join(', ')}`);
			const observerId = serviceCliString(context.options, 'observer');
			const target = serviceCliString(context.options, 'target');
			const sessionId = serviceCliString(context.options, 'session');
			const input: HonchoServiceInputs['chat'] = {
				...workspaceInput(context), query,
				...(observerId === undefined ? {} : { observerId }), ...(target === undefined ? {} : { target }),
				...(sessionId === undefined ? {} : { sessionId }),
				...(level === undefined ? {} : { reasoningLevel: level as (typeof ReasoningLevels)[number] }),
			};
			return (service, options) => service.chat(input, options);
		},
	},
	{
		name: 'list', group: 'workspace', description: 'List Honcho workspaces; usually requires an admin key',
		options: [limitOption, pageOption], table: resourceTable,
		prepare(context) {
			const input = pageInput(context);
			return (service, options) => service.listWorkspace(input, options);
		},
	},
	{
		name: 'create', group: 'workspace', arguments: '[id]', mutating: true,
		description: 'Get or create a Honcho workspace; requires --yes',
		options: [metadataOption, configurationOption, yesOption],
		async prepare(context) {
			requireYes(context, 'workspace create');
			const id = context.args[0];
			const metadata = await readObject(context, 'metadata');
			const configuration = await readObject(context, 'configuration');
			const input = { ...(id ? { id } : {}), ...(metadata ? { metadata } : {}), ...(configuration ? { configuration } : {}) };
			return (service, options) => service.createWorkspace(input, options);
		},
	},
	{
		name: 'list', group: 'peer', description: 'List Honcho peers in a workspace',
		options: [workspaceOption, limitOption, pageOption], table: resourceTable,
		prepare(context) {
			const input = { ...workspaceInput(context), ...pageInput(context) };
			return (service, options) => service.listPeer(input, options);
		},
	},
	{
		name: 'create', group: 'peer', argument: 'id', mutating: true,
		description: 'Get or create a Honcho peer; requires --yes',
		options: [workspaceOption, metadataOption, configurationOption, yesOption],
		async prepare(context) {
			requireYes(context, 'peer create');
			const id = argument(context, 'peer id');
			const metadata = await readObject(context, 'metadata');
			const configuration = await readObject(context, 'configuration');
			const input = { ...workspaceInput(context), id, ...(metadata ? { metadata } : {}), ...(configuration ? { configuration } : {}) };
			return (service, options) => service.createPeer(input, options);
		},
	},
	{
		name: 'list', group: 'session', description: 'List Honcho sessions in a workspace',
		options: [workspaceOption, limitOption, pageOption], table: resourceTable,
		prepare(context) {
			const input = { ...workspaceInput(context), ...pageInput(context) };
			return (service, options) => service.listSession(input, options);
		},
	},
	{
		name: 'create', group: 'session', argument: 'id', mutating: true,
		description: 'Get or create a Honcho session; requires --yes',
		options: [
			workspaceOption,
			{ name: 'peer', description: 'Attach a peer id; repeatable', repeatable: true },
			metadataOption, configurationOption, yesOption,
		],
		async prepare(context) {
			requireYes(context, 'session create');
			const id = argument(context, 'session id');
			const peers = serviceCliStrings(context.options, 'peer');
			const metadata = await readObject(context, 'metadata');
			const configuration = await readObject(context, 'configuration');
			const input = {
				...workspaceInput(context), id, ...(peers?.length ? { peers } : {}),
				...(metadata ? { metadata } : {}), ...(configuration ? { configuration } : {}),
			};
			return (service, options) => service.createSession(input, options);
		},
	},
	{
		name: 'message', group: 'session', argument: 'session', description: 'List messages in a Honcho session',
		options: [workspaceOption, limitOption, pageOption], table: messageTable,
		prepare(context) {
			const input = { ...workspaceInput(context), sessionId: argument(context, 'session id'), ...pageInput(context) };
			return (service, options) => service.listMessage(input, options);
		},
	},
	{
		name: 'summary', group: 'session', argument: 'session', description: 'Read Honcho session summaries',
		options: [workspaceOption],
		prepare(context) {
			const input = { ...workspaceInput(context), sessionId: argument(context, 'session id') };
			return (service, options) => service.getSessionSummary(input, options);
		},
	},
	{
		name: 'context', group: 'session', argument: 'session', description: 'Read token-bounded Honcho session context',
		options: [
			workspaceOption,
			{ name: 'tokens', description: 'Context token budget' },
			{ name: 'summary', description: 'Include the session summary', type: 'boolean', negatable: true },
		],
		prepare(context) {
			const tokens = parseInteger(serviceCliString(context.options, 'tokens'), 'tokens', 1, 1_000_000);
			const input = {
				...workspaceInput(context), sessionId: argument(context, 'session id'),
				...(tokens === undefined ? {} : { tokens }), summary: context.options.summary !== false,
			};
			return (service, options) => service.getSessionContext(input, options);
		},
	},
	{
		name: 'status', group: 'system', description: 'Read the Honcho deriver queue status',
		options: [workspaceOption],
		prepare(context) {
			const input = workspaceInput(context);
			return (service, options) => service.systemStatus(input, options);
		},
	},
	{
		name: 'api', argument: 'path', description: 'Call a raw Honcho API path; requires a writable service, and --yes for methods other than GET, HEAD and OPTIONS', mutating: true,
		options: [
			{ name: 'method', aliases: ['X'], description: 'HTTP method; GET by default, POST with --body' },
			{ name: 'query', description: 'Query parameter key=value; repeatable', repeatable: true },
			{ name: 'body', description: 'JSON body, @file or - for stdin' },
			yesOption,
		],
		async prepare(context) {
			const path = context.args[0];
			if (!path) throw new ServiceCliInputError('Honcho API path is required');
			const bodyArgument = serviceCliString(context.options, 'body');
			const method = (serviceCliString(context.options, 'method') ?? (bodyArgument === undefined ? 'GET' : 'POST')).trim().toUpperCase();
			if (!(HonchoRequestMethods as readonly string[]).includes(method))
				throw new ServiceCliInputError(`--method must be one of ${HonchoRequestMethods.join(', ')}`);
			if (['GET', 'HEAD'].includes(method) && bodyArgument !== undefined)
				throw new ServiceCliInputError('--body cannot be used with GET or HEAD');
			if (isHonchoWriteMethod(method)) requireYes(context, 'API write');
			const query: Record<string, string | string[]> = Object.create(null);
			for (const value of serviceCliStrings(context.options, 'query') ?? []) {
				const at = value.indexOf('=');
				if (at < 1) throw new ServiceCliInputError('--query expects key=value');
				const key = value.slice(0, at);
				const entry = value.slice(at + 1);
				const previous = query[key];
				query[key] = previous === undefined ? entry : [...(Array.isArray(previous) ? previous : [previous]), entry];
			}
			const body = await readJson(context, 'body', 1024 * 1024);
			const input: HonchoServiceInputs['request'] = {
				path, method: method as (typeof HonchoRequestMethods)[number],
				...(Object.keys(query).length ? { query: { ...query } } : {}),
				...(body === undefined ? {} : { body }),
			};
			return (service, options) => service.request(input, options);
		},
	},
];

export const HonchoCliDefinition: ServiceCliDefinition<HonchoServiceClient> = {
	name: 'honcho',
	description: 'Store and query Honcho memory, workspaces, peers, sessions and context',
	examples: [
		{ command: 'woctl honcho query "favorite editor"', description: 'Search conclusions' },
		{ command: 'woctl honcho add --session demo --yes "Prefers dark mode"', description: 'Append a message' },
	],
	options: [],
	commands,
};

export const HonchoServiceCliBinding = defineServiceCliBinding({
	provider: HonchoServiceProvider,
	definition: HonchoCliDefinition,
	createClient: createHonchoServiceToolClient,
});

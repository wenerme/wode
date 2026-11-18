import {
	DefaultHonchoApiPrefix,
	DefaultHonchoBaseUrl,
	HonchoClient,
	type HonchoCallOptions,
	type HonchoPageResponse,
} from '@wener/client/honcho';
import { z } from 'zod';
import type { ServiceProviderDefinition } from '../registry';
import type { ServiceProviderContext } from '../runtime/types';
import type { HonchoServiceCallOptions } from './HonchoServiceContract';
import { HonchoServiceCapability, type IHonchoService } from './IHonchoService';
import { HonchoOperations } from './operations';

const envName = z.string().regex(/^[A-Za-z_][A-Za-z0-9_]*$/u);
const identifier = z.string().trim().min(1).max(512);
export const HonchoServiceOptionsSchema = Object.assign(z.strictObject({
	apiKey: z.string().min(1).optional(),
	apiKeyEnv: envName.optional(),
	apiPrefix: z.string().trim().min(1).max(64).regex(/^\/?[A-Za-z0-9_.-]+(?:\/[A-Za-z0-9_.-]+)*\/?$/u).optional(),
	workspaceId: identifier.optional(),
	peerId: identifier.optional(),
	timeoutMs: z.number().int().min(1).max(3_600_000).optional(),
}), {
	jsonSchema: {
		type: 'object',
		properties: {
			apiKey: { type: 'string' }, apiKeyEnv: { type: 'string' }, apiPrefix: { type: 'string' },
			workspaceId: { type: 'string' }, peerId: { type: 'string' },
			timeoutMs: { type: 'integer', minimum: 1 },
		},
		additionalProperties: false,
	},
});
export type HonchoServiceOptions = z.infer<typeof HonchoServiceOptionsSchema>;

function resolveConfig({ config, getEnv }: ServiceProviderContext) {
	const baseUrl = config.baseUrl ?? DefaultHonchoBaseUrl;
	const url = new URL(baseUrl);
	if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash)
		throw new Error('Honcho baseUrl must be a credential-free HTTP or HTTPS URL');
	const parsed = HonchoServiceOptionsSchema.safeParse(config.options ?? {});
	if (!parsed.success) throw new Error('Invalid Honcho service configuration');
	const value = parsed.data;
	if (value.apiKey !== undefined && value.apiKeyEnv !== undefined) throw new Error('Conflicting Honcho credential configuration');
	let apiKey = value.apiKey;
	if (value.apiKeyEnv !== undefined) {
		apiKey = getEnv?.(value.apiKeyEnv);
		if (!apiKey) throw new Error('Honcho credential environment variable is unavailable');
	}
	return { baseUrl, apiKey, ...value };
}

function toPage<T>(value: HonchoPageResponse<T> | T[] | undefined) {
	if (Array.isArray(value)) return { items: value };
	return { ...value, items: value?.items ?? [] };
}

export const HonchoServiceProvider: ServiceProviderDefinition<IHonchoService> = {
	name: 'honcho',
	title: 'Honcho',
	description: 'Store and query Honcho memory: messages, conclusions, chat, workspaces, peers, sessions and context.',
	examples: [
		{ command: 'woctl honcho query "favorite editor"', description: 'Search conclusions.' },
		{ command: 'woctl honcho session list', description: 'List sessions in the default workspace.' },
	],
	provides: [HonchoServiceCapability],
	optionsSchema: HonchoServiceOptionsSchema,
	operations: HonchoOperations,
	create(context) {
		const resolved = resolveConfig(context);
		const client = new HonchoClient({
			apiKey: resolved.apiKey,
			baseUrl: resolved.baseUrl,
			apiPrefix: resolved.apiPrefix ?? DefaultHonchoApiPrefix,
			headers: context.config.headers,
			timeout: resolved.timeoutMs,
			fetch: context.fetch,
		});
		const readOnly = context.config.readOnly !== false;
		const lifetime = new AbortController();
		let closed = false;
		const writable = () => {
			if (readOnly) throw new Error('Selected service is read-only');
		};
		const call = (options?: HonchoServiceCallOptions): HonchoCallOptions => {
			if (closed) throw new Error('Honcho service is closed');
			options?.signal?.throwIfAborted();
			return {
				signal: options?.signal ? AbortSignal.any([lifetime.signal, options.signal]) : lifetime.signal,
				timeout: options?.context?.timeoutMs,
			};
		};
		const workspace = (id?: string) => {
			const value = id ?? resolved.workspaceId;
			if (!value) throw new Error('Honcho workspaceId is required; set options.workspaceId or pass workspaceId');
			return value;
		};
		const peer = (id: string | undefined, label: string) => {
			const value = id ?? resolved.peerId;
			if (!value) throw new Error(`Honcho ${label} is required; set options.peerId or pass it explicitly`);
			return value;
		};
		const list = (input: { size?: number; page?: number; filters?: Record<string, unknown> } | undefined, options?: HonchoServiceCallOptions) => ({
			size: input?.size, page: input?.page, filters: input?.filters, ...call(options),
		});
		const service: IHonchoService = {
			type: 'honcho',
			readOnly,
			async remember(input, options) {
				writable();
				const peerId = peer(input.peerId, 'peerId');
				const messages = await client.createSessionMessages(workspace(input.workspaceId), input.sessionId, {
					messages: [{ peer_id: peerId, content: input.content, ...(input.metadata ? { metadata: input.metadata } : {}) }],
				}, call(options));
				const message = Array.isArray(messages) ? messages[0] : undefined;
				return { ...message, peer_id: message?.peer_id ?? peerId, session_id: message?.session_id ?? input.sessionId, content: message?.content ?? input.content };
			},
			async query(input, options) {
				const observer = input.observerId ?? resolved.peerId;
				const observed = input.observedId ?? observer;
				const filters: Record<string, unknown> = {};
				if (observer) filters.observer_id = observer;
				if (observed) filters.observed_id = observed;
				if (input.sessionId) filters.session_id = input.sessionId;
				const result = await client.queryConclusions(workspace(input.workspaceId), {
					query: input.query, top_k: input.limit ?? 20, ...(Object.keys(filters).length ? { filters } : {}),
				}, call(options));
				return Array.isArray(result) ? result : [];
			},
			async chat(input, options) {
				const observer = peer(input.observerId, 'observerId');
				const result = await client.chat(workspace(input.workspaceId), observer, {
					query: input.query, target: input.target ?? observer, session_id: input.sessionId,
					reasoning_level: input.reasoningLevel ?? 'low', stream: false,
				}, call(options));
				return { ...result, content: result?.content ?? '' };
			},
			listWorkspace: async (input, options) => toPage(await client.listWorkspaces(list(input, options))),
			async createWorkspace(input, options) {
				writable();
				return client.createWorkspace({ id: input?.id, metadata: input?.metadata, configuration: input?.configuration }, call(options));
			},
			listPeer: async (input, options) => toPage(await client.listPeers(workspace(input?.workspaceId), list(input, options))),
			async createPeer(input, options) {
				writable();
				return client.createPeer(workspace(input.workspaceId), { id: input.id, metadata: input.metadata, configuration: input.configuration }, call(options));
			},
			listSession: async (input, options) => toPage(await client.listSessions(workspace(input?.workspaceId), list(input, options))),
			async createSession(input, options) {
				writable();
				const peers = input.peers?.length ? Object.fromEntries(input.peers.map((id) => [id, {}])) : undefined;
				return client.createSession(workspace(input.workspaceId), {
					id: input.id, metadata: input.metadata, configuration: input.configuration, ...(peers ? { peers } : {}),
				}, call(options));
			},
			listMessage: async (input, options) =>
				toPage(await client.listSessionMessages(workspace(input.workspaceId), input.sessionId, list(input, options))),
			getSessionSummary: async (input, options) => client.getSessionSummaries(workspace(input.workspaceId), input.sessionId, call(options)),
			getSessionContext: async (input, options) => client.getSessionContext(workspace(input.workspaceId), input.sessionId, {
				tokens: input.tokens, summary: input.summary ?? true, ...call(options),
			}),
			systemStatus: async (input, options) => client.getQueueStatus(workspace(input?.workspaceId), call(options)),
			async request(input, options) {
				// Raw requests are classified as writes by contract metadata, so they always require a writable service.
				writable();
				const method = input.method ?? (input.body === undefined ? 'GET' : 'POST');
				return client.request<unknown>({ path: input.path, method, query: input.query, body: input.body, ...call(options) });
			},
			async close() {
				if (closed) return;
				closed = true;
				lifetime.abort(new Error('Honcho service is closed'));
			},
			[Symbol.asyncDispose]() {
				return this.close();
			},
		};
		return { honcho: service };
	},
};

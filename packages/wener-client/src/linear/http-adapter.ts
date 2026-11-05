import type { z } from 'zod/v4';
import { LinearConnectionConfigSchema, type LinearConnectionConfig } from './config';
import { LinearServiceError, LinearServiceErrorCodes } from './errors';
import { LinearGraphql } from './graphql';
import type { LinearAdapter, LinearCallOptions } from './interface';
import * as s from './schema';

export type LinearFetch = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
export interface LinearHttpAdapterOptions {
	fetch?: LinearFetch;
	sleep?: (milliseconds: number, signal: AbortSignal) => Promise<void>;
}
type RequestOptions = LinearCallOptions & { retry?: boolean };

export function createLinearHttpAdapter(config: LinearConnectionConfig, options: LinearHttpAdapterOptions = {}): LinearAdapter {
	const parsed = LinearConnectionConfigSchema.safeParse(config);
	if (!parsed.success) {
		throw new LinearServiceError(LinearServiceErrorCodes.InvalidConfig, 'Linear service configuration is invalid');
	}
	config = parsed.data;
	const fetch = options.fetch ?? globalThis.fetch;
	const sleep = options.sleep ?? sleepWithSignal;
	const authorization = config.accessToken ? `Bearer ${config.accessToken}` : config.apiKey!;
	const controllers = new Set<AbortController>();
	const active = new Set<Promise<unknown>>();
	let closed = false;
	let closePromise: Promise<void> | undefined;

	const waitForRetry = async (milliseconds: number, signal?: AbortSignal): Promise<void> => {
		if (closed) throw closedError();
		signal?.throwIfAborted();
		const controller = new AbortController();
		const unlink = linkSignal(signal, controller);
		controllers.add(controller);
		try {
			await sleep(milliseconds, controller.signal);
			if (closed) throw closedError();
			signal?.throwIfAborted();
		} finally {
			unlink();
			controllers.delete(controller);
		}
	};

	const performRequest = async (query: string, variables: Record<string, unknown>, requestOptions: RequestOptions): Promise<Record<string, unknown>> => {
		const { signal } = requestOptions;
		for (let attempt = 0; attempt <= config.maxRetries; attempt += 1) {
			if (closed) throw closedError();
			signal?.throwIfAborted();
			const controller = new AbortController();
			const unlink = linkSignal(signal, controller);
			controllers.add(controller);
			const timer = setTimeout(() => controller.abort(), config.requestTimeoutMs);
			try {
				const response = await fetch(config.baseUrl, {
					method: 'POST',
					headers: { accept: 'application/json', 'content-type': 'application/json', authorization },
					body: JSON.stringify({ query, variables }), redirect: 'manual', signal: controller.signal,
				});
				if (closed || controller.signal.aborted) {
					await response.body?.cancel().catch(() => undefined);
					throw operationFailed();
				}
				if (response.ok || response.status === 400) {
					const payload = await readBoundedJson(response, config.maxResponseBytes, controller.signal);
					if (isRateLimited(payload)) {
						if (requestOptions.retry !== false && attempt < config.maxRetries) {
							await waitForRetry(rateLimitDelay(response.headers, attempt, config.maxRetryDelayMs), signal);
							continue;
						}
						throw rateLimitedError();
					}
					if (!response.ok) throw operationFailed();
					const data = requireGraphqlData(payload);
					if (closed) throw closedError();
					signal?.throwIfAborted();
					return data;
				}
				const retryable = response.status === 429 || response.status >= 500;
				await response.body?.cancel().catch(() => undefined);
				if (retryable && requestOptions.retry !== false && attempt < config.maxRetries) {
					await waitForRetry(rateLimitDelay(response.headers, attempt, config.maxRetryDelayMs), signal);
					continue;
				}
				if (response.status === 429) throw rateLimitedError();
				throw operationFailed();
			} catch (error) {
				if (closed) throw closedError();
				signal?.throwIfAborted();
				if (error instanceof LinearServiceError) throw error;
				throw operationFailed();
			} finally {
				clearTimeout(timer);
				unlink();
				controllers.delete(controller);
			}
		}
		throw operationFailed();
	};
	const request = (query: string, variables: Record<string, unknown>, requestOptions: RequestOptions = {}): Promise<Record<string, unknown>> => {
		if (closed) return Promise.reject(closedError());
		const operation = performRequest(query, variables, requestOptions);
		active.add(operation);
		const cleanup = () => { active.delete(operation); };
		void operation.then(cleanup, cleanup);
		return operation;
	};

	return {
		async getViewer(options) {
			return parseDto(s.LinearViewerSchema, (await request(LinearGraphql.viewer, {}, options)).viewer);
		},
		async listTeam(input = {}, options) {
			const page = s.LinearListTeamInputSchema.parse(input);
			return parseDto(s.LinearTeamConnectionSchema, (await request(LinearGraphql.teams, page, options)).teams);
		},
		async listIssueState(input, options) {
			const page = s.LinearListIssueStateInputSchema.parse(input);
			const team = (await request(LinearGraphql.issueStates, page, options)).team;
			return parseDto(s.LinearIssueStateConnectionSchema, isRecord(team) ? team.states : undefined);
		},
		async listUser(input = {}, options) {
			const page = s.LinearListUserInputSchema.parse(input);
			const filter = page.query ? { or: [{ name: { containsIgnoreCase: page.query } }, { email: { containsIgnoreCase: page.query } }] } : undefined;
			return parseDto(s.LinearUserConnectionSchema, (await request(LinearGraphql.users, { ...page, filter, query: undefined }, options)).users);
		},
		async listProject(input = {}, options) {
			const page = s.LinearListProjectInputSchema.parse(input);
			const filter = compact({
				accessibleTeams: page.teamId ? { some: { id: { eq: page.teamId } } } : undefined,
				name: page.query ? { containsIgnoreCase: page.query } : undefined,
			});
			return parseDto(s.LinearProjectConnectionSchema, (await request(LinearGraphql.projects, { ...page, filter, teamId: undefined, query: undefined }, options)).projects);
		},
		async listIssue(input = {}, options) {
			const page = s.LinearListIssueInputSchema.parse(input);
			const simpleFilter = compact({
				team: page.teamId ? { id: { eq: page.teamId } } : undefined,
				assignee: page.assigneeId ? { id: { eq: page.assigneeId } } : undefined,
				project: page.projectId ? { id: { eq: page.projectId } } : undefined,
				state: page.stateId ? { id: { eq: page.stateId } } : undefined,
				updatedAt: page.updatedAfter ? { gte: page.updatedAfter } : undefined,
				or: page.query ? [{ title: { containsIgnoreCase: page.query } }, { description: { containsIgnoreCase: page.query } }] : undefined,
			});
			const filter = page.filter ? simpleFilter ? { and: [simpleFilter, page.filter] } : page.filter : simpleFilter;
			return parseDto(s.LinearIssueConnectionSchema, (await request(LinearGraphql.issues, {
				first: page.first, after: page.after, includeArchived: page.includeArchived, filter,
			}, options)).issues);
		},
		async getIssue(input, options) {
			return parseDto(s.LinearIssueSchema, (await request(LinearGraphql.issue, s.LinearGetIssueInputSchema.parse(input), options)).issue);
		},
		async createIssue(input, options) {
			return parseMutationIssue(await request(LinearGraphql.issueCreate, { input: s.LinearCreateIssueInputSchema.parse(input) }, { ...options, retry: false }), 'issueCreate');
		},
		async updateIssue(input, options) {
			const { id, ...changes } = s.LinearUpdateIssueInputSchema.parse(input);
			return parseMutationIssue(await request(LinearGraphql.issueUpdate, { id, input: changes }, { ...options, retry: false }), 'issueUpdate');
		},
		async listComment(input, options) {
			const issue = (await request(LinearGraphql.comments, s.LinearListCommentInputSchema.parse(input), options)).issue;
			return parseDto(s.LinearCommentConnectionSchema, isRecord(issue) ? issue.comments : undefined);
		},
		async createComment(input, options) {
			const result = (await request(LinearGraphql.commentCreate, { input: s.LinearCreateCommentInputSchema.parse(input) }, { ...options, retry: false })).commentCreate;
			if (!isRecord(result) || result.success !== true) throw operationFailed();
			return parseDto(s.LinearCommentSchema, result.comment);
		},
		close() {
			if (closePromise) return closePromise;
			closed = true;
			for (const controller of controllers) controller.abort();
			closePromise = Promise.allSettled([...active]).then(() => undefined);
			return closePromise;
		},
	};
}

function parseDto<T extends z.ZodType>(schema: T, value: unknown): z.output<T> {
	const parsed = schema.safeParse(value);
	if (!parsed.success) throw operationFailed();
	return parsed.data;
}
function requireGraphqlData(payload: unknown): Record<string, unknown> {
	if (!isRecord(payload) || !isRecord(payload.data)) throw operationFailed();
	if (payload.errors !== undefined && (!Array.isArray(payload.errors) || payload.errors.length > 0)) throw operationFailed();
	return payload.data;
}
function isRateLimited(payload: unknown): boolean {
	return isRecord(payload) && Array.isArray(payload.errors) && payload.errors.some(
		(error) => isRecord(error) && isRecord(error.extensions) && error.extensions.code === 'RATELIMITED',
	);
}
function parseMutationIssue(data: Record<string, unknown>, field: string) {
	const result = data[field];
	if (!isRecord(result) || result.success !== true) throw operationFailed();
	return parseDto(s.LinearIssueSchema, result.issue);
}
function compact(value: Record<string, unknown>): Record<string, unknown> | undefined {
	const output = Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined));
	return Object.keys(output).length ? output : undefined;
}
function rateLimitDelay(headers: Headers, attempt: number, maximum: number): number {
	const resetTimes = ['x-ratelimit-endpoint-requests-reset', 'x-ratelimit-requests-reset', 'x-ratelimit-complexity-reset']
		.map((name) => Number(headers.get(name)))
		.filter((value) => Number.isFinite(value) && value > 0)
		.map((value) => Math.max(0, value - Date.now()));
	const retryAfter = headers.get('retry-after');
	if (retryAfter !== null) {
		const seconds = Number(retryAfter);
		const delay = Number.isFinite(seconds) ? Math.max(0, seconds * 1_000) : Math.max(0, Date.parse(retryAfter) - Date.now());
		if (Number.isFinite(delay)) resetTimes.push(delay);
	}
	return Math.min(maximum, resetTimes.length ? Math.max(...resetTimes) : 250 * 2 ** attempt);
}
async function readBoundedJson(response: Response, maximum: number, signal: AbortSignal): Promise<unknown> {
	const contentLength = Number(response.headers.get('content-length'));
	if (Number.isFinite(contentLength) && contentLength > maximum) {
		await response.body?.cancel().catch(() => undefined);
		throw operationFailed();
	}
	const reader = response.body?.getReader();
	if (!reader) throw operationFailed();
	const chunks: Uint8Array[] = [];
	let total = 0;
	let cancelPromise: Promise<void> | undefined;
	const cancel = () => { cancelPromise ??= reader.cancel().catch(() => undefined); };
	signal.addEventListener('abort', cancel, { once: true });
	try {
		while (true) {
			if (signal.aborted) throw operationFailed();
			const { done, value } = await reader.read();
			if (signal.aborted) throw operationFailed();
			if (done) break;
			total += value.byteLength;
			if (total > maximum) {
				await reader.cancel().catch(() => undefined);
				throw operationFailed();
			}
			chunks.push(value);
		}
	} catch (error) {
		if (error instanceof LinearServiceError) throw error;
		throw operationFailed();
	} finally {
		signal.removeEventListener('abort', cancel);
		await cancelPromise;
		reader.releaseLock();
	}
	const bytes = new Uint8Array(total);
	let offset = 0;
	for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
	try { return JSON.parse(new TextDecoder().decode(bytes)); } catch { throw operationFailed(); }
}
function linkSignal(signal: AbortSignal | undefined, controller: AbortController): () => void {
	const abort = () => controller.abort(signal?.reason);
	if (signal?.aborted) abort();
	else signal?.addEventListener('abort', abort, { once: true });
	return () => signal?.removeEventListener('abort', abort);
}
function sleepWithSignal(milliseconds: number, signal: AbortSignal): Promise<void> {
	return new Promise((resolve, reject) => {
		if (signal.aborted) { reject(closedError()); return; }
		const abort = () => { clearTimeout(timer); reject(closedError()); };
		const timer = setTimeout(() => { signal.removeEventListener('abort', abort); resolve(); }, milliseconds);
		signal.addEventListener('abort', abort, { once: true });
	});
}
function rateLimitedError(): LinearServiceError {
	return new LinearServiceError(LinearServiceErrorCodes.RateLimited, 'Linear API rate limit exceeded');
}
function closedError(): LinearServiceError {
	return new LinearServiceError(LinearServiceErrorCodes.Closed, 'Linear service is closed');
}
function operationFailed(): LinearServiceError {
	return new LinearServiceError(LinearServiceErrorCodes.OperationFailed, 'Linear service operation failed');
}
function isRecord(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
}

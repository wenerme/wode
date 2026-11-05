import {
	createLinearHttpAdapter, LinearConnectionConfigSchema, LinearServiceError, LinearServiceErrorCodes,
	type LinearConnectionConfig, type LinearHttpAdapterOptions,
} from '@wener/client/linear';
import type { ILinearService, LinearAdapter, LinearAdapterFactory, LinearCallOptions } from '../ILinearService';
import * as s from '../schema';

export interface CreateLinearServiceOptions extends LinearHttpAdapterOptions {
	createAdapter?: LinearAdapterFactory;
}

class LinearService implements ILinearService {
	readonly type = 'linear' as const;
	readonly readOnly: boolean;
	readonly #adapter: LinearAdapter;
	readonly #active = new Set<Promise<unknown>>();
	#closed = false;
	#closePromise: Promise<void> | undefined;

	constructor(config: LinearConnectionConfig, adapter: LinearAdapter) {
		this.readOnly = config.readOnly;
		this.#adapter = adapter;
	}
	async getViewer(options?: LinearCallOptions) {
		return this.#read(() => this.#adapter.getViewer(options), options);
	}
	async listTeam(input: s.LinearListTeamInput = {}, options?: LinearCallOptions) {
		const parsed = s.LinearListTeamInputSchema.parse(input);
		return this.#read(() => this.#adapter.listTeam(parsed, options), options);
	}
	async listIssueState(input: s.LinearListIssueStateInput, options?: LinearCallOptions) {
		const parsed = s.LinearListIssueStateInputSchema.parse(input);
		return this.#read(() => this.#adapter.listIssueState(parsed, options), options);
	}
	async listUser(input: s.LinearListUserInput = {}, options?: LinearCallOptions) {
		const parsed = s.LinearListUserInputSchema.parse(input);
		return this.#read(() => this.#adapter.listUser(parsed, options), options);
	}
	async listProject(input: s.LinearListProjectInput = {}, options?: LinearCallOptions) {
		const parsed = s.LinearListProjectInputSchema.parse(input);
		return this.#read(() => this.#adapter.listProject(parsed, options), options);
	}
	async listIssue(input: s.LinearListIssueInput = {}, options?: LinearCallOptions) {
		const parsed = s.LinearListIssueInputSchema.parse(input);
		return this.#read(() => this.#adapter.listIssue(parsed, options), options);
	}
	async getIssue(input: s.LinearGetIssueInput, options?: LinearCallOptions) {
		const parsed = s.LinearGetIssueInputSchema.parse(input);
		return this.#read(() => this.#adapter.getIssue(parsed, options), options);
	}
	async createIssue(input: s.LinearCreateIssueInput, options?: LinearCallOptions) {
		const parsed = s.LinearCreateIssueInputSchema.parse(input);
		return this.#write(() => this.#adapter.createIssue(parsed, options), options);
	}
	async updateIssue(input: s.LinearUpdateIssueInput, options?: LinearCallOptions) {
		const parsed = s.LinearUpdateIssueInputSchema.parse(input);
		return this.#write(() => this.#adapter.updateIssue(parsed, options), options);
	}
	async listComment(input: s.LinearListCommentInput, options?: LinearCallOptions) {
		const parsed = s.LinearListCommentInputSchema.parse(input);
		return this.#read(() => this.#adapter.listComment(parsed, options), options);
	}
	async createComment(input: s.LinearCreateCommentInput, options?: LinearCallOptions) {
		const parsed = s.LinearCreateCommentInputSchema.parse(input);
		return this.#write(() => this.#adapter.createComment(parsed, options), options);
	}
	close(): Promise<void> {
		if (this.#closePromise) return this.#closePromise;
		this.#closed = true;
		this.#closePromise = Promise.allSettled([
			Promise.resolve().then(() => this.#adapter.close()), ...this.#active,
		]).then((results) => {
			if (results[0].status === 'rejected') throw operationFailed();
		});
		return this.#closePromise;
	}
	[Symbol.asyncDispose](): Promise<void> {
		return this.close();
	}
	#assertOpen(): void {
		if (this.#closed) throw new LinearServiceError(LinearServiceErrorCodes.Closed, 'Linear service is closed');
	}
	async #read<T>(operation: () => Promise<T>, options?: LinearCallOptions): Promise<T> {
		this.#assertOpen();
		options?.signal?.throwIfAborted();
		let pending: Promise<T> | undefined;
		try {
			pending = operation();
			this.#active.add(pending);
			const result = await pending;
			options?.signal?.throwIfAborted();
			return result;
		} catch (error) {
			options?.signal?.throwIfAborted();
			if (error instanceof LinearServiceError) throw error;
			throw operationFailed();
		} finally {
			if (pending) this.#active.delete(pending);
		}
	}
	async #write<T>(operation: () => Promise<T>, options?: LinearCallOptions): Promise<T> {
		this.#assertOpen();
		if (this.readOnly) throw new LinearServiceError(LinearServiceErrorCodes.ReadOnly, 'Linear service is read-only');
		return this.#read(operation, options);
	}
}

export async function createLinearService(config: LinearConnectionConfig, options: CreateLinearServiceOptions = {}): Promise<ILinearService> {
	const parsed = LinearConnectionConfigSchema.safeParse(config);
	if (!parsed.success) throw new LinearServiceError(LinearServiceErrorCodes.InvalidConfig, 'Linear service configuration is invalid');
	try {
		const adapter = await (options.createAdapter ?? ((connection) => createLinearHttpAdapter(connection, options)))(parsed.data);
		return new LinearService(parsed.data, adapter);
	} catch (error) {
		if (error instanceof LinearServiceError) throw error;
		throw new LinearServiceError(LinearServiceErrorCodes.OperationFailed, 'Linear service initialization failed');
	}
}
function operationFailed(): LinearServiceError {
	return new LinearServiceError(LinearServiceErrorCodes.OperationFailed, 'Linear service operation failed');
}

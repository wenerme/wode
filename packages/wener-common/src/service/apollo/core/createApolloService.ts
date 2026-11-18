import type { z } from 'zod/v4';
import { ApolloServiceContract, type ApolloServiceCallOptions } from '../ApolloServiceContract';
import { type ApolloAdminOperations, createApolloAdminOperations } from './admin-operations';
import { type ApolloConnectionConfig, type ApolloConnectionConfigInput, ApolloConnectionConfigSchema } from './config';
import { ApolloServiceError, ApolloServiceErrorCodes } from './errors';
import { type CreateApolloHttpAdapterOptions, createApolloHttpAdapter } from './http-adapter';
import {
	ApolloHttpError,
	describeApolloHttpError,
	describeApolloTransportError,
	isApolloAuthStatus,
	isApolloHttpRejection,
} from './http-error';
import type { ApolloAdapter, ApolloAdapterFactory, ApolloConfigReadRequest, IApolloService } from './interface';
import { type ApolloMutationOperations, createApolloMutationOperations } from './mutation-operations';
import { type ApolloPortalOperations, createApolloPortalOperations } from './portal-operations';
import { ApolloReadConfigInputSchema, ApolloRequestInputSchema } from './schema';
import type { ApolloMutationOutcome, ApolloServiceOperationContext } from './service-context';

export interface CreateApolloServiceOptions extends CreateApolloHttpAdapterOptions {
	createAdapter?: ApolloAdapterFactory;
}

const DefaultMutationOutcome = {
	state: 'mutation-outcome-unknown',
	message: 'Apollo mutation outcome is unknown',
} as const;

class ApolloServiceImpl implements IApolloService {
	readonly type = 'apollo' as const;
	readonly readOnly: boolean;
	readonly #adapter: ApolloAdapter;
	readonly #config: ApolloConnectionConfig;
	#closed = false;
	#closePromise?: Promise<void>;

	constructor(config: ApolloConnectionConfig, adapter: ApolloAdapter) {
		this.readOnly = config.readOnly;
		this.#config = config;
		this.#adapter = adapter;
	}

	request<T = unknown>(input: z.input<typeof ApolloRequestInputSchema>, options?: ApolloServiceCallOptions): Promise<T> {
		const parsed = this.#parse(ApolloRequestInputSchema, input);
		return this.#call<T>({ ...parsed, role: 'admin', signal: options?.signal }, 'Apollo request failed');
	}

	async readConfig(input: ApolloConfigReadRequest = {}, options?: ApolloServiceCallOptions) {
		this.#assertOpen();
		options?.signal?.throwIfAborted();
		const parsed = this.#parse(ApolloReadConfigInputSchema, input);
		if (!this.#config.appId) {
			throw new ApolloServiceError(ApolloServiceErrorCodes.InvalidRequest, 'Apollo appId is required');
		}
		try {
			const value = await this.#adapter.readConfig(parsed, options);
			options?.signal?.throwIfAborted();
			return ApolloServiceContract.readConfig['~orpc'].outputSchema!.parse(value);
		} catch (error) {
			options?.signal?.throwIfAborted();
			if (error instanceof ApolloServiceError) throw error;
			throw new ApolloServiceError(ApolloServiceErrorCodes.OperationFailed, 'Apollo config read failed');
		}
	}

	getStatus(input?: Parameters<IApolloService['getStatus']>[0], options?: ApolloServiceCallOptions) {
		return this.#portalOperations(options).getStatus(input, options);
	}
	listPortalApp(input?: Parameters<IApolloService['listPortalApp']>[0], options?: ApolloServiceCallOptions) {
		return this.#portalOperations(options).listPortalApp(input, options);
	}
	listPortalOrganization(input?: Parameters<IApolloService['listPortalOrganization']>[0], options?: ApolloServiceCallOptions) {
		return this.#portalOperations(options).listPortalOrganization(input, options);
	}
	listPortalEnv(input?: Parameters<IApolloService['listPortalEnv']>[0], options?: ApolloServiceCallOptions) {
		return this.#portalOperations(options).listPortalEnv(input, options);
	}
	getPortalNavTree(input?: Parameters<IApolloService['getPortalNavTree']>[0], options?: ApolloServiceCallOptions) {
		return this.#portalOperations(options).getPortalNavTree(input, options);
	}
	listPortalNamespace(input?: Parameters<IApolloService['listPortalNamespace']>[0], options?: ApolloServiceCallOptions) {
		return this.#portalOperations(options).listPortalNamespace(input, options);
	}
	getPortalNamespace(input?: Parameters<IApolloService['getPortalNamespace']>[0], options?: ApolloServiceCallOptions) {
		return this.#portalOperations(options).getPortalNamespace(input, options);
	}
	listPortalItem(input?: Parameters<IApolloService['listPortalItem']>[0], options?: ApolloServiceCallOptions) {
		return this.#portalOperations(options).listPortalItem(input, options);
	}
	listPortalRelease(input?: Parameters<IApolloService['listPortalRelease']>[0], options?: ApolloServiceCallOptions) {
		return this.#portalOperations(options).listPortalRelease(input, options);
	}
	getPortalConfig(input?: Parameters<IApolloService['getPortalConfig']>[0], options?: ApolloServiceCallOptions) {
		return this.#portalOperations(options).getPortalConfig(input, options);
	}
	listRelease(input?: Parameters<IApolloService['listRelease']>[0], options?: ApolloServiceCallOptions) {
		return this.#portalOperations(options).listRelease(input, options);
	}
	getRelease(input: Parameters<IApolloService['getRelease']>[0], options?: ApolloServiceCallOptions) {
		return this.#portalOperations(options).getRelease(input, options);
	}
	diffRelease(input: Parameters<IApolloService['diffRelease']>[0], options?: ApolloServiceCallOptions) {
		return this.#portalOperations(options).diffRelease(input, options);
	}
	listApp(input?: Parameters<IApolloService['listApp']>[0], options?: ApolloServiceCallOptions) {
		return this.#adminOperations(options).listApp(input, options);
	}
	getApp(input?: Parameters<IApolloService['getApp']>[0], options?: ApolloServiceCallOptions) {
		return this.#adminOperations(options).getApp(input, options);
	}
	listSelfApp(input?: Parameters<IApolloService['listSelfApp']>[0], options?: ApolloServiceCallOptions) {
		return this.#adminOperations(options).listSelfApp(input, options);
	}
	createApp(input: Parameters<IApolloService['createApp']>[0], options?: ApolloServiceCallOptions) {
		return this.#adminOperations(options).createApp(input, options);
	}
	createAppEnv(input: Parameters<IApolloService['createAppEnv']>[0], options?: ApolloServiceCallOptions) {
		return this.#adminOperations(options).createAppEnv(input, options);
	}
	updateApp(input: Parameters<IApolloService['updateApp']>[0], options?: ApolloServiceCallOptions) {
		return this.#adminOperations(options).updateApp(input, options);
	}
	deleteApp(input: Parameters<IApolloService['deleteApp']>[0], options?: ApolloServiceCallOptions) {
		return this.#adminOperations(options).deleteApp(input, options);
	}
	listMissingAppEnv(input?: Parameters<IApolloService['listMissingAppEnv']>[0], options?: ApolloServiceCallOptions) {
		return this.#adminOperations(options).listMissingAppEnv(input, options);
	}
	getEnvCluster(input?: Parameters<IApolloService['getEnvCluster']>[0], options?: ApolloServiceCallOptions) {
		return this.#adminOperations(options).getEnvCluster(input, options);
	}
	getCluster(input?: Parameters<IApolloService['getCluster']>[0], options?: ApolloServiceCallOptions) {
		return this.#adminOperations(options).getCluster(input, options);
	}
	createCluster(input: Parameters<IApolloService['createCluster']>[0], options?: ApolloServiceCallOptions) {
		return this.#adminOperations(options).createCluster(input, options);
	}
	deleteCluster(input: Parameters<IApolloService['deleteCluster']>[0], options?: ApolloServiceCallOptions) {
		return this.#adminOperations(options).deleteCluster(input, options);
	}
	listNamespace(input?: Parameters<IApolloService['listNamespace']>[0], options?: ApolloServiceCallOptions) {
		return this.#adminOperations(options).listNamespace(input, options);
	}
	getNamespace(input?: Parameters<IApolloService['getNamespace']>[0], options?: ApolloServiceCallOptions) {
		return this.#adminOperations(options).getNamespace(input, options);
	}
	getNamespaceLock(input?: Parameters<IApolloService['getNamespaceLock']>[0], options?: ApolloServiceCallOptions) {
		return this.#adminOperations(options).getNamespaceLock(input, options);
	}
	createNamespace(input: Parameters<IApolloService['createNamespace']>[0], options?: ApolloServiceCallOptions) {
		return this.#adminOperations(options).createNamespace(input, options);
	}
	deleteNamespace(input?: Parameters<IApolloService['deleteNamespace']>[0], options?: ApolloServiceCallOptions) {
		return this.#adminOperations(options).deleteNamespace(input, options);
	}
	listNamespaceUsage(input?: Parameters<IApolloService['listNamespaceUsage']>[0], options?: ApolloServiceCallOptions) {
		return this.#adminOperations(options).listNamespaceUsage(input, options);
	}
	listMissingNamespace(input?: Parameters<IApolloService['listMissingNamespace']>[0], options?: ApolloServiceCallOptions) {
		return this.#adminOperations(options).listMissingNamespace(input, options);
	}
	createMissingNamespace(input?: Parameters<IApolloService['createMissingNamespace']>[0], options?: ApolloServiceCallOptions) {
		return this.#adminOperations(options).createMissingNamespace(input, options);
	}
	listItem(input?: Parameters<IApolloService['listItem']>[0], options?: ApolloServiceCallOptions) {
		return this.#adminOperations(options).listItem(input, options);
	}
	getItem(input: Parameters<IApolloService['getItem']>[0], options?: ApolloServiceCallOptions) {
		return this.#adminOperations(options).getItem(input, options);
	}
	upsertItem(input: Parameters<IApolloService['upsertItem']>[0], options?: ApolloServiceCallOptions) {
		return this.#adminOperations(options).upsertItem(input, options);
	}
	deleteItem(input: Parameters<IApolloService['deleteItem']>[0], options?: ApolloServiceCallOptions) {
		return this.#adminOperations(options).deleteItem(input, options);
	}
	getLatestRelease(input?: Parameters<IApolloService['getLatestRelease']>[0], options?: ApolloServiceCallOptions) {
		return this.#adminOperations(options).getLatestRelease(input, options);
	}
	publishRelease(input?: Parameters<IApolloService['publishRelease']>[0], options?: ApolloServiceCallOptions) {
		return this.#adminOperations(options).publishRelease(input, options);
	}
	rollbackRelease(input: Parameters<IApolloService['rollbackRelease']>[0], options?: ApolloServiceCallOptions) {
		return this.#adminOperations(options).rollbackRelease(input, options);
	}
	async patchNamespaceItem(input: Parameters<IApolloService['patchNamespaceItem']>[0], options?: ApolloServiceCallOptions) {
		return ApolloServiceContract.patchNamespaceItem['~orpc'].outputSchema!.parse(await this.#mutationOperations(options).patchNamespaceItem(input));
	}
	async writeNamespaceText(input: Parameters<IApolloService['writeNamespaceText']>[0], options?: ApolloServiceCallOptions) {
		return ApolloServiceContract.writeNamespaceText['~orpc'].outputSchema!.parse(await this.#mutationOperations(options).writeNamespaceText(input));
	}
	async patchNamespaceDocument(input: Parameters<IApolloService['patchNamespaceDocument']>[0], options?: ApolloServiceCallOptions) {
		return ApolloServiceContract.patchNamespaceDocument['~orpc'].outputSchema!.parse(await this.#mutationOperations(options).patchNamespaceDocument(input));
	}
	async diffNamespaceRelease(input: Parameters<IApolloService['diffNamespaceRelease']>[0] = {}, options?: ApolloServiceCallOptions) {
		return ApolloServiceContract.diffNamespaceRelease['~orpc'].outputSchema!.parse(await this.#mutationOperations(options).diffNamespaceRelease(input));
	}
	async publishNamespaceRelease(input: Parameters<IApolloService['publishNamespaceRelease']>[0] = {}, options?: ApolloServiceCallOptions) {
		return ApolloServiceContract.publishNamespaceRelease['~orpc'].outputSchema!.parse(await this.#mutationOperations(options).publishNamespaceRelease(input));
	}

	#portalOperations(options?: ApolloServiceCallOptions): ApolloPortalOperations {
		return createApolloPortalOperations(this.#context(options));
	}
	#adminOperations(options?: ApolloServiceCallOptions): ApolloAdminOperations {
		return createApolloAdminOperations(this.#context(options));
	}
	#mutationOperations(options?: ApolloServiceCallOptions): ApolloMutationOperations {
		return createApolloMutationOperations(this.#context(options));
	}
	/** Each invocation captures its own signal; concurrent calls never share mutable options. */
	#context(options?: ApolloServiceCallOptions): ApolloServiceOperationContext {
		return {
			config: this.#config,
			signal: options?.signal,
			parse: this.#parse.bind(this),
			admin: (path, input) => this.#admin(path, { ...input, signal: options?.signal }),
			adminMutation: (path, input, outcome) => this.#adminMutation(path, { ...input, signal: options?.signal }, outcome),
			portal: (path, query) => this.#call({ role: 'portal', path, method: 'GET', query, signal: options?.signal }, 'Apollo operation failed'),
			portalMutation: (path, input, outcome) => this.#portalMutation(path, { ...input, signal: options?.signal }, outcome),
			assertWritable: this.#assertWritable.bind(this),
		};
	}

	close(): Promise<void> {
		if (this.#closePromise) return this.#closePromise;
		this.#closed = true;
		this.#closePromise = this.#adapter.close().catch(() => {
			throw new ApolloServiceError(ApolloServiceErrorCodes.OperationFailed, 'Apollo service close failed');
		});
		return this.#closePromise;
	}

	#admin(path: string, input: Omit<import('./interface').ApolloHttpRequest, 'role' | 'path'> = {}): Promise<unknown> {
		return this.#call({ role: 'admin', path, ...input }, 'Apollo operation failed');
	}

	#adminMutation(
		path: string,
		input: Omit<import('./interface').ApolloHttpRequest, 'role' | 'path'>,
		outcome: ApolloMutationOutcome,
	): Promise<unknown> {
		this.#assertWritable();
		return this.#call({ role: 'admin', path, ...input }, 'Apollo operation failed', outcome);
	}

	#portalMutation(
		path: string,
		input: Omit<import('./interface').ApolloHttpRequest, 'role' | 'path'>,
		outcome: ApolloMutationOutcome,
	): Promise<unknown> {
		this.#assertWritable();
		return this.#call({ role: 'portal', path, ...input }, 'Apollo operation failed', outcome);
	}

	async #call<T>(
		input: import('./interface').ApolloHttpRequest,
		message: string,
		outcome?: ApolloMutationOutcome,
	): Promise<T> {
		this.#assertOpen();
		input.signal?.throwIfAborted();
		const method = (input.method ?? (input.body === undefined ? 'GET' : 'POST')).toUpperCase();
		const mutationOutcome = ['GET', 'HEAD', 'OPTIONS'].includes(method)
			? undefined
			: (outcome ?? DefaultMutationOutcome);
		if (!input.path.trim() || !input.path.startsWith('/')) {
			throw new ApolloServiceError(ApolloServiceErrorCodes.InvalidRequest, 'Apollo request path is invalid');
		}
		if (mutationOutcome) this.#assertWritable();
		try {
			// All local admission checks precede this boundary. A mutation error after entry cannot prove server state.
			const value = await this.#adapter.request<T>({ ...input, method });
			if (!mutationOutcome) input.signal?.throwIfAborted();
			return value;
		} catch (error) {
			if (!mutationOutcome) input.signal?.throwIfAborted();
			throw toApolloCallError(error, message, mutationOutcome);
		}
	}

	#parse<TSchema extends z.ZodType>(schema: TSchema, input: unknown): z.output<TSchema> {
		try {
			return schema.parse(input);
		} catch (error) {
			if (error instanceof ApolloServiceError) throw error;
			throw new ApolloServiceError(ApolloServiceErrorCodes.InvalidRequest, 'Apollo request input is invalid');
		}
	}

	#assertWritable(): void {
		this.#assertOpen();
		if (this.readOnly) {
			throw new ApolloServiceError(ApolloServiceErrorCodes.InvalidRequest, 'Apollo service is read-only');
		}
	}

	#assertOpen(): void {
		if (this.#closed) throw new ApolloServiceError(ApolloServiceErrorCodes.Closed, 'Apollo service is closed');
	}
}

function rejectedMessage(outcome: ApolloMutationOutcome | undefined, fallback: string): string {
	if (!outcome) return fallback;
	const rejected = outcome.message.replace(/ outcome is unknown$/u, ' rejected');
	return rejected === outcome.message ? `${outcome.message}; request rejected` : rejected;
}

/**
 * Maps adapter failures without leaking raw transport errors. A definitive HTTP rejection (4xx/redirect) proves
 * the mutation was not applied, so it is reported as rejected with safe diagnostics instead of outcome-unknown.
 */
function toApolloCallError(
	error: unknown,
	message: string,
	outcome: ApolloMutationOutcome | undefined,
): ApolloServiceError {
	if (error instanceof ApolloHttpError) {
		const info = error.toInfo();
		const reason = describeApolloHttpError(info);
		if (isApolloHttpRejection(error)) {
			const auth = isApolloAuthStatus(error);
			const code =
				auth === 'forbidden'
					? ApolloServiceErrorCodes.PermissionDenied
					: auth === 'unauthorized'
						? ApolloServiceErrorCodes.Unauthorized
						: ApolloServiceErrorCodes.OperationFailed;
			return new ApolloServiceError(code, `${rejectedMessage(outcome, message)}: ${reason}`, 'rejected', info);
		}
		if (outcome) {
			return new ApolloServiceError(
				ApolloServiceErrorCodes.PartialFailure,
				`${outcome.message}: ${reason}`,
				outcome.state,
				info,
			);
		}
		return new ApolloServiceError(ApolloServiceErrorCodes.OperationFailed, `${message}: ${reason}`, undefined, info);
	}
	const transport = describeApolloTransportError(error);
	const suffix = transport ? `: ${transport.reason}` : '';
	if (outcome && transport?.notSent) {
		return new ApolloServiceError(
			ApolloServiceErrorCodes.OperationFailed,
			`${outcome.message.replace(/ outcome is unknown$/u, ' failed')}${suffix}; the request was not sent`,
			'not-sent',
		);
	}
	if (outcome) {
		return new ApolloServiceError(ApolloServiceErrorCodes.PartialFailure, `${outcome.message}${suffix}`, outcome.state);
	}
	if (error instanceof ApolloServiceError) return error;
	return new ApolloServiceError(ApolloServiceErrorCodes.OperationFailed, `${message}${suffix}`);
}

export function createApolloService(
	input: ApolloConnectionConfigInput,
	options: CreateApolloServiceOptions = {},
): IApolloService {
	const parsed = ApolloConnectionConfigSchema.safeParse(input);
	if (!parsed.success) {
		throw new ApolloServiceError(ApolloServiceErrorCodes.InvalidRequest, 'Apollo connection config is invalid');
	}
	const config = parsed.data;
	let adapter: ApolloAdapter;
	try {
		adapter = options.createAdapter
			? options.createAdapter(config)
			: createApolloHttpAdapter(config, { fetch: options.fetch });
	} catch {
		throw new ApolloServiceError(ApolloServiceErrorCodes.OperationFailed, 'Apollo service initialization failed');
	}
	return new ApolloServiceImpl(config, adapter);
}

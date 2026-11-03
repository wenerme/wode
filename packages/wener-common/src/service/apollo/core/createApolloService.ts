import type { z } from 'zod/v4';
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
	readonly #portalOperations: ApolloPortalOperations;
	readonly #adminOperations: ApolloAdminOperations;
	readonly #mutationOperations: ApolloMutationOperations;
	#closed = false;
	#closePromise?: Promise<void>;

	constructor(config: ApolloConnectionConfig, adapter: ApolloAdapter) {
		this.readOnly = config.readOnly;
		this.#config = config;
		this.#adapter = adapter;
		const context: ApolloServiceOperationContext = {
			config,
			parse: this.#parse.bind(this),
			admin: this.#admin.bind(this),
			adminMutation: this.#adminMutation.bind(this),
			portal: this.#portal.bind(this),
			portalMutation: this.#portalMutation.bind(this),
			assertWritable: this.#assertWritable.bind(this),
		};
		this.#portalOperations = createApolloPortalOperations(context);
		this.#adminOperations = createApolloAdminOperations(context);
		this.#mutationOperations = createApolloMutationOperations(context);
	}

	request<T = unknown>(input: z.input<typeof ApolloRequestInputSchema>): Promise<T> {
		const parsed = this.#parse(ApolloRequestInputSchema, input);
		return this.#call<T>({ ...parsed, role: 'admin' }, 'Apollo request failed');
	}

	async readConfig<T = unknown>(input: ApolloConfigReadRequest = {}): Promise<T> {
		this.#assertOpen();
		const parsed = this.#parse(ApolloReadConfigInputSchema, input);
		if (!this.#config.appId) {
			throw new ApolloServiceError(ApolloServiceErrorCodes.InvalidRequest, 'Apollo appId is required');
		}
		try {
			return await this.#adapter.readConfig<T>(parsed);
		} catch (error) {
			if (error instanceof ApolloServiceError) throw error;
			throw new ApolloServiceError(ApolloServiceErrorCodes.OperationFailed, 'Apollo config read failed');
		}
	}

	getStatus() {
		return this.#portalOperations.getStatus();
	}
	listPortalApp() {
		return this.#portalOperations.listPortalApp();
	}
	listPortalOrganization() {
		return this.#portalOperations.listPortalOrganization();
	}
	listPortalEnv() {
		return this.#portalOperations.listPortalEnv();
	}
	getPortalNavTree(input?: Parameters<IApolloService['getPortalNavTree']>[0]) {
		return this.#portalOperations.getPortalNavTree(input);
	}
	listPortalNamespace(input?: Parameters<IApolloService['listPortalNamespace']>[0]) {
		return this.#portalOperations.listPortalNamespace(input);
	}
	getPortalNamespace(input?: Parameters<IApolloService['getPortalNamespace']>[0]) {
		return this.#portalOperations.getPortalNamespace(input);
	}
	listPortalItem(input?: Parameters<IApolloService['listPortalItem']>[0]) {
		return this.#portalOperations.listPortalItem(input);
	}
	listPortalRelease(input?: Parameters<IApolloService['listPortalRelease']>[0]) {
		return this.#portalOperations.listPortalRelease(input);
	}
	getPortalConfig(input?: Parameters<IApolloService['getPortalConfig']>[0]) {
		return this.#portalOperations.getPortalConfig(input);
	}
	listRelease(input?: Parameters<IApolloService['listRelease']>[0]) {
		return this.#portalOperations.listRelease(input);
	}
	getRelease(input: Parameters<IApolloService['getRelease']>[0]) {
		return this.#portalOperations.getRelease(input);
	}
	diffRelease(input: Parameters<IApolloService['diffRelease']>[0]) {
		return this.#portalOperations.diffRelease(input);
	}
	listApp(input?: Parameters<IApolloService['listApp']>[0]) {
		return this.#adminOperations.listApp(input);
	}
	getApp(input?: Parameters<IApolloService['getApp']>[0]) {
		return this.#adminOperations.getApp(input);
	}
	listSelfApp(input?: Parameters<IApolloService['listSelfApp']>[0]) {
		return this.#adminOperations.listSelfApp(input);
	}
	createApp(input: Parameters<IApolloService['createApp']>[0]) {
		return this.#adminOperations.createApp(input);
	}
	createAppEnv(input: Parameters<IApolloService['createAppEnv']>[0]) {
		return this.#adminOperations.createAppEnv(input);
	}
	updateApp(input: Parameters<IApolloService['updateApp']>[0]) {
		return this.#adminOperations.updateApp(input);
	}
	deleteApp(input: Parameters<IApolloService['deleteApp']>[0]) {
		return this.#adminOperations.deleteApp(input);
	}
	listMissingAppEnv(input?: Parameters<IApolloService['listMissingAppEnv']>[0]) {
		return this.#adminOperations.listMissingAppEnv(input);
	}
	getEnvCluster(input?: Parameters<IApolloService['getEnvCluster']>[0]) {
		return this.#adminOperations.getEnvCluster(input);
	}
	getCluster(input?: Parameters<IApolloService['getCluster']>[0]) {
		return this.#adminOperations.getCluster(input);
	}
	createCluster(input: Parameters<IApolloService['createCluster']>[0]) {
		return this.#adminOperations.createCluster(input);
	}
	deleteCluster(input: Parameters<IApolloService['deleteCluster']>[0]) {
		return this.#adminOperations.deleteCluster(input);
	}
	listNamespace(input?: Parameters<IApolloService['listNamespace']>[0]) {
		return this.#adminOperations.listNamespace(input);
	}
	getNamespace(input?: Parameters<IApolloService['getNamespace']>[0]) {
		return this.#adminOperations.getNamespace(input);
	}
	getNamespaceLock(input?: Parameters<IApolloService['getNamespaceLock']>[0]) {
		return this.#adminOperations.getNamespaceLock(input);
	}
	createNamespace(input: Parameters<IApolloService['createNamespace']>[0]) {
		return this.#adminOperations.createNamespace(input);
	}
	deleteNamespace(input?: Parameters<IApolloService['deleteNamespace']>[0]) {
		return this.#adminOperations.deleteNamespace(input);
	}
	listNamespaceUsage(input?: Parameters<IApolloService['listNamespaceUsage']>[0]) {
		return this.#adminOperations.listNamespaceUsage(input);
	}
	listMissingNamespace(input?: Parameters<IApolloService['listMissingNamespace']>[0]) {
		return this.#adminOperations.listMissingNamespace(input);
	}
	createMissingNamespace(input?: Parameters<IApolloService['createMissingNamespace']>[0]) {
		return this.#adminOperations.createMissingNamespace(input);
	}
	listItem(input?: Parameters<IApolloService['listItem']>[0]) {
		return this.#adminOperations.listItem(input);
	}
	getItem(input: Parameters<IApolloService['getItem']>[0]) {
		return this.#adminOperations.getItem(input);
	}
	upsertItem(input: Parameters<IApolloService['upsertItem']>[0]) {
		return this.#adminOperations.upsertItem(input);
	}
	deleteItem(input: Parameters<IApolloService['deleteItem']>[0]) {
		return this.#adminOperations.deleteItem(input);
	}
	getLatestRelease(input?: Parameters<IApolloService['getLatestRelease']>[0]) {
		return this.#adminOperations.getLatestRelease(input);
	}
	publishRelease(input?: Parameters<IApolloService['publishRelease']>[0]) {
		return this.#adminOperations.publishRelease(input);
	}
	rollbackRelease(input: Parameters<IApolloService['rollbackRelease']>[0]) {
		return this.#adminOperations.rollbackRelease(input);
	}
	patchNamespaceItem(input: Parameters<IApolloService['patchNamespaceItem']>[0]) {
		return this.#mutationOperations.patchNamespaceItem(input);
	}
	writeNamespaceText(input: Parameters<IApolloService['writeNamespaceText']>[0]) {
		return this.#mutationOperations.writeNamespaceText(input);
	}
	patchNamespaceDocument(input: Parameters<IApolloService['patchNamespaceDocument']>[0]) {
		return this.#mutationOperations.patchNamespaceDocument(input);
	}
	diffNamespaceRelease(input: Parameters<IApolloService['diffNamespaceRelease']>[0] = {}) {
		return this.#mutationOperations.diffNamespaceRelease(input);
	}
	publishNamespaceRelease(input: Parameters<IApolloService['publishNamespaceRelease']>[0] = {}) {
		return this.#mutationOperations.publishNamespaceRelease(input);
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

	#portal(path: string, query?: Record<string, unknown>): Promise<unknown> {
		return this.#call({ role: 'portal', path, method: 'GET', query }, 'Apollo operation failed');
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
			return await this.#adapter.request<T>({ ...input, method });
		} catch (error) {
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

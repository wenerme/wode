import type { CliServiceConfig } from '../config';
import { CliConfigError, isCliServiceEnabled, normalizeCliServices, resolveCliServiceConfigEnv } from '../config';
import type { RedisAdapterFactory } from '../redis/IRedisService';
import type { EdgeTtsSocketFactory } from '@wener/client/tts';
import type { ResolvedServiceContext, ServiceContract, ServiceOperation, ServiceOptionsSchema, ServiceProviderContext, ServiceProviderMetadata } from '../runtime/types';
import type { SqlAdapterFactory } from '../sql/types';
import type { ServiceCapability } from './ServiceCapability';

export * from './ServiceCapability';

/**
 * `S` is the service interface this provider exposes (e.g. `IGrafanaService`); a multi-capability
 * provider uses a union (`ISearchService | IFetchService`). The default `unknown` accepts any provider.
 * `create` returns one service instance per declared capability key.
 */
export interface ServiceProviderDefinition<S = unknown> extends ServiceProviderMetadata {
	name: string;
	aliases?: readonly string[];
	provides: readonly ServiceCapability<S>[];
	optionsSchema?: ServiceOptionsSchema;
	contract?: ServiceContract;
	/** When present, this is the complete tool set, including an explicitly empty set. */
	operations?: Readonly<Record<string, ServiceOperation<S>>>;
	create(context: ServiceProviderContext): Readonly<Record<string, S>> | Promise<Readonly<Record<string, S>>>;
}

/** @deprecated Use `ServiceProviderDefinition` (its default accepts any provider). */
export type AnyServiceProviderDefinition = ServiceProviderDefinition;

export interface ServiceRegistryOptions {
	context?: ResolvedServiceContext;
	fetch?: typeof globalThis.fetch;
	/** Default service name per capability key. */
	defaults?: Readonly<Record<string, string>>;
	sqlDriver?: SqlAdapterFactory;
	redisDriver?: RedisAdapterFactory;
	edgeTtsSocketFactory?: EdgeTtsSocketFactory;
	getEnv?(name: string): string | undefined;
}

export interface ServiceProviderDirectoryEntry {
	readonly name: string;
	readonly aliases: readonly string[];
	readonly provides: readonly string[];
}

export interface ServiceDirectoryEntry {
	readonly name: string;
	readonly provider: string;
	readonly provides: readonly string[];
	readonly readOnly: boolean;
}

interface RegisteredProvider {
	readonly name: string;
	readonly aliases: readonly string[];
	readonly provides: readonly string[];
	readonly optionsSchema?: ServiceOptionsSchema;
	readonly contract?: ServiceContract;
	readonly create: ServiceProviderDefinition['create'];
}

interface ConfiguredService {
	readonly name: string;
	readonly config: CliServiceConfig;
}

interface ServiceEntry {
	readonly promise: Promise<unknown>;
}

function isObject(value: unknown): value is Record<PropertyKey, unknown> {
	return value !== null && (typeof value === 'object' || typeof value === 'function');
}

function invalid(message: string): never {
	throw new Error(message);
}

export class ServiceRegistry {
	readonly #providers = new Map<string, RegisteredProvider>();
	readonly #services: ReadonlyMap<string, ConfiguredService>;
	readonly #context: ResolvedServiceContext;
	readonly #fetch: typeof globalThis.fetch;
	readonly #defaults: Readonly<Record<string, string>>;
	readonly #sqlDriver: SqlAdapterFactory | undefined;
	readonly #redisDriver: RedisAdapterFactory | undefined;
	readonly #edgeTtsSocketFactory: EdgeTtsSocketFactory | undefined;
	readonly #getEnv: ((name: string) => string | undefined) | undefined;
	readonly #entries = new Map<string, ServiceEntry>();
	readonly #instances = new Set<Record<PropertyKey, unknown>>();
	#closed = false;
	#closePromise?: Promise<void>;

	constructor(options: ServiceRegistryOptions = {}) {
		const context = options.context;
		const services = normalizeCliServices(context?.services ?? {});
		const configuredServices = context?.configuredServices
			? normalizeCliServices(context.configuredServices)
			: undefined;
		this.#context = {
			...(context ?? {}),
			services,
			...(configuredServices ? { configuredServices } : {}),
		} as ResolvedServiceContext;
		this.#fetch = options.fetch ?? this.#defaultFetch();
		this.#defaults = Object.freeze({ ...(options.defaults ?? {}) });
		this.#sqlDriver = options.sqlDriver;
		this.#redisDriver = options.redisDriver;
		this.#edgeTtsSocketFactory = options.edgeTtsSocketFactory;
		this.#getEnv = options.getEnv;
		this.#services = new Map(Object.entries(services).map(([name, config]) => [name, { name, config }]));
	}

	/** Any typed definition is accepted: `ServiceProviderDefinition<S>` is assignable to the default. */
	register(provider: ServiceProviderDefinition): this {
		if (this.#closed) invalid('Service registry is closed');
		const normalized = this.#normalizeProvider(provider);
		for (const identifier of [normalized.name, ...normalized.aliases]) {
			if (this.#providers.has(identifier)) invalid('Duplicate service provider');
		}
		for (const identifier of [normalized.name, ...normalized.aliases]) this.#providers.set(identifier, normalized);
		return this;
	}

	hasProvider(name: string): boolean {
		return this.#providers.has(name);
	}

	listProviders(): ServiceProviderDirectoryEntry[] {
		const providers = new Set<RegisteredProvider>(this.#providers.values());
		return [...providers].map((provider) =>
			Object.freeze({
				name: provider.name,
				aliases: Object.freeze([...provider.aliases]),
				provides: Object.freeze([...provider.provides]),
			}),
		);
	}

	list(capability?: string): ServiceDirectoryEntry[] {
		const result: ServiceDirectoryEntry[] = [];
		for (const service of this.#services.values()) {
			if (!isCliServiceEnabled(service.config)) continue;
			const provider = this.#providerFor(service.config.provider);
			if (!provider) continue;
			if (capability !== undefined && !provider.provides.includes(capability)) continue;
			result.push(
				Object.freeze({
					name: service.name,
					provider: provider.name,
					provides: Object.freeze([...provider.provides]),
					readOnly: service.config.readOnly,
				}),
			);
		}
		return result;
	}

	/** The service type is inferred from the capability token; a bare string yields `unknown`. */
	async load<S>(capability: ServiceCapability<S>, name?: string): Promise<S> {
		if (this.#closed) throw new Error('Service registry is closed');
		const service = this.#select(capability, name);
		const provider = this.#providerFor(service.config.provider);
		if (!provider || !provider.provides.includes(capability)) throw new Error('Service capability is unavailable');
		const instance = await this.#getOrCreate(service, provider);
		if (this.#closed) throw new Error('Service registry is closed');
		const capabilityService = instance[capability];
		this.#validateCapability(capability, capabilityService);
		return capabilityService as S;
	}

	async close(): Promise<void> {
		if (this.#closePromise) return this.#closePromise;
		this.#closed = true;
		this.#closePromise = this.#closeAll();
		return this.#closePromise;
	}

	#defaultFetch(): typeof globalThis.fetch {
		if (typeof globalThis.fetch === 'function') return globalThis.fetch.bind(globalThis);
		return (() => Promise.reject(new Error('Fetch implementation is unavailable'))) as typeof globalThis.fetch;
	}

	#normalizeProvider(provider: ServiceProviderDefinition): RegisteredProvider {
		if (!isObject(provider) || typeof provider.name !== 'string' || provider.name.trim() === '')
			invalid('Invalid service provider');
		if (typeof provider.create !== 'function' || !Array.isArray(provider.provides) || provider.provides.length === 0)
			invalid('Invalid service provider');
		const aliases = provider.aliases === undefined ? [] : provider.aliases;
		if (!Array.isArray(aliases) || aliases.some((alias) => typeof alias !== 'string' || alias.trim() === ''))
			invalid('Invalid service provider');
		const identifiers = [provider.name, ...aliases];
		if (new Set(identifiers).size !== identifiers.length) invalid('Duplicate service provider identifier');
		if (
			new Set(provider.provides).size !== provider.provides.length ||
			provider.provides.some((value) => typeof value !== 'string')
		)
			invalid('Invalid service provider capabilities');
		return {
			name: provider.name,
			aliases: Object.freeze([...aliases]),
			provides: Object.freeze([...provider.provides]) as readonly string[],
			optionsSchema: provider.optionsSchema,
			contract: provider.contract,
			create: provider.create,
		};
	}

	#providerFor(identifier: string): RegisteredProvider | undefined {
		return this.#providers.get(identifier);
	}

	#matching(capability: string): ConfiguredService[] {
		return [...this.#services.values()].filter((service) => {
			if (!isCliServiceEnabled(service.config)) return false;
			const provider = this.#providerFor(service.config.provider);
			return provider?.provides.includes(capability) ?? false;
		});
	}

	#select(capability: string, explicitName?: string): ConfiguredService {
		const candidates = this.#matching(capability);
		if (explicitName !== undefined) {
			const exact = this.#services.get(explicitName);
			if (exact) {
				if (!candidates.includes(exact)) throw new Error('Named service is unavailable');
				return exact;
			}
			const named = candidates.filter(
				(service) =>
					this.#providerFor(service.config.provider)?.name === explicitName ||
					this.#providerFor(service.config.provider)?.aliases.includes(explicitName),
			);
			if (named.length === 1) return named[0];
			if (named.length > 1) throw new Error('Ambiguous service selection');
			throw new Error('Named service is unavailable');
		}

		const defaultName = this.#defaults[capability];
		if (defaultName !== undefined) {
			return this.#select(capability, defaultName);
		}
		if (candidates.length === 1) return candidates[0];
		if (candidates.length > 1) throw new Error('Ambiguous service selection');
		throw new Error('No configured service is available');
	}

	#getOrCreate(service: ConfiguredService, provider: RegisteredProvider): Promise<Record<PropertyKey, unknown>> {
		const existing = this.#entries.get(service.name);
		if (existing) return existing.promise as Promise<Record<PropertyKey, unknown>>;
		const promise = Promise.resolve()
			.then(() =>
				provider.create({
					name: service.name,
					config: resolveCliServiceConfigEnv(service.config, this.#getEnv),
					context: this.#context,
					fetch: this.#fetch,
					sqlDriver: this.#sqlDriver,
					redisDriver: this.#redisDriver,
					edgeTtsSocketFactory: this.#edgeTtsSocketFactory,
					getEnv: this.#getEnv,
				}),
			)
			.then((created) => {
				if (!isObject(created)) invalid('Service provider returned an invalid service');
				for (const capability of provider.provides) {
					const instance = created[capability];
					if (isObject(instance)) this.#instances.add(instance);
				}
				for (const capability of provider.provides) this.#validateCapability(capability, created[capability]);
				return created;
			})
			.catch((error) => {
				if (this.#entries.get(service.name) === entry) this.#entries.delete(service.name);
				if (error instanceof CliConfigError) throw error;
				throw new Error('Failed to create service');
			});
		const entry: ServiceEntry = { promise };
		this.#entries.set(service.name, entry);
		return promise as Promise<Record<PropertyKey, unknown>>;
	}

	#validateCapability(capability: string, value: unknown): asserts value is Record<PropertyKey, unknown> {
		if (!isObject(value) || typeof value.type !== 'string' || typeof value.readOnly !== 'boolean')
			invalid('Invalid service capability');
		if ((capability === 'search' || capability === 'fetch' || capability === 'redis') && value.readOnly !== true)
			invalid('Invalid service capability');
		if (
			capability === 'sql' &&
			['ping', 'query', 'exec', 'listObject', 'describeObject', 'close'].some(
				(method) => typeof value[method] !== 'function',
			)
		)
			invalid('Invalid SQL service capability');
		if (
			capability === 'redis' &&
			['ping', 'get', 'getType', 'getTtl', 'scan', 'getHash', 'rangeStream', 'close'].some(
				(method) => typeof value[method] !== 'function',
			)
		)
			invalid('Invalid Redis service capability');
		const method = capability === 'search' ? 'search' : capability === 'fetch' ? 'fetch' : undefined;
		if (method && typeof value[method] !== 'function') invalid('Invalid service capability');
	}

	async #closeAll(): Promise<void> {
		await Promise.allSettled([...this.#entries.values()].map((entry) => entry.promise));
		const errors: unknown[] = [];
		for (const instance of this.#instances) {
			if (typeof instance.close !== 'function') continue;
			try {
				await instance.close();
			} catch (error) {
				errors.push(error);
			}
		}
		if (errors.length > 0) throw new AggregateError(errors, 'Failed to close services');
	}
}

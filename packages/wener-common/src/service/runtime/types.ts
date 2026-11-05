import type { CliServiceConfig } from '../config';
import type { SqlAdapterFactory } from '../sql/types';
import type { RedisAdapterFactory } from '../redis';
import type { EdgeTtsSocketFactory } from '@wener/client/tts';
import type { ServiceCapability, ServiceRegistry } from '../registry';

/** Static provider information shared by service discovery consumers. */
export interface ServiceProviderMetadata {
	title?: string;
	description?: string;
	documentationUrl?: string;
	examples?: readonly { command: string; description?: string }[];
}

export interface ServiceInputValidator<I> {
	safeParse(value: unknown): { success: true; data: I } | { success: false; error?: unknown };
}

/** The helper captures the capability/input pair before operations are collected. */
/** `S` is the service interface the operation invokes; `capability` is its runtime key. */
export interface ServiceOperation<S = unknown, O = unknown> {
	readonly capability: ServiceCapability<S>;
	readonly tool: ServiceTool;
	readonly input: ServiceInputValidator<unknown>;
	execute(registry: ServiceRegistry, name: string, input: unknown, options?: ServiceCallOptions): Promise<O>;
}

export interface ResolvedServiceContext {
	services: Readonly<Record<string, CliServiceConfig>>;
	configuredServices?: Readonly<Record<string, CliServiceConfig>>;
}

export interface ServiceTool {
	title?: string;
	description?: string;
	inputSchema: Record<string, unknown>;
	outputSchema?: Record<string, unknown>;
	annotations?: { readOnlyHint?: boolean; destructiveHint?: boolean };
}
export interface ServiceOptionsSchema {
	safeParse(value: unknown): { success: true; data: unknown } | { success: false; error?: unknown };
	jsonSchema?: Record<string, unknown>;
	toJSONSchema?(options: { io: 'input' }): Record<string, unknown>;
}
export interface ServiceMethodContract {
	description?: string;
	inputSchema?: Record<string, unknown>;
	outputSchema?: Record<string, unknown>;
	inputType?: string;
	outputType?: string;
}
export interface ServiceContract {
	methods: Record<string, ServiceMethodContract>;
}
export interface ServiceSchema {
	service?: { id?: string; name?: string; provider?: string; readOnly?: boolean };
	tools: Record<string, ServiceTool>;
}
export interface ServiceCallOptions {
	signal?: AbortSignal;
}

/** 与 wcli schema/call 的参数结构一致；transport 和认证由宿主提供。 */
export interface ServiceRuntimeClient {
	getSchema(input: { params: { service: string } }, options?: ServiceCallOptions): Promise<ServiceSchema>;
	call(
		input: { params: { service: string }; body: { toolName: string; input: unknown } },
		options?: ServiceCallOptions,
	): Promise<unknown>;
}
export interface ServiceClient {
	getSchema(options?: ServiceCallOptions): Promise<ServiceSchema>;
	call(tool: string, input: unknown, options?: ServiceCallOptions): Promise<unknown>;
	close?(): void | Promise<void>;
}
export interface ServiceProviderContext {
	name: string;
	config: CliServiceConfig;
	context: ResolvedServiceContext;
	fetch: typeof globalThis.fetch;
	sqlDriver?: SqlAdapterFactory;
	redisDriver?: RedisAdapterFactory;
	edgeTtsSocketFactory?: EdgeTtsSocketFactory;
	getEnv?(name: string): string | undefined;
}
export interface ServiceProvider extends ServiceProviderMetadata {
	name: string;
	/** Typed adapters resolve references when loading a capability, after schema discovery. */
	deferConfigResolution?: boolean;
	aliases?: readonly string[];
	capabilities?: readonly string[];
	optionsSchema?: ServiceOptionsSchema;
	contract?: ServiceContract;
	/** Static discovery metadata; adapters return independent clones from getSchema. */
	tools?: Record<string, ServiceTool>;
	create(context: ServiceProviderContext): ServiceClient | Promise<ServiceClient>;
}

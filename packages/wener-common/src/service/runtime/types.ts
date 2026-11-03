import type { CliServiceConfig } from '../config';
import type { SqlAdapterFactory } from '../sql/types';

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
	getEnv?(name: string): string | undefined;
}
export interface ServiceProvider {
	name: string;
	/** Typed adapters resolve references when loading a capability, after schema discovery. */
	deferConfigResolution?: boolean;
	aliases?: readonly string[];
	capabilities?: readonly string[];
	optionsSchema?: ServiceOptionsSchema;
	contract?: ServiceContract;
	create(context: ServiceProviderContext): ServiceClient | Promise<ServiceClient>;
}

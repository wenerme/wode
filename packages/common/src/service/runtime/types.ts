import type { CliServiceConfig, ResolvedCliContext } from '../../context';

export interface ServiceTool {
	title?: string;
	description?: string;
	inputSchema: Record<string, unknown>;
	outputSchema?: Record<string, unknown>;
	annotations?: { readOnlyHint?: boolean; destructiveHint?: boolean };
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
	context: ResolvedCliContext;
	fetch: typeof globalThis.fetch;
}
export interface ServiceProvider {
	name: string;
	create(context: ServiceProviderContext): ServiceClient | Promise<ServiceClient>;
}

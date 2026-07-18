import { z } from 'zod';

export const McpTransportSchema = z.enum(['streamable-http', 'sse', 'stdio']);
export type McpTransport = z.infer<typeof McpTransportSchema>;

const CompatibleMcpTransportSchema = z.enum(['http', 'streamable-http', 'sse', 'stdio']);
const StringMapSchema = z.record(z.string(), z.string());
const ValueMapSchema = z.record(z.string(), z.json());

const McpServerSharedShape = {
	id: z.string().min(1).optional(),
	name: z.string().min(1).optional(),
	title: z.string().optional(),
	description: z.string().optional(),
	timeout: z.number().int().positive().optional(),
	timeoutMs: z.number().int().positive().optional(),
	options: ValueMapSchema.optional(),
	tags: z.array(z.string().min(1)).optional(),
	metadata: ValueMapSchema.optional(),
	extensions: ValueMapSchema.optional(),
};
const McpServerCanonicalSharedShape = {
	...McpServerSharedShape,
	enabled: z.boolean().default(true),
};

export const McpStreamableHttpServerConfigSchema = z.strictObject({
	...McpServerCanonicalSharedShape,
	transport: z.literal('streamable-http'),
	url: z.string().min(1),
	headers: StringMapSchema.optional(),
});
export type McpStreamableHttpServerConfig = z.infer<typeof McpStreamableHttpServerConfigSchema>;

export const McpSseServerConfigSchema = z.strictObject({
	...McpServerCanonicalSharedShape,
	transport: z.literal('sse'),
	url: z.string().min(1),
	headers: StringMapSchema.optional(),
});
export type McpSseServerConfig = z.infer<typeof McpSseServerConfigSchema>;

export const McpStdioServerConfigSchema = z.strictObject({
	...McpServerCanonicalSharedShape,
	transport: z.literal('stdio'),
	command: z.string().min(1),
	args: z.array(z.string()).optional(),
	env: StringMapSchema.optional(),
	cwd: z.string().min(1).optional(),
});
export type McpStdioServerConfig = z.infer<typeof McpStdioServerConfigSchema>;

export const McpServerConfigSchema = z.discriminatedUnion('transport', [
	McpStreamableHttpServerConfigSchema,
	McpSseServerConfigSchema,
	McpStdioServerConfigSchema,
]);
export type McpServerConfigInput = z.input<typeof McpServerConfigSchema>;
export type McpServerConfig = z.output<typeof McpServerConfigSchema>;

export const McpServerConfigCompatibilityInputSchema = z
	.strictObject({
		...McpServerSharedShape,
		enabled: z.boolean().optional(),
		transport: CompatibleMcpTransportSchema.optional(),
		type: CompatibleMcpTransportSchema.optional(),
		url: z.string().min(1).optional(),
		serverUrl: z.string().min(1).optional(),
		headers: StringMapSchema.optional(),
		command: z.string().min(1).optional(),
		args: z.array(z.string()).optional(),
		env: StringMapSchema.optional(),
		cwd: z.string().min(1).optional(),
		disabled: z.boolean().optional(),
	})
	.superRefine((value, context) => {
		const fromTransport = canonicalTransport(value.transport);
		const fromType = canonicalTransport(value.type);
		if (fromTransport && fromType && fromTransport !== fromType) {
			context.addIssue({ code: 'custom', message: 'transport and type conflict', path: ['transport'] });
		}
		const transport = fromTransport ?? fromType ?? inferTransport(value);
		if (!transport) {
			context.addIssue({
				code: 'custom',
				message: 'MCP server requires transport/type, URL, or command',
				path: ['transport'],
			});
			return;
		}
		if (value.enabled !== undefined && value.disabled !== undefined && value.enabled !== !value.disabled) {
			context.addIssue({
				code: 'custom',
				message: 'enabled and disabled must describe the same state',
				path: ['enabled'],
			});
		}
		if (transport === 'stdio') {
			if (!value.command) {
				context.addIssue({ code: 'custom', message: 'stdio transport requires command', path: ['command'] });
			}
			addForbiddenFields(context, value, ['url', 'serverUrl', 'headers'], transport);
		} else {
			if (!value.url && !value.serverUrl) {
				context.addIssue({
					code: 'custom',
					message: `${transport} transport requires url or serverUrl`,
					path: ['url'],
				});
			}
			addForbiddenFields(context, value, ['command', 'args', 'env', 'cwd'], transport);
		}
	})
	.transform((value): z.input<typeof McpServerConfigSchema> => {
		const transport = canonicalTransport(value.transport) ?? canonicalTransport(value.type) ?? inferTransport(value);
		const shared = {
			id: value.id,
			name: value.name,
			title: value.title,
			description: value.description,
			timeout: value.timeout,
			timeoutMs: value.timeoutMs,
			options: value.options,
			tags: value.tags,
			metadata: value.metadata,
			extensions: value.extensions,
			enabled: value.enabled ?? !(value.disabled ?? false),
		};
		if (transport === 'stdio') {
			return {
				...shared,
				transport,
				command: value.command ?? '',
				args: value.args,
				env: value.env,
				cwd: value.cwd,
			};
		}
		return {
			...shared,
			transport: transport ?? 'streamable-http',
			url: value.url ?? value.serverUrl ?? '',
			headers: value.headers,
		};
	})
	.pipe(McpServerConfigSchema);
export type McpServerConfigCompatibilityInput = z.input<typeof McpServerConfigCompatibilityInputSchema>;

export function normalizeMcpServerConfig(input: McpServerConfigCompatibilityInput): McpServerConfig {
	return McpServerConfigCompatibilityInputSchema.parse(input);
}

function canonicalTransport(value: z.infer<typeof CompatibleMcpTransportSchema> | undefined): McpTransport | undefined {
	return value === 'http' ? 'streamable-http' : value;
}

function inferTransport(value: { command?: string; url?: string; serverUrl?: string }): McpTransport | undefined {
	if (value.command) return 'stdio';
	if (value.url || value.serverUrl) return 'streamable-http';
	return undefined;
}

function addForbiddenFields(
	context: z.core.$RefinementCtx<unknown>,
	value: Record<string, unknown>,
	fields: readonly string[],
	transport: McpTransport,
): void {
	for (const field of fields) {
		if (value[field] === undefined) continue;
		context.addIssue({
			code: 'custom',
			message: `${transport} transport does not accept ${field}`,
			path: [field],
		});
	}
}

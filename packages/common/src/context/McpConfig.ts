import { z } from 'zod';

const McpTransportSchema = z.enum(['stdio', 'http']).default('stdio');

export const CliMcpServerConfigSchema = z.looseObject({
	transport: McpTransportSchema,
	command: z.string().optional(),
	args: z.array(z.string()).optional(),
	env: z.record(z.string(), z.string()).optional(),
	cwd: z.string().optional(),
	url: z.string().optional(),
	headers: z.record(z.string(), z.string()).optional(),
	enabled: z.boolean().default(true),
	timeout: z.number().int().positive().max(300_000).optional(),
	title: z.string().optional(),
	description: z.string().optional(),
});

export const CliMcpServersSchema = z.record(z.string(), CliMcpServerConfigSchema);

export type CliMcpServerConfig = z.infer<typeof CliMcpServerConfigSchema>;
export type CliMcpServers = z.infer<typeof CliMcpServersSchema>;

export function describeMcpServers(servers: Record<string, CliMcpServerConfig>): Record<string, unknown> {
	return Object.fromEntries(
		Object.entries(servers).map(([name, server]) => [
			name,
			{
				transport: server.transport,
				enabled: server.enabled !== false,
				title: server.title,
				description: server.description,
				...(server.transport === 'http'
					? { url: sanitizeMcpUrl(server.url) }
					: { command: server.command, args: redactMcpArgs(server.args) }),
			},
		]),
	);
}

export function redactMcpArg(value: string): string {
	if (!/(token|secret|password|passwd|api[-_]?key|authorization|access[-_]?token|auth)/iu.test(value)) return value;
	const separator = value.search(/[=:]/u);
	return separator >= 0 ? `${value.slice(0, separator + 1)}<redacted>` : '<redacted>';
}

export function redactMcpArgs(values: readonly string[] | undefined): string[] | undefined {
	if (!values) return values;
	const result: string[] = [];
	let redactNext = false;
	for (const value of values) {
		if (redactNext) {
			result.push('<redacted>');
			redactNext = false;
			continue;
		}
		if (
			/^(?:-H|--header|--token|--secret|--password|--passwd|--api[-_]?key|--auth|--authorization|--access[-_]?token)$/iu.test(
				value,
			)
		) {
			result.push(value);
			redactNext = true;
			continue;
		}
		result.push(redactMcpArg(value));
	}
	return result;
}

export function sanitizeMcpUrl(value: string | undefined): string | undefined {
	if (!value) return value;
	try {
		const url = new URL(value);
		url.username = '';
		url.password = '';
		url.hash = '';
		for (const key of [...url.searchParams.keys()]) url.searchParams.set(key, '<redacted>');
		return url.toString();
	} catch {
		return '<invalid-url>';
	}
}

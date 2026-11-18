import { type CliCommand, type CliOptions, CliUsageError } from '@wener/common/cli';
import { getCliOutputOptions } from '@wener/common/cli/getCliOutputOptions';
import { type CliMcpServerConfig, redactMcpArgs, sanitizeMcpUrl } from 'common/context';
import { formatJsonSchemaTypeScriptExpression } from 'common/utils';
import { optionString, readCommandText, writeCommandOutput } from '../command-utils';
import type { WoctlCommand, CliExecution, WocliMcpConnection } from '../createCli';

type ServerEntry = { name: string; config: CliMcpServerConfig };

const typescriptOption = { name: 'typescript', type: 'boolean' as const, description: 'Show tool contracts as TypeScript' };

function writeToolInfo(
	server: string,
	tool: Awaited<ReturnType<WocliMcpConnection['listTools']>>[number],
	options: CliOptions,
	context: CliExecution,
) {
	if (options.typescript !== true) return writeCommandOutput({ server, ...tool }, options, context);
	writeToolContracts([tool], context, server);
}

function writeToolContracts(
	tools: Awaited<ReturnType<WocliMcpConnection['listTools']>>,
	context: CliExecution,
	server?: string,
) {
	const title = server?.split(/[^\p{L}\p{N}$]+/u).filter(Boolean)
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join('') || 'Mcp';
	const interfaceName = `${/^[\p{ID_Start}_$]/u.test(title) ? title : `Mcp${title}`}Tools`;
	const schemaType = (value: unknown) => formatJsonSchemaTypeScriptExpression(
		value && typeof value === 'object' && !Array.isArray(value)
			? value as Parameters<typeof formatJsonSchemaTypeScriptExpression>[0]
			: undefined,
	);
	const methods = tools.map((tool) => {
		const toolName = String(tool.name);
		const name = /^[A-Za-z_$][\w$]*$/u.test(toolName) ? toolName : JSON.stringify(toolName);
		const description = typeof tool.description === 'string' && tool.description
			? `  /** ${tool.description.replace(/\*\//gu, '* /').replace(/[\r\n]/gu, ' ')} */\n`
			: '';
		const input = schemaType(tool.inputSchema);
		const output = schemaType(tool.outputSchema);
		return `${description}  ${`${name}(input: ${input}): Promise<${output}>;`.replace(/\n/gu, '\n  ')}`;
	});
	context.stdout(`export interface ${interfaceName} {\n${methods.join('\n')}\n}\n`);
}

function servers(context: CliExecution): ServerEntry[] {
	return Object.entries(context.getConfigContext().mcpServers ?? {}).map(([name, config]) => ({ name, config }));
}

function selectServer(context: CliExecution, name: string): ServerEntry {
	const server = servers(context).find((entry) => entry.name === name);
	if (!server) throw new CliUsageError(`Unknown MCP server: ${name}`);
	if (server.config.enabled === false) throw new CliUsageError(`MCP server is disabled: ${name}`);
	return server;
}

function adHocServer(options: CliOptions): ServerEntry | undefined {
	const url = optionString(options, 'url');
	const name = optionString(options, 'name');
	if (url === undefined && name === undefined) return undefined;
	if (!url || !name) throw new CliUsageError('Ad hoc MCP requires both --url and --name');
	try {
		const parsed = new URL(url);
		if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error();
	} catch {
		throw new CliUsageError('Ad hoc MCP --url must be an HTTP(S) URL');
	}
	return { name, config: { transport: 'http', url, enabled: true } };
}

function selectCommandServer(context: CliExecution, name: string | undefined, options: CliOptions): ServerEntry {
	const adhoc = adHocServer(options);
	if (adhoc) {
		if (name !== undefined && name !== adhoc.name) throw new CliUsageError(`Unknown ad hoc MCP server: ${name}`);
		return adhoc;
	}
	if (!name) throw new CliUsageError('MCP server name is required');
	return selectServer(context, name);
}

async function connectEntry(context: CliExecution, entry: ServerEntry): Promise<WocliMcpConnection> {
	if (!context.host.mcp) throw new CliUsageError('MCP is only available in the Node CLI');
	return context.host.mcp.connect(entry.config, context.signal);
}

function safeServer(entry: ServerEntry) {
	const { config } = entry;
	return {
		name: entry.name,
		transport: config.transport,
		enabled: config.enabled !== false,
		title: config.title,
		description: config.description,
		...(config.transport === 'http'
			? { url: sanitizeMcpUrl(config.url) }
			: {
					command: config.command,
					args: redactMcpArgs(config.args?.map((value) => (value.length > 160 ? `${value.slice(0, 157)}...` : value))),
				}),
	};
}

function textResult(value: unknown): string {
	if (typeof value === 'string') return value;
	if (value && typeof value === 'object' && Array.isArray((value as { content?: unknown }).content)) {
		const text = (value as { content: Array<{ type?: string; text?: string }> }).content
			.filter((item) => item.type === 'text' && item.text)
			.map((item) => item.text)
			.join('\n');
		if (text) return text;
	}
	return JSON.stringify(value, null, 2);
}

function jsonOption(options: CliOptions): boolean {
	return options.json === true;
}

function listCommand(): CliCommand<CliExecution> {
	return {
		name: 'servers',
		aliases: ['list'],
		description: 'List configured MCP servers without connecting',
		run: ({ options }, context) => {
			const adhoc = adHocServer(options);
			return writeCommandOutput((adhoc ? [adhoc] : servers(context)).map(safeServer), options, context);
		},
	};
}

function toolsCommand(): CliCommand<CliExecution> {
	return {
		name: 'tools',
		arguments: '[server] [tool]',
		description: 'List MCP tool names, or inspect one tool',
		options: [typescriptOption],
		async run({ args, options }, context) {
			const adhoc = adHocServer(options);
			const selected = args[0] || adhoc
				? [selectCommandServer(context, args[0], options)]
				: servers(context).filter((s) => s.config.enabled !== false);
			const rows: Record<string, unknown>[] = [];
			for (const server of selected) {
				const client = await connectEntry(context, server);
				try {
					const tools = await client.listTools(context.signal);
					if (args[1]) {
						const tool = tools.find((item) => item.name === args[1]);
						if (!tool) throw new CliUsageError(`Unknown MCP tool: ${args[1]}`);
						writeToolInfo(server.name, tool, options, context);
						return;
					}
					for (const tool of tools) rows.push({ server: server.name, ...tool });
				} finally {
					await client.close();
				}
			}
			if (options.typescript === true) {
				return writeToolContracts(rows.map((tool) => ({
					...tool, name: selected.length > 1 ? `${tool.server}/${tool.name}` : tool.name,
				})), context, selected.length === 1 ? selected[0].name : undefined);
			}
			const output = getCliOutputOptions(context, options);
			if (output.fields?.length || options.output !== undefined || options.json === true) {
				writeCommandOutput(rows, options, context);
				return;
			}
			const names = rows.map((tool) => selected.length > 1 ? `${tool.server}/${tool.name}` : String(tool.name));
			if (names.length) context.stdout(`${names.join('\n')}\n`);
		},
	};
}

function resourcesCommand(): CliCommand<CliExecution> {
	return {
		name: 'resources',
		arguments: '[server]',
		description: 'List MCP resources',
		async run({ args, options }, context) {
			const adhoc = adHocServer(options);
			const selected = args[0] || adhoc
				? [selectCommandServer(context, args[0], options)]
				: servers(context).filter((s) => s.config.enabled !== false);
			const rows: Record<string, unknown>[] = [];
			for (const server of selected) {
				const client = await connectEntry(context, server);
				try {
					for (const resource of await client.listResources(context.signal))
						rows.push({ server: server.name, ...resource });
				} finally {
					await client.close();
				}
			}
			writeCommandOutput(rows, options, context);
		},
	};
}

function readCommand(): CliCommand<CliExecution> {
	return {
		name: 'read',
		arguments: '<server> <uri>',
		description: 'Read an MCP resource',
		async run({ args, options }, context) {
			const entry = selectCommandServer(context, args[0], options);
			const client = await connectEntry(context, entry);
			try {
				const result = await client.readResource(args[1], context.signal);
				if (jsonOption(options)) writeCommandOutput(result, options, context);
				else context.stdout(textResult(result));
			} finally {
				await client.close();
			}
		},
	};
}

function infoCommand(): CliCommand<CliExecution> {
	return {
		name: 'info',
		arguments: '<server> [tool]',
		description: 'Show MCP server or tool information',
		options: [typescriptOption],
		async run({ args, options }, context) {
			const entry = selectCommandServer(context, args[0], options);
			if (!args[1] && options.typescript !== true) {
				const client = await connectEntry(context, entry);
				try {
					writeCommandOutput({ server: safeServer(entry), info: client.serverInfo ?? null }, options, context);
				} finally {
					await client.close();
				}
				return;
			}
			const client = await connectEntry(context, entry);
			try {
				const tools = await client.listTools(context.signal);
				if (!args[1]) return writeToolContracts(tools, context, entry.name);
				const tool = tools.find((item) => item.name === args[1]);
				if (!tool) throw new CliUsageError(`Unknown MCP tool: ${args[1]}`);
				writeToolInfo(entry.name, tool, options, context);
			} finally {
				await client.close();
			}
		},
	};
}

function callCommand(): CliCommand<CliExecution> {
	return {
		name: 'call',
		arguments: '<server> <tool> [input]',
		options: [{ name: 'input', aliases: ['i'], description: 'JSON, @file, or - to read stdin' }],
		description: 'Call an MCP tool',
		async run({ args, options }, context) {
			const raw = args[2] ?? optionString(options, 'input') ?? '{}';
			const text = await readCommandText(raw, context);
			let input: unknown;
			try {
				input = JSON.parse(text);
			} catch {
				throw new CliUsageError('MCP tool input must be valid JSON');
			}
			if (!input || typeof input !== 'object' || Array.isArray(input))
				throw new CliUsageError('MCP tool input must be a JSON object');
			const entry = selectCommandServer(context, args[0], options);
			const client = await connectEntry(context, entry);
			try {
				const result = await client.callTool(args[1], input as Record<string, unknown>, context.signal);
				if (jsonOption(options)) writeCommandOutput(result, options, context);
				else context.stdout(textResult(result));
			} finally {
				await client.close();
			}
		},
	};
}

function grepCommand(): CliCommand<CliExecution> {
	return {
		name: 'grep',
		arguments: '<pattern>',
		description: 'Search MCP tools',
		async run({ args, options }, context) {
			const pattern = args[0]
				.replace(/[.+^${}()|[\]\\]/g, '\\$&')
				.replace(/\*/g, '.*')
				.replace(/\?/g, '.');
			const regex = new RegExp(pattern, 'i');
			const rows: Record<string, unknown>[] = [];
			const adhoc = adHocServer(options);
			for (const server of (adhoc ? [adhoc] : servers(context).filter((s) => s.config.enabled !== false))) {
				const client = await connectEntry(context, server);
				try {
					for (const tool of await client.listTools(context.signal))
						if (regex.test(`${server.name}/${tool.name} ${tool.description ?? ''}`))
							rows.push({ server: server.name, ...tool });
				} finally {
					await client.close();
				}
			}
			writeCommandOutput(rows, options, context);
		},
	};
}

export function createMcpCommand(): WoctlCommand {
	return {
		name: 'mcp',
		hostCapability: 'mcp',
		description: 'MCP servers, tools, resources and calls',
		options: [
			{ name: 'url', description: 'Temporary HTTP MCP URL; not saved to configuration' },
			{ name: 'name', description: 'Temporary MCP server name' },
		],
		commands: [
			listCommand(),
			toolsCommand(),
			resourcesCommand(),
			readCommand(),
			infoCommand(),
			callCommand(),
			grepCommand(),
		],
	};
}

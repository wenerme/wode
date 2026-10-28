import { type CliCommand, type CliOptions, CliUsageError } from '@wener/common/cli';
import { type CliMcpServerConfig, redactMcpArgs, sanitizeMcpUrl } from 'common/context';
import { optionString, readCommandText, writeCommandOutput } from '../command-utils';
import type { WocliCommand, WocliExecution, WocliMcpConnection } from '../createWocliCli';

type ServerEntry = { name: string; config: CliMcpServerConfig };

function servers(context: WocliExecution): ServerEntry[] {
	return Object.entries(context.getConfigContext().mcpServers ?? {}).map(([name, config]) => ({ name, config }));
}

function selectServer(context: WocliExecution, name: string): ServerEntry {
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

function selectCommandServer(context: WocliExecution, name: string | undefined, options: CliOptions): ServerEntry {
	const adhoc = adHocServer(options);
	if (adhoc) {
		if (name !== undefined && name !== adhoc.name) throw new CliUsageError(`Unknown ad hoc MCP server: ${name}`);
		return adhoc;
	}
	if (!name) throw new CliUsageError('MCP server name is required');
	return selectServer(context, name);
}

async function connectEntry(context: WocliExecution, entry: ServerEntry): Promise<WocliMcpConnection> {
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

function listCommand(): CliCommand<WocliExecution> {
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

function toolsCommand(): CliCommand<WocliExecution> {
	return {
		name: 'tools',
		arguments: '[server]',
		description: 'List MCP tools',
		async run({ args, options }, context) {
			const adhoc = adHocServer(options);
			const selected = args[0] || adhoc
				? [selectCommandServer(context, args[0], options)]
				: servers(context).filter((s) => s.config.enabled !== false);
			const rows: Record<string, unknown>[] = [];
			for (const server of selected) {
				const client = await connectEntry(context, server);
				try {
					for (const tool of await client.listTools(context.signal)) rows.push({ server: server.name, ...tool });
				} finally {
					await client.close();
				}
			}
			writeCommandOutput(rows, options, context);
		},
	};
}

function resourcesCommand(): CliCommand<WocliExecution> {
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

function readCommand(): CliCommand<WocliExecution> {
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

function infoCommand(): CliCommand<WocliExecution> {
	return {
		name: 'info',
		arguments: '<server> [tool]',
		description: 'Show MCP server or tool information',
		async run({ args, options }, context) {
			const entry = selectCommandServer(context, args[0], options);
			if (!args[1]) {
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
				const tool = (await client.listTools(context.signal)).find((item) => item.name === args[1]);
				if (!tool) throw new CliUsageError(`Unknown MCP tool: ${args[1]}`);
				writeCommandOutput({ server: entry.name, ...tool }, options, context);
			} finally {
				await client.close();
			}
		},
	};
}

function callCommand(): CliCommand<WocliExecution> {
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

function grepCommand(): CliCommand<WocliExecution> {
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

export function createMcpCommand(): WocliCommand {
	return {
		name: 'mcp',
		serviceProvider: 'mcp',
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

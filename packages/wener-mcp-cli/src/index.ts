#!/usr/bin/env node
/**
 * MCP-CLI - A lightweight CLI for interacting with MCP servers
 *
 * Commands:
 *   mcp-cli servers                     List all servers and tools
 *   mcp-cli tools [server]              List available tools
 *   mcp-cli grep <pattern>              Search tools by glob pattern
 *   mcp-cli info <server>/<tool>        Show tool schema
 *   mcp-cli call <server>/<tool> <json> Call tool with arguments
 *   mcp-cli resources [server]          List MCP resources
 *   mcp-cli read <server>/<resource>    Read an MCP resource
 *   mcp-cli add [options] <name> <url|command> [args...]  Add server config
 *   mcp-cli rm <name>...                Remove server config(s)
 */
import { Command } from 'commander';
import { addCommand } from './commands/add';
import { callCommand } from './commands/call';
import { grepCommand } from './commands/grep';
import { infoCommand } from './commands/info';
import { readCommand } from './commands/read';
import { resourcesCommand } from './commands/resources';
import { rmCommand } from './commands/rm';
import { serversCommand } from './commands/servers';
import { toolsCommand } from './commands/tools';

const VERSION = '0.1.0';

const program = new Command();

program
	.name('mcp-cli')
	.description('A lightweight CLI for interacting with MCP (Model Context Protocol) servers')
	.version(VERSION);

// Global options
program
	.option('-c, --config <path>', 'Path to config file (mcp.json, mcp_servers.json, etc.)')
	.option('-j, --json', 'Output as JSON (for scripting)', false)
	.option('-d, --with-descriptions', 'Include tool descriptions', false);

// servers command - List all servers and tools
program
	.command('servers')
	.description('List all connected MCP servers and their tools')
	.option('-s, --show-sources', 'Show config source for each server', false)
	.action(async (options) => {
		const globalOpts = program.opts();
		await serversCommand({
			withDescriptions: globalOpts.withDescriptions,
			json: globalOpts.json,
			showSources: options.showSources,
			configPath: globalOpts.config,
		});
	});

// tools command - List available tools
program
	.command('tools [server]')
	.description('List available tools (optionally from a specific server)')
	.action(async (server) => {
		const globalOpts = program.opts();
		await toolsCommand({
			server,
			withDescriptions: globalOpts.withDescriptions,
			json: globalOpts.json,
			configPath: globalOpts.config,
		});
	});

// grep command - Search tools by pattern
program
	.command('grep <pattern>')
	.description('Search tool names and descriptions by glob pattern')
	.action(async (pattern) => {
		const globalOpts = program.opts();
		await grepCommand({
			pattern,
			withDescriptions: globalOpts.withDescriptions,
			json: globalOpts.json,
			configPath: globalOpts.config,
		});
	});

// info command - Show server or tool details
program
	.command('info <target>')
	.description('Show tool schema and description (format: server or server/tool)')
	.action(async (target) => {
		const globalOpts = program.opts();
		await infoCommand({
			target,
			json: globalOpts.json,
			withDescriptions: globalOpts.withDescriptions,
			configPath: globalOpts.config,
		});
	});

// call command - Execute a tool
program
	.command('call <target> [args]')
	.description('Call a tool with JSON arguments (format: server/tool)')
	.action(async (target, args) => {
		const globalOpts = program.opts();
		await callCommand({
			target,
			args,
			json: globalOpts.json,
			configPath: globalOpts.config,
		});
	});

// resources command - List MCP resources
program
	.command('resources [server]')
	.description('List MCP resources (optionally from a specific server)')
	.action(async (server) => {
		const globalOpts = program.opts();
		await resourcesCommand({
			server,
			withDescriptions: globalOpts.withDescriptions,
			json: globalOpts.json,
			configPath: globalOpts.config,
		});
	});

// read command - Read an MCP resource
program
	.command('read <target>')
	.description('Read an MCP resource (format: server/resource-uri)')
	.action(async (target) => {
		const globalOpts = program.opts();
		await readCommand({
			target,
			json: globalOpts.json,
			configPath: globalOpts.config,
		});
	});

// add command - Add MCP server configuration
program
	.command('add')
	.description('Add MCP server configuration to .mcp-cli.json')
	.option('-t, --transport <type>', 'Transport type: http, sse, or stdio', 'stdio')
	.option(
		'-e, --env <KEY=VALUE>',
		'Environment variable (can be repeated)',
		(val: string, prev: string[]) => [...prev, val],
		[],
	)
	.argument('<name>', 'Server name')
	.argument('<url-or-command>', 'URL for http/sse, or command for stdio')
	.argument('[args...]', 'Arguments for stdio command')
	.action(async (name, urlOrCommand, args, options) => {
		const globalOpts = program.opts();
		await addCommand({
			transport: options.transport,
			env: options.env,
			name,
			urlOrCommand,
			args,
			json: globalOpts.json,
		});
	});

// rm command - Remove MCP server configuration(s)
program
	.command('rm')
	.description('Remove MCP server configuration(s) from .mcp-cli.json')
	.argument('<names...>', 'Server name(s) to remove')
	.action(async (names) => {
		const globalOpts = program.opts();
		await rmCommand({
			names,
			json: globalOpts.json,
		});
	});

// Handle graceful shutdown
process.on('SIGINT', () => {
	process.exit(130);
});
process.on('SIGTERM', () => {
	process.exit(143);
});

// Run
program.parseAsync(process.argv).catch((error) => {
	console.error(error.message);
	process.exit(1);
});

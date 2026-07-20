#!/usr/bin/env node
/**
 * MCP-CLI - A lightweight CLI for interacting with MCP servers
 *
 * Commands:
 *   mcp-cli servers                      List all servers and tools
 *   mcp-cli tools [server]               List available tools
 *   mcp-cli grep <pattern>               Search tools by glob pattern
 *   mcp-cli info <server>/<tool>         Show tool schema (REQUIRED before call/query)
 *   mcp-cli query <server>/<tool> <json> Query read-only tool (PREFERRED for agents)
 *   mcp-cli call <server>/<tool> <json>  Call any tool (use query for readonly)
 *   mcp-cli resources [server]           List MCP resources
 *   mcp-cli read <server>/<resource>     Read an MCP resource
 *   mcp-cli add [options] <name> <url|command> [args...]  Add server config
 *   mcp-cli rm <name>...                 Remove server config(s)
 *   mcp-cli dump <format>                Export tools in various formats
 */
import { Command } from 'commander';
import { addCommand } from './commands/add';
import { callCommand } from './commands/call';
import { dumpCommand } from './commands/dump';
import { grepCommand } from './commands/grep';
import { infoCommand } from './commands/info';
import { queryCommand } from './commands/query';
import { readCommand } from './commands/read';
import { resourcesCommand } from './commands/resources';
import { rmCommand } from './commands/rm';
import { serversCommand } from './commands/servers';
import { toolsCommand } from './commands/tools';
import { VERSION } from './const.gen';

const program = new Command();

program
	.name('mcp-cli')
	.description('A lightweight CLI for interacting with MCP (Model Context Protocol) servers')
	.version(VERSION)
	.addHelpText(
		'after',
		`
Configuration:
  Config files are auto-discovered in priority order:
    .mcp-cli.local.json  Local overrides (for secrets, gitignored)
    .mcp-cli.json        Project config (add/rm commands write here)
    .mcp.json            Claude standard format
    .cursor/mcp.json     Cursor format
    .gemini/mcp_config.json  Gemini format

  Config format (mcpServers key):
    {
      "mcpServers": {
        "server-name": { "command": "npx", "args": ["-y", "some-mcp-server"] },
        "remote": { "url": "https://mcp.example.com/mcp" }
      },
      "extends": ["./other-config.json"],  // Inherit from other configs
      "discoveryConfig": false,            // Disable auto-discovery
      "include": ["dev-*", "prod-*"],      // Glob patterns to include
      "exclude": ["*-test"]                // Glob patterns to exclude
    }

  Environment variables:
    MCP_CLI_CONFIG_INLINE    Inline JSON config (highest priority)
    MCP_CONFIG_PATH   Explicit config file path
    MCP_DEBUG         Enable debug output
    MCP_TIMEOUT       Request timeout in seconds (default: 1800)

Examples:
  mcp-cli servers                           List all servers and tools
  mcp-cli servers -v                        Show tools with signatures & annotations
  mcp-cli info myserver/mytool              Show tool schema (REQUIRED before call/query)
  mcp-cli query myserver/search '{"q":"x"}' Query read-only tool (safe, recommended)
  mcp-cli call myserver/update '{"id":1}'   Call any tool (use with caution)
  mcp-cli call myserver/mytool - <<'EOF'    Read JSON from stdin (heredoc)
  mcp-cli add notion https://mcp.notion.com/mcp --transport http
  mcp-cli add myserver -- npx -y some-mcp-server
  mcp-cli rm myserver

  # Inline config for testing
  MCP_CLI_CONFIG_INLINE='{"mcpServers":{"test":{"command":"echo"}},"include":["test"]}' mcp-cli servers

Agent Usage (IMPORTANT):
  1. ALWAYS run "mcp-cli info <server>/<tool>" FIRST to get the schema
  2. Use "mcp-cli query" for read-only operations (tools with readOnlyHint: true)
     - Safer: only invokes tools explicitly marked as read-only
     - Easier to allowlist: can permit "query" while restricting "call"
  3. Use "mcp-cli call" only for write/mutating operations
     - Can invoke ANY tool, including destructive ones
     - Requires explicit permission in production environments

  Recommended pattern for agents:
    mcp-cli info server/tool     # Check schema first
    mcp-cli query server/tool    # For read-only (preferred)
    mcp-cli call server/tool     # For mutations (restricted)
`,
	);

// Global options
program
	.option('-c, --config <path>', 'Path to config file')
	.option('-j, --json', 'Output as JSON (for scripting)', false)
	.option('-d, --with-descriptions', 'Include tool descriptions', false);

// servers command - List all servers and tools
program
	.command('servers')
	.description('List all connected MCP servers and their tools')
	.option('-s, --show-sources', 'Show config source for each server', false)
	.option('-v, --verbose', 'Show extra tool info (annotations)', false)
	.action(async (options) => {
		const globalOpts = program.opts();
		await serversCommand({
			withDescriptions: globalOpts.withDescriptions,
			json: globalOpts.json,
			showSources: options.showSources,
			verbose: options.verbose,
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

// query command - Execute a read-only tool (PREFERRED for agents)
program
	.command('query <target> [args]')
	.description('Query a read-only tool - PREFERRED for agents (only readOnlyHint: true tools)')
	.action(async (target, args) => {
		const globalOpts = program.opts();
		await queryCommand({
			target,
			args,
			json: globalOpts.json,
			configPath: globalOpts.config,
		});
	});

// call command - Execute any tool (use query for readonly)
program
	.command('call <target> [args]')
	.description('Call any tool with JSON arguments - use "query" for read-only operations')
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

// dump command - Export tools in various formats
program
	.command('dump')
	.description('Export MCP tools in various formats')
	.argument('<format>', 'Output format: request-tools (chat-completions format)')
	.action(async (format) => {
		const globalOpts = program.opts();
		if (format !== 'request-tools') {
			console.error(`Unknown format: ${format}. Supported formats: request-tools`);
			process.exit(1);
		}
		await dumpCommand({
			format,
			json: globalOpts.json,
			configPath: globalOpts.config,
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

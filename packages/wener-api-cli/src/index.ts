#!/usr/bin/env node
/**
 * API-CLI - A lightweight CLI for interacting with REST APIs via OpenAPI specifications
 *
 * Commands:
 *   api-cli servers                     List all API servers and operations
 *   api-cli ops [server]                List available operations
 *   api-cli grep <pattern>              Search operations by glob pattern
 *   api-cli info <target>               Show operation schema
 *   api-cli get <target> [args]         Execute GET request
 *   api-cli post <target> [args]        Execute POST request
 *   api-cli put <target> [args]         Execute PUT request
 *   api-cli delete <target> [args]      Execute DELETE request
 *   api-cli patch <target> [args]       Execute PATCH request
 *   api-cli call <target> [args]        Execute any API operation
 *   api-cli add <name> <spec-url>       Add server configuration
 *   api-cli rm <names...>               Remove server configuration(s)
 */
import { Command } from 'commander';
import { addCommand } from './commands/add';
import { callCommand } from './commands/call';
import { grepCommand } from './commands/grep';
import { infoCommand } from './commands/info';
import { opsCommand } from './commands/ops';
import { rmCommand } from './commands/rm';
import { serversCommand } from './commands/servers';
import { VERSION } from './const.gen';

const program = new Command();

program
	.name('api-cli')
	.description('A lightweight CLI for interacting with REST APIs via OpenAPI specifications')
	.version(VERSION)
	.addHelpText(
		'after',
		`
Configuration:
  Config files are auto-discovered in priority order:
    .api-cli.local.json  Local overrides (for secrets, gitignored)
    .api-cli.json        Project config (add/rm commands write here)

  Config format:
    {
      "env": {
        "API_TOKEN": "your-secret-token"
      },
      "servers": {
        "petstore": {
          "url": "https://petstore.swagger.io/v3/openapi.json",
          "baseUrl": "https://petstore.swagger.io/v3",
          "headers": { "Authorization": "Bearer \${API_TOKEN}" },
          "type": "openapi"
        }
      }
    }

  Environment variables:
    API_CLI_CONFIG_PATH   Explicit config file path
    API_CLI_DEBUG         Enable debug output
    API_CLI_TIMEOUT       Request timeout in seconds (default: 30)

Examples:
  api-cli servers                              List all servers with operations
  api-cli info petstore/getPetById             Show operation schema by operationId
  api-cli info petstore/pet/1                  Show operation schema by path
  api-cli call petstore/getPetById '{"petId":1}'  Call by operationId
  api-cli get petstore/pet/1                      GET with path params embedded
  api-cli post petstore/addPet '{"name":"dog"}'   POST request
  echo '{"name":"cat"}' | api-cli post petstore/addPet -

Agent Usage:
  IMPORTANT: Always run "api-cli info <server>/<operation>" before calling
  to inspect the operation schema and required parameters.
`,
	);

// Global options
program
	.option('-c, --config <path>', 'Path to config file')
	.option('-j, --json', 'Output as JSON (for scripting)', false)
	.option('-d, --with-descriptions', 'Include descriptions', false);

// servers command - List all API servers with operations
program
	.command('servers')
	.description('List all API servers and their operations')
	.option('-s, --show-sources', 'Show config source for each server', false)
	.action(async (options) => {
		const globalOpts = program.opts();
		await serversCommand({
			json: globalOpts.json,
			showSources: options.showSources,
			withDescriptions: globalOpts.withDescriptions,
			configPath: globalOpts.config,
		});
	});

// ops command - List available operations
program
	.command('ops [server]')
	.description('List available operations (endpoints)')
	.option('--tag <tag>', 'Filter by tag')
	.option('--method <method>', 'Filter by HTTP method')
	.action(async (server, options) => {
		const globalOpts = program.opts();
		await opsCommand({
			server,
			withDescriptions: globalOpts.withDescriptions,
			json: globalOpts.json,
			configPath: globalOpts.config,
			tag: options.tag,
			method: options.method,
		});
	});

// grep command - Search operations by pattern
program
	.command('grep <pattern>')
	.description('Search operations by glob pattern (matches operationId, path, summary)')
	.action(async (pattern) => {
		const globalOpts = program.opts();
		await grepCommand({
			pattern,
			withDescriptions: globalOpts.withDescriptions,
			json: globalOpts.json,
			configPath: globalOpts.config,
		});
	});

// info command - Show operation details
program
	.command('info <target>')
	.description('Show operation details and schema (format: server or server/operationId)')
	.action(async (target) => {
		const globalOpts = program.opts();
		await infoCommand({
			target,
			json: globalOpts.json,
			withDescriptions: globalOpts.withDescriptions,
			configPath: globalOpts.config,
		});
	});

// Helper function to create HTTP method command handler
function createMethodHandler(method: string) {
	return async (target: string, args: string | undefined, options: { header: string[] }) => {
		const globalOpts = program.opts();
		await callCommand({
			target,
			args,
			method,
			json: globalOpts.json,
			configPath: globalOpts.config,
			headers: options.header,
		});
	};
}

// HTTP method commands
const httpMethods = ['get', 'post', 'put', 'delete', 'patch'] as const;

for (const method of httpMethods) {
	program
		.command(`${method} <target> [args]`)
		.description(`Execute ${method.toUpperCase()} request (format: server/path or server/operationId)`)
		.option(
			'-H, --header <key=value>',
			'Add request header (repeatable)',
			(val: string, prev: string[]) => [...prev, val],
			[],
		)
		.action(createMethodHandler(method.toUpperCase()));
}

// call command - Execute any API operation (backward compatibility)
program
	.command('call <target> [args]')
	.description('Execute an API operation (format: server/operationId or server/METHOD/path)')
	.option(
		'-H, --header <key=value>',
		'Add request header (repeatable)',
		(val: string, prev: string[]) => [...prev, val],
		[],
	)
	.action(async (target, args, options) => {
		const globalOpts = program.opts();
		await callCommand({
			target,
			args,
			json: globalOpts.json,
			configPath: globalOpts.config,
			headers: options.header,
		});
	});

// add command - Add server configuration
program
	.command('add <name> <spec-url>')
	.description('Add server configuration to .api-cli.json')
	.option('--base-url <url>', 'API base URL (auto-detected from spec if not provided)')
	.option(
		'-H, --header <key=value>',
		'Default request header (repeatable)',
		(val: string, prev: string[]) => [...prev, val],
		[],
	)
	.action(async (name, specUrl, options) => {
		const globalOpts = program.opts();
		await addCommand({
			name,
			specUrl,
			baseUrl: options.baseUrl,
			headers: options.header,
			json: globalOpts.json,
		});
	});

// rm command - Remove server configuration(s)
program
	.command('rm <names...>')
	.description('Remove server configuration(s) from .api-cli.json')
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

import { StreamableHTTPTransport } from '@hono/mcp';
import { serve } from '@hono/node-server';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { maybeFunction } from '@wener/utils';
import { Command } from 'commander';
import consola from 'consola';
import type { ConsolaInstance } from 'consola/core';
import { config as dotenvConfig } from 'dotenv';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { McpServerOptions, PackageInfo, RuntimeConfig } from './types.js';

let logger = consola.withTag('mcp-server');

function setLogger(
	logger: ConsolaInstance,
	{
		stdio,
		verbose,
	}: {
		stdio?: boolean;
		verbose?: boolean;
	},
) {
	if (stdio) {
		// In STDIO mode, completely silence consola to avoid interfering with JSON-RPC
		logger.level = -999;
		logger.setReporters([
			{
				log: () => {},
			},
		]);
	} else if (verbose) {
		logger.level = 4; // Debug level
	} else {
		logger.level = 3; // Info level
	}
}

/**
 * Load environment variables from specified file
 */
function loadEnvironment(envFile?: string) {
	if (envFile) {
		const result = dotenvConfig({ path: envFile });
		if (result.error) {
			logger.error(`Failed to load environment file: ${envFile}`, result.error);
			process.exit(1);
		}
		logger.success(`Loaded environment variables from: ${envFile}`);
	} else {
		// Try to load .env from current directory by default
		dotenvConfig();
	}
}

/**
 * Create and configure Hono app for HTTP transport
 */
function createHonoApp(config: RuntimeConfig): Hono {
	const app = new Hono();

	// Add request logging middleware
	app.use(async (c, next) => {
		let r;
		try {
			return (r = await next());
		} catch (e) {
			throw e;
		}
	});

	// CORS configuration
	app.use(
		'*',
		cors({
			origin: ['https://claude.ai'],
			allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
			allowHeaders: ['Content-Type', 'Authorization'],
		}),
	);

	// Health check endpoint
	app.get('/health', (c) => {
		return c.json({
			status: 'healthy',
			timestamp: new Date().toISOString(),
			service: config.info.name,
			version: config.info.version,
		});
	});

	return app;
}

/**
 * Setup graceful shutdown handlers
 */
function setupShutdownHandlers(server: Server, httpServer?: any, stdio = false) {
	const shutdown = async (signal: string) => {
		if (!stdio) {
			logger.info(`Received ${signal}, shutting down gracefully...`);
		}

		if (httpServer) {
			httpServer.close();
		}

		if (server) {
			await server.close();
		}

		if (!stdio) {
			logger.info('Server stopped');
		}

		process.exit(0);
	};

	process.on('SIGINT', () => shutdown('SIGINT'));
	process.on('SIGTERM', () => shutdown('SIGTERM'));
}

/**
 * Run MCP server with standardized setup and configuration
 */
export async function runMcpServerCommand(options: McpServerOptions = {}) {
	// load package.json is not reliable
	const info: PackageInfo = {
		name: options.name || 'mcp-server',
		description: options.description || 'MCP Server',
		version: options.version || '1.0.0',
	};

	logger = consola.withTag(info.name);

	const program = options.program || new Command();

	// Setup main command
	program
		.name(info.name)
		.description(info.description)
		.version(info.version)
		.option('-t, --transport <type>', 'Transport type (stdio|http)', options.transport || 'stdio')
		.option('-H, --host <host>', 'HTTP server host)', options.host || 'localhost')
		.option('-p, --port <port>', 'HTTP server port', (process.env.PORT || options.port || 3000).toString())
		.option('-v, --verbose', 'Enable verbose logging')
		.option('--env-file <path>', 'Load environment variables from file')
		.option('--stdio', 'Use STDIO transport (same as --transport stdio)')
		.option('--http', 'Use HTTP transport (same as --transport http)')
		.action(async (cmdOptions) => {
			try {
				// Determine transport type
				const transport = cmdOptions.stdio ? 'stdio' : cmdOptions.http ? 'http' : cmdOptions.transport;
				const stdio = transport === 'stdio';

				// Configure logging early
				setLogger(logger, {
					stdio,
					verbose: cmdOptions.verbose,
				});

				// Load environment variables
				if (!stdio) {
					loadEnvironment(cmdOptions.envFile);
				}

				// Validate transport
				if (!['stdio', 'http'].includes(transport)) {
					if (!stdio) {
						logger.error('Invalid transport type. Must be "stdio" or "http"');
					}
					process.exit(1);
				}

				const config: RuntimeConfig = {
					transport,
					host: cmdOptions.host,
					port: parseInt(cmdOptions.port),
					verbose: cmdOptions.verbose || false,
					envFile: cmdOptions.envFile,
					stdio,
					logger,
					info: info,
					server: new Server(
						{
							name: info.name,
							version: info.version,
						},
						{
							capabilities: {
								tools: {},
								resources: {},
							},
						},
					),
				};

				let app: Hono | undefined;
				let httpServer: any;

				if (transport === 'http') {
					// Create Hono app for HTTP transport
					app = createHonoApp(config);
					config.hono = app;

					if (!stdio) {
						logger.info(`Starting ${info.name} v${info.version}...`);
					}
				}

				// Create server using provided factory function
				if (options.server) {
					config.server = await maybeFunction(options.server, config);
				}

				const server = config.server;
				await options.onServer?.(config);

				// Start server based on transport
				if (transport === 'http' && app) {
					// Add MCP endpoint to Hono app
					app.all('/mcp', async (c) => {
						const transport = new StreamableHTTPTransport();
						await server.connect(transport);
						return transport.handleRequest(c);
					});

					// Start HTTP server
					httpServer = serve({
						fetch: app.fetch,
						port: config.port,
						hostname: config.host,
					});

					logger.success(`${info.name} started on http://${config.host}:${config.port}`);
					logger.info('Available endpoints:');
					logger.info(`  - Health: http://${config.host}:${config.port}/health`);
					logger.info(`  - MCP: http://${config.host}:${config.port}/mcp`);
				} else {
					// STDIO transport
					const transport = new StdioServerTransport();
					await server.connect(transport);

					if (!stdio) {
						logger.info(`${info.name} ready for STDIO communication`);
					}
				}

				// Setup graceful shutdown
				setupShutdownHandlers(server, httpServer, stdio);
			} catch (error) {
				console.error('Failed to start server', error);
				process.exit(1);
			}
		});

	// Allow custom program configuration
	await options.onProgram?.(program);

	// Global error handling
	process.on('unhandledRejection', (error) => {
		console.error('Unhandled promise rejection:', error);
		process.exit(1);
	});

	process.on('uncaughtException', (error) => {
		console.error('Uncaught exception:', error);
		process.exit(1);
	});

	// Parse command line arguments
	program.parse();

	// If no command is provided, show help and exit
	if (!process.argv.slice(2).length) {
		program.outputHelp();
		process.exit(0);
	}

	return {
		logger,
	};
}

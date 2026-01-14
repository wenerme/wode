import { Command } from 'commander';
import consola from 'consola';
import { config as dotenvConfig } from 'dotenv';
import { MssqlMcpServer } from './server/MssqlMcpServer';

const program = new Command();

// Set up the main program as serve command (default)
program
	.name('mssql-mcp')
	.description('Microsoft SQL Server MCP Server')
	.version('1.0.0')
	.option('-v, --verbose', 'enable verbose logging')
	.option('--env-file <path>', 'load environment variables from file')
	.option('-p, --port <port>', 'HTTP server port', '3003')
	.option('-h, --host <host>', 'HTTP server host', 'localhost')
	.option('--stdio', 'use STDIO transport instead of HTTP')
	.action(async (options) => {
		try {
			// Set verbose logging level first
			if (options.verbose) {
				consola.level = 4; // Debug level
			}

			// When using STDIO, disable logging to avoid interfering with MCP communication
			if (options.stdio) {
				consola.level = -1; // Disable all logging
			}

			// Load environment file if specified using dotenv - AFTER stdio check
			if (options.envFile) {
				const result = dotenvConfig({ path: options.envFile });
				if (result.error) {
					consola.error(`Failed to load environment file: ${options.envFile}`, result.error);
					process.exit(1);
				}
				if (!options.stdio) {
					consola.success(`Loaded environment variables from: ${options.envFile}`);
				}
			}

			if (!options.stdio) {
				consola.info('Starting MSSQL MCP server...');
			}

			const server = new MssqlMcpServer({
				port: parseInt(options.port, 10),
				host: options.host,
				stdio: options.stdio,
			});

			await server.start();

			if (!options.stdio) {
				consola.success(`MSSQL MCP server started on http://${options.host}:${options.port}`);
			}

			// Keep the process running
			process.on('SIGINT', async () => {
				if (!options.stdio) {
					consola.info('Shutting down MSSQL MCP server...');
				}
				await server.stop();
				process.exit(0);
			});

			process.on('SIGTERM', async () => {
				if (!options.stdio) {
					consola.info('Shutting down MSSQL MCP server...');
				}
				await server.stop();
				process.exit(0);
			});
		} catch (error) {
			consola.error('Failed to start MSSQL MCP server:', error);
			process.exit(1);
		}
	});

// Global error handling
process.on('unhandledRejection', (error) => {
	consola.error('Unhandled promise rejection:', error);
	process.exit(1);
});

process.on('uncaughtException', (error) => {
	consola.error('Uncaught exception:', error);
	process.exit(1);
});

// Parse command line arguments
program.parse();

// If no command is provided, show help
if (!process.argv.slice(2).length) {
	program.outputHelp();
}

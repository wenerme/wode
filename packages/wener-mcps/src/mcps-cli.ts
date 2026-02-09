#!/usr/bin/env node
/**
 * MCPS - MCP Proxy Server CLI
 *
 * A unified MCP server that supports:
 * - Tencent CLS (Cloud Log Service)
 * - SQL (MySQL, PostgreSQL, SQLite)
 * - Prometheus
 * - Relay (proxy to other MCP servers)
 */
import { serve } from '@hono/node-server';
import { Command } from 'commander';
import consola from 'consola';
import { createServer } from './server/server';

const log = consola.withTag('mcps');

const program = new Command();

program
	.name('mcps')
	.description('MCP Proxy Server - Unified MCP service with relay, SQL, CLS, and Prometheus support')
	.version('0.1.0')
	.option('-p, --port <port>', 'Port to listen on', '8036')
	.option('-c, --cwd <path>', 'Working directory for config files', process.cwd())
	.option('--discovery-config', 'Enable server config discovery endpoints', false)
	.action(async (options) => {
		const port = Number.parseInt(options.port, 10);
		const { app } = createServer({
			cwd: options.cwd,
			port,
			discoveryConfig: options.discoveryConfig,
		});

		log.info(`Starting MCPS server on port ${port}`);

		serve({
			fetch: app.fetch,
			port,
			hostname: '0.0.0.0',
		});

		log.success(`MCPS server running at http://localhost:${port}`);
	});

// Handle graceful shutdown
process.on('SIGINT', () => {
	log.info('Shutting down...');
	process.exit(130);
});
process.on('SIGTERM', () => {
	log.info('Shutting down...');
	process.exit(143);
});

program.parseAsync(process.argv).catch((error) => {
	log.error(error.message);
	process.exit(1);
});

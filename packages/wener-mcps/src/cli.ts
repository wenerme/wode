import { Command } from 'commander';
import type { CreateServerOptions } from './server/server';

export interface CreateProgramOptions {
	name?: string;
	description?: string;
	version?: string;
	defaultPort?: string;
	/** Called before the server starts, allows registering additional providers via side-effect imports */
	beforeStart?: () => void | Promise<void>;
	/** Server setup callback, passed to createServer. Use to register plugins like audit. */
	setup?: CreateServerOptions['setup'];
}

/**
 * Create a reusable Commander program for MCPS server.
 * Consumers can register providers before calling `program.parseAsync()`.
 */
export function createProgram(options: CreateProgramOptions = {}): Command {
	const {
		name = 'mcps',
		description = 'MCP Proxy Server - Unified MCP service with relay, SQL, CLS, and Prometheus support',
		version = '0.1.0',
		defaultPort = '8036',
		beforeStart,
		setup,
	} = options;

	const program = new Command();

	program
		.name(name)
		.description(description)
		.version(version)
		.option('-p, --port <port>', 'Port to listen on', defaultPort)
		.option('-c, --cwd <path>', 'Working directory for config files', process.cwd())
		.option('--discovery-config', 'Enable server config discovery endpoints', false)
		.action(async (opts) => {
			await beforeStart?.();
			const { startServer } = await import('./cli-start.js');
			await startServer({ ...opts, setup });
		});

	return program;
}

import type { Server } from '@modelcontextprotocol/sdk/server/index.js';
import type { MaybeFunction, MaybePromise } from '@wener/utils';
import type { Command } from 'commander';
import type { ConsolaInstance } from 'consola/core';
import type { Hono } from 'hono';

export interface PackageInfo {
	name: string;
	description: string;
	version: string;
}

export interface RuntimeConfig {
	transport: 'stdio' | 'http';
	host: string;
	port: number;
	verbose: boolean;
	envFile?: string;
	stdio: boolean;
	info: PackageInfo;
	hono?: Hono;
	logger: ConsolaInstance;
	server: Server;
}

export interface McpServerOptions {
	name?: string;

	description?: string;

	version?: string;

	transport?: 'stdio' | 'http';

	port?: number;

	host?: string;

	program?: Command;
	onProgram?: (program: Command) => MaybePromise<void>;

	server?: MaybeFunction<MaybePromise<Server>, [config: RuntimeConfig]>;

	onServer?: (config: RuntimeConfig) => MaybePromise<void>;
}

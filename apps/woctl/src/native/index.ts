import { createReadStream } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { CliUsageError } from '@wener/common/cli';
import { DEFAULT_CONFIG_DIRECTORY, DEFAULT_CONFIG_FILENAME, ENV, LEGACY_ENV } from '../const';
import type { WocliHost } from '../createWocliCli';
import { createFileConfigStore } from './config';
import { connectMcpServer } from './mcp';
import { createNativeSqlDriver } from './sql';
import { loadNativeEnv } from './env';

export { createFileConfigStore } from './config';

/** Resolve Node-only bootstrap options without constructing clients or writing configuration. */
export function getNativeCommandOptions(argv: readonly string[]): { argv: string[]; config: string } {
	const args: string[] = [];
	let config =
		process.env[ENV.config] ||
		process.env[LEGACY_ENV.config] ||
		resolve(homedir(), DEFAULT_CONFIG_DIRECTORY, DEFAULT_CONFIG_FILENAME);
	for (let i = 0; i < argv.length; i++) {
		const token = argv[i];
		if (token === '--') {
			args.push(...argv.slice(i));
			break;
		}
		if (token === '--config' || token.startsWith('--config=')) {
			const value = token === '--config' ? argv[++i] : token.slice('--config='.length);
			if (!value || value.startsWith('-')) throw new CliUsageError('--config requires a file path');
			config = value;
		} else args.push(token);
	}
	if (args.length === 1 && ['--version', '-v'].includes(args[0])) args[0] = 'version';
	return { argv: args, config: resolve(config) };
}

/** Node ports; importing this module does not install process signal handlers or execute a command. */
export function createNativeHost(options: { config: string }): WocliHost {
	const cwd = process.cwd();
	let environment: Readonly<Record<string, string>> | undefined;
	return {
		config: createFileConfigStore(options.config, { cwd, projectLookup: true }),
		sqlDriver: createNativeSqlDriver,
		info: { runtime: 'node', node: process.version, platform: process.platform, configPath: options.config },
		getEnv: (name) => (environment ??= loadNativeEnv(cwd))[name] ?? process.env[name],
		env: {
			[ENV.context]: process.env[ENV.context] ?? process.env[LEGACY_ENV.context],
			[ENV.logLevel]: process.env[ENV.logLevel] ?? process.env[LEGACY_ENV.logLevel],
			TERM: process.env.TERM,
			NO_COLOR: process.env.NO_COLOR,
			FORCE_COLOR: process.env.FORCE_COLOR,
			COLORTERM: process.env.COLORTERM,
		},
		term: {
			kind: process.stdout.isTTY ? 'tty' : 'virtual',
			stdinIsTTY: process.stdin.isTTY ?? false,
			stdoutIsTTY: process.stdout.isTTY ?? false,
			columns: process.stdout.columns,
			rows: process.stdout.rows,
		},
		async writeText(path, content, { signal }) {
			signal.throwIfAborted();
			const destination = resolve(path);
			await mkdir(dirname(destination), { recursive: true });
			await writeFile(destination, content, { encoding: 'utf8', mode: 0o600, signal });
		},
		async readText(value, { signal, maxBytes }) {
			const stream = value === '-' ? process.stdin : createReadStream(resolve(value.slice(1)), { signal });
			const chunks: Buffer[] = [];
			let size = 0;
			const onAbort = () => stream.destroy(new Error('Input cancelled'));
			signal.addEventListener('abort', onAbort, { once: true });
			try {
				signal.throwIfAborted();
				for await (const chunk of stream) {
					const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
					size += bytes.length;
					if (size > maxBytes) throw new CliUsageError('Input exceeds size limit');
					chunks.push(bytes);
				}
				return Buffer.concat(chunks).toString('utf8');
			} finally {
				signal.removeEventListener('abort', onAbort);
			}
		},
		mcp: { connect: connectMcpServer },
	};
}

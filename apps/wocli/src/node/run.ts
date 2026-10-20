import { createReadStream } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { CliUsageError } from '@wener/common/cli';
import { CliConfigError } from 'common/context';
import { createWocliCli } from '../createWocliCli';
import { createFileConfigStore } from './config';

function nodeOptions(argv: readonly string[]): { argv: string[]; config: string } {
	const args: string[] = [];
	let config = process.env.WOCLI_CONFIG || resolve(homedir(), '.wode/wocli.yaml');
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

export async function runWocli(argv: readonly string[]): Promise<number> {
	const controller = new AbortController();
	const abort = () => controller.abort(new Error('Command cancelled'));
	process.once('SIGINT', abort);
	process.once('SIGTERM', abort);
	try {
		const input = nodeOptions(argv);
		const cli = createWocliCli({
			config: createFileConfigStore(input.config),
			info: { runtime: 'node', node: process.version, platform: process.platform },
			getEnv: (name) => process.env[name],
			env: {
				WOCLI_CONTEXT: process.env.WOCLI_CONTEXT,
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
		});
		const result = await cli.execute(input.argv, {
			signal: controller.signal,
			columns: process.stdout.columns,
			write: (value) => {
				process.stdout.write(value);
			},
			stdout: (value) => {
				process.stdout.write(value.endsWith('\n') ? value : `${value}\n`);
			},
			stderr: (value) => {
				process.stderr.write(`${value}\n`);
			},
		});
		return result.exitCode;
	} catch (error) {
		process.stderr.write(`wocli: ${error instanceof Error ? error.message : 'Command failed'}\n`);
		return controller.signal.aborted ? 130 : error instanceof CliUsageError || error instanceof CliConfigError ? 2 : 1;
	} finally {
		process.removeListener('SIGINT', abort);
		process.removeListener('SIGTERM', abort);
	}
}

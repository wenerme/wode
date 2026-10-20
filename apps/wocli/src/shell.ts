import { CliUsageError } from '@wener/common/cli';
import { createMemoryCliConfigStore } from 'common/context';
import type { Command } from 'just-bash/browser';
import { createDefaultConfig } from './core';
import { type WocliHost } from './createWocliCli';
import { createWocliWebCli } from './web';

/** 沿用参考 wcli 的 custom command 设计；Bash 负责 argv、管道和重定向。 */
export function createWocliShellCommand(
	host: Omit<WocliHost, 'config'> & Pick<Partial<WocliHost>, 'config'> = {},
): Command {
	const config = host.config ?? createMemoryCliConfigStore(createDefaultConfig());
	return {
		name: 'wocli',
		async execute(args, context) {
			const stdout: string[] = [];
			const stderr: string[] = [];
			const signal = context.signal ?? new AbortController().signal;
			const line = (text: string) => (text.endsWith('\n') ? text : `${text}\n`);
			try {
				const cli = createWocliWebCli({
					...host,
					config,
					env: host.env ?? Object.fromEntries(context.env),
					term: host.term ?? { kind: 'virtual', stdinIsTTY: false, stdoutIsTTY: true },
					writeText:
						host.writeText ??
						(async (path, content, options) => {
							options.signal.throwIfAborted();
							const destination = context.fs.resolvePath(context.cwd, path);
							await context.fs.mkdir(destination.slice(0, destination.lastIndexOf('/')) || '/', { recursive: true });
							await context.fs.writeFile(destination, content);
						}),
					readText:
						host.readText ??
						(async (value, options) => {
							options.signal.throwIfAborted();
							if (value === '-') {
								// just-bash 的 stdin 是 latin1 形态的 UTF-8 字节串。
								const bytes = String(context.stdin);
								if (bytes.length > options.maxBytes) throw new CliUsageError('Input exceeds size limit');
								return new TextDecoder('utf-8', { fatal: true }).decode(
									Uint8Array.from(bytes, (character) => character.charCodeAt(0)),
								);
							}
							return context.fs.readFile(context.fs.resolvePath(context.cwd, value.slice(1)));
						}),
				});
				const result = await cli.execute(args, {
					write: (text) => stdout.push(text),
					stdout: (text) => stdout.push(line(text)),
					stderr: (text) => stderr.push(line(text)),
					signal,
				});
				return { stdout: stdout.join(''), stderr: stderr.join(''), exitCode: result.exitCode };
			} catch (error) {
				const message = error instanceof CliUsageError ? error.message : 'Unable to execute browser wocli command';
				return {
					stdout: '',
					stderr: `wocli: ${message}\n`,
					exitCode: signal.aborted ? 130 : error instanceof CliUsageError ? 2 : 1,
				};
			}
		},
	};
}

import type { IFileSystem, IWritableStreamFileSystem } from '../fs';

export interface CliTerminalInfo {
	readonly kind?: 'tty' | 'virtual';
	readonly name?: string;
	readonly program?: string;
	readonly columns?: number;
	readonly rows?: number;
	readonly stdinIsTTY?: boolean;
	readonly stdoutIsTTY?: boolean;
	readonly stderrIsTTY?: boolean;
	readonly colorDepth?: number;
}

/** 宿主能力对象；命令不修改它，也不拥有 FS 的关闭权。 */
export interface CliRuntime {
	readonly cwd: string;
	readonly env: Readonly<Record<string, string | undefined>>;
	readonly fs: Pick<IFileSystem, 'readFile'> &
		Partial<Omit<IFileSystem, 'readFile'>> &
		Partial<Pick<IWritableStreamFileSystem, 'createWritableStream'>>;
	readonly fetch: typeof globalThis.fetch;
	readonly term?: CliTerminalInfo;
}

export type CliRuntimeInput = Omit<CliRuntime, 'fetch'> & { readonly fetch?: typeof globalThis.fetch };

export function snapshotCliRuntime(runtime: CliRuntimeInput): CliRuntime {
	return Object.freeze({
		cwd: runtime.cwd,
		env: Object.freeze({ ...runtime.env }),
		fs: runtime.fs,
		fetch: runtime.fetch ?? globalThis.fetch.bind(globalThis),
		term: runtime.term ? Object.freeze({ ...runtime.term }) : undefined,
	});
}

export function cliTerminalSize(value: unknown): number | undefined {
	if (value === undefined || value === '') return undefined;
	const size = Number(value);
	return Number.isSafeInteger(size) && size > 0 ? size : undefined;
}

export function getCliColumns(runtime: Pick<CliRuntime, 'term' | 'env'>): number | undefined {
	return cliTerminalSize(runtime.term?.columns) ?? cliTerminalSize(runtime.env.COLUMNS);
}

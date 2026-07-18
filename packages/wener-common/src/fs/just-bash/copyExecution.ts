import type { FsStat as JustBashFsStat } from 'just-bash';
import type { JustBashCopyLimits } from './adapterLimits';
import { createJustBashCopyPlan } from './copyPlan';
import type { JustBashDirent } from './virtualFileSystem';

type ExecuteJustBashCopyOptions = {
	source: string;
	destination: string;
	recursive: boolean;
	limits: Readonly<JustBashCopyLimits>;
	maxReadBytes: number;
	stat(path: string): Promise<JustBashFsStat>;
	readdir(path: string, maxEntries: number): Promise<JustBashDirent[]>;
	readFile(path: string, remainingBytes: number): Promise<Uint8Array>;
	exists(path: string): Promise<boolean>;
	mkdir(path: string): Promise<void>;
	writeFile(path: string, content: Uint8Array): Promise<void>;
	throwIfAborted(): void;
};

export async function executeJustBashCopy(options: ExecuteJustBashCopyOptions): Promise<void> {
	const { source, destination, limits, maxReadBytes, throwIfAborted } = options;
	const sourceStat = await options.stat(source);
	throwIfAborted();
	if (sourceStat.isDirectory && !options.recursive) {
		throw new Error(`EISDIR: recursive copy is required for '${source}'`);
	}
	const plan = await createJustBashCopyPlan({
		source,
		destination,
		limits,
		maxReadBytes,
		stat: options.stat,
		readdir: options.readdir,
		readFile: options.readFile,
		throwIfAborted,
	});
	for (const entry of plan) {
		throwIfAborted();
		if (!entry.directory) {
			await options.writeFile(entry.destination, entry.content);
			continue;
		}
		const destinationExists = await options.exists(entry.destination);
		throwIfAborted();
		if (!destinationExists) await options.mkdir(entry.destination);
	}
}

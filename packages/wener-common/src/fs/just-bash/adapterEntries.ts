import type { FsStat as JustBashFsStat } from 'just-bash';
import type { IFileStat } from '../IFileSystem';
import { assertLegalVirtualBasename } from './paths';
import type { JustBashDirent } from './virtualFileSystem';

export function toJustBashStat(stat: IFileStat, mtime = stat.mtime): JustBashFsStat {
	return {
		isFile: stat.kind === 'file',
		isDirectory: stat.kind === 'directory',
		isSymbolicLink: false,
		mode: stat.kind === 'directory' ? 0o755 : 0o644,
		size: Number.isFinite(stat.size) ? stat.size : 0,
		mtime: new Date(Number.isFinite(mtime) ? mtime : Date.now()),
	};
}

export function syntheticDirectoryStat(): JustBashFsStat {
	return { isFile: false, isDirectory: true, isSymbolicLink: false, mode: 0o755, size: 0, mtime: new Date(0) };
}

export function toJustBashDirent(stat: IFileStat): JustBashDirent {
	return {
		name: assertLegalVirtualBasename(stat.name),
		isFile: stat.kind === 'file',
		isDirectory: stat.kind === 'directory',
		isSymbolicLink: false,
	};
}

export function directoryDirent(name: string): JustBashDirent {
	return { name: assertLegalVirtualBasename(name), isFile: false, isDirectory: true, isSymbolicLink: false };
}

export function mergeDirents(...groups: readonly JustBashDirent[][]): JustBashDirent[] {
	const entries = new Map<string, JustBashDirent>();
	for (const group of groups) for (const entry of group) entries.set(entry.name, entry);
	return Array.from(entries.values()).sort((left, right) => left.name.localeCompare(right.name));
}

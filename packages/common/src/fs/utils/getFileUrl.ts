import type { IFileStat, IFileSystem } from '../IFileSystem';
import type { FileUrlOptions } from '../types';

export function getFileUrl(
	fs: IFileSystem,
	needle?: IFileStat | string,
	{
		...options
	}: FileUrlOptions & {
		fs?: IFileSystem;
	} = {},
) {
	const [file, path] = resolveFilePath(needle);
	if (!path || !needle) return;

	let out: string | undefined;
	if (fs?.getUrl) {
		try {
			out = fs.getUrl(needle, options);
		} catch (e) {
			console.error(`failed to get file url`, needle, e);
		}
	}
	if (!out && file) {
		out = file.meta?.url || (file as any).url;
	}
	return out;
}

export function resolveFilePath(needle: IFileStat): [IFileStat, string];
export function resolveFilePath(needle: string): [undefined, string];
export function resolveFilePath(needle?: IFileStat | string): [IFileStat | undefined, string | undefined];
export function resolveFilePath(needle?: IFileStat | string): [IFileStat | undefined, string | undefined] {
	if (!needle) {
		return [undefined, undefined];
	}
	let file = typeof needle === 'string' ? undefined : needle;
	let path = typeof needle === 'string' ? needle : needle.path;

	if (file && !path) {
		path = file.path;
	}
	return [file, path];
}

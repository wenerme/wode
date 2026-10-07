import type { IFileStat } from '../IFileSystem';
import { toStatLocation } from './paths';

export type CreateFileStatInput = {
	path: string;
	kind: IFileStat['kind'];
	size?: number;
	mtime?: number;
	meta?: IFileStat['meta'];
};

/** 构造 IFileStat；根路径的 name 与 directory 为空字符串。 */
export function createFileStat({ path, kind, size = 0, mtime = 0, meta = {} }: CreateFileStatInput): IFileStat {
	return { path, ...toStatLocation(path), kind, mtime, size, meta };
}

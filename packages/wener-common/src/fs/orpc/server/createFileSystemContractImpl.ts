import { implement } from '@orpc/server';
import { ArrayBuffers } from '@wener/utils';
import type { IFileSystem } from '../../IFileSystem';
import { FileSystemContract } from '../FileSystemContract';

export function createFileSystemContractImpl(ifs: IFileSystem) {
	const os = implement(FileSystemContract);

	return {
		readdir: os.readdir.handler(async ({ input }) => {
			return {
				data: await ifs.readdir(input.dir),
			};
		}),
		stat: os.stat.handler(async ({ input }) => {
			return {
				data: await ifs.stat(input.path),
			};
		}),
		mkdir: os.mkdir.handler(async ({ input }) => {
			await ifs.mkdir(input.path, {
				recursive: input.recursive ?? false,
			});
			return {};
		}),
		rename: os.rename.handler(async ({ input }) => {
			await ifs.rename(input.oldPath, input.newPath, {
				overwrite: input.overwrite ?? false,
			});
			return {};
		}),
		exists: os.exists.handler(async ({ input }) => {
			return {
				data: await ifs.exists(input.path),
			};
		}),
		copy: os.copy.handler(async ({ input }) => {
			await ifs.copy(input.src, input.dest, {
				overwrite: input.overwrite ?? false,
				shallow: input.shallow ?? false,
			});
			return {};
		}),
		readFile: os.readFile.handler(async ({ input }) => {
			return {
				base64: ArrayBuffers.toBase64((await ifs.readFile(input.path, { encoding: 'binary' })) as BufferSource),
			};
		}),
		writeFile: os.writeFile.handler(async ({ input }) => {
			await ifs.writeFile(input.path, Buffer.from(input.base64, 'base64'), {
				overwrite: input.overwrite,
			});
			return {};
		}),

		rm: os.rm.handler(async ({ input }) => {
			await ifs.rm(input.path, {
				recursive: input.recursive ?? undefined,
				force: input.force ?? undefined,
			});
			return {};
		}),
	};
}

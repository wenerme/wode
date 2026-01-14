import type { Readable, Writable } from 'node:stream';
import type { ContractRouterClient } from '@orpc/contract';
import { ArrayBuffers } from '@wener/utils';
import type {
	CopyOptions,
	CreateReadStreamOptions,
	CreateWriteStreamOptions,
	IFileSystem,
	MkdirOptions,
	ReaddirOptions,
	ReadFileOptions,
	RenameOptions,
	RmOptions,
	StatOptions,
	WritableData,
	WriteFileOptions,
} from '../IFileSystem';
import { resolveData } from '../utils';
import type { FileSystemContract } from './FileSystemContract';

type FileSystemContractClient = ContractRouterClient<typeof FileSystemContract>;

export function createContractClientFileSystem(client: FileSystemContractClient): IFileSystem & {
	client: FileSystemContractClient;
} {
	return new ContractFS(client);
}

class ContractFS implements IFileSystem {
	client: FileSystemContractClient;

	constructor(client: FileSystemContractClient) {
		this.client = client;
	}

	async readdir(dir: string, options: ReaddirOptions = {}) {
		const { data } = await this.client.readdir({ dir, ...options });
		return data.map((stat) => ({
			...stat,
			mtime: stat.mtime.getTime(),
		}));
	}

	async stat(entry: string, _options?: StatOptions) {
		const { data } = await this.client.stat({ path: entry });
		return {
			...data,
			mtime: data.mtime.getTime(),
		};
	}

	async mkdir(path: string, options?: MkdirOptions) {
		await this.client.mkdir({
			path,
			recursive: options?.recursive,
		});
	}

	readFile(path: string, options?: ReadFileOptions & { encoding: 'text' }): Promise<string>;
	readFile(path: string, options?: ReadFileOptions): Promise<Uint8Array>;
	async readFile(path: string, options?: ReadFileOptions): Promise<string | Uint8Array> {
		// Note: The contract doesn't currently support encoding options.
		const { base64 } = await this.client.readFile({ path });
		let enc = options?.encoding || 'binary';
		let buf = ArrayBuffers.fromBase64(base64);
		switch (enc) {
			case 'text':
				return ArrayBuffers.toString(buf);
		}
		return buf;
	}

	async writeFile(path: string, data: WritableData, options?: WriteFileOptions) {
		let buf = resolveData(data);
		await this.client.writeFile({ path, base64: ArrayBuffers.toBase64(buf as BufferSource), ...options });
	}

	async rename(oldPath: string, newPath: string, options?: RenameOptions) {
		await this.client.rename({
			oldPath,
			newPath,
			overwrite: options?.overwrite,
		});
	}

	async exists(path: string) {
		const { data } = await this.client.exists({ path });
		return data;
	}

	async copy(src: string, dest: string, options?: CopyOptions) {
		await this.client.copy({
			src,
			dest,
			overwrite: options?.overwrite,
			shallow: options?.shallow,
		});
	}

	async rm(path: string, options?: RmOptions) {
		await this.client.rm({
			path,
			recursive: options?.recursive,
			force: options?.force,
		});
	}

	createReadStream(_path: string, _options?: CreateReadStreamOptions): Readable {
		throw new Error('createReadStream is not implemented in ContractFS');
	}

	createWriteStream(_path: string, _options?: CreateWriteStreamOptions): Writable {
		throw new Error('createWriteStream is not implemented in ContractFS');
	}
}

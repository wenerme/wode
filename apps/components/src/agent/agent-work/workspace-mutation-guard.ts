import { FileSystemError, type IFileSystem } from '@wener/common/fs';

export function createAgentWorkspaceMutationGuard(fileSystem: IFileSystem, canMutate: () => boolean): IFileSystem {
	const assertMutationAllowed = () => {
		if (!canMutate()) throw new FileSystemError('Workspace mutations are quarantined', 'EPERM');
	};
	return {
		copy: async (...args) => {
			assertMutationAllowed();
			await fileSystem.copy(...args);
		},
		createReadableStream: fileSystem.createReadableStream?.bind(fileSystem),
		createWritableStream: fileSystem.createWritableStream
			? (...args) => {
					assertMutationAllowed();
					const writer = fileSystem.createWritableStream!(...args).getWriter();
					return new WritableStream({
						abort: (reason) => writer.abort(reason),
						close: async () => {
							try {
								assertMutationAllowed();
								await writer.close();
							} catch (error) {
								await writer.abort(error).catch(() => undefined);
								throw error;
							}
						},
						write: async (chunk) => {
							try {
								assertMutationAllowed();
								await writer.write(chunk);
							} catch (error) {
								await writer.abort(error).catch(() => undefined);
								throw error;
							}
						},
					});
				}
			: undefined,
		exists: (...args) => fileSystem.exists(...args),
		getUrl: fileSystem.getUrl?.bind(fileSystem),
		mkdir: async (...args) => {
			assertMutationAllowed();
			await fileSystem.mkdir(...args);
		},
		readFile: fileSystem.readFile.bind(fileSystem),
		readdir: (...args) => fileSystem.readdir(...args),
		rename: async (...args) => {
			assertMutationAllowed();
			await fileSystem.rename(...args);
		},
		rm: async (...args) => {
			assertMutationAllowed();
			await fileSystem.rm(...args);
		},
		stat: (...args) => fileSystem.stat(...args),
		writeFile: async (...args) => {
			assertMutationAllowed();
			await fileSystem.writeFile(...args);
		},
	};
}

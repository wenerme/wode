import { FileSystemError, type FileSystemErrorCode } from '../FileSystemError';

/** 构造文件系统错误；实现可替换为子类以保留实现自己的错误名称。 */
export type FileSystemErrorFactory = (message: string, code: FileSystemErrorCode | string) => FileSystemError;

export type FileSystemErrors = ReturnType<typeof createFileSystemErrors>;

/** 各实现共用的错误消息模板；消息只包含逻辑路径。 */
export function createFileSystemErrors(
	create: FileSystemErrorFactory = (message, code) => new FileSystemError(message, code),
) {
	return {
		create,
		aborted: () => create('Operation aborted', 'ABORT_ERR'),
		notFound: (path: string) => create(`File not found: ${path}`, 'ENOENT'),
		alreadyExists: (path: string) => create(`File already exists: ${path}`, 'EEXIST'),
		notDirectory: (path: string) => create(`Not a directory: ${path}`, 'ENOTDIR'),
		isDirectory: (path: string) => create(`Is a directory: ${path}`, 'EISDIR'),
		directoryNotEmpty: (path: string) => create(`Directory not empty: ${path}`, 'ENOTEMPTY'),
		overlappingPaths: () => create('Source and destination paths must not overlap', 'EINVAL'),
	};
}

export const fsErrors: FileSystemErrors = createFileSystemErrors();

export function isFileSystemErrorCode(
	error: unknown,
	code: FileSystemErrorCode | string | readonly (FileSystemErrorCode | string)[],
): error is FileSystemError {
	if (!(error instanceof FileSystemError)) return false;
	return typeof code === 'string' ? error.code === code : code.includes(error.code);
}

/** 执行操作；错误码命中 codes 时返回 undefined，其余错误原样抛出。 */
export async function tryFileSystem<T>(
	operation: () => Promise<T>,
	codes: FileSystemErrorCode | string | readonly (FileSystemErrorCode | string)[] = 'ENOENT',
): Promise<T | undefined> {
	try {
		return await operation();
	} catch (error) {
		if (isFileSystemErrorCode(error, codes)) return undefined;
		throw error;
	}
}

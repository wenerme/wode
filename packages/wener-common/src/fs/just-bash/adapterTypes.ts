import type { IFileSystem as JustBashFileSystem } from 'just-bash';
import type { IFileSystem } from '../IFileSystem';
import type { JustBashCopyLimits } from './adapterLimits';

export type CreateJustBashFileSystemAdapterOptions = {
	fs: IFileSystem;
	/** Virtual mount exposed to just-bash. */
	workspaceRoot?: string;
	/** Root inside the supplied IFileSystem. */
	fsRoot?: string;
	readOnly?: boolean;
	/** Maximum bytes returned by one backing-file read. */
	maxReadBytes?: number;
	/** Maximum resulting file bytes allocated while emulating append. */
	maxAppendBytes?: number;
	/** Recursive-copy traversal and aggregate preload budgets. */
	copyLimits?: Partial<JustBashCopyLimits>;
	onWorkspaceChanged?: () => void;
};

export type JustBashFileSystemExecutionContext = {
	signal?: AbortSignal;
	stdin?: string;
	stdinKind?: 'text' | 'bytes';
};

export type JustBashFileSystemAdapter = JustBashFileSystem & {
	setExecutionContext(context: JustBashFileSystemExecutionContext): void;
	clearExecutionContext(): void;
};

export class JustBashReadOnlyFileSystemError extends Error {
	constructor(operation: string) {
		super(`Filesystem is read-only; ${operation} is not allowed`);
		this.name = 'JustBashReadOnlyFileSystemError';
	}
}

export class JustBashUnsupportedFileSystemOperationError extends Error {
	constructor(operation: string) {
		super(`${operation} is not supported by the IFileSystem adapter`);
		this.name = 'JustBashUnsupportedFileSystemOperationError';
	}
}

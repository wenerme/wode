import type Emittery from 'emittery';
import type { ReactNode } from 'react';

export type FileManagerFileStat = {
	directory: string;
	kind: 'directory' | 'file';
	meta: Record<string, unknown>;
	mtime: number;
	name: string;
	path: string;
	size: number;
};

export type FileManagerFileSystem = {
	copy(
		source: string,
		destination: string,
		options?: { overwrite?: boolean; shallow?: boolean; signal?: AbortSignal },
	): Promise<void>;
	getUrl?(path: FileManagerFileStat | string): string | undefined;
	exists(path: string): Promise<boolean>;
	mkdir(path: string, options?: { recursive?: boolean; signal?: AbortSignal }): Promise<void>;
	readFile(path: string, options: { encoding: 'text'; maxBytes?: number; signal?: AbortSignal }): Promise<string>;
	readFile(
		path: string,
		options?: { encoding?: 'binary'; maxBytes?: number; signal?: AbortSignal },
	): Promise<Uint8Array>;
	readdir(path: string, options?: { signal?: AbortSignal }): Promise<FileManagerFileStat[]>;
	rename(source: string, destination: string, options?: { overwrite?: boolean; signal?: AbortSignal }): Promise<void>;
	rm(path: string, options?: { force?: boolean; recursive?: boolean; signal?: AbortSignal }): Promise<void>;
	stat(path: string, options?: { signal?: AbortSignal }): Promise<FileManagerFileStat>;
	writeFile(
		path: string,
		data: string | ArrayBuffer | ArrayBufferView<ArrayBufferLike> | ReadableStream,
		options?: { overwrite?: boolean; signal?: AbortSignal },
	): Promise<void>;
};

export type FileManagerViewMode = 'list' | 'grid';
export type FileManagerSortBy = 'name' | 'size' | 'mtime';
export type FileManagerSortDirection = 'asc' | 'desc';

export type FileManagerCapabilities = {
	copy: boolean;
	createDirectory: boolean;
	createFile: boolean;
	delete: boolean;
	download: boolean;
	edit: boolean;
	move: boolean;
	preview: boolean;
	rename: boolean;
	upload: boolean;
};

export const defaultFileManagerCapabilities: FileManagerCapabilities = {
	copy: true,
	createDirectory: true,
	createFile: true,
	delete: true,
	download: true,
	edit: true,
	move: true,
	preview: true,
	rename: true,
	upload: true,
};

export type FileManagerPlace = {
	id: string;
	label: ReactNode;
	path: string;
	icon?: ReactNode;
};

export type FileManagerDialogState =
	| { type: 'create'; kind: 'directory' | 'file'; value: string }
	| { type: 'delete' }
	| { type: 'rename'; value: string }
	| { type: 'transfer'; mode: 'copy' | 'move'; destination: string }
	| null;

export type FileManagerOperation =
	| { type: 'copy'; paths: string[]; destination: string }
	| { type: 'create-directory'; directory: string; name: string }
	| { type: 'create-file'; directory: string; name: string }
	| { type: 'delete'; paths: string[] }
	| { type: 'download'; paths: string[] }
	| { type: 'move'; paths: string[]; destination: string }
	| { type: 'rename'; path: string; name: string }
	| { type: 'save-text'; path: string; content: string }
	| { type: 'upload'; directory: string; files: File[] };

export type FileManagerHistoryMode =
	| { type: 'push' }
	| { type: 'replace' }
	| { type: 'traverse'; index: number }
	| { type: 'none' };

export type FileManagerRequest =
	| { type: 'load'; path: string; history: FileManagerHistoryMode }
	| { type: 'open'; entry: FileManagerFileStat }
	| { type: 'operation'; fileSystem: FileManagerFileSystem; operation: FileManagerOperation; rootPath: string };

export type FileManagerEvent =
	| { type: 'error'; action: string; error: unknown }
	| { type: 'navigated'; path: string }
	| { type: 'open-failed'; entry: FileManagerFileStat; error: unknown }
	| { type: 'opened'; entry: FileManagerFileStat }
	| {
			type: 'operation-cancelled';
			operation: FileManagerOperation;
			reason: 'aborted' | 'backend-changed';
			result?: FileManagerOperationResult;
	  }
	| { type: 'operation-failed'; operation: FileManagerOperation; error: unknown; result?: FileManagerOperationResult }
	| { type: 'operation-started'; operation: FileManagerOperation }
	| { type: 'operation-succeeded'; operation: FileManagerOperation; result: FileManagerOperationResult }
	| { type: 'selection-changed'; paths: string[] };

export type FileManagerOperationResult = {
	completed: string[];
	failed: Array<{ path: string; error: unknown }>;
};

export type FileManagerEventMap = {
	event: FileManagerEvent;
	request: FileManagerRequest;
};

export type FileManagerStoreState = {
	fileSystem: FileManagerFileSystem;
	rootPath: string;
	capabilities: FileManagerCapabilities;
	navigation: {
		path: string;
		address: string;
		history: string[];
		index: number;
	};
	listing: {
		entries: FileManagerFileStat[];
		status: 'idle' | 'loading' | 'ready' | 'error';
		error?: string;
		requestId: number;
		requestedPath?: string;
	};
	selection: {
		paths: string[];
		anchorPath?: string;
	};
	view: {
		mode: FileManagerViewMode;
		previewOpen: boolean;
		query: string;
		sidebarOpen: boolean;
		sortBy: FileManagerSortBy;
		sortDirection: FileManagerSortDirection;
	};
	operation: {
		status: 'idle' | 'running' | 'error';
		kind?: FileManagerOperation['type'];
		error?: string;
	};
	preview: {
		draft?: { content: string; path: string };
		pendingSavePath?: string;
		saveError?: { message: string; path: string };
	};
	dialog: FileManagerDialogState;
	events: Emittery<FileManagerEventMap>;
	actions: FileManagerActions;
};

export type FileManagerActions = {
	back: () => void;
	beginListing: (path: string) => number;
	clearError: () => void;
	closeDialog: () => void;
	completeListing: (
		requestId: number,
		path: string,
		entries: FileManagerFileStat[],
		history: FileManagerHistoryMode,
	) => boolean;
	failListing: (requestId: number, error: string) => boolean;
	finishOperation: (error?: string, outcome?: 'succeeded' | 'failed' | 'cancelled') => void;
	forward: () => void;
	open: (entry: FileManagerFileStat) => void;
	openDialog: (dialog: Exclude<FileManagerDialogState, null>) => void;
	refresh: () => void;
	replaceFileSystem: (fileSystem: FileManagerFileSystem, rootPath: string, initialPath?: string) => void;
	requestNavigate: (path: string, history?: FileManagerHistoryMode) => void;
	requestOperation: (operation: FileManagerOperation) => void;
	select: (path: string, options?: { range?: boolean; toggle?: boolean; visiblePaths?: readonly string[] }) => void;
	selectAll: (paths: readonly string[]) => void;
	setAddress: (value: string) => void;
	setCapabilities: (capabilities: Partial<FileManagerCapabilities>) => void;
	setDialogValue: (value: string) => void;
	setOperationRunning: (kind: FileManagerOperation['type']) => void;
	setPreviewOpen: (open: boolean) => void;
	setPreviewDraft: (draft?: { content: string; path: string }) => void;
	setPreviewSaveError: (path: string, message?: string) => void;
	setQuery: (query: string) => void;
	setSidebarOpen: (open: boolean) => void;
	setSort: (by: FileManagerSortBy, direction?: FileManagerSortDirection) => void;
	setViewMode: (mode: FileManagerViewMode) => void;
	up: () => void;
};

export type CreateFileManagerStoreOptions = {
	capabilities?: Partial<FileManagerCapabilities>;
	fileSystem: FileManagerFileSystem;
	initialPath?: string;
	rootPath?: string;
	viewMode?: FileManagerViewMode;
};

export type FileManagerStore = import('zustand/vanilla').StoreApi<FileManagerStoreState>;

export type FileManagerPreviewRenderProps = {
	entry: FileManagerFileStat;
	fileSystem: FileManagerFileSystem;
	defaultPreview: ReactNode;
};

export type FileManagerAddressBarRenderProps = {
	currentMenu: ReactNode;
	defaultAddressBar: ReactNode;
	disabled: boolean;
	loading: boolean;
	onPathChange: (path: string) => void;
	onValueChange: (value: string) => void;
	onValueCommit: (value: string) => void;
	path: string;
	rootPath: string;
	value: string;
};

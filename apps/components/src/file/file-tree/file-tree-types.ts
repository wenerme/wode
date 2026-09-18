import type { ComponentPropsWithRef, DragEvent, ReactNode } from 'react';
import type { StoreApi } from 'zustand/vanilla';
import type { FileTreeEmitter, FileTreeLoadReason } from './file-tree-events';

export type FileTreeFileStat = {
	directory: string;
	kind: 'directory' | 'file';
	meta: Record<string, unknown>;
	mtime: number;
	name: string;
	path: string;
	size: number;
};

export type FileTreeFileSystem = {
	readdir(path: string, options?: { signal?: AbortSignal }): Promise<FileTreeFileStat[]>;
};

export type FileTreeLimits = {
	maxCachedDirectories: number;
	maxConcurrency: number;
	maxDepth: number;
	maxNodes: number;
};

export type FileTreeLimitOptions = Partial<FileTreeLimits>;

export type FileTreeMessages = {
	collapse: string;
	empty: string;
	expand: string;
	loadError: (path: string, error: string) => string;
	loading: string;
	maxCachedDirectories: string;
	maxDepth: string;
	maxNodes: string;
	retry: string;
	treeLabel: string;
};

export type FileTreeDirectoryStatus = 'error' | 'idle' | 'loading' | 'queued' | 'ready';
export type FileTreeDirectoryErrorCode = 'load' | 'max-cached-directories' | 'max-nodes';

export type FileTreeDirectoryState = {
	entries: FileTreeFileStat[];
	lastAccess: number;
	path: string;
	status: FileTreeDirectoryStatus;
	error?: string;
	errorCode?: FileTreeDirectoryErrorCode;
	requestId?: number;
};

export type FileTreeSourceState = {
	directoriesOnly: boolean;
	fileSystem: FileTreeFileSystem;
	generation: number;
	rootPath: string;
};

export type FileTreeStoreState = {
	source: FileTreeSourceState;
	limits: FileTreeLimits;
	tree: {
		clock: number;
		directories: Map<string, FileTreeDirectoryState>;
		expanded: Set<string>;
		pendingRefresh: Set<string>;
		pendingRemoval: Set<string>;
	};
	selection: { path?: string };
	navigation: { currentPath: string };
	reveal: { status: 'error' | 'idle' | 'loading' | 'ready'; path?: string; error?: string };
	requests: { nextId: number };
	events: FileTreeEmitter;
	actions: FileTreeActions;
};

export type FileTreeActions = {
	beginRefresh: (
		paths: readonly string[],
		removedPaths: readonly string[],
		generation: number,
	) => { paths: string[]; removedPaths: string[] } | undefined;
	beginLoad: (path: string, generation: number) => number | undefined;
	beginReveal: (path: string, generation: number) => boolean;
	cancelLoad: (path: string, generation: number, requestId?: number) => boolean;
	collapse: (path: string) => void;
	completeLoad: (path: string, generation: number, requestId: number, entries: FileTreeFileStat[]) => boolean;
	completeReveal: (path: string, generation: number) => boolean;
	consumeRefresh: (generation: number) => { paths: string[]; removedPaths: string[] } | undefined;
	expand: (path: string) => void;
	failLoad: (
		path: string,
		generation: number,
		requestId: number,
		error: string,
		errorCode?: FileTreeDirectoryErrorCode,
	) => boolean;
	failReveal: (path: string, generation: number, error: string) => boolean;
	replaceSource: (options: FileTreeSourceOptions) => boolean;
	requestLoad: (path: string, reason?: FileTreeLoadReason) => void;
	requestNavigate: (path: string) => void;
	requestRefresh: (paths: readonly string[], options?: { removedPaths?: readonly string[] }) => void;
	requestReveal: (path: string) => void;
	requestSelection: (path?: string) => void;
	retry: (path: string) => void;
	syncCurrentPath: (path: string) => void;
	syncSelectedPath: (path?: string) => void;
	toggle: (path: string) => void;
	touch: (path: string) => void;
};

export type FileTreeSourceOptions = {
	directoriesOnly?: boolean;
	fileSystem: FileTreeFileSystem;
	limits?: FileTreeLimitOptions;
	rootPath?: string;
};

export type CreateFileTreeStoreOptions = FileTreeSourceOptions & {
	actions?: Partial<FileTreeActions>;
	currentPath?: string;
	selectedPath?: string;
};

export type FileTreeStore = StoreApi<FileTreeStoreState>;

export type FileTreeRenderNode = {
	children?: FileTreeRenderNode[];
	depth: number;
	entry: FileTreeFileStat;
	error?: string;
	errorCode?: FileTreeDirectoryErrorCode;
	id: string;
	isCurrent: boolean;
	kind: 'directory' | 'file';
	name: string;
	path: string;
	status: FileTreeDirectoryStatus;
};

export type FileTreeDropTarget =
	| { path: string; state: 'accepted' }
	| { path: string; reason: string; state: 'rejected' };

export type FileTreeProps = Omit<ComponentPropsWithRef<'div'>, 'children' | 'onSelect'> & {
	currentPath?: string;
	defaultCurrentPath?: string;
	defaultSelectedPath?: string;
	directoriesOnly?: boolean;
	dropTarget?: FileTreeDropTarget;
	/** @deprecated Use dropTarget to expose accepted and rejected target state. */
	dropTargetPath?: string;
	fileSystem: FileTreeFileSystem;
	height?: number;
	indent?: number;
	limits?: FileTreeLimitOptions;
	messages?: Partial<FileTreeMessages>;
	onActivate?: (entry: FileTreeFileStat) => void;
	onEntryDragEnd?: (entry: FileTreeFileStat, event: DragEvent<HTMLElement>) => void;
	onEntryDragStart?: (entry: FileTreeFileStat, event: DragEvent<HTMLElement>) => void;
	onEntryDragOver?: (entry: FileTreeFileStat, event: DragEvent<HTMLElement>) => void;
	onEntryDragLeave?: (entry: FileTreeFileStat, event: DragEvent<HTMLElement>) => void;
	onEntryDrop?: (entry: FileTreeFileStat, event: DragEvent<HTMLElement>) => void;
	onNavigate?: (path: string) => void;
	onSelectionChange?: (path?: string) => void;
	rootPath?: string;
	isEntryDraggable?: boolean | ((entry: FileTreeFileStat) => boolean);
	renderIcon?: (
		entry: FileTreeFileStat,
		state: { isCurrent: boolean; isOpen: boolean; isSelected: boolean },
	) => ReactNode;
	renderLabel?: (
		entry: FileTreeFileStat,
		state: { isCurrent: boolean; isOpen: boolean; isSelected: boolean },
	) => ReactNode;
	rowHeight?: number;
	selectedPath?: string;
	store?: FileTreeStore;
};

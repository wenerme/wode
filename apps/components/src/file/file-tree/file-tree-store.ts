import Emittery from 'emittery';
import { createStore } from 'zustand/vanilla';
import { mutative } from 'zustand-mutative';
import { type FileTreeEventData, FileTreeEventType } from './file-tree-events';
import { canLoadFileTreeDirectory, normalizeFileTreeLimits } from './file-tree-model';
import {
	getFileTreeAncestorPaths,
	isFileTreePathAtOrBelow,
	isFileTreePathWithinRoot,
	normalizeFileTreePath,
} from './file-tree-path';
import type {
	CreateFileTreeStoreOptions,
	FileTreeActions,
	FileTreeDirectoryState,
	FileTreeSourceOptions,
	FileTreeStoreState,
} from './file-tree-types';

export function createFileTreeStore(options: CreateFileTreeStoreOptions) {
	const rootPath = normalizeFileTreePath(options.rootPath ?? '/');
	const limits = normalizeFileTreeLimits(options.limits);
	const currentPath = normalizeWithin(options.currentPath, rootPath) ?? rootPath;
	const selectedPath = normalizeWithin(options.selectedPath, rootPath);
	const events = new Emittery<FileTreeEventData>();

	return createStore(
		mutative<FileTreeStoreState>((setState, getState) => {
			const defaultActions: FileTreeActions = {
				beginLoad: (requestedPath, generation) => {
					const path = normalizeFileTreePath(requestedPath);
					const state = getState();
					if (generation !== state.source.generation || !isLoadablePath(path, state)) return undefined;
					const existing = state.tree.directories.get(path);
					if (existing?.status === 'ready' || existing?.status === 'loading') return undefined;
					let requestId = 0;
					setState((draft) => {
						draft.requests.nextId += 1;
						requestId = draft.requests.nextId;
						const directory = getOrCreateDirectory(draft, path);
						directory.status = 'loading';
						directory.requestId = requestId;
						directory.error = undefined;
						directory.errorCode = undefined;
						touchState(draft, path);
					});
					return requestId;
				},
				beginRefresh: (requestedPaths, requestedRemovedPaths, generation) => {
					const state = getState();
					if (generation !== state.source.generation) return undefined;
					const removedPaths = normalizeRemovedPaths(requestedRemovedPaths, state);
					if (new Set([...state.tree.pendingRemoval, ...removedPaths]).size > state.limits.maxNodes) {
						setState((draft) => {
							for (const path of draft.tree.directories.keys()) {
								if (path !== draft.source.rootPath) draft.tree.directories.delete(path);
							}
							const root = getOrCreateDirectory(draft, draft.source.rootPath);
							root.status = 'idle';
							root.requestId = undefined;
							root.error = undefined;
							root.errorCode = undefined;
							draft.tree.expanded.clear();
							draft.tree.pendingRefresh.clear();
							draft.tree.pendingRefresh.add(draft.source.rootPath);
							draft.tree.pendingRemoval.clear();
							touchState(draft, draft.source.rootPath);
						});
						return { paths: [state.source.rootPath], removedPaths: [] };
					}
					const blockedPaths = [...state.tree.pendingRemoval, ...removedPaths];
					const paths = normalizeRefreshPaths(requestedPaths, state).filter(
						(path) => !blockedPaths.some((removedPath) => isFileTreePathAtOrBelow(path, removedPath)),
					);
					if (!paths.length && !removedPaths.length) return undefined;
					setState((draft) => {
						for (const removedPath of removedPaths) {
							for (const path of draft.tree.directories.keys()) {
								if (isFileTreePathAtOrBelow(path, removedPath)) draft.tree.directories.delete(path);
							}
							for (const path of draft.tree.expanded) {
								if (isFileTreePathAtOrBelow(path, removedPath)) draft.tree.expanded.delete(path);
							}
							for (const path of draft.tree.pendingRefresh) {
								if (isFileTreePathAtOrBelow(path, removedPath)) draft.tree.pendingRefresh.delete(path);
							}
							draft.tree.pendingRemoval.add(removedPath);
						}
						for (const path of paths) {
							const directory = draft.tree.directories.get(path);
							if (!directory) continue;
							directory.status = 'idle';
							directory.requestId = undefined;
							directory.error = undefined;
							directory.errorCode = undefined;
							draft.tree.pendingRefresh.add(path);
							touchState(draft, path);
						}
					});
					return { paths, removedPaths };
				},
				beginReveal: (requestedPath, generation) => {
					const path = normalizeFileTreePath(requestedPath);
					const state = getState();
					if (generation !== state.source.generation || !isFileTreePathWithinRoot(path, state.source.rootPath))
						return false;
					setState((draft) => {
						draft.reveal = { path, status: 'loading' };
						touchState(draft, path);
					});
					return true;
				},
				cancelLoad: (requestedPath, generation, requestId) => {
					const path = normalizeFileTreePath(requestedPath);
					const state = getState();
					const directory = state.tree.directories.get(path);
					if (
						generation !== state.source.generation ||
						!directory ||
						(requestId !== undefined && directory.requestId !== requestId) ||
						(directory.status !== 'loading' && directory.status !== 'queued')
					)
						return false;
					setState((draft) => {
						const next = draft.tree.directories.get(path);
						if (!next) return;
						next.status = 'idle';
						next.requestId = undefined;
					});
					return true;
				},
				collapse: (requestedPath) => {
					const path = normalizeFileTreePath(requestedPath);
					const state = getState();
					if (!isFileTreePathWithinRoot(path, state.source.rootPath)) return;
					setState((draft) => {
						for (const expanded of draft.tree.expanded) {
							if (isFileTreePathAtOrBelow(expanded, path)) draft.tree.expanded.delete(expanded);
						}
						touchState(draft, path);
					});
					void events.emit(FileTreeEventType.AbortRequested, { generation: state.source.generation, path });
				},
				completeLoad: (requestedPath, generation, requestId, entries) => {
					const path = normalizeFileTreePath(requestedPath);
					const state = getState();
					const directory = state.tree.directories.get(path);
					if (
						generation !== state.source.generation ||
						directory?.status !== 'loading' ||
						directory.requestId !== requestId
					)
						return false;
					setState((draft) => {
						const next = getOrCreateDirectory(draft, path);
						next.entries = entries;
						next.status = 'ready';
						next.requestId = undefined;
						next.error = undefined;
						next.errorCode = undefined;
						touchState(draft, path);
						const limitError = enforceCacheLimits(draft, path);
						if (limitError) {
							const failed = getOrCreateDirectory(draft, path);
							failed.entries = [];
							failed.status = 'error';
							failed.errorCode = limitError;
							failed.error = limitError;
						}
					});
					return true;
				},
				completeReveal: (requestedPath, generation) =>
					settleReveal(setState, getState, requestedPath, generation, undefined),
				consumeRefresh: (generation) => {
					const state = getState();
					if (generation !== state.source.generation) return undefined;
					const paths = [...state.tree.pendingRefresh];
					const removedPaths = [...state.tree.pendingRemoval];
					if (!paths.length && !removedPaths.length) return undefined;
					setState((draft) => {
						draft.tree.pendingRefresh.clear();
						draft.tree.pendingRemoval.clear();
					});
					return { paths, removedPaths };
				},
				expand: (requestedPath) => {
					const path = normalizeFileTreePath(requestedPath);
					const state = getState();
					if (!isLoadablePath(path, state)) return;
					setState((draft) => {
						draft.tree.expanded.add(path);
						touchState(draft, path);
					});
					getState().actions.requestLoad(path, 'expand');
				},
				failLoad: (requestedPath, generation, requestId, error, errorCode = 'load') => {
					const path = normalizeFileTreePath(requestedPath);
					const state = getState();
					const directory = state.tree.directories.get(path);
					if (
						generation !== state.source.generation ||
						directory?.status !== 'loading' ||
						directory.requestId !== requestId
					)
						return false;
					setState((draft) => {
						const next = getOrCreateDirectory(draft, path);
						next.status = 'error';
						next.requestId = undefined;
						next.error = error;
						next.errorCode = errorCode;
					});
					return true;
				},
				failReveal: (requestedPath, generation, error) =>
					settleReveal(setState, getState, requestedPath, generation, error),
				replaceSource: (nextOptions) => {
					const state = getState();
					const nextRoot = normalizeFileTreePath(nextOptions.rootPath ?? '/');
					const nextLimits = normalizeFileTreeLimits(nextOptions.limits);
					const nextDirectoriesOnly = nextOptions.directoriesOnly ?? false;
					if (
						state.source.fileSystem === nextOptions.fileSystem &&
						state.source.rootPath === nextRoot &&
						state.source.directoriesOnly === nextDirectoriesOnly &&
						limitsEqual(state.limits, nextLimits)
					)
						return false;
					const previousGeneration = state.source.generation;
					const generation = previousGeneration + 1;
					setState((draft) => {
						draft.source = {
							directoriesOnly: nextDirectoriesOnly,
							fileSystem: nextOptions.fileSystem,
							generation,
							rootPath: nextRoot,
						};
						draft.limits = nextLimits;
						draft.tree = {
							clock: 0,
							directories: new Map([[nextRoot, createDirectory(nextRoot)]]),
							expanded: new Set(),
							pendingRefresh: new Set(),
							pendingRemoval: new Set(),
						};
						draft.navigation.currentPath = normalizeWithin(draft.navigation.currentPath, nextRoot) ?? nextRoot;
						draft.selection.path = normalizeWithin(draft.selection.path, nextRoot);
						draft.reveal = { status: 'idle' };
					});
					void events.emit(FileTreeEventType.AbortRequested, { generation: previousGeneration });
					return true;
				},
				requestLoad: (requestedPath, reason = 'expand') => {
					const path = normalizeFileTreePath(requestedPath);
					const state = getState();
					if (!isLoadablePath(path, state)) return;
					const directory = state.tree.directories.get(path);
					if (directory?.status === 'ready' || directory?.status === 'loading' || directory?.status === 'queued') {
						if (directory.status === 'ready') getState().actions.touch(path);
						return;
					}
					setState((draft) => {
						const next = getOrCreateDirectory(draft, path);
						next.status = 'queued';
						next.error = undefined;
						next.errorCode = undefined;
						touchState(draft, path);
					});
					void events.emit(FileTreeEventType.LoadRequested, {
						generation: state.source.generation,
						path,
						reason,
					});
				},
				requestNavigate: (requestedPath) => {
					const path = normalizeWithin(requestedPath, getState().source.rootPath);
					if (path) void events.emit(FileTreeEventType.NavigateRequested, { path });
				},
				requestRefresh: (requestedPaths, options = {}) => {
					const state = getState();
					const paths = normalizeRefreshPaths(requestedPaths, state);
					const removedPaths = normalizeRemovedPaths(options.removedPaths ?? [], state);
					if (!paths.length && !removedPaths.length) return;
					if (!getState().actions.beginRefresh(paths, removedPaths, state.source.generation)) return;
					void events.emit(FileTreeEventType.RefreshRequested, { generation: state.source.generation });
				},
				requestReveal: (requestedPath) => {
					const path = normalizeWithin(requestedPath, getState().source.rootPath);
					if (!path) return;
					const generation = getState().source.generation;
					void events.emit(FileTreeEventType.RevealRequested, { generation, path });
				},
				requestSelection: (requestedPath) => {
					const path = normalizeWithin(requestedPath, getState().source.rootPath);
					void events.emit(FileTreeEventType.SelectionRequested, { path });
				},
				retry: (requestedPath) => {
					const path = normalizeFileTreePath(requestedPath);
					const directory = getState().tree.directories.get(path);
					if (directory?.status !== 'error') return;
					setState((draft) => {
						const next = draft.tree.directories.get(path);
						if (next) next.status = 'idle';
					});
					getState().actions.requestLoad(path, 'retry');
				},
				syncCurrentPath: (requestedPath) => {
					const state = getState();
					const path = normalizeWithin(requestedPath, state.source.rootPath) ?? state.source.rootPath;
					if (state.navigation.currentPath === path) return;
					setState((draft) => {
						draft.navigation.currentPath = path;
						touchState(draft, path);
					});
					getState().actions.requestReveal(path);
				},
				syncSelectedPath: (requestedPath) => {
					const path = normalizeWithin(requestedPath, getState().source.rootPath);
					if (getState().selection.path === path) return;
					setState((draft) => {
						draft.selection.path = path;
						if (path) touchState(draft, path);
					});
				},
				toggle: (path) => {
					const state = getState();
					if (state.tree.expanded.has(normalizeFileTreePath(path))) state.actions.collapse(path);
					else state.actions.expand(path);
				},
				touch: (requestedPath) => {
					const path = normalizeFileTreePath(requestedPath);
					if (!isFileTreePathWithinRoot(path, getState().source.rootPath)) return;
					setState((draft) => touchState(draft, path));
				},
			};

			return {
				source: {
					directoriesOnly: options.directoriesOnly ?? false,
					fileSystem: options.fileSystem,
					generation: 1,
					rootPath,
				},
				limits,
				tree: {
					clock: 0,
					directories: new Map([[rootPath, createDirectory(rootPath)]]),
					expanded: new Set(),
					pendingRefresh: new Set(),
					pendingRemoval: new Set(),
				},
				selection: { path: selectedPath },
				navigation: { currentPath },
				reveal: { status: 'idle' },
				requests: { nextId: 0 },
				events,
				actions: { ...defaultActions, ...options.actions },
			};
		}),
	);
}

function settleReveal(
	setState: Parameters<Parameters<typeof mutative<FileTreeStoreState>>[0]>[0],
	getState: () => FileTreeStoreState,
	requestedPath: string,
	generation: number,
	error?: string,
) {
	const path = normalizeFileTreePath(requestedPath);
	const state = getState();
	if (generation !== state.source.generation || state.reveal.path !== path || state.reveal.status !== 'loading')
		return false;
	setState((draft) => {
		draft.reveal = error ? { error, path, status: 'error' } : { path, status: 'ready' };
	});
	return true;
}

function enforceCacheLimits(state: FileTreeStoreState, committingPath: string) {
	const protectedPaths = getProtectedPaths(state);
	const candidates = [...state.tree.directories.values()]
		.filter((directory) => directory.status === 'ready' && !protectedPaths.has(directory.path))
		.sort((left, right) => left.lastAccess - right.lastAccess);
	let cachedDirectories = countReadyDirectories(state);
	let nodes = countCachedNodes(state);
	while (
		candidates.length &&
		(cachedDirectories > state.limits.maxCachedDirectories || nodes > state.limits.maxNodes)
	) {
		const candidate = candidates.shift() as FileTreeDirectoryState;
		if (candidate.path === committingPath && protectedPaths.has(committingPath)) continue;
		state.tree.directories.delete(candidate.path);
		cachedDirectories -= 1;
		nodes -= candidate.entries.length;
	}
	if (nodes > state.limits.maxNodes) return 'max-nodes' as const;
	if (cachedDirectories > state.limits.maxCachedDirectories) return 'max-cached-directories' as const;
	return undefined;
}

function getProtectedPaths(state: FileTreeStoreState) {
	const protectedPaths = new Set<string>([state.source.rootPath]);
	const sources = [state.navigation.currentPath, state.selection.path, ...state.tree.expanded];
	for (const directory of state.tree.directories.values()) {
		if (directory.status === 'loading' || directory.status === 'queued') sources.push(directory.path);
	}
	for (const path of sources) {
		if (!path) continue;
		for (const ancestor of getFileTreeAncestorPaths(path, state.source.rootPath)) protectedPaths.add(ancestor);
	}
	return protectedPaths;
}

function countReadyDirectories(state: FileTreeStoreState) {
	let count = 0;
	for (const directory of state.tree.directories.values()) if (directory.status === 'ready') count += 1;
	return count;
}

function countCachedNodes(state: FileTreeStoreState) {
	let count = 0;
	for (const directory of state.tree.directories.values()) {
		if (directory.status === 'ready') count += directory.entries.length;
	}
	return count;
}

function touchState(state: FileTreeStoreState, path: string) {
	state.tree.clock += 1;
	for (const ancestor of getFileTreeAncestorPaths(path, state.source.rootPath)) {
		const directory = state.tree.directories.get(ancestor);
		if (directory) directory.lastAccess = state.tree.clock;
	}
}

function getOrCreateDirectory(state: FileTreeStoreState, path: string) {
	let directory = state.tree.directories.get(path);
	if (!directory) {
		directory = createDirectory(path);
		state.tree.directories.set(path, directory);
	}
	return directory;
}

function createDirectory(path: string): FileTreeDirectoryState {
	return { entries: [], lastAccess: 0, path, status: 'idle' };
}

function isLoadablePath(path: string, state: FileTreeStoreState) {
	return (
		isFileTreePathWithinRoot(path, state.source.rootPath) &&
		canLoadFileTreeDirectory(path, state.source.rootPath, state.limits)
	);
}

function normalizeWithin(path: string | undefined, rootPath: string) {
	if (path === undefined) return undefined;
	const normalized = normalizeFileTreePath(path);
	return isFileTreePathWithinRoot(normalized, rootPath) ? normalized : undefined;
}

function normalizeRefreshPaths(requestedPaths: readonly string[], state: FileTreeStoreState) {
	const paths = new Set<string>();
	const limit = Math.min(requestedPaths.length, state.limits.maxNodes);
	for (let index = 0; index < limit; index += 1) {
		const requestedPath = requestedPaths[index];
		if (typeof requestedPath !== 'string') continue;
		const path = normalizeFileTreePath(requestedPath);
		if (!isLoadablePath(path, state) || !state.tree.directories.has(path)) continue;
		paths.add(path);
	}
	return [...paths];
}

function normalizeRemovedPaths(requestedPaths: readonly string[], state: FileTreeStoreState) {
	const paths = new Set<string>();
	const limit = Math.min(requestedPaths.length, state.limits.maxNodes);
	for (let index = 0; index < limit; index += 1) {
		const requestedPath = requestedPaths[index];
		if (typeof requestedPath !== 'string') continue;
		const path = normalizeFileTreePath(requestedPath);
		if (path === state.source.rootPath || !isFileTreePathWithinRoot(path, state.source.rootPath)) continue;
		paths.add(path);
	}
	return [...paths];
}

function limitsEqual(left: FileTreeStoreState['limits'], right: FileTreeStoreState['limits']) {
	return (
		left.maxCachedDirectories === right.maxCachedDirectories &&
		left.maxConcurrency === right.maxConcurrency &&
		left.maxDepth === right.maxDepth &&
		left.maxNodes === right.maxNodes
	);
}

export type { FileTreeSourceOptions };

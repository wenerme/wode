import { FileTreeEventType } from './file-tree-events';
import { sanitizeFileTreeEntries } from './file-tree-model';
import { getFileTreeAncestorPaths, isFileTreePathAtOrBelow, normalizeFileTreePath } from './file-tree-path';
import type { FileTreeStore } from './file-tree-types';

export type FileTreeRuntime = {
	dispose: () => void;
	start: () => void;
	whenIdle: () => Promise<void>;
};

type LoadJob = {
	cancelled: boolean;
	controller?: AbortController;
	generation: number;
	path: string;
	promise: Promise<void>;
	requestId?: number;
	resolve: () => void;
};

export function createFileTreeRuntime(store: FileTreeStore): FileTreeRuntime {
	const jobs = new Map<string, LoadJob>();
	const queue: LoadJob[] = [];
	const reveals = new Map<string, Promise<void>>();
	const idleWaiters = new Set<() => void>();
	let active = 0;
	let disposed = false;
	let started = false;
	let unsubscribe: Array<() => void> = [];

	const ensureLoad = (requestedPath: string, generation: number) => {
		const path = normalizeFileTreePath(requestedPath);
		const state = store.getState();
		if (generation !== state.source.generation) return Promise.resolve();
		if (state.tree.directories.get(path)?.status === 'ready') {
			state.actions.touch(path);
			return Promise.resolve();
		}
		const existing = jobs.get(path);
		if (existing?.generation === generation && !existing.cancelled) return existing.promise;
		let resolve: () => void = () => undefined;
		const promise = new Promise<void>((done) => {
			resolve = done;
		});
		const job: LoadJob = { cancelled: false, generation, path, promise, resolve };
		jobs.set(path, job);
		queue.push(job);
		pump();
		return promise;
	};

	const reveal = (requestedPath: string, generation: number) => {
		const target = normalizeFileTreePath(requestedPath);
		const key = `${generation}:${target}`;
		const existing = reveals.get(key);
		if (existing) return existing;
		const promise = runReveal(target, generation).finally(() => {
			reveals.delete(key);
			notifyIdle();
		});
		reveals.set(key, promise);
		return promise;
	};
	const drainRefresh = (generation: number) => {
		const pending = store.getState().actions.consumeRefresh(generation);
		if (!pending) return;
		for (const path of pending.removedPaths) abortJobs(path, generation);
		for (const path of pending.paths) abortJobs(path, generation, false);
		for (const path of pending.paths) void ensureLoad(path, generation);
	};

	function start() {
		if (started || disposed) return;
		started = true;
		const events = store.getState().events;
		unsubscribe = [
			events.on(FileTreeEventType.LoadRequested, ({ data }) => {
				void ensureLoad(data.path, data.generation);
			}),
			events.on(FileTreeEventType.RevealRequested, ({ data }) => {
				void reveal(data.path, data.generation);
			}),
			events.on(FileTreeEventType.RefreshRequested, ({ data }) => {
				drainRefresh(data.generation);
			}),
			events.on(FileTreeEventType.AbortRequested, ({ data }) => {
				abortJobs(data.path, data.generation);
			}),
		];
		const state = store.getState();
		drainRefresh(state.source.generation);
		void ensureLoad(state.source.rootPath, state.source.generation);
		void reveal(state.navigation.currentPath, state.source.generation);
	}

	function dispose() {
		if (disposed) return;
		disposed = true;
		for (const off of unsubscribe) off();
		unsubscribe = [];
		abortJobs(undefined, store.getState().source.generation, true, true);
		notifyIdle();
	}

	async function whenIdle() {
		await Promise.resolve();
		if (active === 0 && reveals.size === 0 && !queue.some((job) => !job.cancelled)) return;
		await new Promise<void>((resolve) => idleWaiters.add(resolve));
	}

	function pump() {
		if (disposed) return;
		const concurrency = store.getState().limits.maxConcurrency;
		while (active < concurrency && queue.length) {
			const job = queue.shift() as LoadJob;
			if (job.cancelled || jobs.get(job.path) !== job) continue;
			active += 1;
			void runLoad(job);
		}
		notifyIdle();
	}

	async function runLoad(job: LoadJob) {
		const state = store.getState();
		if (disposed || job.cancelled || job.generation !== state.source.generation) {
			finishJob(job);
			return;
		}
		const requestId = state.actions.beginLoad(job.path, job.generation);
		if (requestId === undefined) {
			finishJob(job);
			return;
		}
		job.requestId = requestId;
		const controller = new AbortController();
		job.controller = controller;
		const source = store.getState().source;
		try {
			const entries = await source.fileSystem.readdir(job.path, { signal: controller.signal });
			if (disposed || job.cancelled || controller.signal.aborted) {
				store.getState().actions.cancelLoad(job.path, job.generation, requestId);
				return;
			}
			const current = store.getState();
			if (current.source.generation !== job.generation || current.source.fileSystem !== source.fileSystem) return;
			if (!Array.isArray(entries)) throw new Error('File system returned a non-array directory listing');
			if (entries.length > current.limits.maxNodes) {
				throw new FileTreeNodeLimitError(current.limits.maxNodes);
			}
			const sanitized = sanitizeFileTreeEntries(
				entries,
				job.path,
				current.source.rootPath,
				current.source.directoriesOnly,
			);
			if (current.actions.completeLoad(job.path, job.generation, requestId, sanitized)) {
				const latest = store.getState();
				if (
					latest.tree.directories.get(job.path)?.status === 'ready' &&
					latest.reveal.status === 'error' &&
					isFileTreePathAtOrBelow(latest.navigation.currentPath, job.path)
				) {
					void reveal(latest.navigation.currentPath, job.generation);
				}
			}
		} catch (error) {
			const current = store.getState();
			if (controller.signal.aborted || job.cancelled || isAbortError(error)) {
				current.actions.cancelLoad(job.path, job.generation, requestId);
			} else {
				current.actions.failLoad(
					job.path,
					job.generation,
					requestId,
					getErrorMessage(error),
					error instanceof FileTreeNodeLimitError ? 'max-nodes' : 'load',
				);
			}
		} finally {
			finishJob(job);
		}
	}

	async function runReveal(target: string, generation: number) {
		const initial = store.getState();
		if (!initial.actions.beginReveal(target, generation)) return;
		const paths = getFileTreeAncestorPaths(target, initial.source.rootPath);
		if (!paths.length || paths.length - 1 > initial.limits.maxDepth) {
			initial.actions.failReveal(target, generation, 'Current path exceeds the tree depth limit');
			return;
		}
		await ensureLoad(paths[0], generation);
		for (let index = 1; index < paths.length; index += 1) {
			const state = store.getState();
			if (
				disposed ||
				state.source.generation !== generation ||
				state.reveal.path !== target ||
				state.reveal.status !== 'loading'
			)
				return;
			const parent = state.tree.directories.get(paths[index - 1]);
			if (parent?.status !== 'ready') {
				state.actions.failReveal(target, generation, `Unable to load ancestor: ${paths[index - 1]}`);
				return;
			}
			const child = parent.entries.find((entry) => entry.path === paths[index]);
			if (!child) {
				state.actions.failReveal(target, generation, `Current path was not found: ${paths[index]}`);
				return;
			}
			if (index === paths.length - 1) break;
			if (child.kind !== 'directory') {
				state.actions.failReveal(target, generation, `Current path crosses a file: ${child.path}`);
				return;
			}
			state.actions.expand(child.path);
			await ensureLoad(child.path, generation);
		}
		store.getState().actions.completeReveal(target, generation);
	}

	function abortJobs(
		requestedPath: string | undefined,
		generation: number,
		includeDescendants = true,
		allGenerations = false,
	) {
		const path = requestedPath ? normalizeFileTreePath(requestedPath) : undefined;
		for (const job of jobs.values()) {
			if (!allGenerations && job.generation !== generation) continue;
			if (path && (includeDescendants ? !isFileTreePathAtOrBelow(job.path, path) : job.path !== path)) continue;
			job.cancelled = true;
			job.controller?.abort();
			store.getState().actions.cancelLoad(job.path, job.generation, job.requestId);
			if (!job.controller) finishQueuedJob(job);
		}
		notifyIdle();
	}

	function finishQueuedJob(job: LoadJob) {
		if (jobs.get(job.path) === job) jobs.delete(job.path);
		job.resolve();
	}

	function finishJob(job: LoadJob) {
		if (jobs.get(job.path) === job) jobs.delete(job.path);
		active = Math.max(0, active - 1);
		job.resolve();
		pump();
	}

	function notifyIdle() {
		if (active !== 0 || reveals.size !== 0 || queue.some((job) => !job.cancelled)) return;
		for (const resolve of idleWaiters) resolve();
		idleWaiters.clear();
	}

	return { dispose, start, whenIdle };
}

class FileTreeNodeLimitError extends Error {
	constructor(limit: number) {
		super(`Directory entry count exceeds the tree node limit: ${limit}`);
		this.name = 'FileTreeNodeLimitError';
	}
}

function isAbortError(error: unknown) {
	return error instanceof DOMException ? error.name === 'AbortError' : getErrorName(error) === 'AbortError';
}

function getErrorName(error: unknown) {
	return error && typeof error === 'object' && 'name' in error ? String(error.name) : '';
}

function getErrorMessage(error: unknown) {
	return error instanceof Error ? error.message : String(error);
}

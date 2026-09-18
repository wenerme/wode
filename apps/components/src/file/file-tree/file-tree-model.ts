import {
	getFileTreeDepth,
	isFileTreePathWithinRoot,
	joinFileTreePath,
	normalizeFileTreePath,
	validateFileTreeName,
} from './file-tree-path';
import type {
	FileTreeDirectoryState,
	FileTreeFileStat,
	FileTreeLimitOptions,
	FileTreeLimits,
	FileTreeMessages,
	FileTreeRenderNode,
	FileTreeStoreState,
} from './file-tree-types';

export const defaultFileTreeLimits: FileTreeLimits = {
	maxCachedDirectories: 256,
	maxConcurrency: 4,
	maxDepth: 64,
	maxNodes: 10_000,
};

export const defaultFileTreeMessages: FileTreeMessages = {
	collapse: '折叠目录',
	empty: '此目录为空',
	expand: '展开目录',
	loadError: (path, error) => `无法读取 ${path}：${error}`,
	loading: '正在加载文件树',
	maxCachedDirectories: '目录缓存已达到上限',
	maxDepth: '已达到目录深度上限',
	maxNodes: '文件树节点数量已达到上限',
	retry: '重试加载',
	treeLabel: '文件树',
};

export function normalizeFileTreeLimits(limits: FileTreeLimitOptions = {}): FileTreeLimits {
	return {
		maxCachedDirectories: normalizeLimit(limits.maxCachedDirectories, defaultFileTreeLimits.maxCachedDirectories),
		maxConcurrency: normalizeLimit(limits.maxConcurrency, defaultFileTreeLimits.maxConcurrency),
		maxDepth: normalizeLimit(limits.maxDepth, defaultFileTreeLimits.maxDepth),
		maxNodes: normalizeLimit(limits.maxNodes, defaultFileTreeLimits.maxNodes),
	};
}

export function resolveFileTreeMessages(messages: Partial<FileTreeMessages> = {}): FileTreeMessages {
	const resolved = { ...defaultFileTreeMessages };
	for (const key of Object.keys(messages) as Array<keyof FileTreeMessages>) {
		const value = messages[key];
		if (value !== undefined) Object.assign(resolved, { [key]: value });
	}
	return resolved;
}

export function sanitizeFileTreeEntries(
	entries: readonly FileTreeFileStat[],
	directory: string,
	rootPath: string,
	directoriesOnly = false,
): FileTreeFileStat[] {
	if (!Array.isArray(entries)) throw new Error('File system returned a non-array directory listing');
	const normalizedDirectory = normalizeFileTreePath(directory);
	const normalizedRoot = normalizeFileTreePath(rootPath);
	if (!isFileTreePathWithinRoot(normalizedDirectory, normalizedRoot))
		throw new Error('Directory escapes the tree root');
	const names = new Set<string>();
	const sanitized: FileTreeFileStat[] = [];
	for (const candidate of entries as readonly unknown[]) {
		if (!isRecord(candidate) || !validateFileTreeName(candidate.name)) {
			throw new Error(
				`File system returned an invalid direct child: ${String(isRecord(candidate) ? candidate.name : '')}`,
			);
		}
		if (names.has(candidate.name)) throw new Error(`File system returned a duplicate direct child: ${candidate.name}`);
		names.add(candidate.name);
		if (candidate.kind !== 'directory' && candidate.kind !== 'file') {
			throw new Error(`File system returned an invalid child kind: ${candidate.name}`);
		}
		const path = joinFileTreePath(normalizedDirectory, candidate.name);
		if (!isFileTreePathWithinRoot(path, normalizedRoot))
			throw new Error(`File system child escapes root: ${candidate.name}`);
		if (directoriesOnly && candidate.kind === 'file') continue;
		sanitized.push({
			directory: normalizedDirectory,
			kind: candidate.kind,
			meta: isRecord(candidate.meta) ? candidate.meta : {},
			mtime: finiteNonNegative(candidate.mtime),
			name: candidate.name,
			path,
			size: finiteNonNegative(candidate.size),
		});
	}
	return sanitized.sort(compareEntries);
}

export function buildFileTreeData(state: FileTreeStoreState): FileTreeRenderNode[] {
	const rootDirectory = state.tree.directories.get(state.source.rootPath);
	if (!isRenderableDirectory(rootDirectory)) return [];
	const roots = createRenderNodes(rootDirectory.entries, 1, state);
	const stack = roots
		.filter((node) => node.kind === 'directory')
		.map((node) => ({ node, depth: 1 }))
		.reverse();
	let visited = roots.length;
	while (stack.length && visited < state.limits.maxNodes) {
		const { node, depth } = stack.pop() as { node: FileTreeRenderNode; depth: number };
		if (depth >= state.limits.maxDepth || !state.tree.expanded.has(node.path)) continue;
		const directory = state.tree.directories.get(node.path);
		if (!isRenderableDirectory(directory)) continue;
		const children = createRenderNodes(directory.entries, depth + 1, state);
		node.children = children;
		visited += children.length;
		for (let index = children.length - 1; index >= 0; index -= 1) {
			const child = children[index];
			if (child.kind === 'directory') stack.push({ node: child, depth: depth + 1 });
		}
	}
	return roots;
}

function isRenderableDirectory(directory: FileTreeDirectoryState | undefined): directory is FileTreeDirectoryState {
	return Boolean(
		directory &&
			(directory.status === 'ready' ||
				((directory.status === 'idle' || directory.status === 'loading' || directory.status === 'queued') &&
					directory.entries.length > 0)),
	);
}

export function flattenFileTreeData(nodes: readonly FileTreeRenderNode[]): FileTreeRenderNode[] {
	const flattened: FileTreeRenderNode[] = [];
	const stack = [...nodes].reverse();
	while (stack.length) {
		const node = stack.pop() as FileTreeRenderNode;
		flattened.push(node);
		if (!node.children) continue;
		for (let index = node.children.length - 1; index >= 0; index -= 1) stack.push(node.children[index]);
	}
	return flattened;
}

export function formatFileTreeDirectoryError(
	directory: { error?: string; errorCode?: string; path: string },
	messages: FileTreeMessages,
): string {
	if (directory.errorCode === 'max-cached-directories') return messages.maxCachedDirectories;
	if (directory.errorCode === 'max-nodes') return messages.maxNodes;
	return messages.loadError(directory.path, directory.error ?? 'Unknown error');
}

function createRenderNodes(
	entries: readonly FileTreeFileStat[],
	depth: number,
	state: FileTreeStoreState,
): FileTreeRenderNode[] {
	return entries.map((entry) => {
		const directory = entry.kind === 'directory' ? state.tree.directories.get(entry.path) : undefined;
		return {
			children: entry.kind === 'directory' && depth < state.limits.maxDepth ? [] : undefined,
			depth,
			entry,
			error: directory?.error,
			errorCode: directory?.errorCode,
			id: entry.path,
			isCurrent: entry.path === state.navigation.currentPath,
			kind: entry.kind,
			name: entry.name,
			path: entry.path,
			status: directory?.status ?? 'idle',
		};
	});
}

function normalizeLimit(value: number | undefined, maximum: number) {
	if (!Number.isFinite(value)) return maximum;
	return Math.max(1, Math.min(Math.floor(value as number), maximum));
}

function finiteNonNegative(value: unknown) {
	return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : 0;
}

function compareEntries(left: FileTreeFileStat, right: FileTreeFileStat) {
	if (left.kind !== right.kind) return left.kind === 'directory' ? -1 : 1;
	return left.name.localeCompare(right.name, undefined, { numeric: true, sensitivity: 'base' });
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function canLoadFileTreeDirectory(path: string, rootPath: string, limits: FileTreeLimits) {
	const depth = getFileTreeDepth(path, rootPath);
	return depth !== undefined && depth < limits.maxDepth;
}

const maxWorkspacePathBytes = 4096;
const maxWorkspaceNameBytes = 255;

export class AgentWorkspacePathError extends Error {
	constructor(
		message: string,
		readonly code: 'invalid-name' | 'invalid-path' | 'outside-root',
	) {
		super(message);
		this.name = 'AgentWorkspacePathError';
	}
}

export function normalizeAgentWorkspaceRoot(rootPath: string): string {
	if (!rootPath.startsWith('/')) throw new AgentWorkspacePathError('工作区根路径必须是绝对路径。', 'invalid-path');
	return normalizeAbsolutePath(rootPath);
}

export function resolveAgentWorkspacePath(rootPath: string, inputPath: string): string {
	const root = normalizeAgentWorkspaceRoot(rootPath);
	if (!inputPath || utf8Bytes(inputPath) > maxWorkspacePathBytes || inputPath.includes('\0')) {
		throw new AgentWorkspacePathError('工作区路径无效或过长。', 'invalid-path');
	}
	const candidate = inputPath.startsWith('/') ? normalizeAbsolutePath(inputPath) : joinPath(root, inputPath);
	if (!isAgentWorkspacePathWithinRoot(candidate, root)) {
		throw new AgentWorkspacePathError('路径超出工作区根目录。', 'outside-root');
	}
	return candidate;
}

export function isAgentWorkspacePathWithinRoot(path: string, rootPath: string): boolean {
	const root = normalizeAgentWorkspaceRoot(rootPath);
	const candidate = normalizeAbsolutePath(path);
	return root === '/' || candidate === root || candidate.startsWith(`${root}/`);
}

export function validateAgentWorkspaceBasename(name: string): string {
	if (
		!name ||
		name === '.' ||
		name === '..' ||
		name.includes('/') ||
		name.includes('\\') ||
		name.includes('\0') ||
		utf8Bytes(name) > maxWorkspaceNameBytes
	) {
		throw new AgentWorkspacePathError('文件系统返回了无效名称。', 'invalid-name');
	}
	return name;
}

export function joinAgentWorkspaceEntryPath(directory: string, name: string): string {
	const basename = validateAgentWorkspaceBasename(name);
	return directory === '/' ? `/${basename}` : `${directory}/${basename}`;
}

function joinPath(root: string, relative: string): string {
	return normalizeAbsolutePath(root === '/' ? `/${relative}` : `${root}/${relative}`);
}

function normalizeAbsolutePath(path: string): string {
	if (!path.startsWith('/') || path.includes('\\') || path.includes('\0')) {
		throw new AgentWorkspacePathError('工作区路径无效。', 'invalid-path');
	}
	const segments: string[] = [];
	for (const segment of path.split('/')) {
		if (!segment || segment === '.') continue;
		if (segment === '..') segments.pop();
		else segments.push(segment);
	}
	const normalized = `/${segments.join('/')}`;
	if (utf8Bytes(normalized) > maxWorkspacePathBytes) {
		throw new AgentWorkspacePathError('工作区路径过长。', 'invalid-path');
	}
	return normalized;
}

function utf8Bytes(value: string): number {
	return new TextEncoder().encode(value).byteLength;
}

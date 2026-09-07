import { type ToolSet, tool } from 'ai';
import { z } from 'zod';
import {
	joinAgentWorkspaceEntryPath,
	resolveAgentWorkspacePath,
	validateAgentWorkspaceBasename,
} from './workspace-path';
import type { AgentWorkspace } from './workspace-types';

export const MaxAgentWorkspaceListEntries = 200;
export const MaxAgentWorkspaceListOutputBytes = 64 * 1024;
export const MaxAgentWorkspaceReadBytes = 64 * 1024;

export function createAgentWorkspaceReadTools(workspace: AgentWorkspace): ToolSet {
	return {
		workspace_list: tool({
			description: '列出工作区根目录内的文件和目录。',
			inputSchema: z.object({ path: z.string().max(4096).default('.') }),
			execute: async ({ path }, { abortSignal }) => listWorkspace(workspace, path, abortSignal),
		}),
		workspace_read: tool({
			description: '读取工作区根目录内不超过 64 KiB 的 UTF-8 文件。',
			inputSchema: z.object({ path: z.string().min(1).max(4096) }),
			execute: async ({ path }, { abortSignal }) => readWorkspace(workspace, path, abortSignal),
		}),
	};
}

async function listWorkspace(workspace: AgentWorkspace, inputPath: string, signal?: AbortSignal) {
	try {
		const path = resolveAgentWorkspacePath(workspace.rootPath, inputPath);
		const rawEntries = await workspace.fileSystem.readdir(path, {
			maxEntries: MaxAgentWorkspaceListEntries,
			signal,
		});
		const entries: Array<{ kind: 'directory' | 'file'; name: string; size: number }> = [];
		const seen = new Set<string>();
		let invalidEntries = 0;
		let truncated = rawEntries.length > MaxAgentWorkspaceListEntries;
		for (const raw of rawEntries.slice(0, MaxAgentWorkspaceListEntries)) {
			if (entries.length >= MaxAgentWorkspaceListEntries) break;
			try {
				const name = validateAgentWorkspaceBasename(raw.name);
				joinAgentWorkspaceEntryPath(path, name);
				if (seen.has(name) || (raw.kind !== 'directory' && raw.kind !== 'file')) throw new Error('invalid entry');
				seen.add(name);
				const next = { kind: raw.kind, name, size: safeSize(raw.size) };
				const candidate = { entries: [...entries, next], invalidEntries, ok: true, path, truncated };
				if (jsonBytes(candidate) > MaxAgentWorkspaceListOutputBytes) {
					truncated = true;
					break;
				}
				entries.push(next);
			} catch {
				invalidEntries += 1;
			}
		}
		entries.sort((left, right) => left.name.localeCompare(right.name));
		return { entries, invalidEntries, ok: true as const, path, truncated };
	} catch (error) {
		return toolError(error);
	}
}

async function readWorkspace(workspace: AgentWorkspace, inputPath: string, signal?: AbortSignal) {
	try {
		const path = resolveAgentWorkspacePath(workspace.rootPath, inputPath);
		const content = await workspace.fileSystem.readFile(path, {
			encoding: 'binary',
			maxBytes: MaxAgentWorkspaceReadBytes + 1,
			signal,
		});
		if (content.byteLength > MaxAgentWorkspaceReadBytes) {
			return { code: 'too-large' as const, limitBytes: MaxAgentWorkspaceReadBytes, ok: false as const, path };
		}
		try {
			return {
				bytes: content.byteLength,
				content: new TextDecoder('utf-8', { fatal: true }).decode(content),
				ok: true as const,
				path,
			};
		} catch {
			return { code: 'binary' as const, ok: false as const, path };
		}
	} catch (error) {
		return toolError(error);
	}
}

function toolError(error: unknown) {
	if (error instanceof Error && error.name === 'AbortError') return { code: 'aborted' as const, ok: false as const };
	const code =
		typeof error === 'object' && error !== null && 'code' in error ? String(error.code).slice(0, 64) : 'failed';
	return { code, message: toErrorMessage(error).slice(0, 256), ok: false as const };
}

function toErrorMessage(error: unknown): string {
	return error instanceof Error ? error.message : '工作区操作失败。';
}

function jsonBytes(value: unknown): number {
	return new TextEncoder().encode(JSON.stringify(value)).byteLength;
}

function safeSize(value: number): number {
	return Number.isSafeInteger(value) && value >= 0 ? value : 0;
}

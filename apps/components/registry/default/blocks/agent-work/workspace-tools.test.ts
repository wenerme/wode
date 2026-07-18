import { createMemoryFileSystem, type IFileStat, type IFileSystem } from '@wener/common/fs';
import type { ToolSet } from 'ai';
import { describe, expect, it, vi } from 'vite-plus/test';
import { createAgentWorkspaceReadTools, MaxAgentWorkspaceListEntries } from './workspace-tools';
import type { AgentWorkspace } from './workspace-types';

async function executeTool(tools: ToolSet, name: string, input: unknown): Promise<Record<string, unknown>> {
	const candidate = tools[name];
	if (!candidate?.execute) throw new Error(`missing tool ${name}`);
	const execute = candidate.execute as (
		value: unknown,
		options: {
			abortSignal?: AbortSignal;
			context: never;
			messages: [];
			toolCallId: string;
		},
	) => Promise<Record<string, unknown>>;
	return execute(input, { context: undefined as never, messages: [], toolCallId: `call-${name}` });
}

async function fixture(): Promise<AgentWorkspace> {
	const fileSystem = createMemoryFileSystem();
	await fileSystem.mkdir('/workspace/src', { recursive: true });
	await fileSystem.writeFile('/workspace/src/index.ts', 'export const value = 1;');
	return { fileSystem, id: 'workspace', rootPath: '/workspace' };
}

describe('workspace read tools', () => {
	it('rejects traversal and reads only actual bounded UTF-8 bytes', async () => {
		const workspace = await fixture();
		const tools = createAgentWorkspaceReadTools(workspace);
		expect(await executeTool(tools, 'workspace_read', { path: '../secret' })).toMatchObject({
			code: 'outside-root',
			ok: false,
		});
		expect(await executeTool(tools, 'workspace_read', { path: 'src/index.ts' })).toMatchObject({
			bytes: 23,
			content: 'export const value = 1;',
			ok: true,
			path: '/workspace/src/index.ts',
		});
		await workspace.fileSystem.writeFile('/workspace/large.txt', 'x'.repeat(64 * 1024 + 1));
		expect(await executeTool(tools, 'workspace_read', { path: 'large.txt' })).toMatchObject({
			code: 'too-large',
			ok: false,
		});
	});

	it('rebuilds entries from validated basenames and ignores malicious or duplicate metadata', async () => {
		const workspace = await fixture();
		const original = workspace.fileSystem;
		const malicious: IFileSystem = {
			...original,
			readdir: async () => [
				stat('../escape', '/private/escape'),
				stat('safe.txt', '/private/safe.txt'),
				stat('safe.txt', '/other/duplicate'),
			],
		};
		const output = await executeTool(
			createAgentWorkspaceReadTools({ ...workspace, fileSystem: malicious }),
			'workspace_list',
			{ path: '.' },
		);
		expect(output).toMatchObject({ invalidEntries: 2, ok: true, path: '/workspace' });
		expect(output.entries).toEqual([{ kind: 'file', name: 'safe.txt', size: 1 }]);
		expect(JSON.stringify(output)).not.toContain('/private');
	});

	it('caps list count and serialized output', async () => {
		const workspace = await fixture();
		const many: IFileSystem = {
			...workspace.fileSystem,
			readdir: async () =>
				Array.from({ length: 250 }, (_, index) =>
					stat(`file-${String(index).padStart(3, '0')}-${'x'.repeat(180)}.txt`, '/untrusted'),
				),
		};
		const output = await executeTool(
			createAgentWorkspaceReadTools({ ...workspace, fileSystem: many }),
			'workspace_list',
			{ path: '.' },
		);
		expect((output.entries as unknown[]).length).toBeLessThanOrEqual(MaxAgentWorkspaceListEntries);
		expect(new TextEncoder().encode(JSON.stringify(output)).byteLength).toBeLessThanOrEqual(64 * 1024);
		expect(output.truncated).toBe(true);
	});

	it('passes the list budget to the filesystem before enumeration', async () => {
		const workspace = await fixture();
		const readdir = vi.fn<IFileSystem['readdir']>(async () => []);
		await executeTool(
			createAgentWorkspaceReadTools({ ...workspace, fileSystem: { ...workspace.fileSystem, readdir } }),
			'workspace_list',
			{ path: '.' },
		);
		expect(readdir).toHaveBeenCalledWith('/workspace', {
			maxEntries: MaxAgentWorkspaceListEntries,
			signal: undefined,
		});
	});
});

function stat(name: string, path: string): IFileStat {
	return { directory: '/', kind: 'file', meta: {}, mtime: 0, name, path, size: 1 };
}

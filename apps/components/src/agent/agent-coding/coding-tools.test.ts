import { createMemoryFileSystem } from '@wener/common/fs';
import type { ToolSet } from 'ai';
import { describe, expect, it, vi } from 'vite-plus/test';
import { type CreateAgentCodingToolsOptions, createAgentCodingTools } from './coding-tools';
import { createAgentCommandRuntime } from './command-runtime';
import type { AgentCommandExecutor } from './command-types';

async function executeTool(
	tools: ToolSet,
	name: string,
	input: unknown,
	toolCallId = `call-${name}`,
): Promise<Record<string, unknown>> {
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
	return execute(input, { context: undefined as never, messages: [], toolCallId });
}

describe('Agent coding tools', () => {
	it('marks write and bash as approval-required and keeps writes root-bounded', async () => {
		const fileSystem = createMemoryFileSystem();
		await fileSystem.mkdir('/workspace', { recursive: true });
		const changed = vi.fn<() => void>();
		const tools = createAgentCodingTools({
			onWorkspaceChanged: changed,
			runtime: createAgentCommandRuntime({
				execute: async () => ({ durationMs: 1, exitCode: 0, settled: true, stderr: '', stdout: '', truncated: false }),
			}),
			workspace: { fileSystem, id: 'workspace', rootPath: '/workspace' },
		});
		expect(tools.workspace_write?.needsApproval).toBe(true);
		expect(tools.bash?.needsApproval).toBe(true);
		expect(await executeTool(tools, 'workspace_write', { content: 'ok', path: '../escape.txt' })).toMatchObject({
			code: 'outside-root',
			ok: false,
		});
		expect(await executeTool(tools, 'workspace_write', { content: 'ok', path: 'src/new.ts' })).toMatchObject({
			bytes: 2,
			ok: true,
			path: '/workspace/src/new.ts',
		});
		expect(await fileSystem.readFile('/workspace/src/new.ts', { encoding: 'text' })).toBe('ok');
		expect(changed).toHaveBeenCalledOnce();
		expect(
			await executeTool(tools, 'workspace_write', { content: 'x'.repeat(64 * 1024 + 1), path: 'large.txt' }),
		).toMatchObject({ code: 'too-large', ok: false });
	});

	it('delegates bash only to the injected runtime and reports bounded structured results', async () => {
		const execute = vi.fn<AgentCommandExecutor['execute']>(async () => ({
			durationMs: 3,
			exitCode: 0,
			settled: true,
			stderr: '',
			stdout: 'done',
			truncated: false,
			workspaceChanged: true,
		}));
		const started = vi.fn<NonNullable<CreateAgentCodingToolsOptions['onCommandStart']>>();
		const finished = vi.fn<NonNullable<CreateAgentCodingToolsOptions['onCommandFinish']>>();
		const changed = vi.fn<() => void>();
		const tools = createAgentCodingTools({
			onCommandFinish: finished,
			onCommandStart: started,
			onWorkspaceChanged: changed,
			runtime: createAgentCommandRuntime({ execute }),
			workspace: { fileSystem: createMemoryFileSystem(), id: 'workspace', rootPath: '/' },
		});
		expect(await executeTool(tools, 'bash', { command: 'printf done' })).toMatchObject({
			exitCode: 0,
			settled: true,
			stdout: 'done',
			workspaceChanged: true,
		});
		expect(execute).toHaveBeenCalledOnce();
		expect(started).toHaveBeenCalledWith({ command: 'printf done', toolCallId: 'call-bash' });
		expect(finished).toHaveBeenCalledWith(expect.objectContaining({ command: 'printf done', toolCallId: 'call-bash' }));
		expect(changed).toHaveBeenCalledOnce();
	});

	it('keeps the acquired AI bash call active when a parallel call receives busy', async () => {
		const pending = deferred<{
			durationMs: number;
			exitCode: number;
			settled: boolean;
			stderr: string;
			stdout: string;
			truncated: boolean;
		}>();
		let active: { command: string; toolCallId: string } | undefined;
		const started = vi.fn<NonNullable<CreateAgentCodingToolsOptions['onCommandStart']>>((input) => {
			active = input;
		});
		const finished = vi.fn<NonNullable<CreateAgentCodingToolsOptions['onCommandFinish']>>((input) => {
			if (input.acquired && active?.toolCallId === input.toolCallId) active = undefined;
		});
		const tools = createAgentCodingTools({
			onCommandFinish: finished,
			onCommandStart: started,
			runtime: createAgentCommandRuntime({ execute: () => pending.promise }),
			workspace: { fileSystem: createMemoryFileSystem(), id: 'workspace', rootPath: '/' },
		});
		const first = executeTool(tools, 'bash', { command: 'real-command' }, 'call-real');
		const busy = await executeTool(tools, 'bash', { command: 'parallel-command' }, 'call-busy');
		expect(busy).toMatchObject({ exitCode: 125, settled: true });
		expect(started).toHaveBeenCalledOnce();
		expect(active).toEqual({ command: 'real-command', toolCallId: 'call-real' });
		expect(finished).toHaveBeenCalledWith(
			expect.objectContaining({ acquired: false, command: 'parallel-command', toolCallId: 'call-busy' }),
		);
		pending.resolve({ durationMs: 1, exitCode: 0, settled: true, stderr: '', stdout: 'done', truncated: false });
		await first;
		expect(active).toBeUndefined();
		expect(finished).toHaveBeenCalledWith(
			expect.objectContaining({ acquired: true, command: 'real-command', toolCallId: 'call-real' }),
		);
	});
});

function deferred<T>() {
	let resolve!: (value: T) => void;
	const promise = new Promise<T>((resolvePromise) => {
		resolve = resolvePromise;
	});
	return { promise, resolve };
}

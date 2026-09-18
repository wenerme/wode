import { type ToolSet, tool } from 'ai';
import { z } from 'zod';
import { type AgentWorkspace, resolveAgentWorkspacePath } from '../agent-work';
import { type AgentCommandRuntime, MaxAgentCommandStdinBytes } from './command-runtime';
import type { AgentTerminalResult } from './command-types';

export const MaxAgentWorkspaceWriteBytes = 64 * 1024;

export type CreateAgentCodingToolsOptions = {
	onCommandFinish?: (input: {
		acquired: boolean;
		command: string;
		result: AgentTerminalResult;
		toolCallId: string;
	}) => void;
	onCommandStart?: (input: { command: string; toolCallId: string }) => void;
	onWorkspaceChanged?: () => void;
	runtime: AgentCommandRuntime;
	workspace: AgentWorkspace;
};

export function createAgentCodingTools({
	onCommandFinish,
	onCommandStart,
	onWorkspaceChanged,
	runtime,
	workspace,
}: CreateAgentCodingToolsOptions): ToolSet {
	return {
		workspace_write: tool({
			description: '在工作区根目录内写入不超过 64 KiB 的 UTF-8 文件。',
			inputSchema: z.object({
				content: z.string().max(MaxAgentWorkspaceWriteBytes),
				path: z.string().min(1).max(4096),
			}),
			needsApproval: true,
			execute: async ({ content, path }, { abortSignal }) => {
				const bytes = utf8Bytes(content);
				if (bytes > MaxAgentWorkspaceWriteBytes) {
					return { code: 'too-large', limitBytes: MaxAgentWorkspaceWriteBytes, ok: false };
				}
				try {
					const resolved = resolveAgentWorkspacePath(workspace.rootPath, path);
					await workspace.fileSystem.writeFile(resolved, content, { overwrite: true, signal: abortSignal });
					onWorkspaceChanged?.();
					return { bytes, ok: true, path: resolved };
				} catch (error) {
					return toolError(error);
				}
			},
		}),
		bash: tool({
			description: '通过宿主注入的有界执行器运行非交互命令。',
			inputSchema: z.object({
				command: z
					.string()
					.min(1)
					.max(16 * 1024),
				stdin: z.string().max(MaxAgentCommandStdinBytes).optional(),
			}),
			needsApproval: true,
			execute: async ({ command, stdin }, { abortSignal, toolCallId }) => {
				let acquired = false;
				const result = await runtime.execute(
					{ command, stdin },
					{
						onAcquired: () => {
							acquired = true;
							onCommandStart?.({ command, toolCallId });
						},
						signal: abortSignal,
					},
				);
				onCommandFinish?.({ acquired, command, result, toolCallId });
				if (result.workspaceChanged) onWorkspaceChanged?.();
				return {
					aborted: result.aborted ?? false,
					durationMs: Math.round(result.durationMs),
					exitCode: result.exitCode,
					poisoned: result.poisoned ?? false,
					settled: result.settled,
					stderr: result.stderr,
					stdout: result.stdout,
					timedOut: result.timedOut ?? false,
					truncated: result.truncated,
					workspaceChanged: result.workspaceChanged ?? false,
				};
			},
		}),
	};
}

function toolError(error: unknown) {
	if (error instanceof Error && error.name === 'AbortError') return { code: 'aborted', ok: false };
	const code =
		typeof error === 'object' && error !== null && 'code' in error ? String(error.code).slice(0, 64) : 'failed';
	return { code, message: (error instanceof Error ? error.message : '写入失败。').slice(0, 256), ok: false };
}

function utf8Bytes(value: string): number {
	return new TextEncoder().encode(value).byteLength;
}

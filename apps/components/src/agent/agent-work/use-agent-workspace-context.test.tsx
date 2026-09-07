/** @vitest-environment jsdom */

import { createMemoryFileSystem, type IFileSystem } from '@wener/common/fs';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vite-plus/test';
import { useAgentWorkspaceContext } from './use-agent-workspace-context';
import type { AgentWorkspace } from './workspace-types';

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
	(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
	container = document.createElement('div');
	document.body.append(container);
	root = createRoot(container);
});

afterEach(() => {
	act(() => root.unmount());
	(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = false;
	container.remove();
});

describe('useAgentWorkspaceContext', () => {
	it('stays idle and performs zero reads while disabled', async () => {
		let reads = 0;
		const base = createMemoryFileSystem();
		const fileSystem = {
			...base,
			readFile: async () => {
				reads += 1;
				return new Uint8Array();
			},
		} as unknown as IFileSystem;
		await act(async () => root.render(<Probe enabled={false} workspace={{ fileSystem, id: 'chat', rootPath: '/' }} />));
		await act(async () => {
			await Promise.resolve();
		});
		expect(container.textContent).toBe('idle');
		expect(reads).toBe(0);
	});

	it('aborts a read when disabled, ignores its stale result, and reloads when enabled again', async () => {
		let reads = 0;
		let firstSignal: AbortSignal | undefined;
		let resolveFirst: ((bytes: Uint8Array) => void) | undefined;
		const base = createMemoryFileSystem();
		const fileSystem = {
			...base,
			readFile: async (_path: string, options?: { signal?: AbortSignal }) => {
				reads += 1;
				if (reads === 1) {
					firstSignal = options?.signal;
					return new Promise<Uint8Array>((resolve) => {
						resolveFirst = resolve;
					});
				}
				return new TextEncoder().encode('fresh');
			},
		} as unknown as IFileSystem;
		const workspace: AgentWorkspace = { fileSystem, id: 'workspace', rootPath: '/' };
		await act(async () => root.render(<Probe enabled workspace={workspace} />));
		expect(reads).toBe(1);
		await act(async () => root.render(<Probe enabled={false} workspace={workspace} />));
		expect(firstSignal?.aborted).toBe(true);
		expect(container.textContent).toBe('idle');
		await act(async () => {
			resolveFirst?.(new TextEncoder().encode('stale'));
			await Promise.resolve();
		});
		expect(container.textContent).toBe('idle');
		await act(async () => {
			root.render(<Probe enabled workspace={workspace} />);
			await Promise.resolve();
			await Promise.resolve();
		});
		expect(reads).toBe(2);
		expect(container.textContent).toBe('workspace:fresh');
	});

	it('aborts and ignores stale workspace results', async () => {
		let resolveOld: ((bytes: Uint8Array) => void) | undefined;
		const oldBase = createMemoryFileSystem();
		const oldFileSystem = {
			...oldBase,
			readFile: async () =>
				new Promise<Uint8Array>((resolve) => {
					resolveOld = resolve;
				}),
		} as unknown as IFileSystem;
		const freshFileSystem = createMemoryFileSystem();
		await freshFileSystem.writeFile('/AGENTS.md', 'fresh');
		const oldWorkspace: AgentWorkspace = { fileSystem: oldFileSystem, id: 'old', rootPath: '/' };
		const freshWorkspace: AgentWorkspace = { fileSystem: freshFileSystem, id: 'fresh', rootPath: '/' };
		await act(async () => root.render(<Probe workspace={oldWorkspace} />));
		await act(async () => {
			root.render(<Probe workspace={freshWorkspace} />);
			await Promise.resolve();
		});
		await act(async () => {
			resolveOld?.(new TextEncoder().encode('stale'));
			await Promise.resolve();
		});
		expect(container.textContent).toBe('fresh:fresh');
	});
});

function Probe({ enabled, workspace }: { enabled?: boolean; workspace: AgentWorkspace }) {
	const state = useAgentWorkspaceContext({ enabled, skills: [], workspace });
	return (
		<span>{state.context ? `${state.context.workspaceId}:${state.context.agents?.content ?? ''}` : state.status}</span>
	);
}

/** @vitest-environment jsdom */

import { createMemoryFileSystem } from '@wener/common/fs';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { createFileManagerStore } from '../file-manager';
import { AgentWork } from './agent-work';
import type { AgentWorkspaceContext } from './workspace-types';

let container: HTMLDivElement;
let root: Root;
let originalResizeObserver: typeof ResizeObserver | undefined;

beforeEach(() => {
	(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
	container = document.createElement('div');
	document.body.append(container);
	root = createRoot(container);
	originalResizeObserver = globalThis.ResizeObserver;
	globalThis.ResizeObserver = class ResizeObserver {
		constructor(private readonly callback: ResizeObserverCallback) {}
		disconnect() {}
		observe(target: Element) {
			this.callback([resizeEntry(target)], this);
		}
		unobserve() {}
	};
});

afterEach(() => {
	act(() => root.unmount());
	(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = false;
	container.remove();
	globalThis.ResizeObserver = originalResizeObserver as typeof ResizeObserver;
});

describe('AgentWork', () => {
	it('uses segmented single-pane navigation in a narrow container', async () => {
		const fileSystem = createMemoryFileSystem();
		await fileSystem.writeFile('/AGENTS.md', 'Context text');
		await act(async () =>
			root.render(
				<AgentWork
					chat={<div>Chat surface</div>}
					context={context}
					workspace={{ fileSystem, id: 'workspace', rootPath: '/' }}
				/>,
			),
		);
		expect(container.querySelector('[data-slot="agent-work"]')?.getAttribute('data-layout')).toBe('narrow');
		expect(container.textContent).toContain('Chat surface');
		const workspaceButton = findButton('工作区');
		await act(async () => workspaceButton.click());
		expect(container.textContent).not.toContain('Chat surface');
		const contextTab = findButton('上下文');
		const filesTab = findButton('文件');
		expect(filesTab.tabIndex).toBe(0);
		await act(async () => filesTab.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'ArrowRight' })));
		expect(contextTab.getAttribute('aria-selected')).toBe('true');
		expect(contextTab.tabIndex).toBe(0);
		expect(document.activeElement).toBe(contextTab);
		const panel = container.querySelector('[role="tabpanel"]');
		expect(contextTab.getAttribute('aria-controls')).toBe(panel?.id);
		expect(panel?.getAttribute('aria-labelledby')).toBe(contextTab.id);
		expect(container.textContent).toContain('Workspace AGENTS');
		expect(container.textContent).toContain('Skill rules');
	});

	it('preserves a scoped FileManager store and refreshes it on workspace revision', async () => {
		const fileSystem = createMemoryFileSystem();
		const store = createFileManagerStore({ fileSystem, rootPath: '/' });
		const requests = vi.fn<(event: unknown) => void>();
		const unsubscribe = store.getState().events.on('request', requests);
		await act(async () =>
			root.render(
				<AgentWork
					chat={<div>Chat</div>}
					fileManagerProps={{ store }}
					workspace={{ fileSystem, id: 'workspace', revision: 1, rootPath: '/' }}
				/>,
			),
		);
		await act(async () => {
			await Promise.resolve();
		});
		requests.mockClear();
		await act(async () =>
			root.render(
				<AgentWork
					chat={<div>Chat</div>}
					fileManagerProps={{ store }}
					workspace={{ fileSystem, id: 'workspace', revision: 2, rootPath: '/' }}
				/>,
			),
		);
		await act(async () => {
			await Promise.resolve();
		});
		expect(requests).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expect.objectContaining({ history: { type: 'none' }, type: 'load' }),
				name: 'request',
			}),
		);
		expect(store.getState().fileSystem).toBe(fileSystem);
		unsubscribe();
	});
});

function resizeEntry(target: Element): ResizeObserverEntry {
	const size = { blockSize: 0, inlineSize: 0 };
	return {
		borderBoxSize: [size],
		contentBoxSize: [size],
		contentRect: target.getBoundingClientRect(),
		devicePixelContentBoxSize: [size],
		target,
	};
}

function findButton(name: string): HTMLButtonElement {
	const button = Array.from(container.querySelectorAll('button')).find((item) => item.textContent?.trim() === name);
	if (!button) throw new Error(`button ${name} missing`);
	return button;
}

const context: AgentWorkspaceContext = {
	agents: { bytes: 16, content: 'Workspace AGENTS', path: '/AGENTS.md' },
	bytes: 30,
	issues: [{ code: 'agents-read-failed', message: 'Visible issue' }],
	skills: [
		{
			bytes: 14,
			description: 'Skill description',
			identity: 'name-version:["Review","1"]',
			instructions: 'Skill rules',
			name: 'Review',
			version: '1',
		},
	],
	workspaceId: 'workspace',
};

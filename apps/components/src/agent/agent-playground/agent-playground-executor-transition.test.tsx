/** @vitest-environment jsdom */

import { createMemoryFileSystem } from '@wener/common/fs';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import type { AgentCommandExecutor } from '../agent-coding';
import { AgentPlayground } from './agent-playground';

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
			const size = { blockSize: 0, inlineSize: 0 };
			this.callback(
				[
					{
						borderBoxSize: [size],
						contentBoxSize: [size],
						contentRect: target.getBoundingClientRect(),
						devicePixelContentBoxSize: [size],
						target,
					},
				],
				this,
			);
		}
		unobserve() {}
	};
});

afterEach(() => {
	act(() => root.unmount());
	container.remove();
	globalThis.ResizeObserver = originalResizeObserver as typeof ResizeObserver;
	(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = false;
});

describe('AgentPlayground executor transitions', () => {
	it('does not activate a replacement until the old command settles safely', async () => {
		let releaseOld: (() => void) | undefined;
		const oldExecutor: AgentCommandExecutor = {
			execute: (_request, options) =>
				new Promise((resolve) => {
					options?.signal?.addEventListener(
						'abort',
						() => {
							releaseOld = () => resolve({ ...successResult(), aborted: true, exitCode: 130 });
						},
						{ once: true },
					);
				}),
		};
		const replacementExecute = vi.fn<AgentCommandExecutor['execute']>(async () => successResult('replacement'));
		const props = playgroundProps();
		await act(async () => root.render(<AgentPlayground {...props} executor={oldExecutor} />));
		await openTerminalAndRun('old-command');
		await act(async () => {
			root.render(<AgentPlayground {...props} executor={{ execute: replacementExecute }} />);
			await Promise.resolve();
		});
		expect(findButton('取消命令')).toBeDefined();
		expect(replacementExecute).not.toHaveBeenCalled();
		await act(async () => findButton('文件').click());
		expect(findOptionalButton('新建目录')).toBeUndefined();
		expect(findOptionalButton('新建文件')).toBeUndefined();
		expect(findOptionalButton('上传文件')).toBeUndefined();
		await act(async () => {
			releaseOld?.();
			await Promise.resolve();
			await Promise.resolve();
		});
		await act(async () => (await waitForButton('终端')).click());
		await waitForButton('运行命令');
		await typeCommand('replacement-command');
		await act(async () => findButton('运行命令').click());
		expect(replacementExecute).toHaveBeenCalledOnce();
	});

	it('quarantines a replacement when the old command may still mutate', async () => {
		const oldExecutor: AgentCommandExecutor = { execute: () => new Promise(() => undefined) };
		const replacementExecute = vi.fn<AgentCommandExecutor['execute']>(async () => successResult('replacement'));
		const props = playgroundProps({ commandCancelSettleGraceMs: 5 });
		await act(async () => root.render(<AgentPlayground {...props} executor={oldExecutor} />));
		await openTerminalAndRun('unsafe-old-command');
		await act(async () => {
			root.render(<AgentPlayground {...props} executor={{ execute: replacementExecute }} />);
			await Promise.resolve();
		});
		await waitForText('已污染');
		expect(findOptionalButton('运行命令')?.disabled ?? true).toBe(true);
		expect(replacementExecute).not.toHaveBeenCalled();
		await act(async () => findButton('文件').click());
		expect(findOptionalButton('新建目录')).toBeUndefined();
		expect(findOptionalButton('新建文件')).toBeUndefined();
		expect(findOptionalButton('上传文件')).toBeUndefined();
	});
});

function playgroundProps(extra: { commandCancelSettleGraceMs?: number } = {}) {
	return {
		...extra,
		fileSystem: createMemoryFileSystem(),
		initialMode: 'coding' as const,
		personas: [],
		rootPath: '/',
		skills: [],
		workspaceId: 'workspace',
	};
}

async function openTerminalAndRun(command: string) {
	await waitForText('上下文就绪');
	await act(async () => findButton('工作区').click());
	await act(async () => (await waitForButton('终端')).click());
	await typeCommand(command);
	await act(async () => findButton('运行命令').click());
}

async function typeCommand(value: string) {
	const input = container.querySelector<HTMLInputElement>('input[aria-label="命令"]');
	if (!input) throw new Error('command input missing');
	await act(async () => {
		Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set?.call(input, value);
		input.dispatchEvent(new Event('input', { bubbles: true }));
		await Promise.resolve();
	});
}

async function waitForText(value: string) {
	for (let index = 0; index < 30 && !container.textContent?.includes(value); index++) {
		await act(async () => new Promise((resolve) => setTimeout(resolve, 0)));
	}
	if (!container.textContent?.includes(value)) throw new Error(`text ${value} missing`);
}

async function waitForButton(name: string): Promise<HTMLButtonElement> {
	for (let index = 0; index < 30; index++) {
		const button = findOptionalButton(name);
		if (button) return button;
		await act(async () => new Promise((resolve) => setTimeout(resolve, 0)));
	}
	throw new Error(`button ${name} missing`);
}

function findButton(name: string): HTMLButtonElement {
	const button = findOptionalButton(name);
	if (!button) throw new Error(`button ${name} missing`);
	return button;
}

function findOptionalButton(name: string): HTMLButtonElement | undefined {
	return Array.from(container.querySelectorAll('button')).find((item) => item.textContent?.trim() === name);
}

function successResult(stdout = 'ok') {
	return { durationMs: 1, exitCode: 0, settled: true, stderr: '', stdout, truncated: false };
}

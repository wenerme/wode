/** @vitest-environment jsdom */

import { createMemoryFileSystem, type IFileSystem } from '@wener/common/fs';
import type { JustBashModuleLoader } from '@wener/common/fs/just-bash';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import type { AgentCommandExecutor } from '../agent-coding';
import { AgentPlayground, AgentRuntimeIdentityChangedCancelReason } from './agent-playground';
import { getAgentSkillIdentity } from './playground-controls';

let container: HTMLDivElement;
let root: Root;
let originalResizeObserver: typeof ResizeObserver | undefined;

beforeEach(async () => {
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

describe('AgentPlayground memory runtime', () => {
	it('performs zero workspace reads in Chat and reports explicit idle context', async () => {
		let reads = 0;
		const base = createMemoryFileSystem();
		const fileSystem = {
			...base,
			readFile: async () => {
				reads += 1;
				return new Uint8Array();
			},
		} as unknown as IFileSystem;
		await act(async () =>
			root.render(
				<AgentPlayground
					fileSystem={fileSystem}
					initialMode='chat'
					personas={[]}
					rootPath='/'
					skills={[]}
					workspaceId='workspace'
				/>,
			),
		);
		await act(async () => {
			await Promise.resolve();
		});
		expect(reads).toBe(0);
		expect(container.textContent).toContain('对话模式不读取工作区');
	});

	it('keeps connection and mode state in memory and increments runtime revision on apply/mode changes', async () => {
		const storage = vi.spyOn(Storage.prototype, 'setItem');
		const fileSystem = createMemoryFileSystem();
		await fileSystem.writeFile('/AGENTS.md', 'Workspace context');
		await act(async () =>
			root.render(
				<AgentPlayground
					fileSystem={fileSystem}
					initialConnection={{ apiKey: '', baseUrl: 'https://example.com/v1', headers: {}, model: 'example-model' }}
					personas={personas}
					rootPath='/'
					skills={skills}
					workspaceId='workspace'
				/>,
			),
		);
		await act(async () => {
			await Promise.resolve();
			await Promise.resolve();
		});
		const surface = container.querySelector<HTMLElement>('[data-slot="agent-playground"]');
		if (!surface) throw new Error('playground missing');
		const before = Number(surface.dataset.runtimeRevision);
		await act(async () => findButton('应用连接').click());
		expect(Number(surface.dataset.runtimeRevision)).toBeGreaterThan(before);
		expect(container.textContent).toContain('连接已应用');
		const afterConnection = Number(surface.dataset.runtimeRevision);
		await act(async () => findButton('编码').click());
		await act(async () => {
			await Promise.resolve();
		});
		expect(surface.dataset.mode).toBe('coding');
		expect(Number(surface.dataset.runtimeRevision)).toBeGreaterThan(afterConnection);
		expect(storage).not.toHaveBeenCalled();
		expect(window.location.href).not.toContain('example-model');
		storage.mockRestore();
	});

	it('cancels the old command on mode change and completes its retained history entry', async () => {
		let observedSignal: AbortSignal | undefined;
		let observedReason: unknown;
		const executor: AgentCommandExecutor = {
			execute: (_request, options) =>
				new Promise((resolve) => {
					observedSignal = options?.signal;
					options?.signal?.addEventListener(
						'abort',
						() => {
							observedReason = options.signal?.reason;
							resolve({
								aborted: true,
								durationMs: 1,
								exitCode: 130,
								settled: true,
								stderr: 'cancelled\n',
								stdout: '',
								truncated: false,
							});
						},
						{ once: true },
					);
				}),
		};
		await act(async () =>
			root.render(
				<AgentPlayground
					executor={executor}
					fileSystem={createMemoryFileSystem()}
					initialMode='coding'
					personas={[]}
					rootPath='/'
					skills={[]}
					workspaceId='workspace'
				/>,
			),
		);
		await waitForText('上下文就绪');
		await act(async () => findExactButton('工作区').click());
		await act(async () => (await waitForExactButton('终端')).click());
		await typeCommand('long-running-command');
		await act(async () => findExactButton('运行命令').click());
		expect(observedSignal?.aborted).toBe(false);
		await act(async () => {
			findModeButton('对话').click();
			await Promise.resolve();
			await Promise.resolve();
		});
		expect(observedSignal?.aborted).toBe(true);
		expect(observedReason).toBe(AgentRuntimeIdentityChangedCancelReason);
		await act(async () => {
			findModeButton('编码').click();
			await Promise.resolve();
		});
		await act(async () => findExactButton('工作区').click());
		await act(async () => (await waitForExactButton('终端')).click());
		const entry = container.querySelector('[data-terminal-entry]');
		expect(entry?.textContent).toContain('long-running-command');
		expect(entry?.textContent).toContain('退出码 130');
		expect(entry?.textContent).not.toContain('运行中');
		expect(container.textContent).not.toContain('取消命令');
	});

	it('cancels directly on workspace identity change while the replacement context is still loading', async () => {
		let observedSignal: AbortSignal | undefined;
		let observedReason: unknown;
		const executor: AgentCommandExecutor = {
			execute: (_request, options) =>
				new Promise((resolve) => {
					observedSignal = options?.signal;
					options?.signal?.addEventListener(
						'abort',
						() => {
							observedReason = options.signal?.reason;
							resolve({
								aborted: true,
								durationMs: 1,
								exitCode: 130,
								settled: true,
								stderr: 'cancelled\n',
								stdout: '',
								truncated: false,
							});
						},
						{ once: true },
					);
				}),
		};
		await act(async () =>
			root.render(
				<AgentPlayground
					executor={executor}
					fileSystem={createMemoryFileSystem()}
					initialMode='coding'
					personas={[]}
					rootPath='/workspace-a'
					skills={[]}
					workspaceId='workspace-a'
				/>,
			),
		);
		await waitForText('上下文就绪');
		await act(async () => findExactButton('工作区').click());
		await act(async () => (await waitForExactButton('终端')).click());
		await typeCommand('workspace-bound-command');
		await act(async () => findExactButton('运行命令').click());
		expect(observedSignal?.aborted).toBe(false);
		const loadingFileSystem = {
			...createMemoryFileSystem(),
			readFile: () => new Promise<Uint8Array>(() => undefined),
		} as unknown as IFileSystem;
		await act(async () => {
			root.render(
				<AgentPlayground
					executor={executor}
					fileSystem={loadingFileSystem}
					initialMode='coding'
					personas={[]}
					rootPath='/workspace-b'
					skills={[]}
					workspaceId='workspace-b'
				/>,
			);
			await Promise.resolve();
			await Promise.resolve();
		});
		expect(container.textContent).toContain('正在加载上下文');
		expect(observedSignal?.aborted).toBe(true);
		expect(observedReason).toBe(AgentRuntimeIdentityChangedCancelReason);
	});

	it('keeps poison visible across mode, Skill, and context changes on the same runtime', async () => {
		const executor: AgentCommandExecutor = { execute: () => new Promise(() => undefined) };
		await act(async () =>
			root.render(
				<AgentPlayground
					commandCancelSettleGraceMs={5}
					executor={executor}
					fileSystem={createMemoryFileSystem()}
					initialMode='coding'
					personas={personas}
					rootPath='/'
					skills={skills}
					workspaceId='workspace'
				/>,
			),
		);
		await waitForText('上下文就绪');
		await act(async () => findExactButton('工作区').click());
		await act(async () => (await waitForExactButton('终端')).click());
		await typeCommand('ignores-cancellation');
		await act(async () => findExactButton('运行命令').click());
		await act(async () => {
			findModeButton('工作').click();
			await new Promise((resolve) => setTimeout(resolve, 10));
		});
		await act(async () => {
			findModeButton('编码').click();
			await Promise.resolve();
		});
		await waitForText('已污染');
		const skillToggle = container.querySelector<HTMLInputElement>('label[aria-label="选择 Skill review 版本 1"] input');
		if (!skillToggle) throw new Error('skill toggle missing');
		await act(async () => skillToggle.click());
		await act(async () => {
			await Promise.resolve();
			await Promise.resolve();
		});
		expect(container.textContent).toContain('已污染');
	});

	it('toggles same-name Skill versions independently by canonical identity', async () => {
		expect(getAgentSkillIdentity({ id: 'skill-id', name: 'review', version: '1' })).toBe(
			getAgentSkillIdentity({ id: 'skill-id', name: 'renamed', version: '2' }),
		);
		expect(getAgentSkillIdentity({ name: 'review', version: '1' })).not.toBe(
			getAgentSkillIdentity({ name: 'review', version: '2' }),
		);
		const versionedSkills = [
			{ ...skills[0]!, instructions: '版本一', version: '1' },
			{ ...skills[0]!, instructions: '版本二', version: '2' },
		];
		await act(async () =>
			root.render(
				<AgentPlayground
					fileSystem={createMemoryFileSystem()}
					personas={[]}
					rootPath='/'
					skills={versionedSkills}
					workspaceId='workspace'
				/>,
			),
		);
		const first = container.querySelector<HTMLInputElement>('label[aria-label="选择 Skill review 版本 1"] input');
		const second = container.querySelector<HTMLInputElement>('label[aria-label="选择 Skill review 版本 2"] input');
		if (!first || !second) throw new Error('versioned Skill toggles missing');
		expect(first.checked).toBe(true);
		expect(second.checked).toBe(true);
		await act(async () => first.click());
		expect(first.checked).toBe(false);
		expect(second.checked).toBe(true);
	});

	it('allows visible Playground messages to be overridden', async () => {
		await act(async () =>
			root.render(
				<AgentPlayground
					fileSystem={createMemoryFileSystem()}
					messages={{
						connectionRequired: 'Apply a runtime connection',
						connectionSettings: 'Runtime settings',
						controls: { codingMode: 'Code', refreshWorkspace: 'Reload workspace' },
					}}
					personas={[]}
					rootPath='/'
					skills={[]}
					workspaceId='workspace'
				/>,
			),
		);
		expect(container.textContent).toContain('Runtime settings');
		expect(container.textContent).toContain('Apply a runtime connection');
		expect(findButton('Code')).toBeDefined();
		expect(findButton('Reload workspace')).toBeDefined();
	});

	it('initializes an optional just-bash loader only after entering Coding and surfaces failure', async () => {
		const fileSystem = createMemoryFileSystem();
		const loader = vi.fn<JustBashModuleLoader>(async () => {
			throw new Error('mock loader unavailable');
		});
		await act(async () =>
			root.render(
				<AgentPlayground
					fileSystem={fileSystem}
					justBashLoader={loader}
					personas={[]}
					rootPath='/'
					skills={[]}
					workspaceId='workspace'
				/>,
			),
		);
		expect(loader).not.toHaveBeenCalled();
		await act(async () => findButton('编码').click());
		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 0));
		});
		expect(loader).toHaveBeenCalledOnce();
		expect(container.textContent).toContain('just-bash 加载失败');
		expect(container.textContent).toContain('mock loader unavailable');
	});
});

async function typeCommand(value: string) {
	const input = container.querySelector<HTMLInputElement>('input[aria-label="命令"]');
	if (!input) throw new Error('command input missing');
	await act(async () => {
		const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
		setter?.call(input, value);
		input.dispatchEvent(new Event('input', { bubbles: true }));
		await Promise.resolve();
	});
}

async function waitForExactButton(name: string): Promise<HTMLButtonElement> {
	for (let index = 0; index < 20; index++) {
		const button = Array.from(container.querySelectorAll('button')).find((item) => item.textContent?.trim() === name);
		if (button) return button;
		await new Promise((resolve) => setTimeout(resolve, 0));
	}
	throw new Error(`button ${name} missing`);
}

async function waitForText(value: string) {
	for (let index = 0; index < 20 && !container.textContent?.includes(value); index++) {
		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 0));
		});
	}
	if (!container.textContent?.includes(value)) throw new Error(`text ${value} missing`);
}

function findModeButton(name: string): HTMLButtonElement {
	const fieldset = Array.from(container.querySelectorAll('fieldset')).find((item) =>
		item.querySelector('legend')?.textContent?.includes('Agent 模式'),
	);
	const button = Array.from(fieldset?.querySelectorAll('button') ?? []).find((item) =>
		item.textContent?.includes(name),
	);
	if (!button) throw new Error(`mode button ${name} missing`);
	return button;
}

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

function findExactButton(name: string): HTMLButtonElement {
	const button = Array.from(container.querySelectorAll('button')).find((item) => item.textContent?.trim() === name);
	if (!button) throw new Error(`button ${name} missing`);
	return button;
}

function findButton(name: string): HTMLButtonElement {
	const button = Array.from(container.querySelectorAll('button')).find((item) =>
		item.textContent?.trim().includes(name),
	);
	if (!button) throw new Error(`button ${name} missing`);
	return button;
}

const personas = [
	{ assets: [], greetings: [], id: 'persona-a', name: '助手', prompts: { system: '保持简洁' }, version: '1' },
];
const skills = [
	{
		contextRequirements: [],
		description: '检查代码',
		instructions: '先读后写',
		name: 'review',
		resources: [],
		toolRequirements: [],
		version: '1',
	},
];

/** @vitest-environment jsdom */

import type { UIMessage } from 'ai';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import type { AiSdkAgentToolRenderContext } from '../agent-ai-sdk';
import { AgentPlaygroundApproval } from './tool-approval-renderer';

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

describe('AgentPlaygroundApproval', () => {
	it('submits one exact approval response and exposes pending state', async () => {
		let release: (() => void) | undefined;
		const respondToApproval = vi.fn<AiSdkAgentToolRenderContext['respondToApproval']>(
			() =>
				new Promise<void>((resolve) => {
					release = resolve;
				}),
		);
		const context = {
			index: 0,
			message: { id: 'assistant', parts: [], role: 'assistant' } as UIMessage,
			part: {
				approval: { id: 'approval-1' },
				input: { path: 'src/new.ts' },
				state: 'approval-requested',
				type: 'tool-workspace_write',
			},
			respondToApproval,
			step: 0,
		} as unknown as AiSdkAgentToolRenderContext;
		await act(async () => root.render(<AgentPlaygroundApproval context={context} />));
		const approve = findButton('批准');
		await act(async () => {
			approve.click();
			approve.click();
			await Promise.resolve();
		});
		expect(respondToApproval).toHaveBeenCalledOnce();
		expect(respondToApproval).toHaveBeenCalledWith({ approved: true, id: 'approval-1', reason: undefined });
		expect(container.textContent).toContain('正在提交审批');
		await act(async () => {
			release?.();
			await Promise.resolve();
		});
		expect(container.textContent).toContain('审批已提交');
		expect(approve.disabled).toBe(true);
		approve.click();
		expect(respondToApproval).toHaveBeenCalledOnce();
	});

	it('shows a failed approval, re-enables actions, and permits one race-safe retry', async () => {
		let attempt = 0;
		let releaseRetry: (() => void) | undefined;
		const respondToApproval = vi.fn<AiSdkAgentToolRenderContext['respondToApproval']>(() => {
			attempt += 1;
			if (attempt === 1) return Promise.reject(new Error('SDK approval failed'));
			return new Promise<void>((resolve) => {
				releaseRetry = resolve;
			});
		});
		const context = {
			index: 0,
			message: { id: 'assistant', parts: [], role: 'assistant' } as UIMessage,
			part: {
				approval: { id: 'approval-retry' },
				input: { command: 'pnpm test' },
				state: 'approval-requested',
				type: 'tool-command',
			},
			respondToApproval,
			step: 0,
		} as unknown as AiSdkAgentToolRenderContext;
		await act(async () => root.render(<AgentPlaygroundApproval context={context} />));
		const approve = findButton('批准');
		const deny = findButton('拒绝');
		await act(async () => {
			approve.click();
			approve.click();
			await Promise.resolve();
			await Promise.resolve();
		});
		expect(respondToApproval).toHaveBeenCalledOnce();
		expect(container.querySelector('[role="alert"]')?.textContent).toContain('提交审批失败');
		expect(approve.disabled).toBe(false);
		expect(deny.disabled).toBe(false);

		await act(async () => {
			approve.click();
			approve.click();
			await Promise.resolve();
		});
		expect(respondToApproval).toHaveBeenCalledTimes(2);
		expect(approve.disabled).toBe(true);
		expect(container.textContent).toContain('正在提交审批');
		await act(async () => {
			releaseRetry?.();
			await Promise.resolve();
		});
		expect(container.textContent).toContain('审批已提交');
		approve.click();
		expect(respondToApproval).toHaveBeenCalledTimes(2);
	});

	it('resets local submission state when the approval identity changes in place', async () => {
		const respondToApproval = vi.fn<AiSdkAgentToolRenderContext['respondToApproval']>(async () => undefined);
		const context = (id: string) =>
			({
				index: 0,
				message: { id: 'assistant-reused', parts: [], role: 'assistant' } as UIMessage,
				part: {
					approval: { id },
					input: { path: 'src/example.ts' },
					state: 'approval-requested',
					toolCallId: 'tool-call-reused',
					type: 'tool-workspace_write',
				},
				respondToApproval,
				step: 0,
			}) as unknown as AiSdkAgentToolRenderContext;

		await act(async () => root.render(<AgentPlaygroundApproval context={context('approval-first')} />));
		await act(async () => {
			findButton('批准').click();
			await Promise.resolve();
			await Promise.resolve();
		});
		expect(findButton('批准').disabled).toBe(true);

		await act(async () => root.render(<AgentPlaygroundApproval context={context('approval-second')} />));
		expect(findButton('批准').disabled).toBe(false);
		await act(async () => {
			findButton('拒绝').click();
			await Promise.resolve();
			await Promise.resolve();
		});
		expect(respondToApproval).toHaveBeenNthCalledWith(2, {
			approved: false,
			id: 'approval-second',
			reason: '用户拒绝',
		});
	});
});

function findButton(name: string): HTMLButtonElement {
	const button = Array.from(container.querySelectorAll('button')).find((item) => item.textContent?.includes(name));
	if (!button) throw new Error(`button ${name} missing`);
	return button;
}

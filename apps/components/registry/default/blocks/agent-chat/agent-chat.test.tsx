/** @vitest-environment jsdom */

import type { UIMessage } from 'ai';
import { act, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { AgentChat, validateAgentRuntimeMessages } from './index';

const transcript: UIMessage[] = [
	{ id: 'turn-user-1', role: 'user', parts: [{ type: 'text', text: '检查任务' }] },
	{ id: 'turn-assistant-1', role: 'assistant', parts: [{ type: 'text', text: '任务正常' }] },
];

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
	container = document.createElement('div');
	document.body.append(container);
	root = createRoot(container);
});

afterEach(() => {
	act(() => root.unmount());
	container.remove();
});

describe('AgentChat', () => {
	it('renders controlled messages with stable IDs, user anchors, slots, and overrides', () => {
		const markup = renderToStaticMarkup(
			<AgentChat
				connection='已连接'
				files={[]}
				header='运行记录'
				messages={{ empty: 'No messages', retry: 'Retry', transcript: 'Transcript' }}
				status='ready'
				text='草稿'
				toolbar={<button type='button'>设置</button>}
				value={transcript}
				onFilesChange={() => undefined}
				onSend={() => undefined}
				onTextChange={() => undefined}
			/>,
		);
		expect(markup).toContain('data-slot="agent-chat"');
		expect(markup).toContain('data-message-id="turn-user-1"');
		expect(markup).toContain('data-message-id="turn-assistant-1"');
		expect(markup).toMatch(/data-message-id="turn-user-1"[^>]*data-scroll-anchor="true"/);
		expect(markup).toMatch(/data-message-id="turn-assistant-1"[^>]*data-scroll-anchor="false"/);
		expect(markup).toContain('aria-label="Transcript"');
		expect(markup).toContain('运行记录');
		expect(markup).toContain('已连接');
		expect(markup).toContain('设置');
	});

	it('keeps draft controlled and dispatches send, stop, and retry callbacks', () => {
		const send = vi.fn();
		const stop = vi.fn();
		const retry = vi.fn();
		function Harness() {
			const [text, setText] = useState('继续');
			const [files, setFiles] = useState<File[]>([]);
			const [status, setStatus] = useState<'ready' | 'streaming'>('ready');
			return (
				<AgentChat
					error='请求失败'
					files={files}
					status={status}
					text={text}
					value={transcript}
					onFilesChange={setFiles}
					onRetry={retry}
					onSend={(value) => {
						send(value);
						setStatus('streaming');
					}}
					onStop={() => {
						stop();
						setStatus('ready');
					}}
					onTextChange={setText}
				/>
			);
		}
		act(() => root.render(<Harness />));
		act(() => container.querySelector<HTMLButtonElement>('button[aria-label="发送"]')?.click());
		expect(send).toHaveBeenCalledWith({ text: '继续', files: [] });
		act(() => container.querySelector<HTMLButtonElement>('button[aria-label="停止生成"]')?.click());
		expect(stop).toHaveBeenCalledOnce();
		const retryButton = Array.from(container.querySelectorAll<HTMLButtonElement>('button')).find((button) =>
			button.textContent?.includes('重试'),
		);
		act(() => retryButton?.click());
		expect(retry).toHaveBeenCalledOnce();
	});

	it('bounds external runtime messages and disables rendering or send for invalid values', () => {
		const cyclic: Record<string, unknown> = {};
		cyclic.self = cyclic;
		const invalid = [
			{
				id: 'unsafe',
				role: 'assistant',
				parts: [{ type: 'data-unsafe', data: cyclic }],
			},
		] as unknown as UIMessage[];
		const markup = renderToStaticMarkup(
			<AgentChat
				files={[]}
				status='ready'
				text='不应发送'
				value={invalid}
				onFilesChange={() => undefined}
				onSend={() => undefined}
				onTextChange={() => undefined}
			/>,
		);
		expect(markup).toContain('data-invalid-messages="true"');
		expect(markup).toContain('消息不能包含循环引用');
		expect(markup).toContain('disabled=""');
		expect(markup).not.toContain('data-unsafe');

		const oversized = validateAgentRuntimeMessages(
			[{ id: 'large', role: 'user', parts: [{ type: 'text', text: 'x'.repeat(33) }] }],
			{ maxStringBytes: 32 },
		);
		expect(oversized).toMatchObject({ success: false, code: 'string-bytes' });
		const dataUrl = validateAgentRuntimeMessages(
			[{ id: 'file', role: 'user', parts: [{ type: 'file', mediaType: 'text/plain', url: `data:${'x'.repeat(32)}` }] }],
			{ maxDataUrlBytes: 16 },
		);
		expect(dataUrl).toMatchObject({ success: false, code: 'data-url-bytes' });
		expect(
			validateAgentRuntimeMessages(
				Array.from({ length: 3 }, (_, index) => ({ id: `message-${index}`, role: 'user', parts: [] })),
				{ maxMessages: 2 },
			),
		).toMatchObject({ success: false, code: 'messages' });
		expect(
			validateAgentRuntimeMessages(
				[
					{
						id: 'parts',
						role: 'assistant',
						parts: [
							{ type: 'text', text: 'a' },
							{ type: 'text', text: 'b' },
						],
					},
				],
				{ maxParts: 1 },
			),
		).toMatchObject({ success: false, code: 'parts' });
		expect(validateAgentRuntimeMessages(transcript, { maxNodes: 2 })).toMatchObject({ success: false, code: 'nodes' });
	});

	it('fails safely when external message access is trapped', () => {
		const trapped = new Proxy(
			{ id: 'trapped', role: 'user', parts: [] },
			{
				getOwnPropertyDescriptor() {
					throw new Error('blocked');
				},
			},
		);
		expect(validateAgentRuntimeMessages([trapped])).toMatchObject({ success: false, code: 'invalid' });
	});

	it('supports empty and message rendering overrides without mutating the supplied transcript', () => {
		const empty = renderToStaticMarkup(
			<AgentChat
				emptyState={<output>等待输入</output>}
				files={[]}
				status='ready'
				text=''
				value={[]}
				onFilesChange={() => undefined}
				onSend={() => undefined}
				onTextChange={() => undefined}
			/>,
		);
		const custom = renderToStaticMarkup(
			<AgentChat
				files={[]}
				status='ready'
				text=''
				value={transcript}
				onFilesChange={() => undefined}
				onSend={() => undefined}
				onTextChange={() => undefined}
				renderMessage={({ message }) => <output>{`自定义:${message.id}`}</output>}
			/>,
		);
		expect(empty).toContain('等待输入');
		expect(custom).toContain('自定义:turn-user-1');
		expect(transcript).toHaveLength(2);
	});
});

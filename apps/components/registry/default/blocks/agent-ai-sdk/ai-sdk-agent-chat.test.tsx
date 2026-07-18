/** @vitest-environment jsdom */

import type { UIMessage } from 'ai';
import { act, StrictMode, Suspense, startTransition } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { AiSdkAgentChat } from './ai-sdk-agent-chat';

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

describe('AiSdkAgentChat connection lifecycle', () => {
	it('does not leak runtime identity from an abandoned concurrent render', async () => {
		const blocked = new Promise<void>(() => undefined);
		const connectionA = { baseUrl: 'https://example.com/a', model: 'example-model' };
		const connectionB = { baseUrl: 'https://example.com/b', model: 'example-model' };
		const render = (connection: typeof connectionA, suspend: boolean) => (
			<Suspense fallback={<span>pending</span>}>
				<AiSdkAgentChat connection={connection} />
				<SuspendAfter enabled={suspend} promise={blocked} />
			</Suspense>
		);
		await act(async () => root.render(render(connectionA, false)));
		await typeIntoTextarea('保留的草稿');
		await act(async () => {
			startTransition(() => root.render(render(connectionB, true)));
			await Promise.resolve();
		});
		await act(async () => root.render(render(connectionA, false)));
		expect(container.querySelector<HTMLTextAreaElement>('textarea')?.value).toBe('保留的草稿');
	});

	it('aborts the old run and clears uncontrolled messages when the applied connection changes', async () => {
		const signals: AbortSignal[] = [];
		const fetch = vi.fn((_input: RequestInfo | URL, init?: RequestInit) => {
			const signal = init?.signal;
			if (signal) signals.push(signal);
			return new Promise<Response>((_resolve, reject) => {
				signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')), { once: true });
			});
		});
		await act(async () => {
			root.render(
				<AiSdkAgentChat connection={{ baseUrl: 'https://example.com/a', model: 'example-model' }} fetch={fetch} />,
			);
		});
		await typeIntoTextarea('第一条消息');
		await act(async () => {
			container.querySelector<HTMLButtonElement>('button[aria-label="发送"]')?.click();
			await Promise.resolve();
			await Promise.resolve();
		});
		expect(fetch).toHaveBeenCalledOnce();
		expect(container.textContent).toContain('第一条消息');
		await act(async () => {
			root.render(
				<AiSdkAgentChat connection={{ baseUrl: 'https://example.com/b', model: 'example-model' }} fetch={fetch} />,
			);
			await Promise.resolve();
		});
		expect(signals[0]?.aborted).toBe(true);
		expect(container.textContent).not.toContain('第一条消息');
		expect(container.textContent).toContain('开始一段新对话');
	});

	it('restores the mounted guard under StrictMode and sends after asynchronous file conversion', async () => {
		const fetch = vi.fn(async () => streamResponse('严格模式回复'));
		await act(async () => {
			root.render(
				<StrictMode>
					<AiSdkAgentChat connection={{ baseUrl: 'https://example.com/v1', model: 'example-model' }} fetch={fetch} />
				</StrictMode>,
			);
		});
		const fileInput = container.querySelector<HTMLInputElement>('input[aria-label="选择文件"]');
		if (!fileInput) throw new Error('file input missing');
		Object.defineProperty(fileInput, 'files', {
			configurable: true,
			value: [new File(['hello'], 'note.txt', { type: 'text/plain' })],
		});
		await act(async () => fileInput.dispatchEvent(new Event('change', { bubbles: true })));
		await typeIntoTextarea('严格模式消息');
		await act(async () => {
			container.querySelector<HTMLButtonElement>('button[aria-label="发送"]')?.click();
			await new Promise((resolve) => setTimeout(resolve, 30));
		});
		expect(fetch).toHaveBeenCalledOnce();
		expect(container.textContent).toContain('严格模式回复');
	});

	it('renders compatible streams whose initial assistant role chunk has null content', async () => {
		const fetch = vi.fn(async () => streamResponseWithNullRoleChunk('真实流回复'));
		await act(async () => {
			root.render(
				<AiSdkAgentChat connection={{ baseUrl: 'https://example.com/v1', model: 'example-model' }} fetch={fetch} />,
			);
		});
		await typeIntoTextarea('真实流请求');
		await act(async () => {
			container.querySelector<HTMLButtonElement>('button[aria-label="发送"]')?.click();
			await new Promise((resolve) => setTimeout(resolve, 30));
		});
		expect(container.textContent).toContain('真实流请求');
		expect(container.textContent).toContain('真实流回复');
	});

	it('does not echo controlled message references or equivalents and resumes after a user message', async () => {
		const connection = { baseUrl: 'https://example.com/v1', model: 'example-model' };
		const fetch = vi.fn(async () => streamResponse('新回复'));
		const controlled: UIMessage[] = [
			{ id: 'controlled', role: 'user', parts: [{ type: 'text', text: '宿主 transcript' }] },
		];
		const initialChange = vi.fn<(messages: UIMessage[]) => void>();
		await act(async () =>
			root.render(
				<AiSdkAgentChat
					chatMessages={controlled}
					connection={connection}
					fetch={fetch}
					onMessagesChange={initialChange}
				/>,
			),
		);
		expect(initialChange).not.toHaveBeenCalled();

		const sameReferenceChange = vi.fn<(messages: UIMessage[]) => void>();
		await act(async () =>
			root.render(
				<AiSdkAgentChat
					chatMessages={controlled}
					connection={connection}
					fetch={fetch}
					onMessagesChange={sameReferenceChange}
				/>,
			),
		);
		expect(sameReferenceChange).not.toHaveBeenCalled();

		const equivalent = [...controlled];
		const resumedChange = vi.fn<(messages: UIMessage[]) => void>();
		await act(async () =>
			root.render(
				<AiSdkAgentChat
					chatMessages={equivalent}
					connection={connection}
					fetch={fetch}
					onMessagesChange={resumedChange}
				/>,
			),
		);
		expect(resumedChange).not.toHaveBeenCalled();

		await typeIntoTextarea('新用户消息');
		await act(async () => {
			container.querySelector<HTMLButtonElement>('button[aria-label="发送"]')?.click();
			await new Promise((resolve) => setTimeout(resolve, 30));
		});
		expect(
			resumedChange.mock.calls.some(([next]) =>
				next.some((message) => message.parts.some((part) => part.type === 'text' && part.text === '新用户消息')),
			),
		).toBe(true);
	});

	it('aborts stale streams without echoing old messages during an external replacement', async () => {
		let resolveFetch: ((response: Response) => void) | undefined;
		const fetch = vi.fn(
			(_input: RequestInfo | URL, _init?: RequestInit) =>
				new Promise<Response>((resolve) => {
					resolveFetch = resolve;
				}),
		);
		const connection = { baseUrl: 'https://example.com/v1', model: 'example-model' };
		const initialChange = vi.fn<(messages: UIMessage[]) => void>();
		await act(async () =>
			root.render(<AiSdkAgentChat connection={connection} fetch={fetch} onMessagesChange={initialChange} />),
		);
		await typeIntoTextarea('旧请求');
		await act(async () => {
			container.querySelector<HTMLButtonElement>('button[aria-label="发送"]')?.click();
			await Promise.resolve();
			await Promise.resolve();
		});
		expect(fetch).toHaveBeenCalledOnce();
		expect(initialChange).toHaveBeenCalled();
		initialChange.mockClear();
		const replacement: UIMessage[] = [
			{ id: 'replacement', role: 'user', parts: [{ type: 'text', text: '新 transcript' }] },
		];
		const replacementChange = vi.fn<(messages: UIMessage[]) => void>();
		await act(async () => {
			root.render(
				<AiSdkAgentChat
					chatMessages={replacement}
					connection={connection}
					fetch={fetch}
					onMessagesChange={replacementChange}
				/>,
			);
			await Promise.resolve();
		});
		expect(replacementChange).not.toHaveBeenCalled();
		await act(async () => {
			resolveFetch?.(streamResponse('旧流不应追加'));
			await new Promise((resolve) => setTimeout(resolve, 30));
		});
		expect(replacementChange).not.toHaveBeenCalled();
		expect(initialChange).not.toHaveBeenCalled();
		expect(container.textContent).toContain('新 transcript');
		expect(container.textContent).not.toContain('旧请求');
		expect(container.textContent).not.toContain('旧流不应追加');
	});

	it('rejects invalid external transcripts before render or network use', async () => {
		const cyclic: Record<string, unknown> = {};
		cyclic.self = cyclic;
		const invalid = [
			{ id: 'invalid', role: 'user', parts: [{ type: 'data-invalid', data: cyclic }] },
		] as unknown as UIMessage[];
		const fetch = vi.fn();
		await act(async () =>
			root.render(
				<AiSdkAgentChat
					chatMessages={invalid}
					connection={{ baseUrl: 'https://example.com/v1', model: 'example-model' }}
					fetch={fetch}
				/>,
			),
		);
		expect(container.textContent).toContain('消息不能包含循环引用');
		expect(container.querySelector<HTMLButtonElement>('button[aria-label="发送"]')?.disabled).toBe(true);
		expect(fetch).not.toHaveBeenCalled();
	});

	it('preserves messages across revisions only when the host controls them', async () => {
		const controlled: UIMessage[] = [{ id: 'controlled-1', role: 'user', parts: [{ type: 'text', text: '宿主消息' }] }];
		await act(async () => {
			root.render(
				<AiSdkAgentChat
					chatMessages={controlled}
					connection={{ baseUrl: 'https://example.com/a', model: 'example-model' }}
					connectionRevision={1}
				/>,
			);
		});
		expect(container.textContent).toContain('宿主消息');
		await act(async () => {
			root.render(
				<AiSdkAgentChat
					chatMessages={controlled}
					connection={{ baseUrl: 'https://example.com/b', model: 'example-model' }}
					connectionRevision={2}
				/>,
			);
		});
		expect(container.textContent).toContain('宿主消息');
	});
});

function SuspendAfter({ enabled, promise }: { enabled: boolean; promise: Promise<void> }) {
	if (enabled) throw promise;
	return null;
}

function streamResponse(text: string): Response {
	const body = [
		`data: {"id":"chatcmpl-example","object":"chat.completion.chunk","created":1,"model":"example-model","choices":[{"index":0,"delta":{"role":"assistant","content":${JSON.stringify(text)}},"finish_reason":null}]}`,
		'',
		'data: {"id":"chatcmpl-example","object":"chat.completion.chunk","created":1,"model":"example-model","choices":[{"index":0,"delta":{},"finish_reason":"stop"}]}',
		'',
		'data: [DONE]',
		'',
	].join('\n');
	return new Response(body, { headers: { 'content-type': 'text/event-stream' } });
}

function streamResponseWithNullRoleChunk(text: string): Response {
	const body = [
		'data: {"id":"chatcmpl-example","object":"chat.completion.chunk","created":1,"model":"example-model","choices":[{"index":0,"delta":{"role":"assistant","content":null},"finish_reason":null}]}',
		'',
		`data: {"id":"chatcmpl-example","object":"chat.completion.chunk","created":1,"model":"example-model","choices":[{"index":0,"delta":{"content":${JSON.stringify(text)}},"finish_reason":null}]}`,
		'',
		'data: {"id":"chatcmpl-example","object":"chat.completion.chunk","created":1,"model":"example-model","choices":[{"index":0,"delta":{},"finish_reason":"stop"}]}',
		'',
		'data: [DONE]',
		'',
	].join('\n');
	return new Response(body, { headers: { 'content-type': 'text/event-stream' } });
}

async function typeIntoTextarea(value: string) {
	const textarea = container.querySelector<HTMLTextAreaElement>('textarea');
	if (!textarea) throw new Error('textarea missing');
	await act(async () => {
		// oxlint-disable-next-line typescript/unbound-method -- Reflect.apply binds the native setter to the textarea.
		const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set;
		if (!setter) throw new Error('textarea value setter missing');
		Reflect.apply(setter, textarea, [value]);
		textarea.dispatchEvent(new Event('input', { bubbles: true }));
		await Promise.resolve();
	});
}

/** @vitest-environment jsdom */

import { act, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import type { OpenAICompatibleConnectionConfig, OpenAICompatibleConnectionDraft } from './connection-config';
import { OpenAICompatibleConnectionEditor } from './connection-editor';

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

describe('OpenAICompatibleConnectionEditor', () => {
	it('keeps secrets controlled, reveals and clears the key, refreshes models, and applies normalized values', async () => {
		const apply = vi.fn<(connection: OpenAICompatibleConnectionConfig) => void>();
		const fetch = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) =>
			Response.json({ object: 'list', data: [{ id: 'example-a', object: 'model' }] }),
		);
		function Harness() {
			const [draft, setDraft] = useState<OpenAICompatibleConnectionDraft>({
				apiKey: 'example-secret',
				baseUrl: 'https://example.com/v1/',
				model: 'example-model',
			});
			return <OpenAICompatibleConnectionEditor draft={draft} fetch={fetch} onApply={apply} onDraftChange={setDraft} />;
		}
		await act(async () => root.render(<Harness />));
		const keyInput = container.querySelector<HTMLInputElement>('input[type="password"]');
		expect(keyInput?.value).toBe('example-secret');
		act(() => container.querySelector<HTMLButtonElement>('button[aria-label="显示 API Key"]')?.click());
		expect(container.querySelector<HTMLInputElement>('input[type="text"][autocomplete="new-password"]')?.value).toBe(
			'example-secret',
		);
		act(() => container.querySelector<HTMLButtonElement>('button[aria-label="清除 API Key"]')?.click());
		expect(container.querySelector<HTMLInputElement>('input[autocomplete="new-password"]')?.value).toBe('');
		await act(async () => {
			const refresh = Array.from(container.querySelectorAll<HTMLButtonElement>('button')).find((button) =>
				button.textContent?.includes('刷新模型'),
			);
			refresh?.click();
			await new Promise((resolve) => setTimeout(resolve, 10));
		});
		expect(fetch).toHaveBeenCalledOnce();
		expect(container.querySelector('select[aria-label="可用模型"]')).not.toBeNull();
		expect(fetch.mock.calls[0]?.[0]).toBe('https://example.com/v1/models');
		act(() => container.querySelector<HTMLButtonElement>('button[type="submit"]')?.click());
		expect(apply).toHaveBeenCalledWith({ apiKey: '', baseUrl: 'https://example.com/v1', model: 'example-model' });
	});

	it('keeps a key revealed while it is edited and masks the next connection identity', async () => {
		function Harness() {
			const [identity, setIdentity] = useState('connection-a');
			const [draft, setDraft] = useState<OpenAICompatibleConnectionDraft>({
				apiKey: 'secret-a',
				baseUrl: 'https://example.com/v1',
				model: 'example-model',
			});
			return (
				<>
					<button
						type='button'
						onClick={() => {
							setIdentity('connection-b');
							setDraft({ apiKey: 'secret-b', baseUrl: 'https://example.com/v2', model: 'example-model' });
						}}
					>
						切换连接
					</button>
					<OpenAICompatibleConnectionEditor
						draft={draft}
						revealIdentity={identity}
						onApply={() => undefined}
						onDraftChange={setDraft}
					/>
				</>
			);
		}
		await act(async () => root.render(<Harness />));
		act(() => container.querySelector<HTMLButtonElement>('button[aria-label="显示 API Key"]')?.click());
		const key = container.querySelector<HTMLInputElement>('input[autocomplete="new-password"]');
		if (!key) throw new Error('key input missing');
		await changeValue(key, 'secret-a-edited');
		expect(container.querySelector<HTMLInputElement>('input[autocomplete="new-password"]')?.type).toBe('text');
		await act(async () => buttonByText('切换连接').click());
		const next = container.querySelector<HTMLInputElement>('input[autocomplete="new-password"]');
		expect(next?.value).toBe('secret-b');
		expect(next?.type).toBe('password');
	});

	it('aborts model discovery and discards its response when connection inputs change', async () => {
		let resolveFetch: ((response: Response) => void) | undefined;
		const fetch = vi.fn(
			(_input: RequestInfo | URL, _init?: RequestInit) =>
				new Promise<Response>((resolve) => {
					resolveFetch = resolve;
				}),
		);
		function Harness() {
			const [draft, setDraft] = useState<OpenAICompatibleConnectionDraft>({
				apiKey: 'example-secret',
				baseUrl: 'https://example.com/v1',
				model: 'example-model',
			});
			return (
				<OpenAICompatibleConnectionEditor
					draft={draft}
					fetch={fetch}
					onApply={() => undefined}
					onDraftChange={setDraft}
				/>
			);
		}
		await act(async () => root.render(<Harness />));
		await act(async () => buttonByText('刷新模型').click());
		const signal = fetch.mock.calls[0]?.[1]?.signal;
		const baseUrl = container.querySelector<HTMLInputElement>('input[type="url"]');
		if (!baseUrl) throw new Error('base URL input missing');
		await changeValue(baseUrl, 'https://example.com/v2');
		expect(signal?.aborted).toBe(true);
		await act(async () => {
			resolveFetch?.(Response.json({ object: 'list', data: [{ id: 'stale-model', object: 'model' }] }));
			await Promise.resolve();
			await Promise.resolve();
		});
		expect(container.querySelector('select[aria-label="可用模型"]')).toBeNull();
		expect(container.textContent).not.toContain('stale-model');
	});
});

function buttonByText(text: string): HTMLButtonElement {
	const button = [...container.querySelectorAll<HTMLButtonElement>('button')].find((candidate) =>
		candidate.textContent?.includes(text),
	);
	if (!button) throw new Error(`button missing: ${text}`);
	return button;
}

async function changeValue(input: HTMLInputElement, value: string) {
	const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
	if (!setter) throw new Error('input value setter missing');
	await act(async () => {
		setter.call(input, value);
		input.dispatchEvent(new Event('input', { bubbles: true }));
	});
}

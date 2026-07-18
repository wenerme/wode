// @vitest-environment jsdom

import { type Provider, ProviderSchema } from '@wener/ai/schema';
import { act, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vite-plus/test';
import { AiProviderEditor } from '../../blocks/ai-provider-editor';

const initial = ProviderSchema.parse({
	id: 'provider-example',
	name: 'example-provider',
	apiKey: 'placeholder-secret',
	baseUrl: 'https://api.example.com/v1',
	enabled: true,
});

function Harness() {
	const [value, setValue] = useState<Provider>(initial);
	const [changes, setChanges] = useState(0);
	return (
		<>
			<AiProviderEditor
				value={value}
				onChange={(next) => {
					setChanges((current) => current + 1);
					setValue(next);
				}}
			/>
			<output aria-label='controlled id'>{value.id}</output>
			<output aria-label='change count'>{changes}</output>
		</>
	);
}

let container: HTMLDivElement;
let root: Root;

beforeEach(async () => {
	(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
	container = document.createElement('div');
	document.body.append(container);
	root = createRoot(container);
	await act(async () => root.render(<Harness />));
});

afterEach(async () => {
	await act(async () => root.unmount());
	container.remove();
});

describe('AiConfigEditor interactions', () => {
	it('keeps secret reveal UI-only and blocks invalid form/JSON emissions', async () => {
		const secret = labeledInput('API Key');
		expect(secret.type).toBe('password');
		await click(buttonByLabel('显示密钥'));
		expect(secret.type).toBe('text');
		expect(output('change count').textContent).toBe('0');

		const id = labeledInput('ID');
		await changeValue(id, '');
		expect(container.textContent).toContain('请检查以下配置问题');
		expect(output('controlled id').textContent).toBe('provider-example');
		expect(output('change count').textContent).toBe('0');

		await changeValue(id, 'provider-edited');
		expect(output('controlled id').textContent).toBe('provider-edited');
		expect(output('change count').textContent).toBe('1');

		await click(buttonByText('JSON'));
		const json = labeledTextarea('配置 JSON');
		await changeValue(json, '{invalid');
		await click(buttonByText('应用 JSON'));
		expect(container.textContent).toContain('JSON 内容无法解析');
		expect(output('change count').textContent).toBe('1');

		await changeValue(
			json,
			JSON.stringify({
				id: 'provider-json',
				name: 'json-provider',
				baseUrl: 'https://json.example.com/v1',
				enabled: true,
			}),
		);
		await click(buttonByText('应用 JSON'));
		expect(output('controlled id').textContent).toBe('provider-json');
		expect(output('change count').textContent).toBe('2');
	});

	it('does not add list or key/value entries while an IME composition is active', async () => {
		const tags = labeledInput('标签');
		await changeValue(tags, '中文标签');
		await act(async () => tags.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true })));
		await act(async () =>
			tags.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Enter' })),
		);
		expect(output('change count').textContent).toBe('0');
		await act(async () => tags.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true })));
		await act(async () =>
			tags.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Enter' })),
		);
		expect(output('change count').textContent).toBe('1');
		expect(container.textContent).toContain('中文标签');

		const headerKey = container.querySelector<HTMLInputElement>('input[aria-label="请求头 键"]');
		const headerValue = container.querySelector<HTMLInputElement>('input[aria-label="请求头 值"]');
		if (!headerKey || !headerValue) throw new Error('header collection inputs missing');
		await changeValue(headerKey, 'X-Example');
		await changeValue(headerValue, '值');
		await act(async () => headerValue.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true })));
		await act(async () =>
			headerValue.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Enter' })),
		);
		expect(output('change count').textContent).toBe('1');
		await act(async () => headerValue.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true })));
		await act(async () =>
			headerValue.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Enter' })),
		);
		expect(output('change count').textContent).toBe('2');

		await changeValue(tags, '原生 composing');
		await act(async () =>
			tags.dispatchEvent(
				new KeyboardEvent('keydown', { bubbles: true, cancelable: true, isComposing: true, key: 'Enter' }),
			),
		);
		expect(output('change count').textContent).toBe('2');
	});

	it('keeps reveal while editing a secret and masks a newly selected canonical resource', async () => {
		const second = ProviderSchema.parse({
			id: 'provider-b',
			name: 'provider-b',
			apiKey: 'secret-b',
			enabled: true,
		});
		function ResourceHarness() {
			const [value, setValue] = useState<Provider>(initial);
			return (
				<>
					<button type='button' onClick={() => setValue(second)}>
						切换资源
					</button>
					<AiProviderEditor value={value} onChange={setValue} />
				</>
			);
		}
		await act(async () => root.render(<ResourceHarness />));
		await click(buttonByLabel('显示密钥'));
		const revealed = labeledInput('API Key');
		expect(revealed.type).toBe('text');
		await changeValue(revealed, 'secret-a-edited');
		expect(labeledInput('API Key').type).toBe('text');
		await click(buttonByText('切换资源'));
		expect(labeledInput('API Key').value).toBe('secret-b');
		expect(labeledInput('API Key').type).toBe('password');
	});
});

function labeledInput(label: string): HTMLInputElement {
	const matching = [...document.querySelectorAll<HTMLLabelElement>('label')].find((candidate) =>
		candidate.textContent?.trim().startsWith(label),
	);
	const input = matching?.htmlFor ? document.getElementById(matching.htmlFor) : undefined;
	if (!(input instanceof HTMLInputElement)) throw new Error(`input not found: ${label}`);
	return input;
}

function labeledTextarea(label: string): HTMLTextAreaElement {
	const matching = [...document.querySelectorAll<HTMLLabelElement>('label')].find(
		(candidate) => candidate.textContent?.trim() === label,
	);
	const textarea = matching?.htmlFor ? document.getElementById(matching.htmlFor) : undefined;
	if (!(textarea instanceof HTMLTextAreaElement)) throw new Error(`textarea not found: ${label}`);
	return textarea;
}

function buttonByLabel(label: string): HTMLButtonElement {
	const button = document.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`);
	if (!button) throw new Error(`button not found: ${label}`);
	return button;
}

function buttonByText(label: string): HTMLButtonElement {
	const button = [...document.querySelectorAll<HTMLButtonElement>('button')].find(
		(candidate) => candidate.textContent?.trim() === label,
	);
	if (!button) throw new Error(`button not found: ${label}`);
	return button;
}

function output(label: string): HTMLOutputElement {
	const element = document.querySelector<HTMLOutputElement>(`output[aria-label="${label}"]`);
	if (!element) throw new Error(`output not found: ${label}`);
	return element;
}

async function click(element: HTMLElement) {
	await act(async () => element.click());
}

async function changeValue(element: HTMLInputElement | HTMLTextAreaElement, value: string) {
	const prototype = element instanceof HTMLInputElement ? HTMLInputElement.prototype : HTMLTextAreaElement.prototype;
	const setter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
	if (!setter) throw new Error('value setter unavailable');
	await act(async () => {
		setter.call(element, value);
		element.dispatchEvent(new Event('input', { bubbles: true }));
	});
}

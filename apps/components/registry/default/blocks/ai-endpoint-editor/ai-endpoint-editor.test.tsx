/** @vitest-environment jsdom */

import { type Endpoint, EndpointSchema } from '@wener/ai/schema';
import { act, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vite-plus/test';
import { AiEndpointEditor } from './ai-endpoint-editor';

const endpoint = EndpointSchema.parse({
	id: 'endpoint-example',
	name: 'example-endpoint',
	providerId: 'provider-example',
	apiType: 'openai-responses',
	baseUrl: 'https://api.example.com/v1',
	headers: { 'X-Example': 'value' },
	credentials: { mode: 'example' },
	options: { timeout: 30 },
	tags: ['public-example'],
	enabled: true,
});

describe('AiEndpointEditor', () => {
	it('renders canonical Endpoint fields with injected Provider references', () => {
		const markup = renderToStaticMarkup(
			<AiEndpointEditor
				value={endpoint}
				providerOptions={[{ value: 'provider-example', label: 'Example Provider' }]}
				onChange={() => undefined}
			/>,
		);
		expect(markup).toContain('AI Endpoint 配置');
		expect(markup).toContain('Example Provider');
		expect(markup).toContain('openai-responses');
		expect(markup).toContain('https://api.example.com/v1');
		expect(markup).toContain('请求头');
		expect(markup).toContain('Credentials');
		expect(markup).toContain('Options');
		expect(markup).toContain('元数据与扩展');
		expect(markup).not.toContain('>Metadata<');
	});

	it('uses EndpointSchema for invalid external value fallback', () => {
		const markup = renderToStaticMarkup(
			<AiEndpointEditor value={{ id: '', name: '', metadata: {} } as unknown as Endpoint} onChange={() => undefined} />,
		);
		expect(markup).toContain('外部配置无效');
		expect(markup).toContain('endpoint-new');
	});

	it('emits valid Form and JSON changes but rejects non-canonical fields', async () => {
		const container = document.createElement('div');
		document.body.append(container);
		const root = createRoot(container);
		function Harness() {
			const [value, setValue] = useState(endpoint);
			const [changes, setChanges] = useState(0);
			return (
				<>
					<AiEndpointEditor
						value={value}
						providerOptions={[
							{ value: 'provider-example', label: 'Example Provider' },
							{ value: 'provider-other', label: 'Other Provider' },
						]}
						onChange={(next) => {
							setChanges((current) => current + 1);
							setValue(next);
						}}
					/>
					<output aria-label='endpoint state'>{`${value.id}:${value.providerId}:${changes}`}</output>
				</>
			);
		}
		try {
			await act(async () => root.render(<Harness />));
			await selectValue(labeledSelect(container, 'Provider 归属'), 'provider-other');
			expect(container.querySelector('output')?.textContent).toBe('endpoint-example:provider-other:1');

			await clickButton(container, 'JSON');
			const json = labeledTextarea(container, '配置 JSON');
			await changeTextarea(
				json,
				JSON.stringify({ id: 'endpoint-invalid', name: 'invalid', metadata: { invented: true }, enabled: true }),
			);
			await clickButton(container, '应用 JSON');
			expect(container.textContent).toContain('metadata');
			expect(container.querySelector('output')?.textContent).toBe('endpoint-example:provider-other:1');

			await changeTextarea(
				json,
				JSON.stringify({
					id: 'endpoint-json',
					name: 'json-endpoint',
					providerId: 'provider-example',
					baseUrl: 'https://json.example.com/v1',
					credentials: { mode: 'example' },
					options: { timeout: 10 },
					tags: ['json'],
					enabled: true,
				}),
			);
			await clickButton(container, '应用 JSON');
			expect(container.querySelector('output')?.textContent).toBe('endpoint-json:provider-example:2');
		} finally {
			await act(async () => root.unmount());
			container.remove();
		}
	});
});

function labeledSelect(container: HTMLElement, label: string): HTMLSelectElement {
	const element = labeledElement(container, label);
	if (!(element instanceof HTMLSelectElement)) throw new Error(`select not found: ${label}`);
	return element;
}

function labeledTextarea(container: HTMLElement, label: string): HTMLTextAreaElement {
	const element = labeledElement(container, label);
	if (!(element instanceof HTMLTextAreaElement)) throw new Error(`textarea not found: ${label}`);
	return element;
}

function labeledElement(container: HTMLElement, label: string): HTMLElement | null {
	const matching = [...container.querySelectorAll<HTMLLabelElement>('label')].find((candidate) =>
		candidate.textContent?.trim().startsWith(label),
	);
	return matching?.htmlFor ? document.getElementById(matching.htmlFor) : null;
}

async function selectValue(select: HTMLSelectElement, value: string) {
	const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')?.set;
	if (!setter) throw new Error('select value setter unavailable');
	await act(async () => {
		setter.call(select, value);
		select.dispatchEvent(new Event('change', { bubbles: true }));
	});
}

async function changeTextarea(textarea: HTMLTextAreaElement, value: string) {
	const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set;
	if (!setter) throw new Error('textarea value setter unavailable');
	await act(async () => {
		setter.call(textarea, value);
		textarea.dispatchEvent(new Event('input', { bubbles: true }));
	});
}

async function clickButton(container: HTMLElement, label: string) {
	const button = [...container.querySelectorAll<HTMLButtonElement>('button')].find(
		(candidate) => candidate.textContent?.trim() === label,
	);
	if (!button) throw new Error(`button not found: ${label}`);
	await act(async () => button.click());
}

/** @vitest-environment jsdom */

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vite-plus/test';
import { AgentChatPlayground } from './agent-chat-playground';

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

describe('AgentChatPlayground', () => {
	it('auto-applies a valid restored connection and renders the host accessory', async () => {
		await act(async () => {
			root.render(
				<AgentChatPlayground
					connectionAccessory={<span>本地连接设置</span>}
					defaultConnection={{ baseUrl: 'https://example.com/v1', model: 'example-model' }}
				/>,
			);
		});
		expect(
			container.querySelector('[data-slot="openai-compatible-connection-editor"]')?.getAttribute('data-applied'),
		).toBe('true');
		expect(container.querySelector('[data-slot="agent-chat-playground-connection-accessory"]')?.textContent).toContain(
			'本地连接设置',
		);
		expect(container.querySelector<HTMLTextAreaElement>('textarea[aria-label="输入消息…"]')?.disabled).toBe(false);
		expect(container.textContent).toContain('配置已应用');
	});

	it('keeps an invalid restored draft editable without applying it', async () => {
		await act(async () => {
			root.render(<AgentChatPlayground defaultConnection={{ baseUrl: 'not-a-url', model: '' }} />);
		});
		expect(container.querySelector<HTMLInputElement>('input[type="url"]')?.value).toBe('not-a-url');
		expect(
			container.querySelector('[data-slot="openai-compatible-connection-editor"]')?.getAttribute('data-applied'),
		).toBe('false');
		expect(container.querySelector<HTMLTextAreaElement>('textarea[aria-label="输入消息…"]')?.disabled).toBe(true);
	});
});

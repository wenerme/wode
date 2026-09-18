/** @vitest-environment jsdom */

import { act, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import {
	AgentComposer,
	defaultAgentComposerMessages,
	resolveAgentComposerLimits,
	validateAgentComposerFiles,
} from './index';

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
	container.remove();
});

describe('AgentComposer', () => {
	it('renders SSR-safe controlled fields, separate image/audio/file inputs, disabled and error states', () => {
		const markup = renderToStaticMarkup(
			<AgentComposer
				disabled
				error='发送失败'
				files={[]}
				status='error'
				value='草稿'
				onFilesChange={() => undefined}
				onSubmit={() => undefined}
				onValueChange={() => undefined}
			/>,
		);
		expect(markup).toContain('data-slot="agent-composer"');
		expect(markup).toContain('data-status="error"');
		expect(markup).toContain('accept="image/*"');
		expect(markup).toContain('accept="audio/*"');
		expect(markup).toContain('aria-label="选择音频文件"');
		expect(markup).toContain('发送失败');
		expect(markup).toContain('disabled=""');
	});

	it('is IME-safe, sends on Enter, preserves Shift+Enter, and passes host-owned File[]', () => {
		const submit = vi.fn();
		function Harness() {
			const [value, setValue] = useState('你好');
			const [files, setFiles] = useState<File[]>([sizedFile('note.txt', 4)]);
			return (
				<AgentComposer
					files={files}
					value={value}
					onFilesChange={setFiles}
					onSubmit={submit}
					onValueChange={setValue}
				/>
			);
		}
		act(() => root.render(<Harness />));
		const textarea = container.querySelector('textarea');
		expect(textarea).not.toBeNull();
		act(() => textarea?.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true })));
		act(() => textarea?.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Enter' })));
		expect(submit).not.toHaveBeenCalled();
		act(() => textarea?.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true })));
		act(() =>
			textarea?.dispatchEvent(
				new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Enter', shiftKey: true }),
			),
		);
		expect(submit).not.toHaveBeenCalled();
		act(() => textarea?.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Enter' })));
		expect(submit).toHaveBeenCalledOnce();
		expect(submit).toHaveBeenCalledWith({ text: '你好', files: [expect.objectContaining({ name: 'note.txt' })] });
	});

	it('rejects over-count, per-item, and aggregate sizes before accepting valid files', () => {
		const limits = resolveAgentComposerLimits({ maxFiles: 5, maxFileSize: 10, maxTotalSize: 20 });
		const current = [sizedFile('existing-a', 6), sizedFile('existing-b', 5), sizedFile('existing-c', 5)];
		const result = validateAgentComposerFiles(
			current,
			[
				sizedFile('valid', 3),
				sizedFile('too-large', 11),
				sizedFile('over-total', 2),
				sizedFile('fills-last-slot', 1),
				sizedFile('over-count', 1),
			],
			limits,
			defaultAgentComposerMessages,
		);
		expect(result.accepted.map((file) => file.name)).toEqual(['valid', 'fills-last-slot']);
		expect(result.errors.map((error) => error.code).sort()).toEqual(['file-count', 'file-size', 'total-size']);
		expect(result.errors.find((error) => error.code === 'file-count')?.files).toHaveLength(1);
	});

	it('validates restored files before preview and submit, including limits that shrink', () => {
		const createObjectURL = vi.fn((file: File) => `blob:${file.name}`);
		const revokeObjectURL = vi.fn();
		const submit = vi.fn();
		const filesChange = vi.fn();
		const originalCreate = URL.createObjectURL;
		const originalRevoke = URL.revokeObjectURL;
		Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: createObjectURL });
		Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: revokeObjectURL });
		const valid = sizedFile('valid.png', 4, 'image/png');
		const oversized = sizedFile('oversized.png', 40, 'image/png');
		const invalidSize = sizedFile('invalid-size.png', Number.NaN, 'image/png');
		try {
			act(() =>
				root.render(
					<AgentComposer
						files={[valid, oversized, invalidSize]}
						maxFileSize={10}
						value='发送有效附件'
						onFilesChange={filesChange}
						onSubmit={submit}
						onValueChange={() => undefined}
					/>,
				),
			);
			expect(container.textContent).toContain('oversized.png 超过单个文件 10 B 的限制');
			expect(container.textContent).toContain('invalid-size.png 超过单个文件 10 B 的限制');
			expect(container.textContent).toContain('valid.png');
			expect(container.textContent).not.toContain('oversized.png40 B');
			expect(createObjectURL).toHaveBeenCalledOnce();
			expect(createObjectURL).toHaveBeenCalledWith(valid);
			expect(filesChange).not.toHaveBeenCalled();
			act(() => container.querySelector<HTMLButtonElement>('button[aria-label="发送"]')?.click());
			expect(submit).toHaveBeenCalledWith({ text: '发送有效附件', files: [valid] });

			act(() =>
				root.render(
					<AgentComposer
						files={[valid, oversized, invalidSize]}
						maxFileSize={2}
						value=''
						onFilesChange={filesChange}
						onSubmit={submit}
						onValueChange={() => undefined}
					/>,
				),
			);
			expect(container.textContent).toContain('valid.png 超过单个文件 2 B 的限制');
			expect(container.querySelector('[data-slot="agent-composer-attachment"]')).toBeNull();
			expect(createObjectURL).toHaveBeenCalledOnce();
			expect(revokeObjectURL).toHaveBeenCalledWith('blob:valid.png');
			expect(container.querySelector<HTMLButtonElement>('button[aria-label="发送"]')?.disabled).toBe(true);
		} finally {
			Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: originalCreate });
			Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: originalRevoke });
		}
	});

	it('revokes image preview object URLs when a controlled attachment is removed', () => {
		const createObjectURL = vi.fn(() => 'blob:preview');
		const revokeObjectURL = vi.fn();
		const originalCreate = URL.createObjectURL;
		const originalRevoke = URL.revokeObjectURL;
		Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: createObjectURL });
		Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: revokeObjectURL });
		try {
			function Harness() {
				const [files, setFiles] = useState<File[]>([sizedFile('preview.png', 4, 'image/png')]);
				return (
					<AgentComposer
						files={files}
						value=''
						onFilesChange={setFiles}
						onSubmit={() => undefined}
						onValueChange={() => undefined}
					/>
				);
			}
			act(() => root.render(<Harness />));
			expect(createObjectURL).toHaveBeenCalledOnce();
			const remove = container.querySelector<HTMLButtonElement>('button[aria-label="移除附件：preview.png"]');
			act(() => remove?.click());
			expect(revokeObjectURL).toHaveBeenCalledWith('blob:preview');
		} finally {
			Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: originalCreate });
			Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: originalRevoke });
		}
	});

	it('renders repeated references as distinct controlled attachments', () => {
		const file = sizedFile('duplicate.txt', 4);
		act(() =>
			root.render(
				<AgentComposer
					files={[file, file]}
					value=''
					onFilesChange={() => undefined}
					onSubmit={() => undefined}
					onValueChange={() => undefined}
				/>,
			),
		);
		expect(container.querySelectorAll('[data-slot="agent-composer-attachment"]')).toHaveLength(2);
	});
});

function sizedFile(name: string, size: number, type = 'text/plain'): File {
	const file = new File(['x'], name, { type, lastModified: 1 });
	Object.defineProperty(file, 'size', { configurable: true, value: size });
	return file;
}

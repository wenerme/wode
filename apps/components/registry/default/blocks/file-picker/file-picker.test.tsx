import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vite-plus/test';
import type { FileManagerFileSystem } from '../file-manager';
import { DirectoryPicker, FilePicker, SaveFilePicker } from './file-picker';

const fileSystem = {
	copy: vi.fn(),
	exists: vi.fn(),
	mkdir: vi.fn(),
	readFile: vi.fn(),
	readdir: vi.fn(),
	rename: vi.fn(),
	rm: vi.fn(),
	stat: vi.fn(),
	writeFile: vi.fn(),
} as unknown as FileManagerFileSystem;

describe('file picker rendering', () => {
	it('renders standard open, directory, and save actions', () => {
		const open = renderToStaticMarkup(<FilePicker fileSystem={fileSystem} onConfirm={vi.fn()} />);
		const directory = renderToStaticMarkup(<DirectoryPicker fileSystem={fileSystem} onConfirm={vi.fn()} />);
		const save = renderToStaticMarkup(
			<SaveFilePicker fileSystem={fileSystem} suggestedName='report.txt' onConfirm={vi.fn()} />,
		);
		expect(open).toContain('>打开<');
		expect(open).not.toContain('aria-label="新建文件"');
		expect(open).not.toContain('aria-label="上传文件"');
		expect(open).not.toContain('aria-label="删除"');
		expect(directory).toContain('>选择文件夹<');
		expect(save).toContain('aria-label="文件名"');
		expect(save).toContain('value="report.txt"');
		expect(save).toContain('>保存<');
	});

	it('uses single selection chrome unless multiple open is requested', () => {
		const single = renderToStaticMarkup(<FilePicker fileSystem={fileSystem} onConfirm={vi.fn()} />);
		const multiple = renderToStaticMarkup(<FilePicker fileSystem={fileSystem} multiple onConfirm={vi.fn()} />);
		expect(single).not.toContain('aria-label="选择当前列表全部项目"');
		expect(multiple).not.toContain('aria-label="选择当前列表全部项目"');
	});
});

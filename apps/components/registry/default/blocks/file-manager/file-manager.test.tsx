import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vite-plus/test';
import { FileManager } from './file-manager';
import type { FileManagerFileSystem } from './file-manager-types';

const fs = {} as FileManagerFileSystem;

describe('FileManager rendering', () => {
	it('renders an SSR-safe, accessible file workspace', () => {
		const markup = renderToStaticMarkup(<FileManager fileSystem={fs} title='Project files' />);
		expect(markup).toContain('data-file-manager=""');
		expect(markup).toContain('Project files');
		expect(markup).toContain('aria-label="当前位置"');
		expect(markup).toContain('aria-label="文件位置"');
		expect(markup).toContain('aria-label="文件预览"');
		expect(markup).toContain('aria-label="新建目录"');
		expect(markup).not.toContain('<main');
	});

	it('removes mutation controls in read-only mode while preserving preview and download', () => {
		const markup = renderToStaticMarkup(<FileManager fileSystem={fs} readOnly />);
		expect(markup).not.toContain('aria-label="新建目录"');
		expect(markup).not.toContain('aria-label="上传文件"');
		expect(markup).not.toContain('aria-label="删除"');
		expect(markup).toContain('aria-label="下载"');
		expect(markup).toContain('aria-label="文件预览"');
	});

	it('supports a preview-disabled capability surface', () => {
		const markup = renderToStaticMarkup(<FileManager fileSystem={fs} capabilities={{ preview: false }} />);
		expect(markup).not.toContain('aria-label="文件预览"');
		expect(markup).not.toContain('aria-label="关闭预览"');
	});
});

import { createFileManager, useFileManagerRegistry } from '@components/file-viewer/file-manager-registry';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
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

	it('provides the explicit registry to the complete FileManager subtree', () => {
		const manager = createFileManager();
		manager.fileTypes.register({
			id: 'workflow',
			label: '工作流文件',
			match: { extensions: ['flow'] },
			priority: 1000,
		});
		function RegistryProbe() {
			return (
				<span data-registry-probe=''>{useFileManagerRegistry().fileTypes.resolve({ name: 'deploy.flow' })?.id}</span>
			);
		}
		const markup = renderToStaticMarkup(<FileManager fileSystem={fs} manager={manager} title={<RegistryProbe />} />);
		expect(markup).toContain('data-registry-probe=""');
		expect(markup).toContain('>workflow</span>');
	});

	it('supports a preview-disabled capability surface', () => {
		const markup = renderToStaticMarkup(<FileManager fileSystem={fs} capabilities={{ preview: false }} />);
		expect(markup).not.toContain('aria-label="文件预览"');
		expect(markup).not.toContain('aria-label="关闭预览"');
	});

	it('renders compact embedded chrome without a manager-owned title or command toolbar', () => {
		const markup = renderToStaticMarkup(
			<FileManager fileSystem={fs} surfaceVariant='embedded' title='Project files' />,
		);
		expect(markup).toContain('data-file-manager-surface="embedded"');
		expect(markup).not.toContain('>Project files</h2>');
		expect(markup).not.toContain('aria-label="新建目录"');
		expect(markup).toContain('aria-label="搜索当前目录"');
		expect(markup).toContain('aria-label="列表视图"');
	});

	it('keeps embedded controls constrained by the resolved capability surface', () => {
		const markup = renderToStaticMarkup(
			<FileManager fileSystem={fs} capabilities={{ preview: false }} readOnly surfaceVariant='embedded' />,
		);
		expect(markup).not.toContain('>新建目录</span>');
		expect(markup).not.toContain('>新建文件</span>');
		expect(markup).not.toContain('>上传文件</span>');
		expect(markup).not.toContain('aria-label="关闭预览"');
	});
});

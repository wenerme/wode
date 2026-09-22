import type { IFileSystem } from '@wener/common/fs';
import { Tree } from 'react-arborist';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { FileManagerFileSystem } from '../file-manager/file-manager-types';
import { FileTree } from './file-tree';
import { defaultFileTreeMessages } from './file-tree-model';
import { FileTreeNode, FileTreeRow } from './file-tree-row';
import type { FileTreeFileSystem, FileTreeRenderNode } from './file-tree-types';

const fileSystem: FileTreeFileSystem = { readdir: async () => [] };

describe('FileTree', () => {
	it('accepts the structural FileManager and common filesystem contracts', () => {
		const manager = {} as FileManagerFileSystem;
		const common = {} as IFileSystem;
		const fromManager: FileTreeFileSystem = manager;
		const fromCommon: FileTreeFileSystem = common;
		expect(fromManager).toBe(manager);
		expect(fromCommon).toBe(common);
	});

	it('renders react-arborist tree ARIA without starting filesystem I/O during SSR', () => {
		const readdir = vi.fn(async () => []);
		const markup = renderToStaticMarkup(
			<FileTree fileSystem={{ readdir }} aria-label='Workspace files' rootPath='/workspace' />,
		);
		expect(markup).toContain('data-slot="file-tree"');
		expect(markup).toContain('role="tree"');
		expect(markup).toContain('aria-label="Workspace files"');
		expect(markup).toContain('正在加载文件树');
		expect(readdir).not.toHaveBeenCalled();
	});

	it('renders virtual treeitem semantics and a separate expand control for loaded rows', () => {
		const folder = fileStat('/folder', 'directory');
		const report = fileStat('/report.txt', 'file');
		const rows: FileTreeRenderNode[] = [
			{
				children: [],
				depth: 1,
				entry: folder,
				id: '/folder',
				isCurrent: true,
				kind: 'directory',
				name: 'folder',
				path: '/folder',
				status: 'ready',
			},
			{
				depth: 1,
				entry: report,
				id: '/report.txt',
				isCurrent: false,
				kind: 'file',
				name: 'report.txt',
				path: '/report.txt',
				status: 'ready',
			},
		];
		const markup = renderToStaticMarkup(
			<Tree<FileTreeRenderNode>
				aria-label='Files'
				data={rows}
				disableDrag
				height={120}
				openByDefault={false}
				renderRow={FileTreeRow}
				rowHeight={30}
				width={320}
			>
				{(props) => <FileTreeNode {...props} messages={defaultFileTreeMessages} onRetry={() => undefined} />}
			</Tree>,
		);
		expect(markup).toContain('role="treeitem"');
		expect(markup).toContain('aria-level="1"');
		expect(markup).toContain('aria-current="location"');
		expect(markup).toContain('aria-label="展开目录"');
		expect(markup).toContain('data-kind="file"');
		expect(markup).toContain('tabindex="-1"');
	});

	it('supports Simplified Chinese message overrides and bounded stable sizing', () => {
		const markup = renderToStaticMarkup(
			<FileTree fileSystem={fileSystem} height={240} messages={{ loading: '读取目录中', treeLabel: '项目文件' }} />,
		);
		expect(markup).toContain('height:240px');
		expect(markup).toContain('aria-label="项目文件"');
		expect(markup).toContain('读取目录中');
	});

	it('exposes native entry drag and drop presentation without owning filesystem mutations', () => {
		const folder = fileStat('/folder', 'directory');
		const rows: FileTreeRenderNode[] = [
			{
				children: [],
				depth: 1,
				entry: folder,
				id: folder.path,
				isCurrent: false,
				kind: 'directory',
				name: folder.name,
				path: folder.path,
				status: 'ready',
			},
		];
		const markup = renderToStaticMarkup(
			<Tree<FileTreeRenderNode> aria-label='Files' data={rows} disableDrag height={60} rowHeight={30} width={320}>
				{(props) => (
					<FileTreeNode
						{...props}
						dropTarget={{ path: '/folder', state: 'accepted' }}
						isEntryDraggable
						messages={defaultFileTreeMessages}
						onRetry={() => undefined}
					/>
				)}
			</Tree>,
		);
		expect(markup).toContain('draggable="true"');
		expect(markup).toContain('data-drop-target="true"');
		expect(markup).toContain('data-drop-state="accepted"');

		const rejectedMarkup = renderToStaticMarkup(
			<Tree<FileTreeRenderNode> aria-label='Files' data={rows} disableDrag height={60} rowHeight={30} width={320}>
				{(props) => (
					<FileTreeNode
						{...props}
						dropTarget={{ path: '/folder', reason: '当前目录不可写', state: 'rejected' }}
						messages={defaultFileTreeMessages}
						onRetry={() => undefined}
					/>
				)}
			</Tree>,
		);
		expect(rejectedMarkup).toContain('data-drop-state="rejected"');
		expect(rejectedMarkup).toContain('aria-disabled="true"');
		expect(rejectedMarkup).toContain('title="当前目录不可写"');
	});
});

function fileStat(path: string, kind: 'directory' | 'file') {
	return {
		directory: '/',
		kind,
		meta: {},
		mtime: 1,
		name: path.slice(1),
		path,
		size: kind === 'file' ? 1 : 0,
	};
}

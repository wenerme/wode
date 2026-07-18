'use client';

import { createMemoryFileSystem, type IFileSystem } from '@wener/common/fs';
import { FileText, FolderOpen, LayoutDashboard, LoaderCircle } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { ConsolePage } from '../../registry/default/blocks/console-shell';
import { FileManager, renderFileManagerWindow, showFileManager } from '../../registry/default/blocks/file-manager';
import { type ManagedWindow, useWindowManagerActions } from '../../registry/default/blocks/window-manager';

const DOCUMENT_WINDOW_KIND = 'console-demo-document';

const documents = {
	welcome: {
		title: '平台使用指南',
		category: '入门',
		updatedAt: '刚刚',
		body: [
			'这是完整 Console Demo 的工作区。左侧导航负责页面切换，窗口工作区用于并行处理文档与文件。',
			'所有数据均来自浏览器内存中的 mock adapter，刷新页面后会重置。',
		],
	},
	release: {
		title: '发布检查清单',
		category: '运维',
		updatedAt: '12 分钟前',
		body: [
			'确认变更范围与回滚路径。',
			'执行类型检查、自动化测试和目标环境 smoke。',
			'记录当前版本证据并通知相关成员。',
		],
	},
	architecture: {
		title: '工作区架构说明',
		category: '设计',
		updatedAt: '昨天',
		body: [
			'Console Shell、WindowManager 与 FileManager 保持独立状态边界。',
			'业务应用通过 actions 和 renderer 组合功能，不依赖全局 singleton。',
		],
	},
} as const;

type DocumentId = keyof typeof documents;

export function useConsoleDemoFileSystem(enabled = true): IFileSystem | undefined {
	const [fileSystem] = useState(() => createMemoryFileSystem());
	const [ready, setReady] = useState(false);
	useEffect(() => {
		if (!enabled) return;
		let active = true;
		void (async () => {
			await fileSystem.mkdir('/Documents', { recursive: true });
			await fileSystem.mkdir('/Projects/console-demo', { recursive: true });
			await Promise.all([
				fileSystem.writeFile('/README.md', '# Console Demo\n\n登录后可访问资源、文档、文件和窗口工作区。'),
				fileSystem.writeFile('/Documents/发布检查清单.md', documents.release.body.join('\n\n')),
				fileSystem.writeFile(
					'/Projects/console-demo/workspace.json',
					JSON.stringify({ name: 'console-demo', modules: ['document', 'file', 'window'] }, null, 2),
				),
			]);
			if (active) setReady(true);
		})();
		return () => {
			active = false;
		};
	}, [enabled, fileSystem]);
	return enabled && ready ? fileSystem : undefined;
}

export function ConsoleDocumentsContent() {
	const [selected, setSelected] = useState<DocumentId>('welcome');
	const document = documents[selected];
	return (
		<ConsolePage title='文档中心' description='浏览团队指南、设计说明与运行手册。'>
			<div className='border-base-300 grid min-h-[34rem] overflow-hidden border md:grid-cols-[15rem_minmax(0,1fr)]'>
				<nav aria-label='文档目录' className='border-base-300 bg-base-200/50 border-b p-2 md:border-r md:border-b-0'>
					{Object.entries(documents).map(([id, item]) => (
						<button
							key={id}
							type='button'
							className={`mb-1 flex w-full items-start gap-2 rounded-md px-2.5 py-2 text-left text-sm ${selected === id ? 'bg-base-300 font-medium' : 'hover:bg-base-200'}`}
							onClick={() => setSelected(id as DocumentId)}
						>
							<FileText aria-hidden='true' className='mt-0.5 size-4 shrink-0' />
							<span className='min-w-0 flex-1'>
								<span className='block truncate'>{item.title}</span>
								<span className='text-base-content/55 mt-0.5 block text-xs'>{item.category}</span>
							</span>
						</button>
					))}
				</nav>
				<DocumentArticle documentId={selected} document={document} />
			</div>
		</ConsolePage>
	);
}

export function ConsoleFilesContent({ fileSystem }: { fileSystem?: IFileSystem }) {
	return (
		<ConsolePage title='文件' description='管理当前工作区中的文档、项目配置与上传内容。'>
			{fileSystem ? (
				<FileManager className='h-[38rem] min-h-[32rem]' fileSystem={fileSystem} title='工作区文件' />
			) : (
				<ConsoleDemoLoading />
			)}
		</ConsolePage>
	);
}

export function ConsoleWindowWorkspace({ fileSystem }: { fileSystem?: IFileSystem }) {
	const actions = useWindowManagerActions();
	const opened = useRef(false);
	useEffect(() => {
		if (!fileSystem || opened.current) return;
		opened.current = true;
		openDocumentWindow(actions, 'welcome');
		showFileManager({
			windowManager: actions,
			fileManager: { fileSystem, title: '工作区文件' },
			window: { key: 'console-demo-files', bounds: { x: 420, y: 150, width: 900, height: 610 } },
		});
	}, [actions, fileSystem]);

	return (
		<div className='bg-base-200 absolute inset-0 overflow-auto p-4 pb-20 sm:p-6 sm:pb-20'>
			<div className='border-base-300 bg-base-100 flex flex-wrap items-center gap-3 border-b px-3 py-3'>
				<div className='bg-neutral text-neutral-content grid size-9 place-items-center rounded-md'>
					<LayoutDashboard aria-hidden='true' className='size-5' />
				</div>
				<div className='min-w-0 flex-1'>
					<h1 className='text-sm font-semibold'>窗口工作区</h1>
					<p className='text-base-content/60 text-xs'>并行查看文档和文件，窗口状态由当前 Console 作用域管理。</p>
				</div>
				<button type='button' className='btn btn-sm' onClick={() => openDocumentWindow(actions, 'release')}>
					<FileText aria-hidden='true' className='size-4' />
					打开文档
				</button>
				<button
					type='button'
					className='btn btn-neutral btn-sm'
					disabled={!fileSystem}
					onClick={() => {
						if (!fileSystem) return;
						showFileManager({
							windowManager: actions,
							fileManager: { fileSystem, title: '工作区文件' },
							window: { key: 'console-demo-files' },
						});
					}}
				>
					<FolderOpen aria-hidden='true' className='size-4' />
					打开文件
				</button>
			</div>
		</div>
	);
}

export function renderConsoleDemoWindow(window: ManagedWindow) {
	const fileManager = renderFileManagerWindow(window);
	if (fileManager) return fileManager;
	if (window.kind !== DOCUMENT_WINDOW_KIND || !isDocumentWindowData(window.data)) return null;
	const document = documents[window.data.documentId];
	return <DocumentArticle documentId={window.data.documentId} document={document} />;
}

export function renderConsoleDemoWindowIcon(window: ManagedWindow) {
	if (window.kind === DOCUMENT_WINDOW_KIND) return <FileText aria-hidden='true' className='size-4' />;
	if (window.kind === 'file-manager') return <FolderOpen aria-hidden='true' className='size-4' />;
	return null;
}

function openDocumentWindow(actions: ReturnType<typeof useWindowManagerActions>, documentId: DocumentId) {
	const document = documents[documentId];
	return actions.open({
		kind: DOCUMENT_WINDOW_KIND,
		key: `console-demo-document-${documentId}`,
		title: document.title,
		icon: 'document',
		duplicate: 'focus-existing',
		persistence: 'none',
		showInDock: true,
		bounds: { x: 72, y: 72, width: 680, height: 500 },
		size: { minWidth: 360, minHeight: 300 },
		data: { type: DOCUMENT_WINDOW_KIND, documentId },
	});
}

function DocumentArticle({
	documentId,
	document,
}: {
	documentId: DocumentId;
	document: (typeof documents)[DocumentId];
}) {
	const headingId = useId();
	return (
		<article
			aria-labelledby={headingId}
			data-document-id={documentId}
			className='bg-base-100 min-w-0 overflow-auto p-5 sm:p-8'
		>
			<div className='text-base-content/55 text-xs'>
				{document.category} · 更新于 {document.updatedAt}
			</div>
			<h2 id={headingId} className='mt-2 text-xl font-semibold'>
				{document.title}
			</h2>
			<div className='prose prose-sm mt-6 max-w-3xl'>
				{document.body.map((paragraph) => (
					<p key={paragraph}>{paragraph}</p>
				))}
			</div>
		</article>
	);
}

function ConsoleDemoLoading() {
	return (
		<div className='border-base-300 text-base-content/65 flex min-h-64 items-center justify-center gap-2 border text-sm'>
			<LoaderCircle aria-hidden='true' className='size-4 animate-spin' />
			正在准备工作区
		</div>
	);
}

function isDocumentWindowData(value: unknown): value is { type: typeof DOCUMENT_WINDOW_KIND; documentId: DocumentId } {
	if (typeof value !== 'object' || value === null) return false;
	const data = value as { type?: unknown; documentId?: unknown };
	return (
		data.type === DOCUMENT_WINDOW_KIND &&
		typeof data.documentId === 'string' &&
		Object.hasOwn(documents, data.documentId)
	);
}

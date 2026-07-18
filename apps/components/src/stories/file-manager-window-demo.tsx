'use client';

import { createMemoryFileSystem, type IFileSystem } from '@wener/common/fs';
import { FolderOpen } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
	renderFileManagerWindow,
	showFileManager,
} from '../../registry/default/blocks/file-manager/file-manager-window';
import {
	createWindowManagerStore,
	useWindowManagerActions,
	WindowManagerHost,
	WindowManagerProvider,
} from '../../registry/default/blocks/window-manager';
import { LeftCenterRightLayout } from '../../registry/default/ui/left-center-right-layout';

export function FileManagerWindowDemo() {
	const [fileSystem, setFileSystem] = useState<IFileSystem>();
	const [store] = useState(() => createWindowManagerStore({ workspace: { width: 1180, height: 760 } }));
	useEffect(() => {
		let active = true;
		const next = createMemoryFileSystem();
		void Promise.all([
			next.mkdir('/Documents', { recursive: true }),
			next.writeFile('/README.md', '# 窗口文件管理器\n\n同一个作用域文件管理器运行在窗口框架内。'),
			next.writeFile('/notes.txt', '窗口最小化后仍保留文件管理器状态。'),
		]).then(() => {
			if (active) setFileSystem(next);
		});
		return () => {
			active = false;
		};
	}, []);

	return (
		<WindowManagerProvider store={store}>
			<WindowManagerHost
				className='h-screen min-h-[36rem]'
				background={<FileManagerWindowBackground fileSystem={fileSystem} />}
				renderContent={(window) => renderFileManagerWindow(window)}
				renderIcon={(window) =>
					window.kind === 'file-manager' ? <FolderOpen aria-hidden='true' className='size-4' /> : null
				}
				renderStatusBar={(window) =>
					window.kind === 'file-manager' ? (
						<LeftCenterRightLayout
							className='w-full'
							right={
								<span title='文件系统已连接'>
									<span aria-hidden='true' className='bg-success block size-1.5 rounded-full' />
									<span className='sr-only'>文件系统已连接</span>
								</span>
							}
						/>
					) : null
				}
			/>
		</WindowManagerProvider>
	);
}

function FileManagerWindowBackground({ fileSystem }: { fileSystem?: IFileSystem }) {
	const actions = useWindowManagerActions();
	return (
		<div className='bg-base-200 absolute inset-0 p-4'>
			<div className='border-base-300 bg-base-100 flex min-h-12 items-center gap-3 border-b px-3'>
				<div className='bg-neutral text-neutral-content grid size-8 place-items-center rounded-md'>
					<FolderOpen aria-hidden='true' className='size-4' />
				</div>
				<div className='min-w-0 flex-1'>
					<div className='text-sm font-semibold'>文件工作台</div>
					<div className='text-base-content/55 text-xs'>通过作用域内的窗口管理器操作打开文件管理器。</div>
				</div>
				<button
					type='button'
					className='btn btn-neutral btn-sm'
					disabled={!fileSystem}
					onClick={() => {
						if (!fileSystem) return;
						showFileManager({
							windowManager: actions,
							fileManager: { fileSystem, title: '工作区文件' },
							window: { key: 'workspace-files' },
						});
					}}
				>
					<FolderOpen aria-hidden='true' className='size-4' />
					打开文件管理器
				</button>
			</div>
		</div>
	);
}

'use client';

import { createMemoryFileSystem, type IFileSystem } from '@wener/common/fs';
import { useEffect, useRef, useState } from 'react';
import { createFileManagerStore, FileManager } from '@/file/file-manager';
import {
	createDelayedWriteFileSystem,
	createFailingSaveFileSystem,
	createFailOnceUploadFileSystem,
	createSeededMemoryFileSystem,
} from './file-manager-story-filesystem';

export function BackendSwitchDemo() {
	const [backend, setBackend] = useState<{ fileSystem: IFileSystem; label: string }>();
	const [cancelled, setCancelled] = useState(false);
	useEffect(() => {
		let active = true;
		void createSeededMemoryFileSystem().then((fileSystem) => {
			if (active) setBackend({ fileSystem: createDelayedWriteFileSystem(fileSystem, 350), label: 'Backend A' });
		});
		return () => {
			active = false;
		};
	}, []);
	return (
		<main className='p-2 md:p-4'>
			<div className='border-base-300 bg-base-100 mb-2 flex items-center border px-2 py-2'>
				<span className='text-base-content/60 text-xs'>异步 adapter 切换验证</span>
				<span className='flex-1' />
				<button
					type='button'
					className='btn btn-neutral btn-xs'
					onClick={() =>
						void createSeededMemoryFileSystem().then((fileSystem) => setBackend({ fileSystem, label: 'Backend B' }))
					}
				>
					切换文件系统
				</button>
			</div>
			{backend ? (
				<>
					{cancelled ? (
						<div role='status' className='sr-only'>
							旧后端操作已取消
						</div>
					) : null}
					<FileManager
						fileSystem={backend.fileSystem}
						title={backend.label}
						className='h-[min(46rem,calc(100vh-6rem))] min-h-[32rem]'
						onEvent={(event) => {
							if (event.type === 'operation-cancelled') setCancelled(true);
						}}
					/>
				</>
			) : (
				<div role='status'>正在初始化…</div>
			)}
		</main>
	);
}

export function BackendSwitchOpenDemo() {
	const [backend, setBackend] = useState<{ fileSystem: IFileSystem; label: string }>();
	const [pending, setPending] = useState(false);
	const [settled, setSettled] = useState(false);
	const [boundToOldBackend, setBoundToOldBackend] = useState(false);
	const [unexpectedTerminal, setUnexpectedTerminal] = useState(false);
	const oldBackend = useRef<IFileSystem | undefined>(undefined);
	const releaseOpen = useRef<() => void>(() => undefined);
	useEffect(() => {
		let active = true;
		void createSeededMemoryFileSystem().then((fileSystem) => {
			if (!active) return;
			oldBackend.current = fileSystem;
			setBackend({ fileSystem, label: 'Open Backend A' });
		});
		return () => {
			active = false;
			releaseOpen.current();
		};
	}, []);
	return (
		<main className='p-2 md:p-4'>
			<div className='border-base-300 bg-base-100 mb-2 flex flex-wrap items-center gap-2 border p-2'>
				<button
					type='button'
					className='btn btn-neutral btn-xs'
					onClick={() =>
						void createSeededMemoryFileSystem().then((fileSystem) =>
							setBackend({ fileSystem, label: 'Open Backend B' }),
						)
					}
				>
					切换打开后端
				</button>
				<button type='button' className='btn btn-xs' disabled={!pending} onClick={() => releaseOpen.current()}>
					完成旧打开
				</button>
				{pending ? <span>旧打开正在等待</span> : null}
				{settled ? <span>旧打开已结束</span> : null}
				{boundToOldBackend ? <span>回调绑定旧后端</span> : null}
				{unexpectedTerminal ? <span>unexpected stale open terminal</span> : null}
			</div>
			{backend ? (
				<FileManager
					fileSystem={backend.fileSystem}
					title={backend.label}
					className='h-[min(46rem,calc(100vh-6rem))] min-h-[32rem]'
					onEvent={(event) => {
						if (event.type === 'opened' || event.type === 'open-failed') setUnexpectedTerminal(true);
					}}
					onOpenFile={async (_entry, fileSystem) => {
						setBoundToOldBackend(fileSystem === oldBackend.current);
						setPending(true);
						await new Promise<void>((resolve) => {
							releaseOpen.current = resolve;
						});
						setPending(false);
						setSettled(true);
					}}
				/>
			) : (
				<div role='status'>正在初始化…</div>
			)}
		</main>
	);
}

export function DragDropDemo() {
	const [fileSystem, setFileSystem] = useState<IFileSystem>();
	useEffect(() => {
		let active = true;
		const next = createMemoryFileSystem();
		void Promise.all([
			next.mkdir('/CopyTarget', { recursive: true }),
			next.mkdir('/Target', { recursive: true }),
			next.writeFile('/source.txt', 'drag source'),
		]).then(() => {
			if (active) setFileSystem(createFailOnceUploadFileSystem(next, '/retry.txt'));
		});
		return () => {
			active = false;
		};
	}, []);
	return (
		<main className='p-2 md:p-4'>
			<h1 className='sr-only'>文件拖放操作</h1>
			{fileSystem ? (
				<FileManager
					fileSystem={fileSystem}
					title='拖放工作区'
					className='h-[min(46rem,calc(100vh-4rem))] min-h-[32rem]'
				/>
			) : (
				<div role='status'>正在初始化…</div>
			)}
		</main>
	);
}

export function ExternalPanelStateDemo() {
	const [resources] = useState(() => {
		const fileSystem = createMemoryFileSystem();
		return { fileSystem, store: createFileManagerStore({ fileSystem }) };
	});
	return (
		<main className='p-2 md:p-4'>
			<div className='mb-2 flex flex-wrap gap-2'>
				<button
					type='button'
					className='btn btn-sm'
					onClick={() => resources.store.getState().actions.setSidebarOpen(false)}
				>
					Store 关闭位置
				</button>
				<button
					type='button'
					className='btn btn-sm'
					onClick={() => resources.store.getState().actions.setSidebarOpen(true)}
				>
					Store 打开位置
				</button>
				<button
					type='button'
					className='btn btn-sm'
					onClick={() => resources.store.getState().actions.setPreviewOpen(false)}
				>
					Store 关闭预览
				</button>
				<button
					type='button'
					className='btn btn-sm'
					onClick={() => resources.store.getState().actions.setPreviewOpen(true)}
				>
					Store 打开预览
				</button>
			</div>
			<FileManager
				fileSystem={resources.fileSystem}
				store={resources.store}
				title='外部 Panel 状态'
				className='h-[min(42rem,calc(100vh-7rem))] min-h-[28rem]'
			/>
		</main>
	);
}

export function DragDropCancellationDemo() {
	const [fileSystem, setFileSystem] = useState<IFileSystem>();
	useEffect(() => setFileSystem(createDelayedWriteFileSystem(createMemoryFileSystem(), 350)), []);
	return (
		<main className='p-2 md:p-4'>
			<h1 className='sr-only'>取消文件拖放上传</h1>
			{fileSystem ? (
				<FileManager
					fileSystem={fileSystem}
					title='可取消上传'
					className='h-[min(42rem,calc(100vh-4rem))] min-h-[32rem]'
				/>
			) : (
				<div role='status'>正在初始化…</div>
			)}
		</main>
	);
}

export function SaveFailureDemo() {
	const [fileSystem, setFileSystem] = useState<IFileSystem>();
	useEffect(() => {
		let active = true;
		void createSeededMemoryFileSystem().then((value) => {
			if (active) setFileSystem(createFailingSaveFileSystem(value));
		});
		return () => {
			active = false;
		};
	}, []);
	return (
		<main className='p-2 md:p-4'>
			{fileSystem ? (
				<FileManager
					fileSystem={fileSystem}
					initialPath='/Documents'
					title='Save failure boundary'
					className='h-[min(46rem,calc(100vh-4rem))] min-h-[32rem]'
				/>
			) : (
				<div role='status'>正在初始化…</div>
			)}
		</main>
	);
}

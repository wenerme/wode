'use client';

import {
	createMemoryFileSystem,
	createOpfsFileSystem,
	type IFileSystem,
	isDirectoryPickerFileSystemSupported,
	isOpfsFileSystemSupported,
	pickDirectoryFileSystem,
} from '@wener/common/fs';
import { Database, HardDrive, MemoryStick } from 'lucide-react';
import { type ReactNode, useEffect, useState } from 'react';
import { FileManager } from '@/file/file-manager';
import {
	createDelayedWriteFileSystem,
	createFailingSaveFileSystem,
	createSeededMemoryFileSystem,
	seedIfEmpty,
} from './file-manager-story-filesystem';

type DemoBackend = { fileSystem: IFileSystem; id: 'memory' | 'opfs' | 'directory'; label: string };

export function RuntimeLifecycleCancellationDemo() {
	const [fileSystem, setFileSystem] = useState<IFileSystem>();
	const [initialPath, setInitialPath] = useState('/');
	useEffect(() => {
		let active = true;
		const next = createMemoryFileSystem();
		void next.writeFile('/README.md', 'Runtime lifecycle cancellation.').then(() => {
			if (active) setFileSystem(createDelayedWriteFileSystem(next, 350));
		});
		return () => {
			active = false;
		};
	}, []);
	return (
		<main className='p-2 md:p-4'>
			<button type='button' className='btn btn-sm mb-2' onClick={() => setInitialPath('//')}>
				变更初始路径
			</button>
			{fileSystem ? (
				<FileManager
					fileSystem={fileSystem}
					initialPath={initialPath}
					title='Runtime lifecycle cancellation'
					className='h-[min(44rem,calc(100vh-6rem))] min-h-[32rem]'
				/>
			) : (
				<div role='status'>正在初始化…</div>
			)}
		</main>
	);
}

export function RawFileNameKeyboardDemo() {
	const [fileSystem, setFileSystem] = useState<IFileSystem>();
	useEffect(() => {
		let active = true;
		const next = createMemoryFileSystem();
		void Promise.all([
			next.writeFile('/report?.txt', 'question mark filename'),
			next.writeFile('/notes#final.txt', 'hash filename'),
		]).then(() => {
			if (active) setFileSystem(next);
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
					title='Raw filesystem names'
					className='h-[min(46rem,calc(100vh-4rem))] min-h-[32rem]'
					onKeyDown={(event) => {
						if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'a') event.preventDefault();
					}}
				/>
			) : (
				<div role='status'>正在初始化…</div>
			)}
		</main>
	);
}

export function ResponsiveContainerDemo() {
	const [fileSystem, setFileSystem] = useState<IFileSystem>();
	const [wide, setWide] = useState(false);
	useEffect(() => {
		let active = true;
		const next = createMemoryFileSystem();
		void Promise.all([
			next.mkdir('/Folder'),
			next.writeFile('/container.txt', 'Container-based panel orientation.'),
			next.writeFile('/Folder/nested.txt', 'Tree state survives container orientation changes.'),
		]).then(() => {
			if (active) setFileSystem(createFailingSaveFileSystem(next, '/container.txt'));
		});
		return () => {
			active = false;
		};
	}, []);
	return (
		<main className='bg-base-200 min-h-screen p-2 md:p-4'>
			<div className='mb-2 flex gap-2'>
				<button type='button' className='btn btn-sm' onClick={() => setWide(false)}>
					窄容器
				</button>
				<button type='button' className='btn btn-sm' onClick={() => setWide(true)}>
					宽容器
				</button>
			</div>
			<div className='max-w-full transition-[width]' style={{ width: wide ? '70rem' : '36rem' }}>
				{fileSystem ? (
					<FileManager
						fileSystem={fileSystem}
						title='Responsive container'
						className='h-[min(42rem,calc(100vh-6rem))] min-h-[32rem]'
					/>
				) : (
					<div role='status'>正在初始化…</div>
				)}
			</div>
		</main>
	);
}

export function OpenCallbackFailureDemo() {
	const [fileSystem, setFileSystem] = useState<IFileSystem>();
	const [failed, setFailed] = useState(false);
	const [opened, setOpened] = useState(false);
	useEffect(() => {
		void createSeededMemoryFileSystem().then(setFileSystem);
	}, []);
	return (
		<main className='p-2 md:p-4'>
			{failed ? (
				<div role='status' className='sr-only'>
					打开回调失败已处理
				</div>
			) : null}
			{opened ? <div data-unexpected-opened=''>unexpected opened event</div> : null}
			{fileSystem ? (
				<FileManager
					fileSystem={fileSystem}
					title='Open callback boundary'
					className='h-[min(46rem,calc(100vh-4rem))] min-h-[32rem]'
					onEvent={(event) => {
						if (event.type === 'open-failed') setFailed(true);
						if (event.type === 'opened') setOpened(true);
					}}
					onOpenFile={async () => {
						throw new Error('Injected open callback failure');
					}}
				/>
			) : (
				<div role='status'>正在初始化…</div>
			)}
		</main>
	);
}

export function FileManagerDemoExperience({
	backendControls = true,
	readOnly = false,
}: {
	backendControls?: boolean;
	readOnly?: boolean;
}) {
	const [backend, setBackend] = useState<DemoBackend>();
	const [error, setError] = useState<string>();
	const [connecting, setConnecting] = useState(false);
	const [downloaded, setDownloaded] = useState<string>();
	useEffect(() => {
		let active = true;
		void createSeededMemoryFileSystem().then((fileSystem) => {
			if (active) setBackend({ fileSystem, id: 'memory', label: '内存工作区' });
		});
		return () => {
			active = false;
		};
	}, []);
	const connect = async (type: 'directory' | 'memory' | 'opfs') => {
		setConnecting(true);
		setError(undefined);
		try {
			if (type === 'memory') {
				setBackend({ fileSystem: await createSeededMemoryFileSystem(), id: 'memory', label: '内存工作区' });
			} else if (type === 'opfs') {
				const fileSystem = await createOpfsFileSystem({ path: ['wode', 'file-manager-demo'] });
				await seedIfEmpty(fileSystem);
				setBackend({ fileSystem, id: 'opfs', label: '浏览器 OPFS' });
			} else {
				const { fileSystem, handle } = await pickDirectoryFileSystem({
					id: 'wode-file-manager-demo',
					mode: 'readwrite',
				});
				setBackend({ fileSystem, id: 'directory', label: handle.name || '本地目录' });
			}
		} catch (cause) {
			if ((cause as DOMException)?.name !== 'AbortError')
				setError(cause instanceof Error ? cause.message : String(cause));
		} finally {
			setConnecting(false);
		}
	};
	return (
		<main className='p-2 md:p-4'>
			<h1 className='sr-only'>File manager filesystem adapters</h1>
			{backendControls ? (
				<div className='border-base-300 bg-base-100 mb-2 flex flex-wrap items-center gap-1.5 border px-2 py-2'>
					<span className='text-base-content/70 mr-1 text-xs'>存储后端</span>
					<BackendButton
						active={backend?.id === 'memory'}
						disabled={connecting}
						icon={<MemoryStick className='size-3.5' />}
						label='内存'
						onClick={() => void connect('memory')}
					/>
					<BackendButton
						active={backend?.id === 'opfs'}
						disabled={connecting || !isOpfsFileSystemSupported()}
						icon={<Database className='size-3.5' />}
						label='Origin OPFS'
						onClick={() => void connect('opfs')}
					/>
					<BackendButton
						active={backend?.id === 'directory'}
						disabled={connecting || !isDirectoryPickerFileSystemSupported()}
						icon={<HardDrive className='size-3.5' />}
						label='选择本地目录'
						onClick={() => void connect('directory')}
					/>
					<span className='min-w-0 flex-1' />
					<span className='text-base-content/70 truncate text-xs'>{connecting ? '连接中…' : backend?.label}</span>
				</div>
			) : null}
			{error ? (
				<div role='alert' className='border-error/30 bg-error/8 text-error mb-2 border px-3 py-2 text-xs'>
					{error}
				</div>
			) : null}
			{downloaded ? (
				<div role='status' className='sr-only'>
					下载回调：{downloaded}
				</div>
			) : null}
			{backend ? (
				<FileManager
					fileSystem={backend.fileSystem}
					readOnly={readOnly}
					title={backend.label}
					className='h-[min(46rem,calc(100vh-6rem))] min-h-[32rem]'
					onEvent={(event) => {
						if (event.type === 'error')
							setError(event.error instanceof Error ? event.error.message : String(event.error));
					}}
					onDownload={(entry) => setDownloaded(entry.name)}
				/>
			) : (
				<div role='status' className='border-base-300 bg-base-100 grid min-h-96 place-items-center border text-sm'>
					正在初始化内存文件系统…
				</div>
			)}
		</main>
	);
}

function BackendButton({
	active,
	disabled,
	icon,
	label,
	onClick,
}: {
	active: boolean;
	disabled: boolean;
	icon: ReactNode;
	label: string;
	onClick: () => void;
}) {
	return (
		<button
			type='button'
			aria-pressed={active}
			disabled={disabled}
			className={active ? 'btn btn-neutral btn-xs' : 'btn btn-ghost btn-xs'}
			onClick={onClick}
		>
			{icon}
			{label}
		</button>
	);
}

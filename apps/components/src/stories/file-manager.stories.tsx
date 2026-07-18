'use client';

import type { Meta, StoryObj } from '@storybook/react-vite';
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
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { FileManager } from '../../registry/default/blocks/file-manager';
import { FileManagerWindowDemo } from './file-manager-window-demo';

const meta = {
	title: 'Console/File Manager',
	component: FileManager,
	tags: ['autodocs'],
	args: {
		fileSystem: createMemoryFileSystem(),
	},
	parameters: {
		docs: {
			description: {
				component:
					'A filesystem-neutral manager for @wener/common/fs. Authentication, audit policy, routing, object delivery, and domain metadata stay in the consumer adapter.',
			},
		},
	},
} satisfies Meta<typeof FileManager>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MemoryWorkspace: Story = {
	render: () => <FileManagerDemo />,
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const up = canvas.getByRole('button', { name: '上一级' });
		const refresh = canvas.getByRole('button', { name: '刷新' });
		const address = canvasElement.querySelector<HTMLElement>('[data-slot="path-address-bar"]');
		expect(address).not.toBeNull();
		expect(up.compareDocumentPosition(refresh) & Node.DOCUMENT_POSITION_FOLLOWING).not.toBe(0);
		expect(refresh.compareDocumentPosition(address as Node) & Node.DOCUMENT_POSITION_FOLLOWING).not.toBe(0);
		expect(canvas.getAllByRole('separator')).toHaveLength(2);
		await userEvent.click(canvas.getByRole('button', { name: '关闭位置面板' }));
		expect(canvas.queryByRole('navigation', { name: '文件位置' })).not.toBeInTheDocument();
		expect(canvas.getAllByRole('separator')).toHaveLength(1);
		await userEvent.click(canvas.getByRole('button', { name: '打开位置面板' }));
		expect(canvas.getByRole('navigation', { name: '文件位置' })).toBeInTheDocument();
		expect(canvas.getAllByRole('separator')).toHaveLength(2);
		await waitFor(() => expect(canvas.getByRole('button', { name: 'Documents' })).toBeInTheDocument());
		await userEvent.dblClick(canvas.getByRole('button', { name: 'Documents' }));
		await waitFor(() => expect(canvas.getByRole('button', { name: 'README.md' })).toBeInTheDocument());

		await userEvent.upload(
			canvas.getByLabelText('选择上传文件'),
			new File(['uploaded content'], 'upload.txt', { type: 'text/plain' }),
		);
		await waitFor(() => expect(canvas.getByRole('button', { name: 'upload.txt' })).toBeInTheDocument());
		await ensureSelected(canvas, 'upload.txt');
		await userEvent.click(canvas.getByRole('button', { name: '下载' }));
		await waitFor(() => expect(canvas.getByText('下载回调：upload.txt')).toBeInTheDocument());
		await waitForOperation(canvas);

		await userEvent.click(canvas.getByRole('button', { name: '新建目录' }));
		await userEvent.type(canvas.getByRole('textbox', { name: '名称' }), 'Archive');
		await userEvent.click(canvas.getByRole('button', { name: '确认' }));
		await waitForOperation(canvas);
		await waitFor(() => expect(canvas.getByRole('button', { name: 'Archive' })).toBeInTheDocument());
		await ensureSelected(canvas, 'upload.txt');
		await userEvent.click(canvas.getByRole('button', { name: '复制到' }));
		const copyDestination = canvas.getByRole('textbox', { name: '目标目录' });
		await userEvent.clear(copyDestination);
		await userEvent.type(copyDestination, '/Documents/Archive');
		await userEvent.click(canvas.getByRole('button', { name: '确认' }));
		await waitForOperation(canvas);
		await navigateTo(canvas, '/Documents/Archive');
		await waitFor(() => expect(canvas.getByRole('button', { name: 'upload.txt' })).toBeInTheDocument());

		await ensureSelected(canvas, 'upload.txt');
		await userEvent.click(canvas.getByRole('button', { name: '移动到' }));
		const moveDestination = canvas.getByRole('textbox', { name: '目标目录' });
		await userEvent.clear(moveDestination);
		await userEvent.type(moveDestination, '/Projects');
		await userEvent.click(canvas.getByRole('button', { name: '确认' }));
		await waitForOperation(canvas);
		await navigateTo(canvas, '/Projects');
		await waitFor(() => expect(canvas.getByRole('button', { name: 'upload.txt' })).toBeInTheDocument());
		await navigateTo(canvas, '/Documents');

		await userEvent.click(canvas.getByRole('button', { name: '新建文件' }));
		await userEvent.type(canvas.getByRole('textbox', { name: '名称' }), 'todo.txt');
		await userEvent.click(canvas.getByRole('button', { name: '确认' }));
		await waitFor(() => expect(canvas.getByRole('button', { name: 'todo.txt' })).toBeInTheDocument());

		await ensureSelected(canvas, 'todo.txt');
		await userEvent.click(canvas.getByRole('button', { name: '重命名' }));
		const renameInput = canvas.getByRole('textbox', { name: '名称' });
		await userEvent.clear(renameInput);
		await userEvent.type(renameInput, 'tasks.txt');
		await userEvent.click(canvas.getByRole('button', { name: '确认' }));
		await waitFor(() => expect(canvas.getByRole('button', { name: 'tasks.txt' })).toBeInTheDocument());

		await ensureSelected(canvas, 'tasks.txt');
		await userEvent.click(canvas.getByRole('button', { name: '删除' }));
		await userEvent.click(canvas.getByRole('button', { name: '确认' }));
		await waitFor(() => expect(canvas.queryByRole('button', { name: 'tasks.txt' })).not.toBeInTheDocument());

		await userEvent.click(canvas.getByRole('button', { name: '后退' }));
		const movedFile = await waitFor(() => canvas.getByRole('button', { name: 'upload.txt' }));
		const surface = canvasElement.querySelector<HTMLElement>('[data-file-manager]');
		expect(surface).not.toBeNull();
		surface?.focus();
		await userEvent.keyboard('{Control>}a{/Control}');
		expect(canvas.getByRole('checkbox', { name: '选择 upload.txt' })).toBeChecked();
		movedFile.focus();
		await userEvent.keyboard('{Enter}');
		await waitFor(() => expect(canvas.getByText('uploaded content')).toBeInTheDocument());
	},
};

export const WindowWorkspace: Story = {
	render: () => <FileManagerWindowDemo />,
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const launch = await canvas.findByRole('button', { name: '打开文件管理器' });
		await userEvent.click(launch);
		const dialog = await canvas.findByRole('dialog', { name: '工作区文件' });
		expect(canvas.getAllByRole('dialog', { name: '工作区文件' })).toHaveLength(1);
		await userEvent.click(within(dialog).getByRole('button', { name: 'README.md' }));
		expect(within(dialog).getByRole('checkbox', { name: '选择 README.md' })).toBeChecked();
		await userEvent.click(within(dialog).getByRole('button', { name: '最小化' }));
		await waitFor(() => expect(dialog.closest('[data-window-mode]')).toHaveAttribute('data-window-mode', 'minimized'));
		await userEvent.click(launch);
		await waitFor(() => expect(dialog.closest('[data-window-mode]')).toHaveAttribute('data-window-mode', 'normal'));
		expect(canvas.getAllByRole('dialog', { name: '工作区文件' })).toHaveLength(1);
		expect(within(dialog).getByRole('checkbox', { name: '选择 README.md' })).toBeChecked();
	},
	parameters: {
		layout: 'fullscreen',
		docs: {
			description: {
				story: '通过 showFileManager 打开、复用并恢复 WindowManager 中的 FileManager。',
			},
		},
	},
};

export const ReadOnlyAdapter: Story = {
	render: () => <FileManagerDemo backendControls={false} readOnly />,
	parameters: {
		docs: {
			description: {
				story:
					'The same manager can sit over an application-owned explorer adapter with every mutation capability removed.',
			},
		},
	},
};

export const StableGridFlow: Story = {
	render: () => <FileManagerDemo backendControls={false} />,
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await waitFor(() => expect(canvas.getByRole('button', { name: 'welcome.txt' })).toBeInTheDocument());
		await userEvent.click(canvas.getByRole('button', { name: '网格视图' }));

		const grid = canvasElement.querySelector<HTMLElement>('[data-file-manager-grid]');
		expect(grid).not.toBeNull();
		const items = Array.from(grid?.querySelectorAll<HTMLElement>('[data-file-manager-grid-item]') ?? []);
		expect(items.length).toBeGreaterThanOrEqual(4);
		const initialGridWidth = grid?.getBoundingClientRect().width ?? 0;
		const initialItemWidths = items.map((item) => item.getBoundingClientRect().width);
		expect(initialItemWidths.every((width) => Math.abs(width - 144) < 1)).toBe(true);
		const previewSeparator = canvas.getAllByRole('separator').at(-1);
		const previewIsBesideGrid = previewSeparator?.getAttribute('aria-orientation') === 'vertical';

		await userEvent.click(canvas.getByRole('button', { name: '关闭预览' }));
		if (previewIsBesideGrid) {
			await waitFor(() => expect((grid?.getBoundingClientRect().width ?? 0) > initialGridWidth + 100).toBe(true));
		} else {
			await waitFor(() => expect(canvas.getAllByRole('separator')).toHaveLength(1));
		}
		const expectStableItemWidths = () => {
			const currentItems = Array.from(grid?.querySelectorAll<HTMLElement>('[data-file-manager-grid-item]') ?? []);
			expect(
				currentItems.every(
					(item, index) => Math.abs(item.getBoundingClientRect().width - initialItemWidths[index]) < 1,
				),
			).toBe(true);
		};
		expectStableItemWidths();

		await userEvent.click(canvas.getByRole('button', { name: '打开预览' }));
		await waitFor(() => expect(canvas.getAllByRole('separator')).toHaveLength(2));
		const resizedSeparator = canvas.getAllByRole('separator').at(-1);
		expect(resizedSeparator).toBeDefined();
		if (previewIsBesideGrid) {
			const reopenedGridWidth = grid?.getBoundingClientRect().width ?? 0;
			resizedSeparator?.focus();
			await userEvent.keyboard('{ArrowRight}');
			await waitFor(() =>
				expect(Math.abs((grid?.getBoundingClientRect().width ?? 0) - reopenedGridWidth)).toBeGreaterThan(1),
			);
		} else {
			const previousValue = resizedSeparator?.getAttribute('aria-valuenow');
			resizedSeparator?.focus();
			await userEvent.keyboard('{ArrowDown}');
			await waitFor(() => expect(resizedSeparator?.getAttribute('aria-valuenow')).not.toBe(previousValue));
		}
		expectStableItemWidths();
		expect(canvasElement.ownerDocument.documentElement.scrollWidth).toBeLessThanOrEqual(
			canvasElement.ownerDocument.documentElement.clientWidth,
		);
	},
	parameters: {
		docs: {
			description: {
				story: '网格项目使用固定宽度的 flex flow；详情面板显隐只改变每行项目数量，不拉伸项目。',
			},
		},
	},
};

export const BrowserBackends: Story = {
	render: () => <FileManagerDemo backendControls />,
	parameters: {
		docs: {
			description: {
				story:
					'OPFS uses origin-private persistent storage. Local directory access is requested only from the explicit user click and is not persisted by this component.',
			},
		},
	},
};

export const BackendSwitchCancellation: Story = {
	render: () => <BackendSwitchDemo />,
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await waitFor(() => expect(canvas.getByRole('heading', { name: 'Backend A' })).toBeInTheDocument());
		await userEvent.click(canvas.getByRole('button', { name: '新建文件' }));
		await userEvent.type(canvas.getByRole('textbox', { name: '名称' }), 'stale.txt');
		await userEvent.click(canvas.getByRole('button', { name: '确认' }));
		await userEvent.click(canvas.getByRole('button', { name: '切换文件系统' }));
		await waitFor(() => expect(canvas.getByRole('heading', { name: 'Backend B' })).toBeInTheDocument());
		await new Promise((resolve) => setTimeout(resolve, 450));
		expect(canvas.queryByRole('button', { name: 'stale.txt' })).not.toBeInTheDocument();
		expect(canvas.queryByText(/正在执行/)).not.toBeInTheDocument();
		expect(canvas.getByText('旧后端操作已取消')).toBeInTheDocument();
	},
	parameters: {
		docs: {
			description: {
				story:
					'Switching adapters aborts an in-flight write and prevents the old backend from committing into new state.',
			},
		},
	},
};

export const RuntimeLifecycleCancellation: Story = {
	render: () => <RuntimeLifecycleCancellationDemo />,
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await waitFor(() => expect(canvas.getByRole('button', { name: 'README.md' })).toBeInTheDocument());
		await userEvent.click(canvas.getByRole('button', { name: 'README.md' }));
		await userEvent.click(await canvas.findByRole('button', { name: '编辑 README.md' }));
		await userEvent.type(canvas.getByRole('textbox', { name: '编辑 README.md' }), '\nlifecycle draft');
		await userEvent.click(canvas.getByRole('button', { name: '保存' }));
		await waitFor(() => expect(canvas.getByRole('button', { name: '关闭预览' })).toBeDisabled());
		await userEvent.click(canvas.getByRole('button', { name: '变更初始路径' }));
		await waitFor(() => expect(canvas.getByRole('alert')).toHaveTextContent('保存已取消'));
		expect(canvas.getByRole('button', { name: '关闭预览' })).toBeEnabled();
		expect((canvas.getByRole('textbox', { name: '编辑 README.md' }) as HTMLTextAreaElement).value).toContain(
			'lifecycle draft',
		);
	},
};

export const SaveFailurePreservesDraft: Story = {
	render: () => <SaveFailureDemo />,
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await waitFor(() => expect(canvas.getByRole('button', { name: 'README.md' })).toBeInTheDocument());
		await userEvent.click(canvas.getByRole('button', { name: 'README.md' }));
		await userEvent.click(await canvas.findByRole('button', { name: '编辑 README.md' }));
		const editor = canvas.getByRole('textbox', { name: '编辑 README.md' });
		await userEvent.type(editor, '\nunsaved draft');
		await userEvent.click(canvas.getByRole('button', { name: '保存' }));
		await waitFor(() => expect(canvas.getByRole('button', { name: '关闭预览' })).toBeDisabled());
		await waitFor(() => expect(canvas.getByRole('alert')).toHaveTextContent('Injected save failure'));
		expect((canvas.getByRole('textbox', { name: '编辑 README.md' }) as HTMLTextAreaElement).value).toContain(
			'unsaved draft',
		);
	},
	parameters: {
		docs: {
			description: {
				story: 'A failed adapter write leaves the text editor and unsaved draft intact for retry or copy-out.',
			},
		},
	},
};

export const RawFileNamesAndKeyboardOverride: Story = {
	render: () => <RawFileNameKeyboardDemo />,
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await waitFor(() => expect(canvas.getByRole('button', { name: 'report?.txt' })).toBeInTheDocument());
		await userEvent.click(canvas.getByRole('button', { name: 'report?.txt' }));
		await waitFor(() => expect(canvas.getByText('question mark filename')).toBeInTheDocument());
		await userEvent.click(canvas.getByRole('button', { name: 'notes#final.txt' }));
		await waitFor(() => expect(canvas.getByText('hash filename')).toBeInTheDocument());

		const surface = canvasElement.querySelector<HTMLElement>('[data-file-manager]');
		expect(surface).not.toBeNull();
		surface?.focus();
		await userEvent.keyboard('{Control>}a{/Control}');
		expect(canvas.getByRole('checkbox', { name: '选择 report?.txt' })).not.toBeChecked();
		expect(canvas.getByRole('checkbox', { name: '选择 notes#final.txt' })).toBeChecked();
	},
	parameters: {
		docs: {
			description: {
				story:
					'Filesystem names retain literal URL delimiter characters, while a consumer can prevent the built-in keyboard shortcuts.',
			},
		},
	},
};

export const ResponsiveContainerOrientation: Story = {
	render: () => <ResponsiveContainerDemo />,
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await waitFor(() => expect(canvas.getByRole('button', { name: 'container.txt' })).toBeInTheDocument());
		await waitFor(() =>
			expect(
				canvas
					.getAllByRole('separator')
					.every((separator) => separator.getAttribute('aria-orientation') === 'horizontal'),
			).toBe(true),
		);
		const verticalGroup = canvasElement.querySelector<HTMLElement>('[data-slot="resizable-panel-group"]');
		const verticalPanels = Array.from(canvasElement.querySelectorAll<HTMLElement>('[data-slot="resizable-panel"]'));
		expect(verticalGroup).not.toBeNull();
		const groupHeight = verticalGroup?.getBoundingClientRect().height ?? 0;
		const heights = verticalPanels.map((panel) => panel.getBoundingClientRect().height);
		expect(heights[0]).toBeGreaterThanOrEqual(groupHeight * 0.11);
		expect(heights[1]).toBeGreaterThanOrEqual(groupHeight * 0.24);
		expect(heights[2]).toBeGreaterThanOrEqual(groupHeight * 0.29);
		if ((canvasElement.ownerDocument.defaultView?.innerWidth ?? 0) >= 1200) {
			await userEvent.click(canvas.getByRole('button', { name: 'container.txt' }));
			await userEvent.click(await canvas.findByRole('button', { name: '编辑 container.txt' }));
			await userEvent.type(canvas.getByRole('textbox', { name: '编辑 container.txt' }), '\ncross-axis draft');
			await userEvent.click(canvas.getByRole('button', { name: '保存' }));
			await waitFor(() => expect(canvas.getByRole('button', { name: '关闭预览' })).toBeDisabled());
			await userEvent.click(canvas.getByRole('button', { name: '宽容器' }));
			await waitFor(() =>
				expect(
					canvas
						.getAllByRole('separator')
						.every((separator) => separator.getAttribute('aria-orientation') === 'vertical'),
				).toBe(true),
			);
			await waitFor(() => {
				const panels = Array.from(canvasElement.querySelectorAll<HTMLElement>('[data-slot="resizable-panel"]'));
				const widths = panels.map((panel) => panel.getBoundingClientRect().width);
				expect(widths[0]).toBeGreaterThanOrEqual(140);
				expect(widths[0]).toBeLessThanOrEqual(220);
				expect(widths[1]).toBeGreaterThan(400);
				expect(widths[2]).toBeGreaterThanOrEqual(250);
				expect(widths[2]).toBeLessThanOrEqual(380);
			});
			await waitFor(() => expect(canvas.getByRole('alert')).toHaveTextContent('Injected save failure'));
			expect((canvas.getByRole('textbox', { name: '编辑 container.txt' }) as HTMLTextAreaElement).value).toContain(
				'cross-axis draft',
			);
		} else {
			expect(canvasElement.ownerDocument.documentElement.scrollWidth).toBeLessThanOrEqual(
				canvasElement.ownerDocument.documentElement.clientWidth,
			);
		}
	},
};

export const OpenCallbackFailure: Story = {
	render: () => <OpenCallbackFailureDemo />,
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const file = await waitFor(() => canvas.getByRole('button', { name: 'welcome.txt' }));
		file.focus();
		await userEvent.keyboard('{Enter}');
		await waitFor(() => expect(canvas.getByText('打开回调失败已处理')).toBeInTheDocument());
		expect(canvas.queryByText('unexpected opened event')).not.toBeInTheDocument();
	},
};

type DemoBackend = { fileSystem: IFileSystem; id: 'memory' | 'opfs' | 'directory'; label: string };

function BackendSwitchDemo() {
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

function SaveFailureDemo() {
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

function RuntimeLifecycleCancellationDemo() {
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

function RawFileNameKeyboardDemo() {
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

function ResponsiveContainerDemo() {
	const [fileSystem, setFileSystem] = useState<IFileSystem>();
	const [wide, setWide] = useState(false);
	useEffect(() => {
		let active = true;
		const next = createMemoryFileSystem();
		void next.writeFile('/container.txt', 'Container-based panel orientation.').then(() => {
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

function OpenCallbackFailureDemo() {
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

function FileManagerDemo({
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
					<span className='text-base-content/55 mr-1 text-xs'>存储后端</span>
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
					<span className='text-base-content/55 truncate text-xs'>{connecting ? '连接中…' : backend?.label}</span>
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

async function navigateTo(canvas: ReturnType<typeof within>, path: string) {
	await userEvent.click(canvas.getByRole('button', { name: '编辑路径' }));
	const address = canvas.getByRole('textbox', { name: '当前位置' });
	await userEvent.clear(address);
	await userEvent.type(address, path);
	await userEvent.keyboard('{Enter}');
}

async function waitForOperation(canvas: ReturnType<typeof within>) {
	await waitFor(() => expect(canvas.queryByText(/正在执行/)).not.toBeInTheDocument());
}

async function ensureSelected(canvas: ReturnType<typeof within>, name: string) {
	const checkbox = canvas.getByRole('checkbox', { name: `选择 ${name}` }) as HTMLInputElement;
	if (!checkbox.checked) await userEvent.click(checkbox);
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

async function createSeededMemoryFileSystem(): Promise<IFileSystem> {
	const fileSystem = createMemoryFileSystem();
	await seedDemoFileSystem(fileSystem);
	return fileSystem;
}

async function seedIfEmpty(fileSystem: IFileSystem) {
	if ((await fileSystem.readdir('/')).length === 0) await seedDemoFileSystem(fileSystem);
}

async function seedDemoFileSystem(fileSystem: IFileSystem) {
	await fileSystem.mkdir('/Documents', { recursive: true });
	await fileSystem.mkdir('/Projects/file-manager', { recursive: true });
	await fileSystem.mkdir('/Media', { recursive: true });
	await fileSystem.writeFile(
		'/Documents/README.md',
		'# File manager\n\nThis workspace is backed by `@wener/common/fs`.\n\n- Memory is ephemeral\n- OPFS is origin-private\n- Local directories require an explicit picker gesture\n',
	);
	await fileSystem.writeFile(
		'/Documents/notes.txt',
		'Review filesystem boundaries before attaching business policy.\n',
	);
	await fileSystem.writeFile(
		'/Projects/file-manager/spec.json',
		JSON.stringify(
			{ adapter: '@wener/common/fs', capabilities: ['read', 'write', 'copy', 'move'], version: 1 },
			null,
			2,
		),
	);
	await fileSystem.writeFile(
		'/Media/workflow.svg',
		'<svg xmlns="http://www.w3.org/2000/svg" width="640" height="240" viewBox="0 0 640 240"><rect width="640" height="240" fill="#f4f4f5"/><g fill="#18181b" font-family="system-ui" font-size="20"><text x="40" y="68">IFileSystem</text><text x="250" y="68">FileManager Runtime</text><text x="470" y="68">Consumer</text></g><path d="M150 60h80m190 0h35" stroke="#2563eb" stroke-width="4"/><text x="40" y="175" fill="#52525b" font-family="system-ui" font-size="16">Memory · OPFS · Local Directory · Remote Adapter</text></svg>',
	);
	await fileSystem.writeFile('/welcome.txt', 'Select a folder, create a file, or switch storage backends.\n');
}

function createDelayedWriteFileSystem(fileSystem: IFileSystem, delayMs: number): IFileSystem {
	return new Proxy(fileSystem, {
		get(target, property, receiver) {
			if (property === 'writeFile') {
				return async (...args: Parameters<IFileSystem['writeFile']>) => {
					const signal = args[2]?.signal;
					await waitForAbortableDelay(delayMs, signal);
					return target.writeFile(...args);
				};
			}
			const value = Reflect.get(target, property, receiver);
			return typeof value === 'function' ? value.bind(target) : value;
		},
	});
}

function createFailingSaveFileSystem(fileSystem: IFileSystem, failingPath = '/Documents/README.md'): IFileSystem {
	return new Proxy(fileSystem, {
		get(target, property, receiver) {
			if (property === 'writeFile') {
				return async (...args: Parameters<IFileSystem['writeFile']>) => {
					if (args[0] === failingPath) {
						await new Promise((resolve) => setTimeout(resolve, 120));
						throw new Error('Injected save failure');
					}
					return target.writeFile(...args);
				};
			}
			const value = Reflect.get(target, property, receiver);
			return typeof value === 'function' ? value.bind(target) : value;
		},
	});
}

function waitForAbortableDelay(delayMs: number, signal?: AbortSignal): Promise<void> {
	return new Promise((resolve, reject) => {
		if (signal?.aborted) {
			reject(new DOMException('Operation aborted', 'AbortError'));
			return;
		}
		const timer = setTimeout(resolve, delayMs);
		signal?.addEventListener(
			'abort',
			() => {
				clearTimeout(timer);
				reject(new DOMException('Operation aborted', 'AbortError'));
			},
			{ once: true },
		);
	});
}

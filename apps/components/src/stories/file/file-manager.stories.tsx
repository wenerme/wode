'use client';

import type { Meta, StoryObj } from '@storybook/react-vite';
import { createMemoryFileSystem } from '@wener/common/fs';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { FileManager } from '@/file/file-manager';
import { FileManagerWindowDemo } from './file-manager-window-demo';
import {
	BackendSwitchDemo,
	BackendSwitchOpenDemo,
	DragDropCancellationDemo,
	DragDropDemo,
	ExternalPanelStateDemo,
	SaveFailureDemo,
} from './file-manager-story-demos';
import {
	FileManagerDemoExperience,
	OpenCallbackFailureDemo,
	RawFileNameKeyboardDemo,
	ResponsiveContainerDemo,
	RuntimeLifecycleCancellationDemo,
} from './file-manager-story-boundary-demos';
import {
	createStoryDataTransfer,
	dispatchStoryDrag,
	getDirectPanels,
	getDirectSeparators,
	getResizeHandle,
	getResizePanel,
	hasOrientation,
} from './file-manager-story-interactions';
import {
	playCollapsedTreeRefresh,
	playDragDropOperations,
	playMemoryWorkspace,
	playStableGridFlow,
} from './file-manager-story-plays';

const meta = {
	id: 'console-file-manager',
	title: 'File/File Manager',
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
	render: () => <FileManagerDemoExperience backendControls={false} />,
	play: playMemoryWorkspace,
};

export const DragDropOperations: Story = {
	render: () => <DragDropDemo />,
	play: playDragDropOperations,
	parameters: {
		docs: {
			description: {
				story: '本地多文件 drop、部分失败重试，以及内部文件拖到目录的默认移动流程。',
			},
		},
	},
};

export const CollapsedTreeRefresh: Story = {
	render: () => <DragDropDemo />,
	play: playCollapsedTreeRefresh,
	parameters: {
		docs: {
			description: {
				story: '文件树折叠期间发生 mutation，重新展开后保留目录展开状态并消费持久化 refresh。',
			},
		},
	},
};

export const DragDropPartialFailure: Story = {
	render: () => <DragDropDemo />,
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await waitFor(() => expect(canvas.getByRole('button', { name: 'source.txt' })).toBeInTheDocument());
		const dropZone = canvasElement.querySelector<HTMLElement>('[data-file-manager-drop-zone]');
		expect(dropZone).not.toBeNull();
		const dataTransfer = createStoryDataTransfer([new File(['ok'], 'ok.txt'), new File(['retry'], 'retry.txt')]);
		dispatchStoryDrag(dropZone as HTMLElement, 'drop', dataTransfer);
		await waitFor(() => expect(canvas.getByRole('alert', { name: '文件操作结果' })).toHaveTextContent('部分完成'));
		expect(canvas.getByRole('button', { name: '重试' })).toBeInTheDocument();
		await userEvent.click(canvas.getByRole('button', { name: '关闭操作结果' }));
		if (getResizePanel(canvasElement, '-tree').getBoundingClientRect().height <= 1) {
			await userEvent.click(canvas.getByRole('button', { name: '展开文件树' }));
		}
		await waitFor(() => expect(canvas.getByRole('treeitem', { name: /ok\.txt/ })).toBeInTheDocument(), {
			timeout: 3000,
		});
	},
};

export const DragDropCancellation: Story = {
	render: () => <DragDropCancellationDemo />,
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await waitFor(() => expect(canvas.getByText('当前目录为空')).toBeInTheDocument());
		const dropZone = canvasElement.querySelector<HTMLElement>('[data-file-manager-drop-zone]');
		expect(dropZone).not.toBeNull();
		const dataTransfer = createStoryDataTransfer([new File(['late'], 'late.txt')]);
		dispatchStoryDrag(dropZone as HTMLElement, 'drop', dataTransfer);
		await waitFor(() => expect(canvas.getByText('正在执行 上传…')).toBeInTheDocument());
		await userEvent.click(canvas.getByRole('button', { name: '取消' }));
		await waitFor(() => expect(canvas.getByRole('alert', { name: '文件操作结果' })).toHaveTextContent('操作已取消'));
		await new Promise((resolve) => setTimeout(resolve, 450));
		expect(canvas.queryByRole('button', { name: 'late.txt' })).not.toBeInTheDocument();
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
	render: () => <FileManagerDemoExperience backendControls={false} readOnly />,
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await waitFor(() => expect(canvas.getByRole('button', { name: 'welcome.txt' })).toBeInTheDocument());
		const getTreeDirectory = () =>
			canvasElement.querySelector<HTMLElement>('[data-slot="file-tree"] [data-kind="directory"]');
		await waitFor(() => expect(getTreeDirectory()).not.toBeNull(), { timeout: 3000 });
		const dataTransfer = createStoryDataTransfer([new File(['blocked'], 'blocked.txt')]);
		dispatchStoryDrag(getTreeDirectory() as HTMLElement, 'dragover', dataTransfer);
		await waitFor(() => expect(getTreeDirectory()).toHaveAttribute('data-drop-state', 'rejected'));
		expect(getTreeDirectory()).toHaveAttribute('title', '当前文件系统为只读或未启用上传');
		dispatchStoryDrag(getTreeDirectory() as HTMLElement, 'drop', dataTransfer);
		await waitFor(() =>
			expect(canvas.getByRole('alert', { name: '拖放操作提示' })).toHaveTextContent('只读或未启用上传'),
		);
	},
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
	render: () => <FileManagerDemoExperience backendControls={false} />,
	play: playStableGridFlow,
	parameters: {
		docs: {
			description: {
				story: '网格项目使用固定宽度的 flex flow；详情面板显隐只改变每行项目数量，不拉伸项目。',
			},
		},
	},
};

export const CollapsiblePanels: Story = {
	render: () => <FileManagerDemoExperience backendControls={false} />,
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await waitFor(() => expect(canvas.getByRole('tree')).toBeInTheDocument());

		const treeHandle = getResizeHandle(canvasElement, '-sidebar-handle');
		expect(canvas.getByRole('button', { name: '展开文件树' })).toBeDisabled();
		treeHandle.focus();
		await userEvent.keyboard('{End}');
		await waitFor(() =>
			expect(getResizePanel(canvasElement, '-tree').getBoundingClientRect().height).toBeLessThanOrEqual(1),
		);
		const expandTree = canvas.getByRole('button', { name: '展开文件树' });
		await waitFor(() => expect(expandTree).toBeEnabled());
		expect(canvas.queryByRole('tree')).not.toBeInTheDocument();
		await userEvent.tab();
		expect(getResizePanel(canvasElement, '-tree').contains(canvasElement.ownerDocument.activeElement)).toBe(false);
		await userEvent.click(expandTree);
		await waitFor(() =>
			expect(getResizePanel(canvasElement, '-tree').getBoundingClientRect().height).toBeGreaterThan(1),
		);
		expect(expandTree).toBeDisabled();
		expect(canvas.getByRole('tree')).toBeInTheDocument();

		const placesHandle = getResizeHandle(canvasElement, '-places-handle-');
		placesHandle.focus();
		await userEvent.keyboard('{Home}');
		await waitFor(() => expect(canvas.getByRole('button', { name: '打开位置面板' })).toBeInTheDocument());
		await userEvent.keyboard('{Enter}');
		await waitFor(() => expect(canvas.getByRole('button', { name: '关闭位置面板' })).toBeInTheDocument());

		const previewHandle = getResizeHandle(canvasElement, '-preview-handle-');
		previewHandle.focus();
		await userEvent.keyboard('{End}');
		await waitFor(() => expect(canvas.getByRole('button', { name: '打开预览' })).toBeInTheDocument());
		await userEvent.keyboard('{Home}');
		await waitFor(() => expect(canvas.getByRole('button', { name: '关闭预览' })).toBeInTheDocument());
	},
	parameters: {
		docs: {
			description: {
				story: 'Places、FileTree 与 Preview 使用原生 collapsible panel；越过 minSize 后折叠为零并保留 separator。',
			},
		},
	},
};

export const ControlledPanelState: Story = {
	render: () => <ExternalPanelStateDemo />,
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await waitFor(() => expect(canvas.getByRole('navigation', { name: '文件位置' })).toBeInTheDocument());
		const placesHandle = getResizeHandle(canvasElement, '-places-handle-');
		const placesPanel = placesHandle.previousElementSibling as HTMLElement;
		const placesDimension = () =>
			placesHandle.getAttribute('aria-orientation') === 'vertical'
				? placesPanel.getBoundingClientRect().width
				: placesPanel.getBoundingClientRect().height;
		await userEvent.click(canvas.getByRole('button', { name: 'Store 关闭位置' }));
		await waitFor(() => expect(placesDimension()).toBeLessThanOrEqual(1));
		expect(canvas.queryByRole('navigation', { name: '文件位置' })).not.toBeInTheDocument();
		await userEvent.click(canvas.getByRole('button', { name: 'Store 打开位置' }));
		await waitFor(() => expect(placesDimension()).toBeGreaterThan(1));

		const previewHandle = getResizeHandle(canvasElement, '-preview-handle-');
		const previewPanel = previewHandle.nextElementSibling as HTMLElement;
		const previewDimension = () =>
			previewHandle.getAttribute('aria-orientation') === 'vertical'
				? previewPanel.getBoundingClientRect().width
				: previewPanel.getBoundingClientRect().height;
		await userEvent.click(canvas.getByRole('button', { name: 'Store 关闭预览' }));
		await waitFor(() => expect(previewDimension()).toBeLessThanOrEqual(1));
		expect(canvas.queryByRole('complementary', { name: '文件预览' })).not.toBeInTheDocument();
		await userEvent.click(canvas.getByRole('button', { name: 'Store 打开预览' }));
		await waitFor(() => expect(previewDimension()).toBeGreaterThan(1));
	},
};

export const FileManagerDemo: Story = {
	name: 'File Manager Demo',
	render: () => <FileManagerDemoExperience backendControls />,
	parameters: {
		docs: {
			description: {
				story: '用于手动体验完整文件管理流程，可在临时 Memory、持久化 Origin OPFS 和用户授权的本地目录之间切换。',
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

export const BackendSwitchSuppressesStaleOpen: Story = {
	render: () => <BackendSwitchOpenDemo />,
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await waitFor(() => expect(canvas.getByRole('heading', { name: 'Open Backend A' })).toBeInTheDocument());
		await userEvent.dblClick(canvas.getByRole('button', { name: 'welcome.txt' }));
		await waitFor(() => expect(canvas.getByText('旧打开正在等待')).toBeInTheDocument());
		await userEvent.click(canvas.getByRole('button', { name: '切换打开后端' }));
		await waitFor(() => expect(canvas.getByRole('heading', { name: 'Open Backend B' })).toBeInTheDocument());
		await userEvent.click(canvas.getByRole('button', { name: '完成旧打开' }));
		await waitFor(() => expect(canvas.getByText('旧打开已结束')).toBeInTheDocument());
		expect(canvas.getByText('回调绑定旧后端')).toBeInTheDocument();
		expect(canvas.queryByText('unexpected stale open terminal')).not.toBeInTheDocument();
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
		const getOuterGroup = () => canvasElement.querySelector<HTMLElement>('[data-slot="resizable-panel-group"]');
		await waitFor(() => expect(canvas.getByRole('button', { name: 'container.txt' })).toBeInTheDocument());
		const verticalGroup = getOuterGroup();
		expect(verticalGroup).not.toBeNull();
		await waitFor(() => expect(getDirectSeparators(verticalGroup).every(hasOrientation('horizontal'))).toBe(true));
		const verticalPanels = getDirectPanels(verticalGroup);
		const groupHeight = verticalGroup?.getBoundingClientRect().height ?? 0;
		const heights = verticalPanels.map((panel) => panel.getBoundingClientRect().height);
		expect(heights[0]).toBeGreaterThanOrEqual(groupHeight * 0.11);
		expect(heights[1]).toBeGreaterThanOrEqual(groupHeight * 0.24);
		expect(heights[2]).toBeGreaterThanOrEqual(groupHeight * 0.29);
		if ((canvasElement.ownerDocument.defaultView?.innerWidth ?? 0) >= 1200) {
			const folder = await canvas.findByRole('treeitem', { name: /Folder/ }, { timeout: 3000 });
			await userEvent.click(within(folder).getByRole('button', { name: '展开目录' }));
			await waitFor(() => expect(canvas.getByRole('treeitem', { name: /nested\.txt/ })).toBeInTheDocument());
			const treeHandle = getResizeHandle(canvasElement, '-sidebar-handle');
			treeHandle.focus();
			await userEvent.keyboard('{End}');
			await waitFor(() => expect(canvas.queryByRole('tree')).not.toBeInTheDocument());

			await userEvent.click(canvas.getByRole('button', { name: 'container.txt' }));
			await userEvent.click(await canvas.findByRole('button', { name: '编辑 container.txt' }));
			await userEvent.type(canvas.getByRole('textbox', { name: '编辑 container.txt' }), '\ncross-axis draft');
			await userEvent.click(canvas.getByRole('button', { name: '保存' }));
			await waitFor(() => expect(canvas.getByRole('button', { name: '关闭预览' })).toBeDisabled());
			await userEvent.click(canvas.getByRole('button', { name: '宽容器' }));
			await waitFor(() => expect(getDirectSeparators(getOuterGroup()).every(hasOrientation('vertical'))).toBe(true));
			await waitFor(() => {
				const panels = getDirectPanels(getOuterGroup());
				const widths = panels.map((panel) => panel.getBoundingClientRect().width);
				expect(widths[0]).toBeGreaterThanOrEqual(176);
				expect(widths[0]).toBeLessThanOrEqual(384);
				expect(widths[1]).toBeGreaterThan(400);
				expect(widths[2]).toBeGreaterThanOrEqual(250);
				expect(widths[2]).toBeLessThanOrEqual(380);
			});
			await waitFor(() => expect(canvas.getByRole('alert')).toHaveTextContent('Injected save failure'));
			expect((canvas.getByRole('textbox', { name: '编辑 container.txt' }) as HTMLTextAreaElement).value).toContain(
				'cross-axis draft',
			);
			await expect(canvas.queryByRole('tree')).not.toBeInTheDocument();
			await userEvent.click(canvas.getByRole('button', { name: '展开文件树' }));
			await expect(canvas.getByRole('treeitem', { name: /nested\.txt/ })).toBeInTheDocument();
			await userEvent.click(canvas.getByRole('button', { name: '窄容器' }));
			await waitFor(() => expect(getDirectSeparators(getOuterGroup()).every(hasOrientation('horizontal'))).toBe(true));
			await expect(canvas.getByRole('treeitem', { name: /nested\.txt/ })).toBeInTheDocument();
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

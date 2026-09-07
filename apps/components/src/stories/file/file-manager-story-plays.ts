import { expect, userEvent, waitFor, within } from 'storybook/test';
import {
	createStoryDataTransfer,
	dispatchStoryDrag,
	ensureSelected,
	getResizeHandle,
	getResizePanel,
	navigateTo,
	waitForOperation,
} from './file-manager-story-interactions';

export const playMemoryWorkspace = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
	const canvas = within(canvasElement);
	const up = canvas.getByRole('button', { name: '上一级' });
	const refresh = canvas.getByRole('button', { name: '刷新' });
	const address = canvasElement.querySelector<HTMLElement>('[data-slot="path-address-bar"]');
	expect(address).not.toBeNull();
	expect(up.compareDocumentPosition(refresh) & Node.DOCUMENT_POSITION_FOLLOWING).not.toBe(0);
	expect(refresh.compareDocumentPosition(address as Node) & Node.DOCUMENT_POSITION_FOLLOWING).not.toBe(0);
	expect(canvas.getAllByRole('separator')).toHaveLength(3);
	await userEvent.click(canvas.getByRole('button', { name: '关闭位置面板' }));
	await waitFor(() => expect(canvas.queryByRole('navigation', { name: '文件位置' })).not.toBeInTheDocument());
	expect(canvas.getAllByRole('separator', { hidden: true })).toHaveLength(3);
	await userEvent.click(canvas.getByRole('button', { name: '打开位置面板' }));
	await waitFor(() => expect(canvas.getByRole('navigation', { name: '文件位置' })).toBeInTheDocument());
	expect(canvas.getAllByRole('separator')).toHaveLength(3);
	await waitFor(() => expect(canvas.getByRole('button', { name: 'Documents' })).toBeInTheDocument());
	const documentsTreeItem = await canvas.findByRole('treeitem', { name: /Documents/ }, { timeout: 3000 });
	await userEvent.dblClick(within(documentsTreeItem).getByText('Documents'));
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
	await waitFor(() => expect(canvas.getByRole('treeitem', { name: /Archive/ })).toBeInTheDocument());
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
	await userEvent.click(movedFile);
	const openPreview = canvas.queryByRole('button', { name: '打开预览' });
	if (openPreview) await userEvent.click(openPreview);
	await waitFor(() => expect(canvas.getByText('uploaded content')).toBeInTheDocument());
};

export const playDragDropOperations = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
	const canvas = within(canvasElement);
	await waitFor(() => expect(canvas.getByRole('button', { name: 'source.txt' })).toBeInTheDocument());
	const dropZone = canvasElement.querySelector<HTMLElement>('[data-file-manager-drop-zone]');
	expect(dropZone).not.toBeNull();
	const uploadTransfer = createStoryDataTransfer([
		new File(['ok'], 'ok.txt', { type: 'text/plain' }),
		new File(['retry'], 'retry.txt', { type: 'text/plain' }),
	]);
	expect(Array.from(uploadTransfer.types)).toContain('Files');
	expect(dispatchStoryDrag(dropZone as HTMLElement, 'dragover', uploadTransfer)).toBe(false);
	dispatchStoryDrag(dropZone as HTMLElement, 'drop', uploadTransfer);
	await waitFor(() => expect(canvas.getByRole('alert', { name: '文件操作结果' })).toHaveTextContent('部分完成'));
	expect(canvas.getByRole('button', { name: 'ok.txt' })).toBeInTheDocument();
	expect(canvas.queryByRole('button', { name: 'retry.txt' })).not.toBeInTheDocument();
	await userEvent.click(canvas.getByRole('button', { name: '重试' }));
	await waitFor(() => expect(canvas.getByRole('button', { name: 'retry.txt' })).toBeInTheDocument());
	await userEvent.click(canvas.getByRole('button', { name: '关闭操作结果' }));
	const treePanel = getResizePanel(canvasElement, '-tree');
	if (treePanel.getBoundingClientRect().height <= 1) {
		await userEvent.click(canvas.getByRole('button', { name: '展开文件树' }));
	}
	const getTreeSourceRow = () =>
		canvasElement.querySelector<HTMLElement>('[data-file-manager-entry-path="/retry.txt"]');
	const getTreeTargetRow = () =>
		canvasElement.querySelector<HTMLElement>('[data-slot="file-tree"] [data-path="/Target"]');
	const getRejectedTreeFileRow = () =>
		canvasElement.querySelector<HTMLElement>('[data-slot="file-tree"] [data-path="/source.txt"]');
	const getTreeTargetItem = () => getTreeTargetRow()?.closest<HTMLElement>('[role="treeitem"]');
	expect(getTreeSourceRow()).not.toBeNull();
	await waitFor(() => expect(getTreeTargetRow()).not.toBeNull(), { timeout: 3000 });
	await waitFor(() => expect(getRejectedTreeFileRow()).not.toBeNull(), { timeout: 3000 });
	await userEvent.click(within(getTreeTargetItem() as HTMLElement).getByRole('button', { name: '展开目录' }));
	await waitFor(() => expect(getTreeTargetItem()).toHaveAttribute('aria-expanded', 'true'));
	const rejectedTransfer = createStoryDataTransfer();
	dispatchStoryDrag(getTreeSourceRow() as HTMLElement, 'dragstart', rejectedTransfer);
	dispatchStoryDrag(getRejectedTreeFileRow() as HTMLElement, 'dragover', rejectedTransfer);
	await waitFor(() => expect(getRejectedTreeFileRow()).toHaveAttribute('data-drop-state', 'rejected'));
	expect(getRejectedTreeFileRow()).toHaveAttribute('title', '只能拖放到目录');
	expect(getRejectedTreeFileRow()).toHaveAttribute('aria-disabled', 'true');
	dispatchStoryDrag(getRejectedTreeFileRow() as HTMLElement, 'drop', rejectedTransfer);
	await waitFor(() => expect(canvas.getByRole('alert', { name: '拖放操作提示' })).toHaveTextContent('只能拖放到目录'));
	expect(canvas.getByRole('button', { name: 'retry.txt' })).toBeInTheDocument();
	const treeMoveTransfer = createStoryDataTransfer();
	await waitFor(() => expect(getTreeSourceRow()).not.toBeNull());
	dispatchStoryDrag(getTreeSourceRow() as HTMLElement, 'dragstart', treeMoveTransfer);
	await waitFor(() => expect(getTreeTargetRow()).not.toBeNull());
	dispatchStoryDrag(getTreeTargetRow() as HTMLElement, 'dragover', treeMoveTransfer);
	await waitFor(() => expect(getTreeTargetRow()).toHaveAttribute('data-drop-target', 'true'));
	dispatchStoryDrag(getTreeTargetRow() as HTMLElement, 'drop', treeMoveTransfer);
	await waitFor(() => expect(canvas.queryByRole('button', { name: 'retry.txt' })).not.toBeInTheDocument());
	await waitFor(() => expect(getTreeTargetItem()).toHaveAttribute('aria-expanded', 'true'));
	await waitFor(() =>
		expect(
			canvasElement.querySelector<HTMLElement>('[data-slot="file-tree"] [data-path="/Target/retry.txt"]'),
		).not.toBeNull(),
	);

	const getSourceRow = () => canvasElement.querySelector<HTMLElement>('[data-file-manager-entry-path="/ok.txt"]');
	const getTargetRow = () => canvasElement.querySelector<HTMLElement>('[data-file-manager-entry-path="/Target"]');
	const sourceRow = getSourceRow();
	expect(sourceRow).not.toBeNull();
	expect(getTargetRow()).not.toBeNull();
	const moveTransfer = createStoryDataTransfer();
	dispatchStoryDrag(sourceRow as HTMLElement, 'dragstart', moveTransfer);
	dispatchStoryDrag(getTargetRow() as HTMLElement, 'dragover', moveTransfer);
	await waitFor(() => expect(getTargetRow()).toHaveAttribute('data-drop-target', 'true'));
	dispatchStoryDrag(getTargetRow() as HTMLElement, 'drop', moveTransfer);
	await waitFor(() => expect(canvas.queryByRole('button', { name: 'ok.txt' })).not.toBeInTheDocument());
	await userEvent.dblClick(canvas.getByRole('button', { name: 'Target' }));
	await waitFor(() => expect(canvas.getByRole('button', { name: 'ok.txt' })).toBeInTheDocument());
	expect(canvas.getByRole('button', { name: 'retry.txt' })).toBeInTheDocument();
	const dismissFeedback = canvas.queryByRole('button', { name: '关闭操作结果' });
	if (dismissFeedback) await userEvent.click(dismissFeedback);
	await waitFor(() => expect(getTreeTargetRow()).not.toBeNull(), { timeout: 3000 });
	const treeUploadTransfer = createStoryDataTransfer([
		new File(['tree upload'], 'tree-upload.txt', { type: 'text/plain' }),
	]);
	dispatchStoryDrag(getTreeTargetRow() as HTMLElement, 'dragover', treeUploadTransfer);
	await waitFor(() => expect(getTreeTargetRow()).toHaveAttribute('data-drop-state', 'accepted'));
	dispatchStoryDrag(getTreeTargetRow() as HTMLElement, 'drop', treeUploadTransfer);
	await waitFor(() => expect(canvas.getByRole('button', { name: 'tree-upload.txt' })).toBeInTheDocument());
	const copySourceRow = canvasElement.querySelector<HTMLElement>('[data-file-manager-entry-path="/Target/ok.txt"]');
	const getCopyTargetRow = () =>
		canvasElement.querySelector<HTMLElement>('[data-slot="file-tree"] [data-path="/CopyTarget"]');
	expect(copySourceRow).not.toBeNull();
	await waitFor(() => expect(getCopyTargetRow()).not.toBeNull());
	const copyTransfer = createStoryDataTransfer();
	dispatchStoryDrag(copySourceRow as HTMLElement, 'dragstart', copyTransfer);
	dispatchStoryDrag(getCopyTargetRow() as HTMLElement, 'dragover', copyTransfer, { ctrlKey: true });
	dispatchStoryDrag(getCopyTargetRow() as HTMLElement, 'drop', copyTransfer, { ctrlKey: true });
	await navigateTo(canvas, '/CopyTarget');
	await waitFor(() => expect(canvas.getByRole('button', { name: 'ok.txt' })).toBeInTheDocument());
	await navigateTo(canvas, '/Target');
	await waitFor(() => expect(canvas.getByRole('button', { name: 'ok.txt' })).toBeInTheDocument());
};

export const playCollapsedTreeRefresh = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
	const canvas = within(canvasElement);
	await waitFor(() => expect(canvas.getByRole('button', { name: 'Target' })).toBeInTheDocument());
	if (getResizePanel(canvasElement, '-tree').getBoundingClientRect().height <= 1) {
		await userEvent.click(canvas.getByRole('button', { name: '展开文件树' }));
	}
	const getTargetRow = () => canvasElement.querySelector<HTMLElement>('[data-slot="file-tree"] [data-path="/Target"]');
	const getTargetItem = () => getTargetRow()?.closest<HTMLElement>('[role="treeitem"]');
	await waitFor(() => expect(getTargetItem()).not.toBeNull());
	await userEvent.click(within(getTargetItem() as HTMLElement).getByRole('button', { name: '展开目录' }));
	await waitFor(() => expect(getTargetItem()).toHaveAttribute('aria-expanded', 'true'));
	await userEvent.dblClick(canvas.getByRole('button', { name: 'Target' }));
	await waitFor(() => expect(canvas.getByText('当前目录为空')).toBeInTheDocument());

	const treeHandle = getResizeHandle(canvasElement, '-sidebar-handle');
	treeHandle.focus();
	await userEvent.keyboard('{End}');
	await waitFor(() =>
		expect(getResizePanel(canvasElement, '-tree').getBoundingClientRect().height).toBeLessThanOrEqual(1),
	);
	await waitFor(() => expect(canvas.queryByRole('tree')).not.toBeInTheDocument());
	await userEvent.upload(
		canvas.getByLabelText('选择上传文件'),
		new File(['refresh while hidden'], 'hidden-refresh.txt', { type: 'text/plain' }),
	);
	await waitFor(() => expect(canvas.getByRole('button', { name: 'hidden-refresh.txt' })).toBeInTheDocument());

	await userEvent.click(canvas.getByRole('button', { name: '展开文件树' }));
	await waitFor(() => expect(canvas.getByRole('tree')).toBeInTheDocument());
	await waitFor(() => expect(getTargetItem()).toHaveAttribute('aria-expanded', 'true'));
	await waitFor(() =>
		expect(
			canvasElement.querySelector<HTMLElement>('[data-slot="file-tree"] [data-path="/Target/hidden-refresh.txt"]'),
		).not.toBeNull(),
	);
};

export const playStableGridFlow = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
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
	}
	await waitFor(() => expect(canvas.queryByRole('complementary', { name: '文件预览' })).not.toBeInTheDocument());
	expect(canvas.getAllByRole('separator')).toHaveLength(3);
	const expectStableItemWidths = () => {
		const currentItems = Array.from(grid?.querySelectorAll<HTMLElement>('[data-file-manager-grid-item]') ?? []);
		expect(
			currentItems.every((item, index) => Math.abs(item.getBoundingClientRect().width - initialItemWidths[index]) < 1),
		).toBe(true);
	};
	expectStableItemWidths();

	await userEvent.click(canvas.getByRole('button', { name: '打开预览' }));
	await waitFor(() => expect(canvas.getByRole('complementary', { name: '文件预览' })).toBeInTheDocument());
	expect(canvas.getAllByRole('separator')).toHaveLength(3);
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
};

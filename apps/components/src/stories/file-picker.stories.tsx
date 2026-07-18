import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import {
	DelayedSaveCancellationFixture,
	documentAndImageAccept,
	ErrorPickerFixture,
	imageAccept,
	PickerFixture,
} from './file-picker-fixtures';

const meta = {
	title: 'Console/File Picker',
	parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const OpenSingle: Story = {
	render: () => <PickerFixture mode='open' />,
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await userEvent.click(await canvas.findByRole('button', { name: 'README.md' }));
		await userEvent.click(canvas.getByRole('button', { name: '打开' }));
		expect(canvas.getByLabelText('选择结果')).toHaveTextContent('/README.md');
	},
};

export const OpenMultiple: Story = {
	render: () => <PickerFixture mode='open' multiple />,
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await userEvent.click(await canvas.findByRole('checkbox', { name: '选择 README.md' }));
		await userEvent.click(canvas.getByRole('checkbox', { name: '选择 说明.txt' }));
		await userEvent.click(canvas.getByRole('button', { name: '打开' }));
		expect(canvas.getByLabelText('选择结果')).toHaveTextContent('/README.md, /说明.txt');
	},
};

export const OpenDirectoryWithPrimaryAction: Story = {
	render: () => <PickerFixture mode='open' />,
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await userEvent.click(await canvas.findByRole('button', { name: '文档' }));
		await userEvent.click(canvas.getByRole('button', { name: '打开' }));
		await userEvent.click(await canvas.findByRole('button', { name: '计划.md' }));
		await userEvent.click(canvas.getByRole('button', { name: '打开' }));
		expect(canvas.getByLabelText('选择结果')).toHaveTextContent('/文档/计划.md');
	},
};

export const SelectDirectory: Story = {
	render: () => <PickerFixture mode='directory' />,
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await userEvent.click(await canvas.findByRole('button', { name: '文档' }));
		await userEvent.click(canvas.getByRole('button', { name: '选择文件夹' }));
		expect(canvas.getByLabelText('选择结果')).toHaveTextContent('/文档');
	},
};

export const SaveNewFile: Story = {
	render: () => <PickerFixture mode='save' suggestedName='新报告.md' />,
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await canvas.findByRole('button', { name: '保存' });
		await userEvent.click(canvas.getByRole('button', { name: '保存' }));
		expect(await canvas.findByLabelText('选择结果')).toHaveTextContent('/新报告.md');
	},
};

export const SaveInsideSelectedDirectory: Story = {
	render: () => <PickerFixture mode='save' suggestedName='新报告.md' />,
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await userEvent.click(await canvas.findByRole('button', { name: '文档' }));
		await userEvent.click(canvas.getByRole('button', { name: '保存' }));
		await canvas.findByRole('button', { name: '计划.md' });
		await userEvent.click(canvas.getByRole('button', { name: '保存' }));
		expect(await canvas.findByLabelText('选择结果')).toHaveTextContent('/文档/新报告.md');
	},
};

export const SaveWithOverwriteConfirmation: Story = {
	render: () => <PickerFixture mode='save' />,
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await userEvent.click(await canvas.findByRole('button', { name: '保存' }));
		const dialog = await canvas.findByRole('dialog', { name: '确认替换文件' });
		expect(within(dialog).getByText(/季度报告.md/)).toBeInTheDocument();
		await userEvent.click(within(dialog).getByRole('button', { name: '替换' }));
		expect(canvas.getByLabelText('选择结果')).toHaveTextContent('/季度报告.md');
	},
};

export const ImageFilter: Story = {
	render: () => <PickerFixture accept={imageAccept} initialPath='/图片' mode='open' />,
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		expect(await canvas.findByRole('button', { name: '封面.png' })).toBeInTheDocument();
		expect(canvas.getByRole('button', { name: 'banner.jpg' })).toBeInTheDocument();
		expect(canvas.queryByRole('button', { name: 'README.md' })).not.toBeInTheDocument();
	},
};

export const FileTypeSelector: Story = {
	render: () => <PickerFixture accept={documentAndImageAccept} mode='open' />,
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		expect(await canvas.findByRole('button', { name: 'README.md' })).toBeInTheDocument();
		expect(canvas.queryByRole('button', { name: 'logo.png' })).not.toBeInTheDocument();
		await userEvent.selectOptions(canvas.getByLabelText('文件类型'), '1');
		expect(await canvas.findByRole('button', { name: 'logo.png' })).toBeInTheDocument();
		expect(canvas.queryByRole('button', { name: 'README.md' })).not.toBeInTheDocument();
	},
};

export const EmptyDirectory: Story = {
	render: () => <PickerFixture initialPath='/空目录' mode='open' />,
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		expect(await canvas.findByText('没有符合条件的文件')).toBeInTheDocument();
		expect(canvas.getByRole('button', { name: '打开' })).toBeDisabled();
	},
};

export const BackendError: Story = {
	render: () => <ErrorPickerFixture />,
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const alerts = await canvas.findAllByRole('alert');
		expect(alerts.some((alert) => alert.textContent?.includes('模拟目录读取失败'))).toBe(true);
		expect(canvas.getByRole('button', { name: '重试' })).toBeInTheDocument();
	},
};

export const CancelPendingSaveCheck: Story = {
	render: () => <DelayedSaveCancellationFixture />,
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await userEvent.click(await canvas.findByRole('button', { name: '保存' }));
		expect(canvas.getByText('正在检查保存目标…')).toBeInTheDocument();
		await userEvent.click(canvas.getByRole('button', { name: '取消' }));
		await waitFor(() => expect(canvas.getByLabelText('选择结果')).toHaveTextContent('已取消'));
		await new Promise((resolve) => setTimeout(resolve, 220));
		expect(canvas.getByLabelText('选择结果')).toHaveTextContent('已取消');
	},
};

export const NavigateDuringPendingSaveCheck: Story = {
	render: () => <DelayedSaveCancellationFixture />,
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await userEvent.click(await canvas.findByRole('button', { name: '保存' }));
		await userEvent.dblClick(canvas.getByRole('button', { name: '文档' }));
		expect(await canvas.findByRole('button', { name: '计划.md' })).toBeInTheDocument();
		await new Promise((resolve) => setTimeout(resolve, 220));
		expect(canvas.getByLabelText('选择结果')).toHaveTextContent('等待选择');
	},
};

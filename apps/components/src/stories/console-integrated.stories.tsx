import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { ConsoleWorkspaceDemo } from './ConsoleWorkspaceDemo';
import { ConsoleDemo as CompleteConsoleDemo } from './console-demo';

const meta = {
	title: 'Console/Integrated',
	component: ConsoleWorkspaceDemo,
	tags: ['autodocs'],
	parameters: {
		consoleThemeOwner: 'story',
		docs: {
			description: {
				component:
					'Integration proof for shell navigation, DataView, preferences, About, responsive layout, and DaisyUI theme persistence.',
			},
		},
	},
} satisfies Meta<typeof ConsoleWorkspaceDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ResourceWorkspace: Story = {
	args: {
		initialPage: 'resources',
	},
};

export const WindowWorkspace: Story = {
	render: () => <CompleteConsoleDemo initialScreen='console' initialPage='workspace' />,
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await expect(await canvas.findByRole('dialog', { name: '平台使用指南' })).toBeInTheDocument();
		await expect(await canvas.findByRole('dialog', { name: '工作区文件' })).toBeInTheDocument();
		await expect(canvas.getByRole('navigation', { name: '窗口停靠栏' })).toHaveAttribute('data-position', 'right');
	},
};

export const ConsoleDemo: Story = {
	render: () => <CompleteConsoleDemo />,
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const body = within(canvasElement.ownerDocument.body);
		await userEvent.click(canvas.getByRole('button', { name: '现在注册' }));
		await expect(canvas.getByRole('heading', { level: 1, name: '创建工作区账号' })).toBeInTheDocument();
		await userEvent.click(canvas.getByRole('button', { name: '注册并创建工作区' }));
		await expect(await canvas.findByRole('heading', { level: 1, name: '首页' })).toBeInTheDocument();

		const accountMenu = canvas.getByRole('button', { name: '账户菜单，有新通知' });
		await userEvent.click(accountMenu);
		await userEvent.click(await body.findByRole('menuitem', { name: '个人资料' }));
		await expect(await canvas.findByRole('heading', { level: 1, name: '显示设置' })).toBeInTheDocument();
		await userEvent.click(accountMenu);
		await userEvent.click(await body.findByRole('menuitem', { name: '退出登录' }));
		await expect(canvas.getByRole('heading', { level: 1, name: '登录工作区' })).toBeInTheDocument();
		await expect(canvas.getByLabelText('邮箱')).toHaveValue('lin@example.com');
		await userEvent.type(canvas.getByLabelText('密码'), 'wrong-password');
		await userEvent.click(canvas.getByRole('button', { name: '登录' }));
		await expect(await canvas.findByRole('alert')).toHaveTextContent('邮箱或密码不正确');
		await userEvent.clear(canvas.getByLabelText('密码'));
		await userEvent.type(canvas.getByLabelText('密码'), 'registered-demo');
		await userEvent.click(canvas.getByRole('button', { name: '登录' }));
		await expect(await canvas.findByRole('heading', { level: 1, name: '首页' })).toBeInTheDocument();

		await expect(canvas.getByRole('link', { name: '工作台' })).toHaveAttribute('href', '/console');
		await expect(canvas.getByRole('link', { name: '文件' })).toHaveAttribute('href', '/file');
		await expect(canvas.getByRole('link', { name: '系统管理' })).toHaveAttribute('href', '/admin');
		await expect(canvas.getByRole('link', { name: '平台管理' })).toHaveAttribute('href', '/meta/admin');
		await expect(canvas.getByRole('link', { name: '用户设置' })).toHaveAttribute('href', '/user/settings');

		await navigateWithFirstLink(canvas, '客户');
		await expect(await canvas.findByRole('heading', { level: 1, name: '客户' })).toBeInTheDocument();
		await userEvent.click(canvas.getByRole('button', { name: '新建客户' }));
		await userEvent.clear(canvas.getByLabelText('客户名称'));
		await userEvent.type(canvas.getByLabelText('客户名称'), '星河数据');
		await userEvent.type(canvas.getByLabelText('负责人'), '韩梅');
		await userEvent.selectOptions(canvas.getByLabelText('状态'), 'active');
		await userEvent.click(canvas.getByRole('button', { name: '保存客户' }));
		await expect(await canvas.findByText('星河数据')).toBeInTheDocument();
		await expect(await canvas.findByRole('status')).toHaveTextContent('客户已创建');
		await userEvent.click(canvas.getByRole('button', { name: '编辑 星河数据' }));
		await userEvent.clear(canvas.getByLabelText('客户名称'));
		await userEvent.type(canvas.getByLabelText('客户名称'), '星河数据更新');
		await userEvent.click(canvas.getByRole('button', { name: '保存客户' }));
		await expect(await canvas.findByText('星河数据更新')).toBeInTheDocument();

		await navigateWithFirstLink(canvas, '联系人');
		await userEvent.click(canvas.getByRole('button', { name: '新建联系人' }));
		await userEvent.type(canvas.getByLabelText('联系人姓名'), '韩梅');
		const customerSelect = canvas.getByLabelText('所属客户');
		await userEvent.selectOptions(customerSelect, within(customerSelect).getByRole('option', { name: '星河数据更新' }));
		await userEvent.type(canvas.getByLabelText('职位'), '数据负责人');
		await userEvent.type(canvas.getByLabelText('Email'), 'han@example.com');
		await userEvent.type(canvas.getByLabelText('电话'), '13800000009');
		await userEvent.click(canvas.getByRole('button', { name: '保存联系人' }));
		await expect(await canvas.findByText('han@example.com')).toBeInTheDocument();
		await expect(await canvas.findByRole('status')).toHaveTextContent('联系人已创建');

		await navigateWithFirstLink(canvas, '客户');
		await userEvent.click(canvas.getByRole('button', { name: '删除 星河数据更新' }));
		await userEvent.click(canvas.getByRole('button', { name: '确认删除' }));
		await expect(await canvas.findByRole('status')).toHaveTextContent('客户及其联系人已删除');
		await navigateWithFirstLink(canvas, '联系人');
		await expect(canvas.queryByText('han@example.com')).not.toBeInTheDocument();
		await userEvent.click(canvas.getByRole('button', { name: '重置演示数据' }));
		await expect(await canvas.findByText('lin@example.com')).toBeInTheDocument();

		await navigateWithFirstLink(canvas, '文件');
		await expect(await canvas.findByRole('heading', { level: 1, name: '文件' })).toBeInTheDocument();
		await expect(await canvas.findByRole('button', { name: 'README.md' })).toBeInTheDocument();
		await navigateWithFirstLink(canvas, '系统管理');
		await expect(await canvas.findByRole('heading', { level: 1, name: '系统用户' })).toBeInTheDocument();
		await navigateWithFirstLink(canvas, '系统设置');
		await expect(await canvas.findByRole('heading', { level: 1, name: '系统设置' })).toBeInTheDocument();
		await navigateWithFirstLink(canvas, '平台管理');
		await expect(await canvas.findByRole('heading', { level: 1, name: '租户' })).toBeInTheDocument();
		await navigateWithFirstLink(canvas, '用户设置');
		await expect(await canvas.findByRole('heading', { level: 1, name: '显示设置' })).toBeInTheDocument();
		await navigateWithFirstLink(canvas, '系统信息');
		await expect(await canvas.findByRole('heading', { level: 1, name: '系统信息' })).toBeInTheDocument();
		await expect(canvas.getByRole('navigation', { name: '窗口停靠栏' })).toHaveAttribute('data-position', 'right');
	},
	parameters: {
		docs: {
			description: {
				story: '完整 mock 流程：注册、登录、工作台、文件、系统管理、平台管理、用户设置与右侧窗口 Dock。',
			},
		},
	},
};

export const Console: Story = {
	render: () => <CompleteConsoleDemo dataPartition='manual' resetDataOnMount={false} />,
	parameters: {
		docs: {
			description: {
				story: '无自动 play 的完整 Console。使用固定 IndexedDB manual 分区，刷新后保留登录后的客户与联系人操作。',
			},
		},
	},
};

export const SettingsWorkspace: Story = {
	args: {
		initialPage: 'preferences',
	},
};

async function navigateWithFirstLink(canvas: ReturnType<typeof within>, name: string) {
	const links = canvas.getAllByRole('link', { name: new RegExp(`^${escapeRegExp(name)}(?:\\s|$)`) });
	await userEvent.click(links[0]);
}

function escapeRegExp(value: string) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

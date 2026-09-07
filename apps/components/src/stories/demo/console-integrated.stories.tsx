import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { ConsoleWorkspaceDemo } from './ConsoleWorkspaceDemo';
import { ConsoleDemo as CompleteConsoleDemo } from './console-demo';

const meta = {
	id: 'console-integrated',
	title: 'Demo/Console Integration',
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
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await expect(canvas.queryByText('Wener Console / Platform')).not.toBeInTheDocument();
		await expect(canvas.getByRole('region', { name: '资源工作区' })).toBeInTheDocument();
		await userEvent.click(canvas.getByRole('row', { name: 'core-postgres' }));
		await expect(canvas.getByRole('complementary', { name: '资源概要' })).toHaveTextContent('core-postgres');
		if ((canvasElement.ownerDocument.defaultView?.innerWidth ?? 1024) < 1024) {
			await userEvent.keyboard('{Escape}');
		}
		await userEvent.click(canvas.getByRole('button', { name: '列表视图' }));
		await expect(canvasElement.querySelector('[data-slot="data-view-list"]')).not.toBeNull();
		if (canvas.queryByRole('button', { name: '关闭概要' })) {
			await userEvent.click(canvas.getByRole('button', { name: '关闭概要' }));
		}
	},
};

export const WindowWorkspace: Story = {
	render: () => <CompleteConsoleDemo initialScreen='console' initialPage='workspace' />,
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await expect(await canvas.findByRole('dialog', { name: '平台使用指南' }, { timeout: 10_000 })).toBeInTheDocument();
		await expect(await canvas.findByRole('dialog', { name: '工作区文件' }, { timeout: 10_000 })).toBeInTheDocument();
		await expect(canvas.getByRole('navigation', { name: '窗口停靠栏' })).toHaveAttribute('data-position', 'right');
	},
};

export const ConsoleDemo: Story = {
	render: () => <CompleteConsoleDemo />,
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const body = within(canvasElement.ownerDocument.body);
		await expect(canvas.getByRole('button', { name: '登录' })).toBeEnabled();
		await userEvent.click(canvas.getByRole('button', { name: '现在注册' }));
		await expect(canvas.getByRole('heading', { level: 1, name: '创建工作区账号' })).toBeInTheDocument();
		await userEvent.click(canvas.getByRole('button', { name: '注册并创建工作区' }));
		await expect(
			await canvas.findByRole('heading', { level: 1, name: '首页' }, { timeout: 10_000 }),
		).toBeInTheDocument();

		const accountMenu = canvas.getByRole('button', { name: '账户菜单，有新通知' });
		await userEvent.click(accountMenu);
		await userEvent.click(await body.findByRole('menuitem', { name: '个人资料' }));
		await expect(await canvas.findByRole('heading', { level: 1, name: '显示设置' })).toBeInTheDocument();
		await userEvent.click(accountMenu);
		await userEvent.click(await body.findByRole('menuitem', { name: '退出登录' }));
		await expect(canvas.getByRole('heading', { level: 1, name: '登录工作区' })).toBeInTheDocument();
		await expect(canvas.getByLabelText('邮箱')).toHaveValue('lin@example.com');
		await userEvent.clear(canvas.getByLabelText('密码'));
		await userEvent.type(canvas.getByLabelText('密码'), 'wrong-password');
		await userEvent.click(canvas.getByRole('button', { name: '登录' }));
		await expect(await canvas.findByRole('alert')).toHaveTextContent('邮箱或密码不正确');
		await userEvent.clear(canvas.getByLabelText('密码'));
		await userEvent.type(canvas.getByLabelText('密码'), 'registered-demo');
		await userEvent.click(canvas.getByRole('button', { name: '登录' }));
		await expect(
			await canvas.findByRole('heading', { level: 1, name: '首页' }, { timeout: 10_000 }),
		).toBeInTheDocument();

		await expect(canvas.getByRole('link', { name: '工作台' })).toHaveAttribute('href', '/console');
		await expect(canvas.getByRole('link', { name: '文件' })).toHaveAttribute('href', '/file');
		await expect(canvas.getByRole('link', { name: '系统管理' })).toHaveAttribute('href', '/admin');
		await expect(canvas.getByRole('link', { name: '平台管理' })).toHaveAttribute('href', '/meta/admin');
		await expect(canvas.getByRole('link', { name: '用户设置' })).toHaveAttribute('href', '/user/settings');
		const globalNavigation = within(canvas.getByLabelText('全局导航'));
		for (const link of globalNavigation.getAllByRole('link')) await expect(link).not.toHaveAttribute('aria-current');

		await navigateWithFirstLink(canvas, '客户');
		await expect(await canvas.findByRole('heading', { level: 1, name: '客户' })).toBeInTheDocument();
		await expect(canvas.queryByText('Wener Console / 工作台')).not.toBeInTheDocument();
		await expect(canvas.getByRole('table', { name: '客户列表' })).toBeInTheDocument();
		const customerHeader = canvasElement.querySelector<HTMLElement>('[data-slot="data-view-layout-header"]');
		const customerFooter = canvasElement.querySelector<HTMLElement>('[data-slot="data-view-layout-footer"]');
		await expect(customerHeader).not.toBeNull();
		await expect(customerFooter).not.toBeNull();
		await expect(within(customerHeader as HTMLElement).queryByText('128 条')).not.toBeInTheDocument();
		await waitFor(() => expect(within(customerFooter as HTMLElement).getByText('1-20')).toBeInTheDocument(), {
			timeout: 10_000,
		});
		await expect(within(customerFooter as HTMLElement).getByText('总数 128')).toBeInTheDocument();
		await expect(within(customerFooter as HTMLElement).getByRole('combobox', { name: '每页数量' })).toHaveValue('20');
		if ((canvasElement.ownerDocument.defaultView?.innerWidth ?? 1024) < 768) {
			await expect(canvas.getByRole('navigation', { name: '当前模块导航' })).toBeVisible();
			await expect(canvas.getByRole('link', { name: /^联系人(?:\s|$)/ })).toBeVisible();
		}
		await userEvent.click(canvas.getByRole('row', { name: '启明科技' }));
		await expect(canvas.getByRole('complementary', { name: '客户概要' })).toHaveTextContent('启明科技');
		await userEvent.click(canvas.getByRole('tab', { name: '联系人' }));
		await expect(canvas.getByRole('complementary', { name: '客户概要' })).toHaveTextContent('采购负责人');
		await userEvent.click(canvas.getByRole('button', { name: '关闭概要' }));
		await userEvent.click(canvas.getByRole('button', { name: '新建客户' }));
		await userEvent.clear(canvas.getByLabelText('客户名称'));
		await userEvent.type(canvas.getByLabelText('客户名称'), '星河数据');
		await userEvent.selectOptions(canvas.getByLabelText('负责人'), 'user-0009');
		await userEvent.selectOptions(canvas.getByLabelText('状态'), 'active');
		await userEvent.click(canvas.getByRole('button', { name: '保存客户' }));
		await expect(await canvas.findByText('星河数据')).toBeInTheDocument();
		await expect(await canvas.findByText('客户已创建', { selector: '[role="status"]' })).toBeInTheDocument();
		await expect(canvas.getByText('总数 129')).toBeInTheDocument();
		await expect(await canvas.findByRole('link', { name: '客户 129' }, { timeout: 5_000 })).toBeInTheDocument();
		await userEvent.click(canvas.getByRole('button', { name: '编辑 星河数据' }));
		await userEvent.clear(canvas.getByLabelText('客户名称'));
		await userEvent.type(canvas.getByLabelText('客户名称'), '星河数据更新');
		await userEvent.click(canvas.getByRole('button', { name: '保存客户' }));
		await expect(await canvas.findByText('星河数据更新')).toBeInTheDocument();

		await navigateWithFirstLink(canvas, '联系人');
		await expect(canvas.getByRole('table', { name: '联系人列表' })).toBeInTheDocument();
		await userEvent.click(await findPointerReadyElement(canvas.getByRole('button', { name: '新建联系人' })));
		await userEvent.type(canvas.getByLabelText('联系人姓名'), '韩梅');
		const customerSelect = canvas.getByLabelText('所属客户');
		await userEvent.selectOptions(customerSelect, within(customerSelect).getByRole('option', { name: '星河数据更新' }));
		await userEvent.type(canvas.getByLabelText('职位'), '数据负责人');
		await userEvent.type(canvas.getByLabelText('Email'), 'han@example.com');
		await userEvent.type(canvas.getByLabelText('电话'), '13800000009');
		await userEvent.click(canvas.getByRole('button', { name: '保存联系人' }));
		await expect(
			await canvas.findByText('联系人已创建', { selector: '[role="status"]' }, { timeout: 10_000 }),
		).toBeInTheDocument();
		await waitFor(() => expect(canvas.getByText('总数 357')).toBeInTheDocument(), { timeout: 10_000 });
		await expect(await canvas.findByRole('link', { name: '联系人 357' }, { timeout: 10_000 })).toBeInTheDocument();
		await userEvent.type(canvas.getByRole('textbox', { name: '搜索联系人' }), 'han@example.com');
		await waitFor(() => expect(canvas.getByText('han@example.com')).toBeInTheDocument(), { timeout: 10_000 });

		await navigateWithFirstLink(canvas, '客户');
		await userEvent.click(canvas.getByRole('button', { name: '删除 星河数据更新' }));
		await userEvent.click(canvas.getByRole('button', { name: '确认删除' }));
		await expect(
			await canvas.findByText('客户及其联系人已删除', { selector: '[role="status"]' }, { timeout: 5_000 }),
		).toBeInTheDocument();
		await expect(canvas.getByText('总数 128')).toBeInTheDocument();
		await expect(await canvas.findByRole('link', { name: '客户 128' }, { timeout: 5_000 })).toBeInTheDocument();
		await navigateWithFirstLink(canvas, '联系人');
		await expect(canvas.queryByText('han@example.com')).not.toBeInTheDocument();
		await expect(canvas.getByText('总数 356')).toBeInTheDocument();
		await expect(await canvas.findByRole('link', { name: '联系人 356' }, { timeout: 5_000 })).toBeInTheDocument();
		await userEvent.click(canvas.getByRole('button', { name: '重置演示数据' }));
		await userEvent.type(canvas.getByRole('textbox', { name: '搜索联系人' }), 'lin@example.com');
		await expect(await canvas.findByText('lin@example.com')).toBeInTheDocument();
		await navigateWithFirstLink(canvas, '订单');
		await expect(await canvas.findByRole('heading', { level: 1, name: '订单' })).toBeInTheDocument();
		await expect(canvas.queryByText('Wener Console / 工作台')).not.toBeInTheDocument();
		await expect(canvas.getByRole('table', { name: '订单列表' })).toBeInTheDocument();
		await expect(canvas.getByText('1-20')).toBeInTheDocument();
		await expect(canvas.getByText('总数 24')).toBeInTheDocument();
		await userEvent.click(canvas.getByRole('row', { name: 'ORD-2026-0188' }));
		await expect(canvas.getByRole('complementary', { name: '订单概要' })).toHaveTextContent('ORD-2026-0188');
		await userEvent.click(canvas.getByRole('button', { name: '关闭概要' }));
		await expect(canvasElement.ownerDocument.documentElement.scrollWidth).toBeLessThanOrEqual(
			canvasElement.ownerDocument.documentElement.clientWidth,
		);
		await userEvent.type(canvas.getByRole('textbox', { name: '搜索' }), '0188');
		await expect(canvas.getByText('1-1')).toBeInTheDocument();
		await expect(canvas.getByText('总数 1')).toBeInTheDocument();
		await expect(canvas.queryByText('ORD-2026-0187')).not.toBeInTheDocument();
		await navigateWithFirstLink(canvas, '商机');
		await expect(canvas.getByRole('textbox', { name: '搜索' })).toHaveValue('');
		await expect(canvas.getByText('1-18')).toBeInTheDocument();
		await expect(canvas.getByText('总数 18')).toBeInTheDocument();

		await navigateWithFirstLink(canvas, '文件');
		await expect(canvas.queryByText('Wener Console / 文件')).not.toBeInTheDocument();
		await expect(canvas.queryByText('管理当前工作区中的文档、项目配置与上传内容。')).not.toBeInTheDocument();
		await expect(canvas.queryByRole('heading', { level: 1, name: '文件' })).not.toBeInTheDocument();
		await expect(canvasElement.querySelector('[data-file-manager]')).toBeInTheDocument();
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

async function findPointerReadyElement<T extends HTMLElement>(element: T) {
	const view = element.ownerDocument.defaultView;
	await waitFor(() => {
		for (let current: HTMLElement | null = element; current; current = current.parentElement) {
			expect(view?.getComputedStyle(current).pointerEvents).not.toBe('none');
			if (current === element.ownerDocument.body) break;
		}
	});
	return element;
}

function escapeRegExp(value: string) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

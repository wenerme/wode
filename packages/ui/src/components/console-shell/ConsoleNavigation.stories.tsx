import type { Meta, StoryObj } from '@storybook/react-vite';
import { Files, Home, Settings } from 'lucide-react';
import { useState } from 'react';
import { expect, waitFor, within } from 'storybook/test';
import { ConsoleMainHeader, ConsoleMainLayout } from './ConsoleMainLayout';
import { ConsoleModuleNavigationDrawer } from './ConsoleModuleNavigationDrawer';
import { ConsoleNavigationModule } from './ConsoleNavigationModule';
import { ConsoleNavigationRail } from './ConsoleNavigationRail';
import type { ConsoleNavigationLinkComponent } from './ConsoleShell';
import { ConsoleShellLayout } from './ConsoleShellLayout';

const meta = {
	title: 'Console/Navigation',
	component: ConsoleNavigationModule,
	parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof ConsoleNavigationModule>;
export default meta;
type Story = StoryObj<typeof meta>;
const brand = { label: '工作区', icon: <Files aria-hidden /> };
const entries = [
	{ title: '内容管理' },
	{ href: '#documents', label: '文档', icon: <Files aria-hidden /> },
	{ href: '#settings', label: '设置', icon: <Settings aria-hidden /> },
] as const;

function NavigationExample() {
	const [path, setPath] = useState('#documents');
	const items = entries.map((entry) => ('href' in entry ? { ...entry, active: entry.href === path } : entry));
	const Link: ConsoleNavigationLinkComponent = ({ href, onClick, ...props }) => (
		<a
			{...props}
			href={href}
			onClick={(event) => {
				event.preventDefault();
				onClick?.(event);
				setPath(href);
			}}
		/>
	);
	return (
		<div className='h-[560px]'>
			<ConsoleShellLayout>
				<ConsoleNavigationRail
					top={[{ id: 'home', href: '#home', label: '首页', icon: <Home aria-hidden /> }]}
					items={[
						{
							id: 'documents',
							href: '#documents',
							label: '文档空间',
							icon: <Files aria-hidden />,
							active: path === '#documents',
						},
					]}
					bottom={[{ id: 'settings', href: '#settings', label: '偏好设置', icon: <Settings aria-hidden /> }]}
					linkComponent={Link}
				/>
				<ConsoleNavigationModule brand={brand} items={items} linkComponent={Link} />
				<ConsoleModuleNavigationDrawer brand={brand} items={items} linkComponent={Link} />
				<ConsoleMainLayout header={<ConsoleMainHeader title='导航示例' />}>
					<div className='space-y-3 p-6'>
						<p>将预览窗口缩窄到 768px 以下，模块导航会切换为抽屉入口。</p>
						<output aria-label='当前页面'>{path}</output>
					</div>
				</ConsoleMainLayout>
			</ConsoleShellLayout>
		</div>
	);
}
export const Responsive: Story = {
	args: { brand, items: entries },
	render: () => <NavigationExample />,
	play: async ({ canvas, canvasElement, userEvent }) => {
		const trigger = canvas.queryByRole('button', { name: /^模块导航：/ });
		if (trigger) {
			await userEvent.click(trigger);
			const body = within(canvasElement.ownerDocument.body);
			const dialog = await body.findByRole('dialog', { name: '工作区' });
			await expect(dialog).toBeVisible();
			await userEvent.click(within(dialog).getByRole('link', { name: '设置' }));
			await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument());
		} else {
			await userEvent.click(canvas.getByRole('button', { name: '收起模块导航' }));
			await expect(canvas.getByRole('button', { name: '展开模块导航' })).toHaveAttribute('aria-expanded', 'false');
			await userEvent.click(canvas.getByRole('link', { name: '偏好设置' }));
		}
		await expect(canvas.getByLabelText('当前页面')).toHaveTextContent('#settings');
	},
};

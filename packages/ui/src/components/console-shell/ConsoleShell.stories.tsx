import type { Meta, StoryObj } from '@storybook/react-vite';
import { Files, Home, PanelLeftClose, PanelLeftOpen, Settings } from 'lucide-react';
import { useState } from 'react';
import { expect } from 'storybook/test';
import {
	ConsoleContent,
	ConsoleDock,
	ConsoleHeader,
	ConsoleNavLink,
	ConsolePage,
	ConsoleRail,
	ConsoleRailButton,
	ConsoleRailLink,
	ConsoleRailSection,
	ConsoleShell,
	ConsoleSidebar,
	ConsoleSidebarFooter,
	ConsoleSidebarHeader,
	ConsoleSidebarNav,
	ConsoleStatus,
} from './ConsoleShell';

const meta = {
	title: 'Console/Shell',
	component: ConsoleShell,
	parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof ConsoleShell>;
export default meta;
type Story = StoryObj<typeof meta>;

function ShellExample() {
	const [collapsed, setCollapsed] = useState(false);
	const [selected, setSelected] = useState('文档');
	return (
		<ConsoleShell
			className='h-[640px]'
			rail={
				<ConsoleRail>
					<ConsoleRailSection grow>
						<ConsoleRailLink
							href='#home'
							label='首页'
							icon={<Home aria-hidden />}
							onClick={(e) => {
								e.preventDefault();
								setSelected('首页');
							}}
						/>
					</ConsoleRailSection>
					<ConsoleRailSection>
						<ConsoleRailButton label='设置' icon={<Settings aria-hidden />} onClick={() => setSelected('设置')} />
					</ConsoleRailSection>
				</ConsoleRail>
			}
			sidebar={
				<ConsoleSidebar collapsed={collapsed}>
					<ConsoleSidebarHeader>{collapsed ? <Files aria-label='工作区' /> : '示例工作区'}</ConsoleSidebarHeader>
					<ConsoleSidebarNav>
						<ConsoleNavLink
							href='#documents'
							label='文档'
							icon={<Files aria-hidden />}
							active={selected === '文档'}
							collapsed={collapsed}
							badge='3'
							onClick={(e) => {
								e.preventDefault();
								setSelected('文档');
							}}
						/>
					</ConsoleSidebarNav>
					<ConsoleSidebarFooter>
						<ConsoleStatus>本地示例</ConsoleStatus>
					</ConsoleSidebarFooter>
				</ConsoleSidebar>
			}
			header={
				<ConsoleHeader
					title={selected}
					breadcrumbs='工作区'
					prefix={
						<button
							type='button'
							className='btn btn-ghost btn-sm'
							aria-label='切换侧栏'
							aria-expanded={!collapsed}
							onClick={() => setCollapsed(!collapsed)}
						>
							{collapsed ? <PanelLeftOpen aria-hidden /> : <PanelLeftClose aria-hidden />}
						</button>
					}
				/>
			}
			dock={
				<ConsoleDock>
					<ConsoleRailButton label='查看帮助' icon={<span>?</span>} onClick={() => setSelected('帮助')} />
				</ConsoleDock>
			}
		>
			<ConsoleContent>
				<ConsolePage title={selected} description='导航、页头、侧栏与工具坞均由宿主组合。'>
					<div className='bg-base-100 border-base-300 rounded-lg border p-6'>
						此示例仅使用本地状态，切换导航不会发出网络请求。
					</div>
				</ConsolePage>
			</ConsoleContent>
		</ConsoleShell>
	);
}

export const Workspace: Story = {
	render: () => <ShellExample />,
	play: async ({ canvas, userEvent }) => {
		const toggle = canvas.getByRole('button', { name: '切换侧栏' });
		await userEvent.click(toggle);
		await expect(toggle).toHaveAttribute('aria-expanded', 'false');
		await userEvent.click(toggle);
		await expect(toggle).toHaveAttribute('aria-expanded', 'true');
		await userEvent.click(canvas.getByRole('button', { name: '设置' }));
		await expect(canvas.getByRole('heading', { name: '设置' })).toBeVisible();
	},
};
export const Dark: Story = { render: () => <ShellExample />, globals: { theme: 'dark' } };

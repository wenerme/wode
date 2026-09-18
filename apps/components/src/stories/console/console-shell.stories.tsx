import type { Meta, StoryObj } from '@storybook/react-vite';
import { Activity, Boxes, ChevronsLeft, ChevronsRight, FileText, Gauge, Settings, Users } from 'lucide-react';
import { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import {
	ConsoleContent,
	ConsoleDock,
	ConsoleHeader,
	ConsoleNavLink,
	ConsolePage,
	ConsoleRail,
	ConsoleRailLink,
	ConsoleRailSection,
	ConsoleShell,
	ConsoleSidebar,
	ConsoleSidebarFooter,
	ConsoleSidebarHeader,
	ConsoleSidebarNav,
} from '@/console/console-shell';

const meta = {
	id: 'console-shell',
	title: 'Console/Shell',
	component: ConsoleShell,
	tags: ['autodocs'],
	parameters: {
		consoleThemeOwner: 'story',
		docs: {
			description: {
				component:
					'A router-agnostic console shell with global rail, collapsible module navigation, content header, and optional utility dock.',
			},
		},
	},
} satisfies Meta<typeof ConsoleShell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Expanded: Story = {
	render: () => <ConsoleShellStory />,
	play: async ({ canvasElement }) => {
		const sidebar = canvasElement.querySelector<HTMLElement>('aside[aria-label="模块导航"]');
		expect(sidebar).not.toBeNull();
		if ((canvasElement.ownerDocument.defaultView?.innerWidth ?? 1024) < 768) {
			await expect(sidebar as HTMLElement).not.toBeVisible();
			return;
		}
		const canvas = within(canvasElement);
		await userEvent.click(canvas.getByRole('button', { name: '收起模块导航' }));
		await expect(sidebar as HTMLElement).toHaveAttribute('data-collapsed', 'true');
		await expect(canvas.getByRole('button', { name: '展开模块导航' })).toBeVisible();
		await userEvent.click(canvas.getByRole('button', { name: '展开模块导航' }));
		await expect(sidebar as HTMLElement).not.toHaveAttribute('data-collapsed');
	},
};

export const CollapsedNavigation: Story = {
	render: () => <ConsoleShellStory collapsed />,
	play: async ({ canvasElement }) => {
		const sidebar = canvasElement.querySelector<HTMLElement>('aside[aria-label="模块导航"]');
		expect(sidebar).not.toBeNull();
		if ((canvasElement.ownerDocument.defaultView?.innerWidth ?? 1024) >= 768)
			await expect(sidebar as HTMLElement).toHaveAttribute('data-collapsed', 'true');
	},
};

export const Mobile: Story = {
	parameters: {
		viewport: { defaultViewport: 'mobile2' },
	},
	render: () => <ConsoleShellStory />,
};

function ConsoleShellStory({ collapsed: initialCollapsed = false }: { collapsed?: boolean }) {
	const [collapsed, setCollapsed] = useState(initialCollapsed);
	return (
		<ConsoleShell
			rail={
				<ConsoleRail>
					<ConsoleRailSection>
						<ConsoleRailLink active href='#workspace' icon={<Gauge className='size-4' />} label='工作台' />
						<ConsoleRailLink href='#resources' icon={<Boxes className='size-4' />} label='资源' />
					</ConsoleRailSection>
					<ConsoleRailSection grow>
						<ConsoleRailLink href='#members' icon={<Users className='size-4' />} label='成员' />
					</ConsoleRailSection>
					<ConsoleRailSection>
						<ConsoleRailLink href='#settings' icon={<Settings className='size-4' />} label='设置' />
					</ConsoleRailSection>
				</ConsoleRail>
			}
			sidebar={
				<ConsoleSidebar collapsed={collapsed}>
					<ConsoleSidebarHeader>
						<div className='bg-neutral text-neutral-content grid size-8 place-items-center rounded-sm'>W</div>
						{collapsed ? null : <span className='truncate text-sm font-semibold'>Platform</span>}
					</ConsoleSidebarHeader>
					<ConsoleSidebarNav>
						<ConsoleNavLink
							active
							collapsed={collapsed}
							href='#overview'
							icon={<Gauge className='size-4' />}
							label='概览'
						/>
						<ConsoleNavLink
							collapsed={collapsed}
							href='#activity'
							icon={<Activity className='size-4' />}
							label='活动'
						/>
						<ConsoleNavLink
							collapsed={collapsed}
							href='#documents'
							icon={<FileText className='size-4' />}
							label='文档'
						/>
					</ConsoleSidebarNav>
					<ConsoleSidebarFooter>
						<button
							type='button'
							aria-label={collapsed ? '展开模块导航' : '收起模块导航'}
							data-tip={collapsed ? '展开模块导航' : undefined}
							className={`text-base-content/65 hover:bg-base-200 flex h-9 w-full items-center justify-center gap-2 rounded-md text-xs ${collapsed ? 'tooltip tooltip-right' : ''}`}
							onClick={() => setCollapsed((value) => !value)}
						>
							{collapsed ? <ChevronsRight className='size-4' /> : <ChevronsLeft className='size-4' />}
							{collapsed ? null : '收起导航'}
						</button>
					</ConsoleSidebarFooter>
				</ConsoleSidebar>
			}
			header={
				<ConsoleHeader
					breadcrumbs='工作台 / 概览'
					title='资源运营'
					actions={
						<button className='btn btn-neutral btn-sm' type='button'>
							新建资源
						</button>
					}
				/>
			}
			dock={
				<ConsoleDock>
					<button aria-label='通知' className='btn btn-ghost btn-square btn-sm' type='button'>
						<Activity className='size-4' />
					</button>
				</ConsoleDock>
			}
		>
			<ConsoleContent>
				<ConsolePage
					description='在不引入应用路由或资源工作台的前提下，验证 rail、sidebar、header 与 dock 的布局边界。'
					title='运行概览'
				>
					<div className='grid gap-px border sm:grid-cols-3'>
						{[
							['在线服务', '24'],
							['待处理事件', '7'],
							['今日请求', '1.82M'],
						].map(([label, value]) => (
							<div key={label} className='bg-base-100 p-4'>
								<div className='text-base-content/60 text-xs'>{label}</div>
								<div className='mt-2 text-2xl font-semibold'>{value}</div>
							</div>
						))}
					</div>
				</ConsolePage>
			</ConsoleContent>
		</ConsoleShell>
	);
}

import { HiCog, HiHome, HiInformationCircle, HiUser } from 'react-icons/hi2';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { IconSidebarLayout } from './IconSidebarLayout';

const meta: Meta<typeof IconSidebarLayout.Layout> = {
	title: 'components/LeftSideMenuBarLayout',
	component: IconSidebarLayout.Layout,
	parameters: {
		layout: 'fullscreen',
	},
};

export default meta;

type Story = StoryObj<typeof meta>;

const sampleItems = [
	{
		title: '首页',
		href: '/',
		icon: <HiHome />,
	},
	{
		title: '用户',
		href: '/users',
		icon: <HiUser />,
	},
	{
		title: '设置',
		href: '/settings',
		icon: <HiCog />,
	},
	{
		title: '帮助',
		href: '/help',
		icon: <HiInformationCircle />,
	},
];

export const Default: Story = {
	args: {
		top: sampleItems.slice(0, 1),
		center: [...sampleItems, ...sampleItems, ...sampleItems],
		bottom: sampleItems.slice(3),
		className: 'h-screen',
		children: (
			<div className='bg-base-100 flex h-full items-center justify-center p-8'>
				<div className='text-center'>
					<h1 className='mb-4 text-2xl font-bold'>IconSidebarLayout Demo</h1>
					<p className='text-base-content/70'>
						This is the main content area. The left sidebar contains navigation icons.
					</p>
				</div>
			</div>
		),
	},
};

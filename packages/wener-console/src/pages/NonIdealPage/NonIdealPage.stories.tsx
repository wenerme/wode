import { BiError } from 'react-icons/bi';
import { GrDocumentMissing } from 'react-icons/gr';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { NonIdealPage } from './NonIdealPage';

const meta: Meta<typeof NonIdealPage.Layout> = {
	title: 'pages/NonIdealPage',
	component: NonIdealPage.Layout,
	parameters: {
		layout: 'fullscreen',
	},
	tags: ['autodocs'],
	decorators: [
		(Story) => (
			<div className='h-screen'>
				<Story />
			</div>
		),
	],
};

export default meta;
type Story = StoryObj<typeof NonIdealPage.Layout>;

export const Default: Story = {
	args: {
		icon: <GrDocumentMissing className={'h-12 w-12'} />,
		title: '页面不存在',
		description: '当前页面地址不存在或已被移除',
	},
};

export const WithCustomAction: Story = {
	args: {
		icon: <BiError className={'h-12 w-12'} />,
		title: '发生错误',
		description: '页面加载时发生错误',
		action: (
			<div className='flex gap-2'>
				<button className='btn btn-sm'>重试</button>
				<button className='btn btn-sm btn-outline'>返回</button>
			</div>
		),
	},
};

export const PageNotFoundStory: Story = {
	render: () => {
		return <NonIdealPage.PageNotFound />;
	},
};

export const ServerErrorStory: Story = {
	render: () => {
		return <NonIdealPage.ServerError statusCode='500' />;
	},
};

export const ServerErrorWithCustomStatus: Story = {
	render: () => {
		return <NonIdealPage.ServerError statusCode='503' />;
	},
};

export const LayoutWithChildren: Story = {
	args: {
		icon: <GrDocumentMissing className={'h-12 w-12'} />,
		title: '页面不存在',
		description: '当前页面地址不存在或已被移除',
		children: (
			<div className='mt-4'>
				<small className='text-gray-500'>Additional information can go here</small>
			</div>
		),
	},
};

import type { Meta, StoryObj } from '@storybook/react-vite';
import { Divider } from './index';

const meta = { title: 'Primitive/Divider', component: Divider, tags: ['autodocs'] } satisfies Meta<typeof Divider>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
	render: () => (
		<div className='w-80'>
			<p>第一部分</p>
			<Divider>或者</Divider>
			<p>第二部分</p>
			<Divider tone='primary' />
		</div>
	),
};
export const Vertical: Story = {
	render: () => (
		<div className='flex h-24 items-stretch'>
			<span>左侧</span>
			<Divider vertical tone='neutral' />
			<span>右侧</span>
		</div>
	),
};

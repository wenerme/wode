import type { Meta, StoryObj } from '@storybook/react-vite';
import { Separator } from './index';

const meta = { title: 'Primitive/Separator', component: Separator, tags: ['autodocs'] } satisfies Meta<
	typeof Separator
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
	render: () => (
		<div className='grid w-80 gap-3'>
			<p>个人资料</p>
			<Separator />
			<p>偏好设置</p>
		</div>
	),
};
export const Vertical: Story = {
	render: () => (
		<div className='flex h-16 items-stretch gap-3'>
			<span>总览</span>
			<Separator orientation='vertical' />
			<span>明细</span>
		</div>
	),
};

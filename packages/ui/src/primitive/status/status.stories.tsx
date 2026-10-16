import type { Meta, StoryObj } from '@storybook/react-vite';
import { Status } from './index';

const meta = { title: 'Primitive/Status', component: Status, tags: ['autodocs'] } satisfies Meta<typeof Status>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
	render: () => (
		<p className='flex items-center gap-2'>
			<Status tone='success' aria-hidden='true' />
			在线
		</p>
	),
};
export const StatesAndSizes: Story = {
	render: () => (
		<div className='flex items-center gap-6'>
			<span>
				<Status size='xs' tone='neutral' aria-hidden='true' /> 离线
			</span>
			<span>
				<Status size='md' tone='warning' aria-hidden='true' /> 忙碌
			</span>
			<span>
				<Status size='xl' tone='error' aria-hidden='true' /> 连接中断
			</span>
		</div>
	),
};

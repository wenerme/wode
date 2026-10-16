import type { Meta, StoryObj } from '@storybook/react-vite';
import { Progress } from './index';

const meta = { title: 'Primitive/Progress', component: Progress, tags: ['autodocs'] } satisfies Meta<typeof Progress>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
	args: { value: 45, max: 100, tone: 'primary', 'aria-label': '导入进度', className: 'w-80' },
};
export const States: Story = {
	render: () => (
		<div className='grid w-80 gap-4'>
			<label>
				等待开始
				<Progress value={0} max={100} aria-label='等待开始' />
			</label>
			<label>
				已完成
				<Progress value={100} max={100} tone='success' aria-label='已完成' />
			</label>
			<label>
				进度未知
				<Progress max={100} tone='info' aria-label='进度未知' />
			</label>
		</div>
	),
};

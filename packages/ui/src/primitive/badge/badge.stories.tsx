import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge } from './index';

const meta = { title: 'Primitive/Badge', component: Badge, tags: ['autodocs'] } satisfies Meta<typeof Badge>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = { args: { tone: 'success', children: '已完成' } };
export const Variants: Story = {
	render: () => (
		<div className='flex flex-wrap items-center gap-3'>
			<Badge size='xs' variant='outline'>
				草稿
			</Badge>
			<Badge size='sm' tone='info' variant='soft'>
				处理中
			</Badge>
			<Badge size='lg' tone='warning' variant='dash'>
				待确认
			</Badge>
			<Badge size='xl' variant='ghost'>
				归档
			</Badge>
			<Badge tone='error' role='img' aria-label='有未读消息' />
		</div>
	),
};

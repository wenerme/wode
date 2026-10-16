import type { Meta, StoryObj } from '@storybook/react-vite';
import { Skeleton } from './index';

const meta = { title: 'Primitive/Skeleton', component: Skeleton, tags: ['autodocs'] } satisfies Meta<typeof Skeleton>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
	render: () => (
		<div className='grid w-80 gap-4' role='status' aria-label='正在加载资料'>
			<div className='flex gap-4' aria-hidden='true'>
				<Skeleton className='size-12 rounded-full' />
				<div className='grid flex-1 gap-2'>
					<Skeleton className='h-4 w-24' />
					<Skeleton className='h-4 w-full' />
				</div>
			</div>
			<Skeleton className='h-32 w-full' aria-hidden='true' />
			<span className='sr-only'>正在加载资料</span>
		</div>
	),
};
export const Text: Story = {
	render: () => (
		<div role='status'>
			<Skeleton text>正在加载文章摘要……</Skeleton>
		</div>
	),
};

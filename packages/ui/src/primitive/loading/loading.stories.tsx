import type { Meta, StoryObj } from '@storybook/react-vite';
import { Loading, Spinner } from './index';

const meta = { title: 'Primitive/Loading', component: Loading, tags: ['autodocs'] } satisfies Meta<typeof Loading>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
	render: () => (
		<div role='status' className='flex items-center gap-2'>
			<Spinner aria-hidden='true' />
			正在加载内容
		</div>
	),
};
export const Variants: Story = {
	render: () => (
		<div className='flex flex-wrap gap-6'>
			{(['spinner', 'dots', 'ring', 'ball', 'bars', 'infinity'] as const).map((variant) => (
				<div key={variant} className='grid justify-items-center gap-2'>
					<Loading variant={variant} size='lg' aria-hidden='true' />
					<span>{variant}</span>
				</div>
			))}
		</div>
	),
};
export const Sizes: Story = {
	render: () => (
		<div className='flex items-center gap-4'>
			{(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((size) => (
				<div key={size}>
					<Loading size={size} aria-hidden='true' />
					<span className='sr-only'>加载动画</span> {size}
				</div>
			))}
		</div>
	),
};

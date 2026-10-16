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

function ToneMatrix() {
	return (
		<div className='grid max-w-3xl gap-5'>
			{(['default', 'outline', 'dash', 'soft', 'ghost'] as const).map((variant) => (
				<section key={variant} aria-label={`${variant} badges`} className='grid gap-2'>
					<h2 className='font-semibold'>{variant}</h2>
					<div className='flex flex-wrap gap-3'>
						{(
							['default', 'neutral', 'primary', 'secondary', 'accent', 'info', 'success', 'warning', 'error'] as const
						).map((tone) => (
							<Badge key={tone} variant={variant} tone={tone}>
								{tone}
							</Badge>
						))}
					</div>
				</section>
			))}
		</div>
	);
}

export const AllTones: Story = { render: () => <ToneMatrix /> };
export const DarkTones: Story = { render: () => <ToneMatrix />, globals: { theme: 'dark' } };

import type { Meta, StoryObj } from '@storybook/react-vite';
import { CircleCheck, Clock3 } from 'lucide-react';
import { Status } from '../../registry/default/ui/status';

const meta = {
	title: 'UI/Status',
	component: Status,
	tags: ['autodocs'],
	parameters: {
		layout: 'centered',
	},
	args: {
		children: '正常',
		tone: 'success',
		variant: 'plain',
		size: 'sm',
	},
	argTypes: {
		tone: {
			control: 'select',
			options: ['neutral', 'info', 'success', 'warning', 'danger', 'muted'],
		},
		variant: {
			control: 'select',
			options: ['plain', 'soft', 'solid', 'outline'],
		},
		size: {
			control: 'select',
			options: ['xs', 'sm', 'md'],
		},
	},
} satisfies Meta<typeof Status>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const OperationalStates: Story = {
	render: () => (
		<div className='bg-base-100 grid min-w-72 gap-3 p-5'>
			<div className='flex items-center justify-between gap-6'>
				<span className='text-sm font-medium'>数据库主集群</span>
				<Status tone='success'>正常</Status>
			</div>
			<div className='flex items-center justify-between gap-6'>
				<span className='text-sm font-medium'>审计归档</span>
				<Status tone='warning'>等待处理</Status>
			</div>
			<div className='flex items-center justify-between gap-6'>
				<span className='text-sm font-medium'>分析副本</span>
				<Status tone='danger'>离线</Status>
			</div>
			<div className='flex items-center justify-between gap-6'>
				<span className='text-sm font-medium'>配置同步</span>
				<Status tone='info' icon={<Clock3 className='size-3.5' />}>
					同步中
				</Status>
			</div>
			<div className='flex items-center justify-between gap-6'>
				<span className='text-sm font-medium'>历史任务</span>
				<Status tone='muted'>已归档</Status>
			</div>
		</div>
	),
};

export const DenseSurfaces: Story = {
	render: () => (
		<div className='flex flex-wrap items-center gap-2'>
			<Status tone='success' variant='soft' icon={<CircleCheck className='size-3.5' />}>
				已同步
			</Status>
			<Status tone='warning' variant='solid'>
				2 项待审
			</Status>
			<Status tone='danger' variant='outline'>
				离线
			</Status>
			<Status tone='neutral' variant='soft'>
				草稿
			</Status>
		</div>
	),
};

const statusCatalog = [
	['neutral', '待确认'],
	['info', '同步中'],
	['success', '正常'],
	['warning', '待处理'],
	['danger', '离线'],
	['muted', '已归档'],
] as const;

export const AllVariants: Story = {
	render: () => (
		<div className='grid grid-cols-2 items-center gap-x-5 gap-y-3 sm:grid-cols-3'>
			{(['plain', 'soft', 'solid', 'outline'] as const).flatMap((variant) =>
				statusCatalog.map(([tone, label]) => (
					<Status key={`${variant}-${tone}`} tone={tone} variant={variant}>
						{label}
					</Status>
				)),
			)}
		</div>
	),
};

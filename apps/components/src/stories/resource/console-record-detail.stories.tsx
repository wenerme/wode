import type { Meta, StoryObj } from '@storybook/react-vite';
import { ConsoleRecordDetailPage, ConsoleRecordState } from '@/resource/console-record-detail';
import { ContactRecordDemo } from './console-record-detail-demo';
import { playContactRecord } from './console-record-detail-play';

const meta = {
	id: 'console-record-detail',
	title: 'Resource/Record Detail',
	component: ConsoleRecordDetailPage,
	args: {
		header: null,
	},
	parameters: {
		layout: 'fullscreen',
		docs: {
			description: {
				component:
					'适用于 CRM、ERP 与后台系统的高密度记录详情页，提供身份头、命令栏、页签、事实字段、活动与关联记录布局。',
			},
		},
	},
} satisfies Meta<typeof ConsoleRecordDetailPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Contact: Story = {
	render: () => <ContactRecordDemo />,
	play: playContactRecord,
};

export const States: Story = {
	render: () => (
		<main className='bg-base-300 grid min-h-screen gap-px lg:grid-cols-3'>
			<h1 className='sr-only'>记录详情状态</h1>
			<div className='bg-base-100'>
				<ConsoleRecordState state='loading' description='正在同步联系人、活动和关联业务数据。' />
			</div>
			<div className='bg-base-100'>
				<ConsoleRecordState title='未找到联系人' description='该记录可能已归档，或当前账号没有查看权限。' />
			</div>
			<div className='bg-base-100'>
				<ConsoleRecordState
					state='error'
					description='服务暂时不可用，请稍后重试。'
					actions={
						<button className='btn btn-sm' type='button'>
							重试
						</button>
					}
				/>
			</div>
		</main>
	),
};

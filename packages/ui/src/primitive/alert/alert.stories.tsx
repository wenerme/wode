import type { Meta, StoryObj } from '@storybook/react-vite';
import { Alert, AlertDescription, AlertTitle } from './index';

const meta = { title: 'Primitive/Alert', component: Alert, tags: ['autodocs'] } satisfies Meta<typeof Alert>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		tone: 'info',
		children: (
			<div>
				<AlertTitle>离线演示</AlertTitle>
				<AlertDescription>所有内容均在本地展示。</AlertDescription>
			</div>
		),
	},
};
export const Variants: Story = {
	render: () => (
		<div className='grid gap-4'>
			<Alert tone='success' variant='soft'>
				<span>保存成功</span>
			</Alert>
			<Alert tone='warning' variant='outline'>
				<span>有尚未保存的修改</span>
			</Alert>
			<Alert tone='error' variant='dash' direction='vertical'>
				<AlertTitle>导入失败</AlertTitle>
				<AlertDescription>请检查文件格式。</AlertDescription>
			</Alert>
		</div>
	),
};

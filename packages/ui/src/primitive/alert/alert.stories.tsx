import type { Meta, StoryObj } from '@storybook/react-vite';
import { assertTextContrast } from '../story-contrast';
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

function ToneMatrix() {
	return (
		<div className='grid w-full max-w-4xl gap-5'>
			{(['default', 'outline', 'dash', 'soft'] as const).map((variant) => (
				<section key={variant} aria-label={`${variant} alerts`} className='grid gap-2'>
					<h2 className='font-semibold'>{variant}</h2>
					{(['default', 'info', 'success', 'warning', 'error'] as const).map((tone) => (
						<Alert key={tone} variant={variant} tone={tone}>
							<span>{tone}：提示内容与操作状态。</span>
						</Alert>
					))}
				</section>
			))}
		</div>
	);
}

export const AllTones: Story = {
	render: () => <ToneMatrix />,
	play: ({ canvasElement }) => assertTextContrast(canvasElement.querySelectorAll<HTMLElement>('[data-slot="alert"]')),
};
export const DarkTones: Story = { ...AllTones, globals: { theme: 'dark' } };

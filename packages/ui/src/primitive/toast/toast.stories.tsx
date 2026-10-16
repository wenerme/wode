import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, waitFor } from 'storybook/test';
import {
	ToastAction,
	ToastClose,
	ToastContent,
	ToastDescription,
	ToastProvider,
	ToastRoot,
	ToastTitle,
	ToastViewport,
	useToastManager,
} from './index';

function Notifications({ error = false }: { error?: boolean }) {
	const manager = useToastManager();
	const [result, setResult] = useState('尚未执行通知操作');
	return (
		<div className='grid min-h-64 w-96 max-w-full content-start gap-4'>
			<button
				type='button'
				className='btn btn-primary'
				onClick={() =>
					manager.add({
						title: error ? '保存失败' : '已保存草稿',
						description: error ? '本地演示错误，可再次尝试。' : '可撤销本次保存。',
						type: error ? 'error' : 'success',
					})
				}
			>
				{error ? '显示错误通知' : '显示保存通知'}
			</button>
			<p role='status'>{result}</p>
			<ToastViewport className='static w-full' aria-label='通知列表'>
				{manager.toasts.map((toast) => (
					<ToastRoot key={toast.id} toast={toast} data-testid='notification'>
						<ToastContent>
							<div className='grid flex-1 gap-2'>
								<ToastTitle>{toast.title}</ToastTitle>
								<ToastDescription>{toast.description}</ToastDescription>
								<ToastAction
									className='btn btn-sm'
									onClick={() => {
										setResult(error ? '已重新尝试' : '已撤销保存');
										manager.close(toast.id);
									}}
								>
									{error ? '重试' : '撤销'}
								</ToastAction>
							</div>
							<ToastClose aria-label='关闭通知'>×</ToastClose>
						</ToastContent>
					</ToastRoot>
				))}
			</ToastViewport>
		</div>
	);
}
const meta = {
	title: 'Primitive/Toast',
	component: ToastProvider,
	tags: ['autodocs'],
	parameters: {
		docs: { description: { component: '每个示例使用独立 Provider，通知由用户触发。演示关闭自动超时以便检查和操作。' } },
	},
} satisfies Meta<typeof ToastProvider>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
	render: () => (
		<ToastProvider timeout={0}>
			<Notifications />
		</ToastProvider>
	),
	play: async ({ canvas, userEvent }) => {
		await userEvent.click(canvas.getByRole('button', { name: '显示保存通知' }));
		const notification = await canvas.findByTestId('notification');
		await waitFor(() => expect(notification).toBeVisible());
		await userEvent.click(canvas.getByRole('button', { name: '撤销' }));
		await expect(canvas.getByText('已撤销保存')).toBeVisible();
		await waitFor(() => expect(canvas.queryByTestId('notification')).not.toBeInTheDocument());
	},
};
export const ErrorAndRetry: Story = {
	render: () => (
		<ToastProvider timeout={0}>
			<Notifications error />
		</ToastProvider>
	),
	play: async ({ canvas, userEvent }) => {
		await userEvent.click(canvas.getByRole('button', { name: '显示错误通知' }));
		const notification = await canvas.findByTestId('notification');
		await waitFor(() => expect(notification).toBeVisible());
		await userEvent.click(await canvas.findByRole('button', { name: '重试' }));
		await expect(canvas.getByText('已重新尝试')).toBeVisible();
		await waitFor(() => expect(canvas.queryByTestId('notification')).not.toBeInTheDocument());
	},
};

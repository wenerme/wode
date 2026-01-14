import type { Meta, StoryObj } from '@storybook/react-vite';
import { Toaster } from 'react-hot-toast';
import { showErrorToast } from './showErrorToast';
import { showPromiseToast } from './showPromiseToast';
import { showSuccessToast } from './showSuccessToast';
import { TODO } from './TODO';

const meta: Meta = {
	title: 'console/toast',
	parameters: {
		layout: 'centered',
	},
	decorators: [
		(Story) => (
			<>
				<Toaster position='top-center' />
				<Story />
			</>
		),
	],
};
export default meta;

type Story = StoryObj<typeof meta>;

export const Demo: Story = {
	render: () => {
		return (
			<div className='flex flex-col gap-4 p-4'>
				<h2 className='text-lg font-bold'>Toast 演示</h2>

				<div className='flex flex-wrap gap-2'>
					<button className='btn btn-success' onClick={() => showSuccessToast('操作成功!')}>
						Success Toast
					</button>

					<button className='btn btn-error' onClick={() => showErrorToast(new Error('发生了一个错误'))}>
						Error Toast
					</button>

					<button className='btn btn-info' onClick={() => TODO('实现这个功能')}>
						TODO Toast
					</button>
				</div>

				<h3 className='mt-4 font-semibold'>Promise Toast</h3>
				<div className='flex flex-wrap gap-2'>
					<button
						className='btn btn-primary'
						onClick={() => {
							showPromiseToast(new Promise((resolve) => setTimeout(resolve, 2000)), { action: '加载数据' });
						}}
					>
						Promise (成功)
					</button>

					<button
						className='btn btn-secondary'
						onClick={() => {
							showPromiseToast(new Promise((_, reject) => setTimeout(() => reject(new Error('网络错误')), 2000)), {
								action: '加载数据',
								swallow: true,
							});
						}}
					>
						Promise (失败)
					</button>

					<button
						className='btn btn-accent'
						onClick={() => {
							showPromiseToast(
								(ac) =>
									new Promise((resolve, reject) => {
										const timer = setTimeout(resolve, 5000);
										ac.signal.addEventListener('abort', () => {
											clearTimeout(timer);
											reject(ac.signal.reason);
										});
									}),
								{ action: '长时间操作', canAbort: true, swallow: true },
							);
						}}
					>
						可中断的 Promise
					</button>
				</div>

				<h3 className='mt-4 font-semibold'>自定义消息</h3>
				<div className='flex flex-wrap gap-2'>
					<button
						className='btn'
						onClick={() => {
							showPromiseToast<{ name: string }>(
								new Promise((resolve) => setTimeout(() => resolve({ name: 'Wener' }), 1500)),
								{
									loading: '正在获取用户信息...',
									success: (data) => `欢迎, ${data.name}!`,
									error: (err: Error) => `获取失败: ${err.message}`,
								},
							);
						}}
					>
						自定义消息
					</button>

					<button
						className='btn'
						onClick={() => {
							showPromiseToast(new Promise((resolve) => setTimeout(resolve, 1000)), {
								delay: 500,
								loading: '加载中...',
								success: null,
							});
						}}
					>
						延迟显示 (500ms)
					</button>
				</div>
			</div>
		);
	},
};

export const ErrorTypes: Story = {
	render: () => {
		return (
			<div className='flex flex-col gap-4 p-4'>
				<h2 className='text-lg font-bold'>不同类型错误展示</h2>
				<div className='flex flex-wrap gap-2'>
					<button className='btn btn-error btn-sm' onClick={() => showErrorToast(new Error('标准错误'))}>
						Error
					</button>

					<button className='btn btn-error btn-sm' onClick={() => showErrorToast(new TypeError('类型错误'))}>
						TypeError
					</button>

					<button className='btn btn-error btn-sm' onClick={() => showErrorToast('字符串错误消息')}>
						String Error
					</button>

					<button
						className='btn btn-error btn-sm'
						onClick={() => showErrorToast({ message: '对象错误', code: 'ERR_001' })}
					>
						Object Error
					</button>

					<button className='btn btn-error btn-sm' onClick={() => showErrorToast(null)}>
						Null (no toast)
					</button>
				</div>
			</div>
		);
	},
};

export const AbortablePromise: Story = {
	render: () => {
		return (
			<div className='flex flex-col gap-4 p-4'>
				<h2 className='text-lg font-bold'>可中断的 Promise</h2>
				<p className='text-sm text-gray-500'>点击按钮后，toast 会显示取消按钮</p>

				<div className='flex flex-wrap gap-2'>
					<button
						className='btn btn-primary'
						onClick={() => {
							showPromiseToast(
								(ac) =>
									new Promise((resolve, reject) => {
										const timer = setTimeout(() => resolve('完成'), 10000);
										ac.signal.addEventListener('abort', () => {
											clearTimeout(timer);
											reject(new DOMException('用户取消', 'AbortError'));
										});
									}),
								{
									action: '下载文件',
									canAbort: true,
									swallow: true,
								},
							);
						}}
					>
						开始下载 (10秒)
					</button>

					<button
						className='btn btn-secondary'
						onClick={async () => {
							const result = await showPromiseToast(
								(ac) => fetch('https://httpbin.org/delay/5', { signal: ac.signal }).then((r) => r.json()),
								{
									action: '请求数据',
									canAbort: true,
									swallow: true,
								},
							);
							if (result) {
								console.log('请求结果:', result);
							}
						}}
					>
						Fetch with AbortController
					</button>
				</div>
			</div>
		);
	},
};

export const ProgressToast: Story = {
	render: () => {
		return (
			<div className='flex flex-col gap-4 p-4'>
				<h2 className='text-lg font-bold'>Progress Toast</h2>
				<p className='text-sm text-gray-500'>支持动态更新消息的 toast</p>

				<div className='flex flex-wrap gap-2'>
					<button
						className='btn btn-primary'
						onClick={() => {
							showPromiseToast(
								async ({ setMessage }) => {
									setMessage('步骤 1/3: 准备数据...');
									await new Promise((r) => setTimeout(r, 1500));
									setMessage('步骤 2/3: 处理中...');
									await new Promise((r) => setTimeout(r, 1500));
									setMessage('步骤 3/3: 完成中...');
									await new Promise((r) => setTimeout(r, 1000));
									return '完成';
								},
								{ action: '多步骤操作' },
							);
						}}
					>
						多步骤进度
					</button>

					<button
						className='btn btn-secondary'
						onClick={() => {
							showPromiseToast(
								async ({ setMessage, signal }) => {
									for (let i = 0; i <= 100; i += 10) {
										if (signal.aborted) throw new DOMException('已取消', 'AbortError');
										setMessage(`上传进度: ${i}%`);
										await new Promise((r) => setTimeout(r, 300));
									}
									return '上传完成';
								},
								{ action: '上传文件', canAbort: true, swallow: true },
							);
						}}
					>
						模拟上传进度 (可中断)
					</button>

					<button
						className='btn btn-accent'
						onClick={() => {
							showPromiseToast(
								async ({ setMessage }) => {
									const items = ['用户数据', '订单信息', '库存状态', '系统日志'];
									for (const item of items) {
										setMessage(`正在同步: ${item}`);
										await new Promise((r) => setTimeout(r, 800));
									}
									return items.length;
								},
								{
									action: '数据同步',
									success: (count) => `成功同步 ${count} 项数据`,
								},
							);
						}}
					>
						数据同步
					</button>
				</div>
			</div>
		);
	},
};

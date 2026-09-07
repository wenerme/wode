import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '@wener/ui/button';
import { Dialog } from '@wener/ui/dialog';
import { Input } from '@wener/ui/input';
import { Popover } from '@wener/ui/popover';
import { Textarea } from '@wener/ui/textarea';
import { Search } from 'lucide-react';
import { expect, userEvent, waitFor, within } from 'storybook/test';

function UiPrimitivesCatalog() {
	return (
		<main className='bg-base-200 text-base-content min-h-screen p-4 md:p-8'>
			<div className='mx-auto grid w-full max-w-3xl gap-8'>
				<header className='border-base-300 border-b pb-4'>
					<h1 className='text-xl font-semibold'>UI 基础组件</h1>
					<p className='text-base-content/65 mt-1 text-sm'>通过真实 @wener/ui package export 验证。</p>
				</header>

				<section aria-labelledby='button-variants'>
					<h2 id='button-variants' className='text-sm font-semibold'>
						按钮变体
					</h2>
					<div className='mt-3 flex flex-wrap items-center gap-2'>
						<Button>主要操作</Button>
						<Button variant='secondary'>次要操作</Button>
						<Button variant='outline'>边框操作</Button>
						<Button variant='ghost'>轻量操作</Button>
						<Button variant='destructive'>危险操作</Button>
						<Button disabled>不可用</Button>
						<Button aria-label='搜索' size='icon' variant='outline'>
							<Search aria-hidden='true' data-icon='inline-start' />
						</Button>
					</div>
				</section>

				<section aria-labelledby='form-controls' className='grid gap-4 sm:grid-cols-2'>
					<h2 id='form-controls' className='sr-only'>
						表单控件
					</h2>
					<div className='form-control gap-1'>
						<label className='label-text text-sm' htmlFor='ui-primitives-email'>
							邮箱
						</label>
						<Input
							id='ui-primitives-email'
							defaultValue='invalid-address'
							aria-describedby='ui-primitives-email-error'
							aria-invalid='true'
							type='email'
						/>
						<span id='ui-primitives-email-error' className='text-error text-xs'>
							请输入有效邮箱地址
						</span>
					</div>
					<div className='form-control gap-1'>
						<label className='label-text text-sm' htmlFor='ui-primitives-description'>
							说明
						</label>
						<Textarea id='ui-primitives-description' defaultValue='当前内容只用于本地 Story。' />
					</div>
				</section>

				<section aria-labelledby='overlay-controls'>
					<h2 id='overlay-controls' className='text-sm font-semibold'>
						浮层
					</h2>
					<div className='mt-3 flex flex-wrap gap-2'>
						<Dialog.Root>
							<Dialog.Trigger render={<Button variant='secondary' />}>打开确认对话框</Dialog.Trigger>
							<Dialog.Content>
								<Dialog.Title className='text-lg font-semibold'>删除草稿</Dialog.Title>
								<Dialog.Description className='text-base-content/65 text-sm'>
									此操作只用于验证 Dialog 的焦点和关闭行为。
								</Dialog.Description>
								<div className='flex justify-end'>
									<Dialog.Close render={<Button variant='outline' />}>取消</Dialog.Close>
								</div>
							</Dialog.Content>
						</Dialog.Root>

						<Popover.Root>
							<Popover.Trigger render={<Button variant='outline' />}>打开浮层</Popover.Trigger>
							<Popover.Content>
								<Popover.Title className='font-medium'>批量操作</Popover.Title>
								<Popover.Description className='text-base-content/65 mt-1 text-sm'>当前选择 3 项。</Popover.Description>
							</Popover.Content>
						</Popover.Root>
					</div>
				</section>
			</div>
		</main>
	);
}

const meta = {
	id: 'components-ui-primitives',
	title: 'Core/Components/UI Primitives',
	component: UiPrimitivesCatalog,
	tags: ['autodocs'],
	parameters: {
		layout: 'fullscreen',
		docs: {
			description: {
				component: 'Publish-safe package primitives using Base UI behavior and DaisyUI semantic tokens.',
			},
		},
	},
} satisfies Meta<typeof UiPrimitivesCatalog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {};

export const Catalog: Story = {
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const body = within(canvasElement.ownerDocument.body);
		await expect(canvas.getByRole('button', { name: '不可用' })).toBeDisabled();
		await expect(canvas.getByLabelText('邮箱')).toHaveAttribute('aria-invalid', 'true');

		const dialogTrigger = canvas.getByRole('button', { name: '打开确认对话框' });
		await userEvent.click(dialogTrigger);
		await expect(await body.findByRole('dialog', { name: '删除草稿' })).toBeInTheDocument();
		await userEvent.click(body.getByRole('button', { name: '取消' }));
		await waitFor(() => expect(body.queryByRole('dialog', { name: '删除草稿' })).not.toBeInTheDocument());
		await expect(dialogTrigger).toHaveFocus();

		await userEvent.click(canvas.getByRole('button', { name: '打开浮层' }));
		await expect(await body.findByText('当前选择 3 项。')).toBeInTheDocument();
	},
};

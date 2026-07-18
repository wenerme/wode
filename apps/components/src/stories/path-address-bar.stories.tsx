'use client';

import type { Meta, StoryObj } from '@storybook/react-vite';
import { Clipboard, FolderPlus, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { PathAddressBar, PathAddressBarMenuItem } from '../../registry/default/ui/path-address-bar';

const meta = {
	title: 'UI/Path Address Bar',
	component: PathAddressBar,
	tags: ['autodocs'],
	args: { path: '/' },
	parameters: {
		docs: {
			description: {
				component:
					'A controlled breadcrumb and editable path hybrid with responsive ancestor overflow. Path validation, history, and authorization remain consumer concerns.',
			},
		},
	},
} satisfies Meta<typeof PathAddressBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
	render: () => <PathAddressBarDemo />,
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await userEvent.click(canvas.getByRole('button', { name: '编辑路径' }));
		const input = canvas.getByRole('textbox', { name: '路径' });
		await userEvent.clear(input);
		await userEvent.type(input, '/tenant/acme/design/review{Enter}');
		await waitFor(() =>
			expect(canvas.getByRole('button', { name: '打开 review 菜单' })).toHaveAttribute('aria-current', 'page'),
		);
		expect(canvas.getByRole('status')).toHaveTextContent('已打开 /tenant/acme/design/review');

		const currentMenu = canvas.getByRole('button', { name: '打开 review 菜单' });
		currentMenu.focus();
		await userEvent.keyboard('{Control>}l{/Control}');
		const editing = canvas.getByRole('textbox', { name: '路径' });
		await userEvent.type(editing, '/draft');
		await userEvent.keyboard('{Escape}');
		expect(canvas.queryByRole('textbox', { name: '路径' })).not.toBeInTheDocument();
		expect(canvas.getByRole('button', { name: '打开 review 菜单' })).toHaveAttribute('aria-current', 'page');

		await userEvent.click(canvas.getByRole('button', { name: '打开 review 菜单' }));
		const body = within(canvasElement.ownerDocument.body);
		await userEvent.click(await body.findByText('新建同级目录'));
		expect(canvas.getByRole('status')).toHaveTextContent('请求新建目录');
	},
};

export const ResponsiveOverflow: Story = {
	render: () => (
		<main className='p-4'>
			<div className='w-72 max-w-full'>
				<PathAddressBar
					path='/tenant/acme/product/document/2026/contracts/customer-a/final'
					rootPath='/tenant/acme'
					rootLabel='企业文件'
				/>
			</div>
		</main>
	),
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const overflow = await canvas.findByRole('button', { name: '更多上级目录' });
		await userEvent.click(overflow);
		const body = within(canvasElement.ownerDocument.body);
		expect(await body.findByRole('menuitem', { name: /企业文件/ })).toBeInTheDocument();
		expect(body.getByRole('menuitem', { name: /product/ })).toBeInTheDocument();
		const current = canvasElement.querySelector<HTMLElement>('[aria-current="page"]');
		expect(current).toHaveTextContent('final');
	},
};

function PathAddressBarDemo() {
	const [path, setPath] = useState('/tenant/acme/product/document/specification');
	const [draft, setDraft] = useState(path);
	const [activity, setActivity] = useState('就绪');
	const navigate = (nextPath: string) => {
		setPath(nextPath);
		setDraft(nextPath);
		setActivity(`已打开 ${nextPath}`);
	};
	return (
		<main className='p-4'>
			<div className='border-base-300 bg-base-100 mx-auto max-w-4xl border p-3'>
				<PathAddressBar
					aria-label='资源路径地址栏'
					path={path}
					rootPath='/tenant/acme'
					rootLabel='企业文件'
					value={draft}
					onPathChange={navigate}
					onValueChange={setDraft}
					onValueCommit={navigate}
					currentMenu={
						<>
							<PathAddressBarMenuItem onClick={() => setActivity('请求新建目录')}>
								<FolderPlus aria-hidden='true' className='size-4' />
								<span>新建同级目录</span>
							</PathAddressBarMenuItem>
							<PathAddressBarMenuItem onClick={() => setActivity(`已复制 ${path}`)}>
								<Clipboard aria-hidden='true' className='size-4' />
								<span>复制路径</span>
							</PathAddressBarMenuItem>
							<PathAddressBarMenuItem onClick={() => setActivity(`已刷新 ${path}`)}>
								<RefreshCw aria-hidden='true' className='size-4' />
								<span>刷新</span>
							</PathAddressBarMenuItem>
						</>
					}
				/>
				<div role='status' aria-live='polite' className='text-base-content/60 mt-3 text-xs'>
					{activity}
				</div>
			</div>
		</main>
	);
}

'use client';

import type { Meta, StoryObj } from '@storybook/react-vite';
import { createMemoryFileSystem, type IFileSystem } from '@wener/common/fs';
import { useEffect, useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { FileManager } from '@/file/file-manager';

const meta = {
	id: 'file-file-manager-embedded-workspace',
	title: 'File/File Manager/Embedded Workspace',
	component: FileManager,
	args: { fileSystem: createMemoryFileSystem() },
	parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof FileManager>;

export default meta;
type Story = StoryObj<typeof meta>;

export const EmbeddedWorkspace: Story = {
	render: () => <EmbeddedWorkspaceDemo />,
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await waitFor(() => expect(canvas.getByRole('button', { name: 'project-plan.md' })).toBeInTheDocument());
		const surface = canvasElement.querySelector<HTMLElement>('[data-file-manager]');
		expect(surface).toHaveAttribute('data-file-manager-surface', 'embedded');
		expect(canvas.queryByRole('heading', { name: '项目文件' })).not.toBeInTheDocument();
		expect(canvas.queryByRole('button', { name: '新建目录' })).not.toBeInTheDocument();

		await userEvent.click(canvas.getByRole('button', { name: '搜索当前目录' }));
		const search = canvas.getByRole('textbox', { name: '搜索当前目录' });
		await userEvent.type(search, 'plan');
		expect(canvas.getByRole('button', { name: 'project-plan.md' })).toBeInTheDocument();
		await userEvent.clear(search);
		await userEvent.click(canvas.getByRole('button', { name: '关闭搜索' }));

		await userEvent.click(canvas.getByRole('checkbox', { name: '选择 project-plan.md' }));
		const currentDirectoryMenu = canvas.getByRole('button', { name: /打开 .* 菜单/ });
		await userEvent.click(currentDirectoryMenu);
		const body = within(canvasElement.ownerDocument.body);
		expect(await body.findByText('已选择 1 个项目')).toBeInTheDocument();
		expect(body.getByRole('menuitem', { name: '复制到' })).toBeInTheDocument();
		expect(body.getByRole('menuitem', { name: '删除' })).toBeInTheDocument();
		await userEvent.click(body.getByRole('menuitem', { name: '重命名' }));
		const rename = canvas.getByRole('textbox', { name: '名称' });
		await userEvent.clear(rename);
		await userEvent.type(rename, 'project-plan-final.md');
		await userEvent.click(canvas.getByRole('button', { name: '确认' }));
		await waitFor(() => expect(canvas.getByRole('button', { name: 'project-plan-final.md' })).toBeInTheDocument());

		await userEvent.click(canvas.getByRole('button', { name: /打开 .* 菜单/ }));
		await userEvent.click(await body.findByRole('menuitem', { name: '新建目录' }));
		await userEvent.type(canvas.getByRole('textbox', { name: '名称' }), 'Review');
		await userEvent.click(canvas.getByRole('button', { name: '确认' }));
		await waitFor(() => expect(canvas.getByRole('button', { name: 'Review' })).toBeInTheDocument());

		const navigation = canvasElement.querySelector<HTMLElement>('[data-slot="file-manager-navigation"]');
		expect(navigation?.scrollWidth).toBeLessThanOrEqual(navigation?.clientWidth ?? 0);
	},
};

export const NarrowEmbeddedWorkspace: Story = {
	render: () => <EmbeddedWorkspaceDemo narrow />,
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await waitFor(() => expect(canvas.getByRole('button', { name: 'project-plan.md' })).toBeInTheDocument());
		await waitFor(() => expect(canvas.queryByRole('button', { name: '刷新' })).not.toBeInTheDocument());
		const navigation = canvasElement.querySelector<HTMLElement>('[data-slot="file-manager-navigation"]');
		expect(navigation?.scrollWidth).toBeLessThanOrEqual(navigation?.clientWidth ?? 0);
	},
};

function EmbeddedWorkspaceDemo({ narrow = false }: { narrow?: boolean }) {
	const [fileSystem, setFileSystem] = useState<IFileSystem>();
	useEffect(() => {
		void createEmbeddedWorkspaceFileSystem().then(setFileSystem);
	}, []);
	if (!fileSystem)
		return (
			<div role='status' className='grid min-h-screen place-items-center text-sm'>
				正在准备文件空间…
			</div>
		);
	return (
		<main className={narrow ? 'bg-base-200 min-h-screen w-[22rem] max-w-full' : 'bg-base-200 min-h-screen p-3 sm:p-5'}>
			<h1 className='sr-only'>嵌入式文件工作区</h1>
			<FileManager
				className={narrow ? 'h-[46rem] rounded-md' : 'mx-auto h-[min(46rem,calc(100vh-2.5rem))] max-w-6xl rounded-md'}
				fileSystem={fileSystem}
				initialPath='/Workspace'
				rootPath='/Workspace'
				surfaceVariant='embedded'
			/>
		</main>
	);
}

async function createEmbeddedWorkspaceFileSystem(): Promise<IFileSystem> {
	const fileSystem = createMemoryFileSystem();
	await fileSystem.mkdir('/Workspace/Design', { recursive: true });
	await fileSystem.mkdir('/Workspace/Contracts', { recursive: true });
	await fileSystem.writeFile('/Workspace/project-plan.md', '# Project plan\n\nReview milestones and linked files.\n');
	await fileSystem.writeFile('/Workspace/Design/overview.txt', 'Current design notes.\n');
	await fileSystem.writeFile('/Workspace/Contracts/review.txt', 'Review checklist.\n');
	return fileSystem;
}

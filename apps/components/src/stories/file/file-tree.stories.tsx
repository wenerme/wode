import type { Meta, StoryObj } from '@storybook/react-vite';
import { type ReactNode, useMemo, useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { FileTree, type FileTreeFileStat, type FileTreeFileSystem } from '@/file/file-tree';

const meta = {
	id: 'ui-file-tree',
	title: 'File/File Tree',
	parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const AsyncWorkspace: Story = {
	render: () => <AsyncTreeDemo />,
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		expect(await canvas.findByText('文档')).toBeInTheDocument();
		expect(canvas.queryByText('计划.md')).not.toBeInTheDocument();
		await userEvent.click(
			within(canvas.getByRole('treeitem', { name: /文档/ })).getByRole('button', { name: '展开目录' }),
		);
		expect(await canvas.findByText('计划.md')).toBeInTheDocument();
		await userEvent.dblClick(canvas.getByText('计划.md'));
		expect(canvas.getByLabelText('导航结果')).toHaveTextContent('/文档/计划.md');
		expect(canvas.getByLabelText('读取次数')).toHaveTextContent('/=1, /文档=1');
	},
};

export const BackendError: Story = {
	render: () => (
		<StoryFrame>
			<FileTree fileSystem={{ readdir: async () => Promise.reject(new Error('模拟树读取失败')) }} height={520} />
		</StoryFrame>
	),
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		expect(await canvas.findByRole('alert')).toHaveTextContent('模拟树读取失败');
		expect(canvas.getByRole('button', { name: '重试加载' }).tabIndex).toBe(0);
	},
};

export const LargeVirtualizedDirectory: Story = {
	render: () => <LargeTreeDemo />,
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		expect(await canvas.findByText('file-0000.txt')).toBeInTheDocument();
		await waitFor(() => expect(canvas.getAllByRole('treeitem').length).toBeLessThan(80));
		expect(canvas.getByLabelText('总节点数')).toHaveTextContent('2000');
	},
};

function AsyncTreeDemo() {
	const [currentPath, setCurrentPath] = useState('/');
	const [calls, setCalls] = useState<Record<string, number>>({});
	const fileSystem = useMemo<FileTreeFileSystem>(
		() => ({
			async readdir(path, { signal } = {}) {
				setCalls((value) => ({ ...value, [path]: (value[path] ?? 0) + 1 }));
				await delay(40, signal);
				if (path === '/')
					return [entry('/文档', 'directory'), entry('/图片', 'directory'), entry('/README.md', 'file')];
				if (path === '/文档') return [entry('/文档/计划.md', 'file'), entry('/文档/归档', 'directory')];
				if (path === '/图片') return [entry('/图片/logo.png', 'file')];
				return [];
			},
		}),
		[],
	);
	return (
		<StoryFrame>
			<FileTree currentPath={currentPath} fileSystem={fileSystem} height={560} onNavigate={setCurrentPath} />
			<div className='mt-2 flex gap-4 text-xs'>
				<output aria-label='导航结果'>{currentPath}</output>
				<output aria-label='读取次数'>
					{Object.entries(calls)
						.map(([path, count]) => `${path}=${count}`)
						.join(', ')}
				</output>
			</div>
		</StoryFrame>
	);
}

function LargeTreeDemo() {
	const entries = useMemo(
		() => Array.from({ length: 2_000 }, (_, index) => entry(`/file-${pad(index)}.txt`, 'file')),
		[],
	);
	const fileSystem = useMemo<FileTreeFileSystem>(() => ({ readdir: async () => entries }), [entries]);
	return (
		<StoryFrame>
			<FileTree fileSystem={fileSystem} height={600} limits={{ maxNodes: 3_000 }} />
			<output aria-label='总节点数' className='mt-2 block text-xs'>
				{entries.length}
			</output>
		</StoryFrame>
	);
}

function StoryFrame({ children }: { children: ReactNode }) {
	return (
		<main className='bg-base-200 min-h-screen p-4'>
			<h1 className='sr-only'>异步文件树</h1>
			{children}
		</main>
	);
}

function entry(path: string, kind: FileTreeFileStat['kind']): FileTreeFileStat {
	const separator = path.lastIndexOf('/');
	return {
		directory: separator <= 0 ? '/' : path.slice(0, separator),
		kind,
		meta: {},
		mtime: 1,
		name: path.slice(separator + 1),
		path,
		size: kind === 'file' ? 1 : 0,
	};
}

function pad(value: number) {
	return String(value).padStart(4, '0');
}

function delay(milliseconds: number, signal?: AbortSignal) {
	return new Promise<void>((resolve, reject) => {
		const timer = setTimeout(resolve, milliseconds);
		signal?.addEventListener(
			'abort',
			() => {
				clearTimeout(timer);
				const error = new Error('aborted');
				error.name = 'AbortError';
				reject(error);
			},
			{ once: true },
		);
	});
}

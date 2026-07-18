'use client';

import type { Meta, StoryObj } from '@storybook/react-vite';
import { createMemoryFileSystem, type IFileSystem } from '@wener/common/fs';
import { useEffect, useMemo, useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { FileSystemFileViewer, FileViewer } from '../../registry/default/ui/file-viewer';

const meta = {
	title: 'UI/File Viewer',
	component: FileViewer,
	tags: ['autodocs'],
	args: { file: { name: 'example.txt' } },
	parameters: {
		docs: {
			description: {
				component:
					'Composable Text, Image, PDF, Audio, Video, and unsupported-file viewers. The optional filesystem adapter owns bounded reads, cancellation, and direct standalone saves.',
			},
		},
	},
} satisfies Meta<typeof FileViewer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const EditableText: Story = {
	render: () => <EditableTextDemo />,
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await userEvent.click(canvas.getByRole('button', { name: /编辑/ }));
		const editor = canvas.getByRole('textbox', { name: '编辑 config.json' });
		await userEvent.clear(editor);
		await userEvent.type(editor, 'status: updated');
		await userEvent.click(canvas.getByRole('button', { name: '保存' }));
		await waitFor(() => expect(canvas.getByRole('status')).toHaveTextContent('已保存'));
		expect(canvas.getByText('status: updated')).toBeInTheDocument();
	},
};

export const MediaCatalog: Story = {
	render: () => <MediaCatalogDemo />,
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		expect(canvas.getByRole('img', { name: 'workspace.jpg' })).toBeInTheDocument();
		expect(await canvas.findByLabelText('sample.pdf PDF 预览')).toBeInTheDocument();
		expect(canvasElement.querySelector('[data-slot="audio-file-viewer"]')).not.toBeNull();
		const video = canvasElement.querySelector<HTMLElement>('[data-slot="video-file-viewer"]');
		expect(video).not.toBeNull();
		await waitFor(() =>
			expect(within(video as HTMLElement).getByRole('alert')).toHaveTextContent('preview.mp4 加载失败'),
		);
		expect(within(video as HTMLElement).getByRole('link', { name: '下载文件' })).toBeInTheDocument();
		const unsupported = canvasElement.querySelector<HTMLElement>('[data-slot="unsupported-file-viewer"]');
		expect(unsupported).not.toBeNull();
		await userEvent.click(within(unsupported as HTMLElement).getByRole('button', { name: '下载文件' }));
		expect(canvas.getByRole('status')).toHaveTextContent('请求下载 archive.bin');
	},
};

export const FileSystemAdapter: Story = {
	render: () => <FileSystemViewerDemo />,
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await waitFor(() => expect(canvas.getByText('Filesystem adapter keeps reads bounded.')).toBeInTheDocument());
		await userEvent.click(canvas.getByRole('button', { name: /编辑/ }));
		await userEvent.type(canvas.getByRole('textbox', { name: '编辑 guide.txt' }), '\nSaved through IFileSystem.');
		await userEvent.click(canvas.getByRole('button', { name: '保存' }));
		await waitFor(() => expect(canvas.getByRole('status')).toHaveTextContent('写入完成'));
	},
};

function EditableTextDemo() {
	const [text, setText] = useState('{\n  "status": "ready"\n}');
	const [activity, setActivity] = useState('未修改');
	return (
		<main className='p-4'>
			<div className='border-base-300 bg-base-100 mx-auto max-w-4xl border'>
				<FileViewer
					file={{ name: 'config.json', mimeType: 'application/json', size: text.length }}
					text={text}
					onSave={async (draft) => {
						await new Promise((resolve) => setTimeout(resolve, 40));
						setText(draft);
						setActivity('已保存');
					}}
				/>
				<div role='status' aria-live='polite' className='border-base-300 border-t px-3 py-2 text-xs'>
					{activity}
				</div>
			</div>
		</main>
	);
}

function MediaCatalogDemo() {
	const [activity, setActivity] = useState('媒体预览就绪');
	const pdfBytes = useMemo(() => createMinimalPdf(), []);
	return (
		<main className='p-4'>
			<div className='grid gap-3 lg:grid-cols-2'>
				<FileViewer file={{ name: 'workspace.jpg', mimeType: 'image/jpeg' }} src='/zoom-console.jpg' />
				<FileViewer file={{ name: 'sample.pdf', mimeType: 'application/pdf' }} bytes={pdfBytes} />
				<FileViewer
					file={{ name: 'silence.wav', mimeType: 'audio/wav' }}
					src='data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA='
				/>
				<FileViewer
					file={{ name: 'preview.mp4', mimeType: 'video/mp4' }}
					src='data:video/mp4;base64,AAAAHGZ0eXBtcDQyAAAAAG1wNDJpc29t'
				/>
				<div className='lg:col-span-2'>
					<FileViewer
						file={{ name: 'archive.bin', mimeType: 'application/octet-stream', size: 4096 }}
						onDownload={(file) => setActivity(`请求下载 ${file.name}`)}
					/>
				</div>
			</div>
			<div role='status' aria-live='polite' className='mt-3 text-xs'>
				{activity}
			</div>
		</main>
	);
}

function FileSystemViewerDemo() {
	const [fileSystem, setFileSystem] = useState<IFileSystem>();
	const [activity, setActivity] = useState('正在初始化');
	useEffect(() => {
		let active = true;
		const next = createMemoryFileSystem();
		void next.writeFile('/guide.txt', 'Filesystem adapter keeps reads bounded.').then(() => {
			if (active) {
				setFileSystem(next);
				setActivity('读取完成');
			}
		});
		return () => {
			active = false;
		};
	}, []);
	return (
		<main className='p-4'>
			{fileSystem ? (
				<FileSystemFileViewer
					className='mx-auto h-[32rem] max-w-4xl'
					fileSystem={fileSystem}
					maxBytes={64 * 1024}
					path='/guide.txt'
					onTextSaved={() => setActivity('写入完成')}
				/>
			) : (
				<div role='status'>正在初始化…</div>
			)}
			<div role='status' aria-live='polite' className='mx-auto mt-3 max-w-4xl text-xs'>
				{activity}
			</div>
		</main>
	);
}

function createMinimalPdf(): Uint8Array {
	return new TextEncoder().encode(
		'%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Count 0/Kids[]>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF',
	);
}

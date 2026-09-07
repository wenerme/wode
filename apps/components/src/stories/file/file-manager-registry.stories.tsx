import type { Meta, StoryObj } from '@storybook/react-vite';
import { Braces, Workflow } from 'lucide-react';
import { useState } from 'react';
import { expect, within } from 'storybook/test';
import {
	createFileManager,
	FileManagerFileTypeIcon,
	FileManagerRegistryProvider,
	getFileManager,
	getFileManagerFileTypeLabel,
} from '@/file/file-manager';
import { FileViewer } from '@/file/file-viewer';

const meta = {
	id: 'console-file-manager-registry',
	title: 'File/File Manager Registry',
	parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const BuiltinCatalog: Story = {
	render: () => <BuiltinCatalogDemo />,
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		expect(canvas.getByText('目录')).toBeInTheDocument();
		expect(canvas.getByText('代码')).toBeInTheDocument();
		expect(canvas.getByText('图片')).toBeInTheDocument();
		expect(canvas.getByText('可执行文件')).toBeInTheDocument();
		expect(canvas.getAllByTestId('file-type-definition')).toHaveLength(15);
	},
};

export const ScopedCustomViewer: Story = {
	render: () => <ScopedCustomViewerDemo />,
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		expect(canvas.getByRole('region', { name: '流程文件预览' })).toHaveTextContent('start -> review -> done');
		expect(canvas.getByText('Scoped workflow viewer')).toBeInTheDocument();
	},
};

function BuiltinCatalogDemo() {
	const [manager] = useState(() => getFileManager());
	const examples: Record<string, { kind?: 'directory' | 'file'; name: string; mimeType?: string }> = {
		directory: { kind: 'directory', name: 'src' },
		text: { name: 'notes.txt' },
		code: { name: 'schema.ts' },
		image: { name: 'photo.png' },
		pdf: { name: 'report.pdf' },
		audio: { name: 'voice.mp3' },
		video: { name: 'clip.mp4' },
		archive: { name: 'backup.zip' },
		sheet: { name: 'budget.xlsx' },
		document: { name: 'letter.docx' },
		slide: { name: 'deck.pptx' },
		database: { name: 'data.sqlite' },
		font: { name: 'brand.woff2' },
		executable: { name: 'setup.exe' },
		'generic-file': { name: 'payload.data' },
	};
	return (
		<FileManagerRegistryProvider manager={manager}>
			<main className='bg-base-200 min-h-screen p-4'>
				<h1 className='sr-only'>文件类型目录</h1>
				<div className='grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] gap-2'>
					{manager.fileTypes.list().map((definition) => {
						const file = manager.fileTypes.resolveInput({ path: '/', ...examples[definition.id] });
						return (
							<div
								key={definition.id}
								data-testid='file-type-definition'
								className='border-base-300 bg-base-100 flex items-center gap-3 rounded-md border p-3'
							>
								<FileManagerFileTypeIcon file={file} manager={manager} className='size-6' />
								<div className='min-w-0'>
									<div className='truncate text-sm font-medium'>{getFileManagerFileTypeLabel(definition, file)}</div>
									<div className='text-base-content/70 truncate text-[10px]'>{definition.id}</div>
								</div>
							</div>
						);
					})}
				</div>
			</main>
		</FileManagerRegistryProvider>
	);
}

function ScopedCustomViewerDemo() {
	const [manager] = useState(() =>
		createFileManager({
			parent: getFileManager(),
			definitions: [
				{
					id: 'workflow',
					label: '工作流',
					priority: 500,
					match: { extensions: ['flow'] },
					icon: ({ className }) => <Workflow aria-hidden='true' className={className} />,
					viewer: {
						render: ({ bytes }) => (
							<section aria-label='流程文件预览' className='grid min-h-64 place-items-center p-6 font-mono'>
								{bytes ? new TextDecoder().decode(bytes) : 'empty'}
							</section>
						),
					},
				},
			],
		}),
	);
	return (
		<FileManagerRegistryProvider manager={manager}>
			<main className='bg-base-200 min-h-screen p-4'>
				<h1 className='sr-only'>自定义文件预览</h1>
				<div className='border-base-300 bg-base-100 mx-auto max-w-3xl border'>
					<header className='border-base-300 flex items-center gap-2 border-b px-3 py-2 text-sm font-medium'>
						<Braces aria-hidden='true' className='size-4' /> Scoped workflow viewer
					</header>
					<FileViewer
						bytes={new TextEncoder().encode('start -> review -> done')}
						file={{ name: 'release.flow', path: '/release.flow', size: 23 }}
						manager={manager}
					/>
				</div>
			</main>
		</FileManagerRegistryProvider>
	);
}

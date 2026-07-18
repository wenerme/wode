import type { Meta, StoryObj } from '@storybook/react-vite';
import { FolderOpen, Save } from 'lucide-react';
import { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import {
	renderFilePickerWindow,
	showDirectoryPicker,
	showFilePicker,
	showSaveFilePicker,
} from '../../registry/default/blocks/file-picker';
import {
	createWindowManagerStore,
	WindowManagerHost,
	WindowManagerProvider,
} from '../../registry/default/blocks/window-manager';
import { usePickerFileSystem } from './file-picker-fixtures';

const meta = {
	title: 'Console/File Picker Window',
	parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const ProgrammaticPickers: Story = {
	render: () => <FilePickerWindowDemo />,
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await userEvent.click(await canvas.findByRole('button', { name: '打开文件' }));
		const dialog = await canvas.findByRole('dialog', { name: '打开文件' });
		await userEvent.click(within(dialog).getByRole('button', { name: 'README.md' }));
		await userEvent.click(within(dialog).getByRole('button', { name: '打开' }));
		expect(await canvas.findByLabelText('窗口选择结果')).toHaveTextContent('/README.md');
	},
};

function FilePickerWindowDemo() {
	const fileSystem = usePickerFileSystem();
	const [store] = useState(() => createWindowManagerStore({ workspace: { width: 1180, height: 760 } }));
	const [result, setResult] = useState('等待选择');
	return (
		<WindowManagerProvider store={store}>
			<WindowManagerHost
				className='h-screen min-h-[36rem]'
				background={
					<div className='bg-base-200 absolute inset-0 p-4'>
						<div className='border-base-300 bg-base-100 flex flex-wrap items-center gap-2 border-b p-3'>
							<button
								type='button'
								className='btn btn-sm'
								disabled={!fileSystem}
								onClick={() => fileSystem && void showFilePicker({ fileSystem, windowManager: store }).then(show)}
							>
								<FolderOpen aria-hidden='true' className='size-4' /> 打开文件
							</button>
							<button
								type='button'
								className='btn btn-sm'
								disabled={!fileSystem}
								onClick={() =>
									fileSystem && void showFilePicker({ fileSystem, multiple: true, windowManager: store }).then(show)
								}
							>
								<FolderOpen aria-hidden='true' className='size-4' /> 打开多个文件
							</button>
							<button
								type='button'
								className='btn btn-sm'
								disabled={!fileSystem}
								onClick={() => fileSystem && void showDirectoryPicker({ fileSystem, windowManager: store }).then(show)}
							>
								<FolderOpen aria-hidden='true' className='size-4' /> 选择文件夹
							</button>
							<button
								type='button'
								className='btn btn-sm'
								disabled={!fileSystem}
								onClick={() =>
									fileSystem &&
									void showSaveFilePicker({ fileSystem, suggestedName: '导出.md', windowManager: store }).then(show)
								}
							>
								<Save aria-hidden='true' className='size-4' /> 保存文件
							</button>
							<output aria-label='窗口选择结果' className='ml-auto text-xs'>
								{result}
							</output>
						</div>
					</div>
				}
				renderContent={(window) => renderFilePickerWindow(window)}
			/>
		</WindowManagerProvider>
	);

	function show(value: { path: string } | { path: string }[] | undefined) {
		setResult(Array.isArray(value) ? value.map((entry) => entry.path).join(', ') : (value?.path ?? '已取消'));
	}
}

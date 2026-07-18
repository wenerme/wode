import type { Meta, StoryObj } from '@storybook/react-vite';
import { Mic, SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { AgentComposer, type AgentComposerSubmitValue } from '../../registry/default/ui/agent-composer';

const meta = {
	title: 'Agent/Agent Composer',
	tags: ['autodocs'],
	parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const MultimodalValidation: Story = {
	render: () => <ComposerDemo />,
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const image = new File(['image'], 'design.png', { type: 'image/png' });
		const audio = new File(['audio'], 'note.mp3', { type: 'audio/mpeg' });
		await userEvent.upload(canvas.getByLabelText('选择图片文件'), image);
		await userEvent.upload(canvas.getByLabelText('选择音频文件'), audio);
		await expect(canvas.getByText('design.png')).toBeInTheDocument();
		await expect(canvas.getByText('note.mp3')).toBeInTheDocument();
		await userEvent.upload(canvas.getByLabelText('选择文件'), [
			new File(['1'], 'one.txt', { type: 'text/plain' }),
			new File(['2'], 'two.txt', { type: 'text/plain' }),
			new File(['3'], 'three.txt', { type: 'text/plain' }),
			new File(['4'], 'four.txt', { type: 'text/plain' }),
		]);
		await expect(canvas.getByRole('alert')).toHaveTextContent('最多添加 5 个文件。');
		await userEvent.type(canvas.getByRole('textbox', { name: '输入消息…' }), '请检查这些附件');
		await userEvent.click(canvas.getByRole('button', { name: '发送' }));
		await expect(canvas.getByRole('status')).toHaveTextContent('已提交 5 个附件');
	},
};

export const Mobile: Story = {
	render: () => <ComposerDemo />,
	parameters: { viewport: { defaultViewport: 'mobile1' } },
};

function ComposerDemo() {
	const [value, setValue] = useState('');
	const [files, setFiles] = useState<File[]>([]);
	const [result, setResult] = useState('等待发送');
	function submit(input: AgentComposerSubmitValue) {
		setResult(`已提交 ${input.files.length} 个附件`);
		setValue('');
		setFiles([]);
	}
	return (
		<main className='bg-base-200 flex min-h-screen items-end justify-center p-3 md:items-center md:p-8'>
			<div className='w-full max-w-3xl space-y-2'>
				<AgentComposer
					files={files}
					value={value}
					model={
						<select aria-label='模型' className='select select-ghost select-sm h-8 min-h-8 max-w-36'>
							<option>Example Chat</option>
							<option>Example Reasoner</option>
						</select>
					}
					microphone={
						<button
							type='button'
							className='btn btn-ghost btn-circle btn-sm size-8 min-h-8 min-w-8'
							aria-label='录音'
							title='录音'
						>
							<Mic aria-hidden='true' className='size-4' />
						</button>
					}
					settings={
						<button
							type='button'
							className='btn btn-ghost btn-circle btn-sm size-8 min-h-8 min-w-8'
							aria-label='设置'
							title='设置'
						>
							<SlidersHorizontal aria-hidden='true' className='size-4' />
						</button>
					}
					onFilesChange={setFiles}
					onSubmit={submit}
					onValueChange={setValue}
				/>
				<output className='text-base-content/60 block px-1 text-xs'>{result}</output>
			</div>
		</main>
	);
}

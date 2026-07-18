import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ChatStatus, UIMessage } from 'ai';
import { useEffect, useRef, useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { AgentChat, type AgentComposerSubmitValue } from '../../registry/default/blocks/agent-chat';

const meta = {
	title: 'Agent/Agent Chat',
	tags: ['autodocs'],
	parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const ControlledOperations: Story = {
	render: () => <MockAgentChat />,
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await userEvent.upload(
			canvas.getByLabelText('选择文件'),
			new File(['example'], 'context.txt', { type: 'text/plain' }),
		);
		await userEvent.type(canvas.getByRole('textbox', { name: '输入消息…' }), '运行工具');
		await userEvent.click(canvas.getByRole('button', { name: '发送' }));
		await expect(canvas.getByText('context.txt')).toBeInTheDocument();
		await waitFor(() => expect(canvas.getByText('已完成')).toBeInTheDocument());
		await userEvent.type(canvas.getByRole('textbox', { name: '输入消息…' }), '触发错误');
		await userEvent.click(canvas.getByRole('button', { name: '发送' }));
		await expect(canvas.getByRole('alert', { name: '对话出错' })).toHaveTextContent('模拟请求失败');
		await userEvent.click(canvas.getByRole('button', { name: '重试' }));
		await waitFor(() => expect(canvas.getByText('重试完成')).toBeInTheDocument());
	},
};

export const AbortStreaming: Story = {
	render: () => <MockAgentChat slow />,
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await userEvent.type(canvas.getByRole('textbox', { name: '输入消息…' }), '生成长回答');
		await userEvent.click(canvas.getByRole('button', { name: '发送' }));
		await userEvent.click(canvas.getByRole('button', { name: '停止生成' }));
		await expect(canvas.getByText('已停止')).toBeInTheDocument();
	},
};

export const ToolAndAttachment: Story = {
	render: () => (
		<StoryFrame>
			<AgentChat
				files={[]}
				status='ready'
				text=''
				value={toolTranscript}
				onFilesChange={() => undefined}
				onSend={() => undefined}
				onTextChange={() => undefined}
			/>
		</StoryFrame>
	),
};

function MockAgentChat({ slow = false }: { slow?: boolean }) {
	const [messages, setMessages] = useState<UIMessage[]>([]);
	const [text, setText] = useState('');
	const [files, setFiles] = useState<File[]>([]);
	const [status, setStatus] = useState<ChatStatus>('ready');
	const [error, setError] = useState<string>();
	const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
	useEffect(() => () => timer.current && clearTimeout(timer.current), []);

	function send(input: AgentComposerSubmitValue) {
		const id = `turn-${messages.length + 1}`;
		const userParts: UIMessage['parts'] = [
			...input.files.map((file) => ({
				type: 'file' as const,
				filename: file.name,
				mediaType: file.type || 'application/octet-stream',
				url: `data:${file.type || 'application/octet-stream'};base64,ZXhhbXBsZQ==`,
			})),
			{ type: 'text', text: input.text },
		];
		setText('');
		setFiles([]);
		setError(undefined);
		if (input.text.includes('错误')) {
			setMessages((current) => [...current, { id, role: 'user', parts: userParts }]);
			setStatus('error');
			setError('模拟请求失败');
			return;
		}
		const assistantId = `${id}-assistant`;
		setStatus('streaming');
		setMessages((current) => [
			...current,
			{ id, role: 'user', parts: userParts },
			{
				id: assistantId,
				role: 'assistant',
				parts: input.text.includes('工具')
					? ([
							{
								type: 'tool-check',
								toolCallId: `${id}-tool`,
								state: 'input-available',
								input: { target: 'context.txt' },
							},
							{ type: 'text', text: '正在检查', state: 'streaming' },
						] as unknown as UIMessage['parts'])
					: [{ type: 'text', text: '正在生成', state: 'streaming' }],
			},
		]);
		timer.current = setTimeout(
			() => {
				setMessages((current) =>
					current.map((message) =>
						message.id === assistantId
							? {
									...message,
									parts: input.text.includes('工具')
										? ([
												{
													type: 'tool-check',
													toolCallId: `${id}-tool`,
													state: 'output-available',
													input: { target: 'context.txt' },
													output: { ok: true },
												},
												{ type: 'text', text: '检查完成', state: 'done' },
											] as unknown as UIMessage['parts'])
										: [{ type: 'text', text: '生成完成', state: 'done' }],
								}
							: message,
					),
				);
				setStatus('ready');
			},
			slow ? 2000 : 30,
		);
	}

	function stop() {
		if (timer.current) clearTimeout(timer.current);
		setStatus('ready');
		setMessages((current) =>
			current.map((message, index) =>
				index === current.length - 1 && message.role === 'assistant'
					? { ...message, parts: [{ type: 'text', text: '已停止', state: 'done' }] }
					: message,
			),
		);
	}

	function retry() {
		setError(undefined);
		setStatus('streaming');
		timer.current = setTimeout(() => {
			setMessages((current) => [
				...current,
				{ id: `retry-${current.length}`, role: 'assistant', parts: [{ type: 'text', text: '重试完成' }] },
			]);
			setStatus('ready');
		}, 30);
	}

	return (
		<StoryFrame>
			<AgentChat
				connection={<span className='status status-success text-xs'>Mock</span>}
				error={error}
				files={files}
				header={<h1 className='text-sm font-semibold'>Agent Chat</h1>}
				status={status}
				text={text}
				value={messages}
				onFilesChange={setFiles}
				onRetry={retry}
				onSend={send}
				onStop={stop}
				onTextChange={setText}
			/>
		</StoryFrame>
	);
}

function StoryFrame({ children }: { children: import('react').ReactNode }) {
	return (
		<main className='bg-base-200 h-screen min-h-[32rem] p-2 md:p-6'>
			<div className='mx-auto size-full max-w-5xl'>{children}</div>
		</main>
	);
}

const toolTranscript: UIMessage[] = [
	{
		id: 'attachment-user',
		role: 'user',
		parts: [
			{ type: 'file', filename: 'context.txt', mediaType: 'text/plain', url: 'data:text/plain;base64,ZXhhbXBsZQ==' },
			{ type: 'text', text: '检查附件。' },
		],
	},
	{
		id: 'tool-assistant',
		role: 'assistant',
		parts: [
			{
				type: 'tool-check',
				toolCallId: 'tool-check-1',
				state: 'output-available',
				input: { target: 'context.txt' },
				output: { ok: true },
			},
			{ type: 'text', text: '附件检查完成。' },
		] as unknown as UIMessage['parts'],
	},
];

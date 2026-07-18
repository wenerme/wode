import type { Meta, StoryObj } from '@storybook/react-vite';
import type { UIMessage } from 'ai';
import { Copy, RotateCcw } from 'lucide-react';
import { AgentMessage } from '../../registry/default/ui/agent-message';

const meta = {
	title: 'Agent/Agent Message',
	tags: ['autodocs'],
	parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const assistantMessage: UIMessage = {
	id: 'assistant-summary',
	role: 'assistant',
	parts: [
		{ type: 'step-start' },
		{ type: 'reasoning', text: '比较了任务状态与最近一次检查结果。', state: 'done' },
		{
			type: 'text',
			text: '### 检查结果\n\n- 类型检查通过\n- 组件测试通过\n- 预览构建仍在运行',
			state: 'done',
		},
		{ type: 'source-url', sourceId: 'source-docs', title: '组件文档', url: 'https://example.com/docs/components' },
	],
};

export const ContentParts: Story = {
	render: () => (
		<main className='bg-base-100 min-h-screen px-4 py-8'>
			<div className='mx-auto max-w-3xl'>
				<AgentMessage
					message={assistantMessage}
					meta='10:42'
					usage='386 tokens'
					actions={
						<>
							<button
								type='button'
								className='btn btn-ghost btn-circle btn-xs size-7 min-h-7 min-w-7'
								aria-label='复制回答'
								title='复制回答'
							>
								<Copy aria-hidden='true' className='size-3.5' />
							</button>
							<button
								type='button'
								className='btn btn-ghost btn-circle btn-xs size-7 min-h-7 min-w-7'
								aria-label='重新生成'
								title='重新生成'
							>
								<RotateCcw aria-hidden='true' className='size-3.5' />
							</button>
						</>
					}
				/>
			</div>
		</main>
	),
};

const toolParts = [
	{
		type: 'tool-search',
		toolCallId: 'tool-1',
		title: '搜索文档',
		state: 'input-streaming',
		input: { query: 'message' },
	},
	{
		type: 'tool-read',
		toolCallId: 'tool-2',
		title: '读取文件',
		state: 'input-available',
		input: { path: '/src/app.tsx' },
	},
	{
		type: 'dynamic-tool',
		toolName: 'publishPreview',
		toolCallId: 'tool-3',
		title: '发布预览',
		state: 'approval-requested',
		input: { environment: 'preview' },
		approval: { id: 'approval-3' },
	},
	{
		type: 'dynamic-tool',
		toolName: 'publishPreview',
		toolCallId: 'tool-4',
		title: '发布预览',
		state: 'approval-responded',
		input: { environment: 'preview' },
		approval: { id: 'approval-4', approved: true },
	},
	{
		type: 'tool-search',
		toolCallId: 'tool-5',
		title: '搜索文档',
		state: 'output-available',
		input: {},
		output: { matches: 12 },
	},
	{
		type: 'tool-read',
		toolCallId: 'tool-6',
		title: '读取文件',
		state: 'output-error',
		input: {},
		errorText: '文件不存在',
	},
	{
		type: 'dynamic-tool',
		toolName: 'removeArtifact',
		toolCallId: 'tool-7',
		title: '删除产物',
		state: 'output-denied',
		input: { path: '/dist/report.json' },
		approval: { id: 'approval-7', approved: false, reason: '保留检查产物' },
	},
] as unknown as UIMessage['parts'];

export const ToolLifecycle: Story = {
	render: () => (
		<main className='bg-base-100 min-h-screen px-4 py-8'>
			<div className='mx-auto max-w-3xl'>
				<AgentMessage message={{ id: 'tool-lifecycle', role: 'assistant', parts: toolParts }} />
			</div>
		</main>
	),
};

export const Multimodal: Story = {
	render: () => (
		<main className='bg-base-100 min-h-screen px-4 py-8'>
			<div className='mx-auto max-w-3xl'>
				<AgentMessage
					message={{
						id: 'multimodal',
						role: 'assistant',
						parts: [
							{ type: 'text', text: '附件已准备好。' },
							{
								type: 'file',
								mediaType: 'image/png',
								filename: 'preview.png',
								url: 'https://placehold.co/640x360/png',
							},
							{
								type: 'file',
								mediaType: 'audio/mpeg',
								filename: 'summary.mp3',
								url: 'https://example.com/summary.mp3',
							},
							{
								type: 'file',
								mediaType: 'application/pdf',
								filename: 'summary.pdf',
								url: 'https://example.com/summary.pdf',
							},
						],
					}}
				/>
			</div>
		</main>
	),
};

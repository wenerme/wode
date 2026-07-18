import type { Meta, StoryObj } from '@storybook/react-vite';
import type { UIMessage } from 'ai';
import { AgentMessage } from '../../registry/default/ui/agent-message';
import {
	MessageScroller,
	MessageScrollerButton,
	MessageScrollerContent,
	MessageScrollerItem,
	MessageScrollerProvider,
	MessageScrollerViewport,
} from '../../registry/default/ui/message-scroller';

const meta = {
	title: 'Agent/Message Scroller',
	parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const transcript: UIMessage[] = Array.from({ length: 24 }, (_value, index) => {
	const user = index % 2 === 0;
	return {
		id: `message-${index + 1}`,
		role: user ? 'user' : 'assistant',
		parts: [
			{
				type: 'text',
				text: user
					? `检查第 ${Math.floor(index / 2) + 1} 组任务状态。`
					: `第 ${Math.floor(index / 2) + 1} 组任务已完成检查。\n\n- 配置可读取\n- 输出结构有效\n- 未发现阻断项`,
				state: index === 23 ? 'streaming' : 'done',
			},
		],
	};
});

export const LongStreamingTranscript: Story = {
	render: () => (
		<main className='bg-base-200 flex min-h-screen items-center justify-center p-3 md:p-8'>
			<section
				aria-label='Agent 对话'
				className='border-base-300 bg-base-100 h-[min(44rem,calc(100vh-1.5rem))] w-full max-w-4xl overflow-hidden rounded-md border'
			>
				<MessageScrollerProvider autoScroll defaultScrollPosition='end'>
					<MessageScroller>
						<MessageScrollerViewport>
							<MessageScrollerContent className='gap-5 px-3 py-5 md:px-6'>
								{transcript.map((message) => (
									<MessageScrollerItem key={message.id} messageId={message.id} scrollAnchor={message.role === 'user'}>
										<AgentMessage message={message} />
									</MessageScrollerItem>
								))}
							</MessageScrollerContent>
						</MessageScrollerViewport>
						<MessageScrollerButton />
					</MessageScroller>
				</MessageScrollerProvider>
			</section>
		</main>
	),
};

export const MobileTranscript: Story = {
	...LongStreamingTranscript,
	parameters: { viewport: { defaultViewport: 'mobile1' } },
};

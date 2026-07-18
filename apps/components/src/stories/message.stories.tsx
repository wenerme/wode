import type { Meta, StoryObj } from '@storybook/react-vite';
import { Bot, UserRound } from 'lucide-react';
import {
	Message,
	MessageAvatar,
	MessageContent,
	MessageFooter,
	MessageGroup,
	MessageHeader,
} from '../../registry/default/ui/message';

const meta = {
	title: 'Agent/Message',
	component: Message,
	tags: ['autodocs'],
	parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof Message>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Variants: Story = {
	render: () => (
		<main className='bg-base-100 min-h-screen px-4 py-8'>
			<MessageGroup className='mx-auto max-w-3xl gap-6'>
				<Message>
					<MessageAvatar className='bg-secondary text-secondary-foreground'>
						<Bot aria-hidden='true' className='size-4' />
					</MessageAvatar>
					<MessageContent>
						<MessageHeader>助手</MessageHeader>
						<p className='max-w-2xl leading-6'>我已整理项目状态，两个检查已通过，还有一个任务正在运行。</p>
						<MessageFooter>刚刚</MessageFooter>
					</MessageContent>
				</Message>
				<Message align='end'>
					<MessageAvatar className='bg-primary text-primary-content'>
						<UserRound aria-hidden='true' className='size-4' />
					</MessageAvatar>
					<MessageContent>
						<MessageHeader>你</MessageHeader>
						<p className='bg-primary text-primary-content max-w-xl rounded-md px-3 py-2 leading-6'>
							继续运行剩余检查，并保留当前草稿。
						</p>
						<MessageFooter>已发送</MessageFooter>
					</MessageContent>
				</Message>
				<Message>
					<MessageContent>
						<MessageHeader>系统</MessageHeader>
						<p className='border-info bg-info/10 border-l-2 px-3 py-2'>会话模型已切换为 Example Reasoner。</p>
					</MessageContent>
				</Message>
			</MessageGroup>
		</main>
	),
};

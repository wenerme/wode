import type { Meta, StoryObj } from '@storybook/react-vite';
import { tool } from 'ai';
import { useRef, useState } from 'react';
import { z } from 'zod';
import { AgentChatPlayground } from '@/agent/agent-ai-sdk';
import { readLiveOpenAIConnectionStoryEnvironment } from './agent-ai-sdk-story-environment';
import {
	resolveLiveOpenAIConnectionStoryState,
	writeLiveOpenAIConnectionStoryState,
} from './agent-ai-sdk-story-storage';

const meta = {
	id: 'agent-ai-sdk-direct-chat',
	title: 'Agent/AI SDK Direct Chat',
	component: AgentChatPlayground,
	parameters: {
		controls: { disable: true },
		layout: 'fullscreen',
	},
} satisfies Meta<typeof AgentChatPlayground>;

export default meta;
type Story = StoryObj<typeof meta>;

const liveStoryTools = {
	calculate: tool({
		description: '对两个数字执行一次受限算术运算。用户要求测试工具调用或计算时使用此工具。',
		inputSchema: z.strictObject({
			left: z.number(),
			operation: z.enum(['add', 'subtract', 'multiply', 'divide']),
			right: z.number(),
		}),
		execute: ({ left, operation, right }) => ({
			left,
			operation,
			result: calculate(left, operation, right),
			right,
		}),
	}),
	currentTime: tool({
		description: '返回指定时区的真实当前时间。用户询问当前时间或要求测试工具调用时使用此工具。',
		inputSchema: z.strictObject({
			timeZone: z.enum(['UTC', 'Asia/Shanghai', 'America/New_York']).default('Asia/Shanghai'),
		}),
		execute: ({ timeZone }) => {
			const now = new Date();
			return {
				display: new Intl.DateTimeFormat('zh-CN', {
					dateStyle: 'full',
					timeStyle: 'long',
					timeZone,
				}).format(now),
				iso: now.toISOString(),
				timeZone,
			};
		},
	}),
};

export const LiveOpenAICompatible: Story = {
	render: () => (
		<main className='bg-base-200 h-screen min-h-[42rem] p-2 md:p-6'>
			<div className='mx-auto size-full max-w-6xl'>
				<LiveOpenAICompatibleStory />
			</div>
		</main>
	),
};

function LiveOpenAICompatibleStory() {
	const [initial] = useState(() =>
		resolveLiveOpenAIConnectionStoryState(resolveLocalStorage(), readLiveOpenAIConnectionStoryEnvironment()),
	);
	const [rememberCredentials, setRememberCredentials] = useState(initial.rememberCredentials);
	const currentConnection = useRef(initial.connection);
	return (
		<AgentChatPlayground
			defaultConnection={initial.connection}
			instructions='如需外部事实，只使用提供的工具。用户明确要求测试工具调用时必须调用工具，并基于工具结果继续回答。'
			maxSteps={8}
			reasoning='high'
			tools={liveStoryTools}
			connectionAccessory={
				<label className='flex cursor-pointer items-center gap-2 text-xs'>
					<input
						type='checkbox'
						className='checkbox checkbox-sm'
						checked={rememberCredentials}
						onChange={(event) => {
							const checked = event.currentTarget.checked;
							setRememberCredentials(checked);
							writeLiveOpenAIConnectionStoryState(resolveLocalStorage(), currentConnection.current, checked);
						}}
					/>
					<span>本地记住凭据</span>
				</label>
			}
			onConnectionDraftChange={(connection) => {
				currentConnection.current = connection;
				writeLiveOpenAIConnectionStoryState(resolveLocalStorage(), connection, rememberCredentials);
			}}
		/>
	);
}

function calculate(left: number, operation: 'add' | 'subtract' | 'multiply' | 'divide', right: number): number {
	if (operation === 'add') return left + right;
	if (operation === 'subtract') return left - right;
	if (operation === 'multiply') return left * right;
	if (right === 0) throw new Error('除数不能为 0。');
	return left / right;
}

function resolveLocalStorage(): Storage | undefined {
	try {
		return globalThis.localStorage;
	} catch {
		return undefined;
	}
}

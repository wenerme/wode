import type { Meta, StoryObj } from '@storybook/react-vite';
import { AgentChatPlayground } from '../../registry/default/blocks/agent-ai-sdk';

const meta = {
	title: 'Agent/AI SDK Direct Chat',
	component: AgentChatPlayground,
	parameters: {
		controls: { disable: true },
		layout: 'fullscreen',
	},
} satisfies Meta<typeof AgentChatPlayground>;

export default meta;
type Story = StoryObj<typeof meta>;

export const LiveOpenAICompatible: Story = {
	render: () => (
		<main className='bg-base-200 h-screen min-h-[42rem] p-2 md:p-6'>
			<div className='mx-auto size-full max-w-6xl'>
				<AgentChatPlayground />
			</div>
		</main>
	),
};

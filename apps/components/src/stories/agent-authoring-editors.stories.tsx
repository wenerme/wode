import type { Meta, StoryObj } from '@storybook/react-vite';
import { type Persona, PersonaSchema } from '@wener/ai/agent/persona';
import { type Skill, SkillSchema } from '@wener/ai/agent/skill';
import { useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { AgentPersonaEditor } from '../../registry/default/blocks/agent-persona-editor';
import { AgentSkillEditor } from '../../registry/default/blocks/agent-skill-editor';

const persona = PersonaSchema.parse({
	id: 'persona-example',
	name: '示例研究助手',
	version: '1.0.0',
	description: '面向公开资料的研究角色。',
	authoring: { personality: '严谨、直接、可追溯', values: ['准确', '透明'] },
	prompts: { system: '仅使用用户提供或公开的资料。', scenario: '协助整理 example.com 的公开文档。' },
	greetings: ['你好，我可以帮助整理公开资料。'],
	author: { name: 'Example Author', url: 'https://example.com/author' },
	governance: {
		visibility: 'private',
		contentRating: 'general',
		reviewStatus: 'draft',
		sourceUrl: 'https://example.com/source',
	},
	assets: [],
});
const skill = SkillSchema.parse({
	id: 'skill-example',
	name: 'public-doc-summary',
	description: '总结公开示例文档',
	version: '1.0.0',
	instructions: '读取用户提供的文档并输出带来源的摘要。',
	tags: ['documentation'],
	toolRequirements: [],
	contextRequirements: [],
	resources: [],
});

const meta = {
	id: 'agent-authoring-editors',
	title: 'Agent/配置编辑器/Authoring',
	component: AgentPersonaEditor,
	args: { value: persona, onChange: () => undefined },
	tags: ['autodocs'],
	parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof AgentPersonaEditor>;
export default meta;
type Story = StoryObj<typeof meta>;

export const PersonaLoreWorkflow: Story = {
	name: 'Persona Lore 与 Asset Manifest',
	render: () => <PersonaDemo />,
	play: async ({ canvasElement }) => {
		canvasElement.dataset.personaLorePlay = 'running';
		const canvas = within(canvasElement);
		await userEvent.click(canvas.getByRole('button', { name: '添加条目' }));
		await expect(canvas.getByLabelText(/^条目 ID/)).toHaveValue('lore-1');
		await userEvent.type(canvas.getByLabelText('触发关键词'), 'example');
		await userEvent.keyboard('{Enter}');
		await userEvent.type(canvas.getByLabelText(/^内容\*?$/), '公开示例知识。');
		await waitFor(() => expect(canvas.getByRole('status', { name: 'Lore count' })).toHaveTextContent('1'));
		await userEvent.click(canvas.getByRole('button', { name: '添加资源' }));
		await expect(canvas.getByLabelText(/^资源 URI/)).toHaveValue('https://cdn.example.com/persona/asset');
		await expect(canvas.getByRole('status', { name: 'Asset count' })).toHaveTextContent('1');
		canvasElement.dataset.personaLorePlay = 'complete';
	},
};

export const SkillRequirementsWorkflow: Story = {
	name: 'Skill Requirements 与 Resources',
	render: () => <SkillDemo />,
	play: async ({ canvasElement }) => {
		canvasElement.dataset.skillRequirementsPlay = 'running';
		const canvas = within(canvasElement);
		await userEvent.click(canvas.getByRole('button', { name: '添加工具要求' }));
		await expect(canvas.getByLabelText(/^工具名称/)).toHaveValue('tool-1');
		await userEvent.clear(canvas.getByLabelText(/^工具名称/));
		await userEvent.type(canvas.getByLabelText(/^工具名称/), 'search');
		await expect(canvas.getByLabelText(/^工具名称/)).toHaveValue('search');
		await userEvent.click(canvas.getByRole('button', { name: '添加上下文要求' }));
		await expect(canvas.getByLabelText(/^值/)).toHaveValue('reference-1.md');
		await userEvent.click(canvas.getByRole('button', { name: '添加资源' }));
		await expect(canvas.getByLabelText('相对路径')).toHaveValue('references/resource-1.md');
		await waitFor(() =>
			expect(canvas.getByRole('status', { name: 'Requirement counts' })).toHaveTextContent('1 / 1 / 1'),
		);
		await expect(canvas.getByText('name: "public-doc-summary"', { exact: false })).toBeInTheDocument();
		canvasElement.dataset.skillRequirementsPlay = 'complete';
	},
};

function PersonaDemo() {
	const [value, setValue] = useState<Persona>(persona);
	return (
		<main className='bg-base-200 min-h-screen p-2 sm:p-6'>
			<div className='mx-auto max-w-6xl space-y-2'>
				<AgentPersonaEditor value={value} onChange={setValue} />
				<div className='flex gap-4 text-xs'>
					<output aria-label='Lore count'>Lore: {value.lorebook?.entries.length ?? 0}</output>
					<output aria-label='Asset count'>Assets: {value.assets.length}</output>
				</div>
			</div>
		</main>
	);
}

function SkillDemo() {
	const [value, setValue] = useState<Skill>(skill);
	return (
		<main className='bg-base-200 min-h-screen p-2 sm:p-6'>
			<div className='mx-auto max-w-6xl space-y-2'>
				<AgentSkillEditor value={value} onChange={setValue} />
				<output aria-label='Requirement counts' className='text-xs'>
					{value.toolRequirements.length} / {value.contextRequirements.length} / {value.resources.length}
				</output>
			</div>
		</main>
	);
}

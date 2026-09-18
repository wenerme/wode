import type { Meta, StoryObj } from '@storybook/react-vite';
import { QueryBuilder } from '@/resource/query-builder';
import {
	ControlledRejectionDemo,
	DraftApplyRejectionDemo,
	EmptyQueryBuilder,
	ReadOnlyQueryBuilder,
	ResettableQueryBuilderDemo,
} from './query-builder-story-demos';
import { customerFields, initialQuery } from './query-builder-story-fixtures';
import { runControlledRejection, runDraftApplyRejection, runInteractionRegression } from './query-builder-story-plays';

const meta = {
	id: 'utilities-query-builder',
	title: 'Resource/Query Builder',
	component: QueryBuilder,
	args: { query: initialQuery, fields: customerFields, onQueryChange: () => undefined },
	tags: ['autodocs'],
	parameters: {
		layout: 'fullscreen',
		docs: {
			description: {
				component: '支持嵌套分组、不可变状态、草稿提交与校验，并可注入值编辑器的 Schema 驱动查询组件。',
			},
		},
	},
} satisfies Meta<typeof QueryBuilder>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SchemaDriven: Story = {
	name: 'Schema 驱动',
	render: () => <ResettableQueryBuilderDemo />,
	parameters: {
		docs: {
			description: { story: '展示 JSON Schema 字段适配、嵌套逻辑、应用持有的草稿状态、外部更新冲突和自定义编辑器。' },
		},
	},
};

export const InteractionRegression: Story = {
	name: '交互回归（自动）',
	render: () => <ResettableQueryBuilderDemo />,
	parameters: {
		docs: {
			description: {
				story: '自动执行字段搜索、草稿提交、外部更新冲突、覆盖和恢复流程；用于交互回归，不作为静态预览入口。',
			},
		},
	},
	play: async ({ canvasElement }) => runInteractionRegression(canvasElement),
};

export const Empty: Story = {
	name: '空状态',
	render: () => <EmptyQueryBuilder />,
	parameters: { docs: { description: { story: '空查询可立即搜索并添加条件或嵌套分组。' } } },
};

export const ReadOnly: Story = {
	name: '只读',
	render: () => <ReadOnlyQueryBuilder />,
	parameters: { docs: { description: { story: '使用正常对比度的静态输出展示可检查策略，不显示修改操作。' } } },
};

export const ControlledRejection: Story = {
	name: '受控拒绝',
	render: () => <ControlledRejectionDemo />,
	parameters: { docs: { description: { story: '父组件记录但拒绝每次变更，用于验证连续操作始终基于当前受控值。' } } },
	play: async ({ canvasElement }) => runControlledRejection(canvasElement),
};

export const DraftApplyRejection: Story = {
	name: '草稿提交拒绝',
	render: () => <DraftApplyRejectionDemo />,
	parameters: { docs: { description: { story: '被拒绝的草稿保持可检查和待提交状态，直到权威值变化或用户重置。' } } },
	play: async ({ canvasElement }) => runDraftApplyRejection(canvasElement),
};

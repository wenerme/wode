import type { Meta, StoryObj } from '@storybook/react-vite';
import { RotateCcw, Save } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import {
	cloneQuery,
	createQueryGroup,
	createQueryRule,
	QueryBuilder,
	type QueryGroup,
	type QueryJsonSchema,
	type QueryValueEditorProps,
	queryFieldsFromJsonSchema,
	useQueryBuilderDraft,
	validateQuery,
} from '../../registry/default/ui/query-builder';

const customerSchema: QueryJsonSchema = {
	type: 'object',
	title: '客户',
	properties: {
		status: {
			type: 'string',
			title: '生命周期状态',
			description: '客户当前所处的商业生命周期',
			enum: ['active', 'trial', 'paused'],
			'x-enumNames': ['活跃', '试用', '暂停'],
			'x-query': { order: 1 },
		},
		revenue: {
			type: 'number',
			title: '年收入',
			description: '标准化后的年度收入（美元）',
			'x-query': { order: 2, group: '商务' },
		},
		riskScore: {
			type: 'integer',
			title: '风险评分',
			description: '0 到 100 的内部风险评分',
			'x-query': { order: 3, group: '商务', editor: 'risk-score' },
		},
		ownerId: {
			type: 'string',
			title: '客户负责人',
			description: '负责维护客户关系的成员',
			'x-query': { order: 4, group: '客户关系', editor: 'owner' },
		},
		createdAt: {
			type: 'string',
			format: 'date-time',
			title: '创建时间',
			'x-query': { group: '生命周期' },
		},
		archived: {
			type: 'boolean',
			title: '已归档',
			description: '是否包含已归档客户记录',
			'x-query': { group: '生命周期' },
		},
		profile: {
			type: 'object',
			title: '客户画像',
			properties: {
				country: {
					type: 'string',
					title: '国家或地区',
					enum: ['CN', 'SG', 'US'],
					'x-enumNames': ['中国', '新加坡', '美国'],
				},
				industry: { type: 'string', title: '行业' },
			},
		},
	},
};

const { fields: customerFields, diagnostics: schemaDiagnostics } = queryFieldsFromJsonSchema(customerSchema);

const initialQuery = createQueryGroup('customer-root', {
	children: [
		createQueryRule('status-rule', '/status', 'in', ['active', 'trial']),
		createQueryRule('revenue-rule', '/revenue', 'between', [1000, 50000]),
		createQueryGroup('ownership-group', {
			combinator: 'or',
			children: [
				createQueryRule('owner-rule', '/ownerId', 'eq', 'owner-ada'),
				createQueryRule('risk-rule', '/riskScore', 'gte', 60),
			],
		}),
	],
});

const meta = {
	id: 'utilities-query-builder',
	title: '组件/查询构建器',
	component: QueryBuilder,
	args: {
		query: initialQuery,
		fields: customerFields,
		onQueryChange: () => undefined,
	},
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
			description: {
				story: '展示 JSON Schema 字段适配、嵌套逻辑、应用持有的草稿状态、外部更新冲突和自定义编辑器。',
			},
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
	play: async ({ canvasElement }) => {
		canvasElement.dataset.queryBuilderPlay = 'running';
		const canvas = within(canvasElement);
		await userEvent.click(canvas.getByRole('button', { name: '恢复示例' }));
		await waitFor(() => expect(canvas.getAllByText('4 个条件').length).toBeGreaterThan(0));
		const body = within(canvasElement.ownerDocument.body);
		await userEvent.click(canvas.getByRole('button', { name: '已选 2 项' }));
		await body.findByRole('searchbox', { name: '搜索值' });
		await userEvent.keyboard('{End}');
		await expect(body.getByRole('button', { name: '暂停' })).toHaveFocus();
		await userEvent.keyboard('{Home}');
		await expect(body.getByRole('button', { name: '活跃' })).toHaveFocus();
		await userEvent.keyboard('{Escape}');

		const addButtons = canvas.getAllByRole('button', { name: '添加条件' });
		await userEvent.click(addButtons[0]);
		const search = await body.findByRole('searchbox', { name: '搜索字段' });
		await userEvent.type(search, '已归档');
		const archivedOption = await waitFor(() => {
			const option = [
				...canvasElement.ownerDocument.querySelectorAll<HTMLButtonElement>('button[data-query-option="field"]'),
			].find((candidate) => candidate.textContent?.includes('已归档'));
			expect(option).toBeDefined();
			return option as HTMLButtonElement;
		});
		await userEvent.keyboard('{ArrowUp}');
		await expect(archivedOption).toHaveFocus();
		await userEvent.keyboard('{Enter}');
		await expect(canvas.getAllByText('5 个条件').length).toBeGreaterThan(0);
		await expect(canvas.getByRole('group', { name: '已归档条件' })).toBeInTheDocument();

		await userEvent.click(canvas.getByRole('button', { name: '应用更改' }));
		await expect(canvas.getByText('已应用版本 1')).toBeInTheDocument();
		const minimumRevenue = canvas.getAllByRole('spinbutton', { name: '最小值' })[0];
		await userEvent.clear(minimumRevenue);
		await userEvent.type(minimumRevenue, '-12.5');
		await expect(minimumRevenue).toHaveValue(-12.5);
		await userEvent.click(canvas.getByRole('button', { name: '模拟已保存更新' }));
		await expect(canvas.getByText('编辑草稿期间，已保存的查询发生了变化。')).toBeInTheDocument();
		await expect(canvas.getByRole('button', { name: '应用更改' })).toBeDisabled();
		await userEvent.click(canvas.getByRole('button', { name: '模拟已保存更新' }));
		await expect(canvas.queryByText('编辑草稿期间，已保存的查询发生了变化。')).not.toBeInTheDocument();
		await expect(canvas.getByRole('button', { name: '应用更改' })).toBeEnabled();
		await userEvent.click(canvas.getByRole('button', { name: '模拟已保存更新' }));
		await expect(canvas.getByText('编辑草稿期间，已保存的查询发生了变化。')).toBeInTheDocument();
		await userEvent.clear(minimumRevenue);
		await userEvent.type(minimumRevenue, '1000');
		await userEvent.click(canvas.getAllByRole('checkbox', { name: '排除' })[0]);
		await expect(canvas.queryByText('编辑草稿期间，已保存的查询发生了变化。')).not.toBeInTheDocument();
		await expect(canvas.getByRole('button', { name: '应用更改' })).toBeDisabled();
		await userEvent.clear(minimumRevenue);
		await userEvent.type(minimumRevenue, '-12.5');
		await userEvent.click(canvas.getByRole('button', { name: '模拟已保存更新' }));
		await expect(canvas.getByText('编辑草稿期间，已保存的查询发生了变化。')).toBeInTheDocument();
		await userEvent.click(canvas.getByRole('button', { name: '覆盖已保存查询' }));
		await expect(canvas.getByText('已应用版本 2')).toBeInTheDocument();
		await expect(canvas.queryByText('编辑草稿期间，已保存的查询发生了变化。')).not.toBeInTheDocument();
		await userEvent.click(canvas.getByRole('button', { name: '恢复示例' }));
		await waitFor(() => expect(canvas.getByText('已应用版本 0')).toBeInTheDocument());
		canvasElement.dataset.queryBuilderPlay = 'complete';
	},
};

export const Empty: Story = {
	name: '空状态',
	render: () => <EmptyQueryBuilder />,
	parameters: {
		docs: {
			description: {
				story: '空查询可立即搜索并添加条件或嵌套分组。',
			},
		},
	},
};

export const ReadOnly: Story = {
	name: '只读',
	render: () => (
		<main className='bg-base-200 min-h-screen p-4 md:p-8'>
			<h1 className='sr-only'>只读查询示例</h1>
			<div className='mx-auto max-w-5xl'>
				<QueryBuilder
					query={initialQuery}
					fields={customerFields}
					readOnly
					title='已保存的客户分群'
					description='此策略由营收运营团队维护。'
					valueEditors={{ owner: OwnerEditor, 'risk-score': RiskScoreEditor }}
					onQueryChange={() => undefined}
				/>
			</div>
		</main>
	),
	parameters: {
		docs: {
			description: {
				story: '使用正常对比度的静态输出展示可检查策略，不显示修改操作。',
			},
		},
	},
};

export const ControlledRejection: Story = {
	name: '受控拒绝',
	render: () => <ControlledRejectionDemo />,
	parameters: {
		docs: {
			description: {
				story: '父组件记录但拒绝每次变更，用于验证连续操作始终基于当前受控值。',
			},
		},
	},
	play: async ({ canvasElement }) => {
		canvasElement.dataset.queryControlledPlay = 'running';
		const canvas = within(canvasElement);
		const rootNot = canvas.getAllByRole('checkbox', { name: '排除' })[0];
		await userEvent.click(rootNot);
		await userEvent.click(rootNot);
		await userEvent.click(canvas.getByRole('button', { name: '查看变更提议' }));
		await expect(canvas.getByRole('status', { name: '提议的排除状态' })).toHaveTextContent('true, true');
		await expect(rootNot).not.toBeChecked();
		const minimumRevenue = canvas.getByRole('spinbutton', { name: '最小值' });
		await userEvent.clear(minimumRevenue);
		await waitFor(() => expect(minimumRevenue).toHaveValue(1000));
		canvasElement.dataset.queryControlledPlay = 'complete';
	},
};

export const DraftApplyRejection: Story = {
	name: '草稿提交拒绝',
	render: () => <DraftApplyRejectionDemo />,
	parameters: {
		docs: {
			description: {
				story: '被拒绝的草稿保持可检查和待提交状态，直到权威值变化或用户重置。',
			},
		},
	},
	play: async ({ canvasElement }) => {
		canvasElement.dataset.queryDraftRejectionPlay = 'running';
		const canvas = within(canvasElement);
		const rootNot = canvas.getAllByRole('checkbox', { name: '排除' })[0];
		await userEvent.click(rootNot);
		await userEvent.click(canvas.getByRole('button', { name: '提交草稿' }));
		await expect(canvas.getByRole('status', { name: '草稿提议' })).toHaveTextContent('1 次提议');
		await expect(rootNot).toBeChecked();
		await expect(canvas.getByRole('button', { name: '提交草稿' })).toBeEnabled();
		await userEvent.click(canvas.getByRole('button', { name: '重置草稿' }));
		await expect(rootNot).not.toBeChecked();
		canvasElement.dataset.queryDraftRejectionPlay = 'complete';
	},
};

function ResettableQueryBuilderDemo() {
	const [revision, setRevision] = useState(0);
	return <DraftQueryBuilderDemo key={revision} onRestore={() => setRevision((current) => current + 1)} />;
}

function DraftQueryBuilderDemo({ onRestore }: { onRestore: () => void }) {
	const [committed, setCommitted] = useState<QueryGroup>(() => cloneQuery(initialQuery));
	const [appliedRevision, setAppliedRevision] = useState(0);
	const validate = useCallback((query: QueryGroup) => validateQuery(query, { fields: customerFields }), []);
	const draft = useQueryBuilderDraft({
		value: committed,
		validate,
		onApply: (query) => {
			setCommitted(query);
			setAppliedRevision((current) => current + 1);
		},
	});
	return (
		<main className='bg-base-200 min-h-screen'>
			<header className='border-base-300 bg-base-100 border-b px-4 py-5 md:px-8'>
				<div className='mx-auto flex max-w-7xl flex-wrap items-end justify-between gap-4'>
					<div>
						<h1 className='text-xl font-semibold'>客户查询工作台</h1>
						<p className='text-base-content/65 mt-1 text-sm'>Schema 字段、嵌套逻辑、校验和应用持有的草稿状态。</p>
					</div>
					<div className='flex flex-wrap items-center gap-2 text-xs'>
						<span className='badge badge-outline'>Schema 诊断 {schemaDiagnostics.length}</span>
						<span className='badge badge-outline'>已应用版本 {appliedRevision}</span>
						<button
							type='button'
							className='btn btn-outline btn-xs'
							onClick={() => setCommitted((current) => ({ ...cloneQuery(current), negated: !current.negated }))}
						>
							模拟已保存更新
						</button>
					</div>
				</div>
			</header>
			<div className='mx-auto grid max-w-7xl min-w-0 xl:grid-cols-[minmax(0,1fr)_22rem]'>
				<section className='min-w-0 p-3 md:p-6'>
					{draft.stale ? (
						<div className='alert alert-warning mb-3 flex-wrap text-sm'>
							<span className='min-w-0 flex-1'>编辑草稿期间，已保存的查询发生了变化。</span>
							<div className='flex flex-wrap gap-1'>
								<button type='button' className='btn btn-ghost btn-sm' onClick={draft.reset}>
									重新加载已保存查询
								</button>
								<button type='button' className='btn btn-warning btn-sm' onClick={draft.overwrite}>
									覆盖已保存查询
								</button>
							</div>
						</div>
					) : null}
					<QueryBuilder
						query={draft.draft}
						fields={customerFields}
						title='客户分群'
						description='使用可复用、可序列化的条件匹配客户记录。'
						valueEditors={{ owner: OwnerEditor, 'risk-score': RiskScoreEditor }}
						actions={
							<>
								<button type='button' className='btn btn-ghost btn-sm' disabled={!draft.dirty} onClick={draft.reset}>
									<RotateCcw aria-hidden='true' className='size-4' />
									重置草稿
								</button>
								<button type='button' className='btn btn-ghost btn-sm' onClick={onRestore}>
									恢复示例
								</button>
								<button
									type='button'
									className='btn btn-primary btn-sm'
									disabled={!draft.dirty || draft.stale || draft.issues.length > 0}
									onClick={() => draft.apply()}
								>
									<Save aria-hidden='true' className='size-4' />
									应用更改
								</button>
							</>
						}
						onQueryChange={(query) => draft.setDraft(query)}
					/>
				</section>
				<aside className='border-base-300 bg-base-100 min-w-0 border-t p-4 xl:border-t-0 xl:border-l'>
					<h2 className='text-sm font-semibold'>可序列化 AST</h2>
					<p className='text-base-content/65 mt-1 text-xs'>后端适配器无需引入 UI 代码即可转换此文档。</p>
					<div
						role='region'
						aria-label='可序列化 AST'
						className='bg-base-200 mt-3 max-h-[42rem] overflow-auto rounded-md p-3 text-[11px] leading-5'
					>
						<pre>{JSON.stringify(draft.draft, null, 2)}</pre>
					</div>
				</aside>
			</div>
		</main>
	);
}

function EmptyQueryBuilder() {
	const [query, setQuery] = useState(() => createQueryGroup('empty-root'));
	return (
		<main className='bg-base-200 min-h-screen p-4 md:p-8'>
			<QueryBuilder
				className='mx-auto max-w-5xl'
				query={query}
				fields={customerFields}
				title='新建查询'
				description='选择字段或创建嵌套分组。'
				onQueryChange={setQuery}
			/>
		</main>
	);
}

function DraftApplyRejectionDemo() {
	const [committed] = useState<QueryGroup>(() => cloneQuery(initialQuery));
	const [proposals, setProposals] = useState(0);
	const draft = useQueryBuilderDraft({
		value: committed,
		onApply: () => setProposals((current) => current + 1),
	});
	return (
		<main className='bg-base-200 min-h-screen p-4 md:p-8'>
			<h1 className='sr-only'>草稿提交被拒绝示例</h1>
			<div className='mx-auto max-w-5xl space-y-3'>
				<QueryBuilder
					query={draft.draft}
					fields={customerFields}
					title='草稿提议'
					description='父组件有意保留当前已保存查询。'
					valueEditors={{ owner: OwnerEditor, 'risk-score': RiskScoreEditor }}
					actions={
						<>
							<button type='button' className='btn btn-ghost btn-sm' disabled={!draft.dirty} onClick={draft.reset}>
								重置草稿
							</button>
							<button
								type='button'
								className='btn btn-primary btn-sm'
								disabled={!draft.dirty || !draft.canApply}
								onClick={() => draft.apply()}
							>
								提交草稿
							</button>
						</>
					}
					onQueryChange={draft.onQueryChange}
				/>
				<output aria-label='草稿提议' className='text-sm font-medium'>
					{proposals} 次提议
				</output>
			</div>
		</main>
	);
}

function ControlledRejectionDemo() {
	const proposals = useRef<QueryGroup[]>([]);
	const [summary, setSummary] = useState('none');
	return (
		<main className='bg-base-200 min-h-screen p-4 md:p-8'>
			<h1 className='sr-only'>受控查询示例</h1>
			<div className='mx-auto max-w-5xl space-y-3'>
				<QueryBuilder
					query={initialQuery}
					fields={customerFields}
					title='严格受控查询'
					description='父组件记录变更提议，但有意拒绝应用。'
					valueEditors={{ owner: OwnerEditor, 'risk-score': RiskScoreEditor }}
					onQueryChange={(query) => proposals.current.push(query)}
				/>
				<div className='flex items-center gap-3'>
					<button
						type='button'
						className='btn btn-outline btn-sm'
						onClick={() => setSummary(proposals.current.map((query) => String(query.negated)).join(', '))}
					>
						查看变更提议
					</button>
					<output aria-label='提议的排除状态' className='text-sm font-medium'>
						{summary}
					</output>
				</div>
			</div>
		</main>
	);
}

function OwnerEditor({ id, value, disabled, readOnly, invalid, ariaDescribedBy, onChange }: QueryValueEditorProps) {
	const owners: Record<string, string> = {
		'owner-ada': 'Ada · 大客户组',
		'owner-lin': 'Lin · 增长组',
		'owner-maya': 'Maya · 战略组',
	};
	if (readOnly) {
		return (
			<output
				id={id}
				aria-label='客户负责人'
				aria-describedby={ariaDescribedBy}
				className='border-base-300 flex min-h-8 items-center rounded-sm border px-2.5 text-sm'
			>
				{typeof value === 'string' ? (owners[value] ?? value) : '选择负责人'}
			</output>
		);
	}
	return (
		<select
			id={id}
			className='select select-bordered select-sm w-full min-w-0'
			aria-label='客户负责人'
			aria-invalid={invalid || undefined}
			aria-describedby={ariaDescribedBy}
			disabled={disabled}
			value={typeof value === 'string' ? value : ''}
			onChange={(event) => onChange(event.target.value || null)}
		>
			<option value=''>选择负责人</option>
			<option value='owner-ada'>Ada · 大客户组</option>
			<option value='owner-lin'>Lin · 增长组</option>
			<option value='owner-maya'>Maya · 战略组</option>
		</select>
	);
}

function RiskScoreEditor({ id, value, disabled, readOnly, invalid, ariaDescribedBy, onChange }: QueryValueEditorProps) {
	const score = typeof value === 'number' ? value : 50;
	if (readOnly) {
		return (
			<output
				id={id}
				aria-label='风险评分'
				aria-describedby={ariaDescribedBy}
				className='border-base-300 flex min-h-8 items-center rounded-sm border px-2.5 text-sm tabular-nums'
			>
				{score}
			</output>
		);
	}
	return (
		<div className='flex min-w-0 items-center gap-3'>
			<input
				id={id}
				type='range'
				className='range range-primary range-xs min-w-0 flex-1'
				aria-label='风险评分'
				aria-invalid={invalid || undefined}
				aria-describedby={ariaDescribedBy}
				disabled={disabled}
				min={0}
				max={100}
				value={score}
				onChange={(event) => onChange(Number(event.target.value))}
			/>
			<output htmlFor={id} className='badge badge-outline w-11 shrink-0 tabular-nums'>
				{score}
			</output>
		</div>
	);
}

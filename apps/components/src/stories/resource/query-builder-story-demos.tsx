import { RotateCcw, Save } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import {
	cloneQuery,
	createQueryGroup,
	QueryBuilder,
	type QueryGroup,
	useQueryBuilderDraft,
	validateQuery,
} from '@/resource/query-builder';
import { customerValueEditors } from './query-builder-story-editors';
import { customerFields, initialQuery, schemaDiagnostics } from './query-builder-story-fixtures';

export function ResettableQueryBuilderDemo() {
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
						valueEditors={customerValueEditors}
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

export function EmptyQueryBuilder() {
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

export function ReadOnlyQueryBuilder() {
	return (
		<main className='bg-base-200 min-h-screen p-4 md:p-8'>
			<h1 className='sr-only'>只读查询示例</h1>
			<div className='mx-auto max-w-5xl'>
				<QueryBuilder
					query={initialQuery}
					fields={customerFields}
					readOnly
					title='已保存的客户分群'
					description='此策略由营收运营团队维护。'
					valueEditors={customerValueEditors}
					onQueryChange={() => undefined}
				/>
			</div>
		</main>
	);
}

export function DraftApplyRejectionDemo() {
	const [committed] = useState<QueryGroup>(() => cloneQuery(initialQuery));
	const [proposals, setProposals] = useState(0);
	const draft = useQueryBuilderDraft({ value: committed, onApply: () => setProposals((current) => current + 1) });
	return (
		<main className='bg-base-200 min-h-screen p-4 md:p-8'>
			<h1 className='sr-only'>草稿提交被拒绝示例</h1>
			<div className='mx-auto max-w-5xl space-y-3'>
				<QueryBuilder
					query={draft.draft}
					fields={customerFields}
					title='草稿提议'
					description='父组件有意保留当前已保存查询。'
					valueEditors={customerValueEditors}
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

export function ControlledRejectionDemo() {
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
					valueEditors={customerValueEditors}
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

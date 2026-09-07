import { ChevronDown, ChevronRight, Layers3, Plus } from 'lucide-react';
import { useId } from 'react';
import { cn } from '@/lib/utils';
import type { QueryBuilderContext } from './query-builder-context';
import { QueryFieldPicker } from './query-editors';
import { QueryBuilderRule, NodeActions } from './query-builder-rule';
import type { QueryGroup } from './query-model';
import { createQueryGroup, createQueryRuleForField } from './query-model';
import { countQueryRules } from './query-state';

export type QueryBuilderGroupProps = {
	group: QueryGroup;
	context: QueryBuilderContext;
	depth: number;
	index: number;
	siblingCount: number;
	parentId?: string;
	root?: boolean;
};

export function QueryBuilderGroup({
	group,
	context,
	depth,
	index,
	siblingCount,
	parentId,
	root = false,
}: QueryBuilderGroupProps) {
	const { messages } = context;
	const collapsed = context.collapsed.has(group.id);
	const groupIssues = context.issuesByNode.get(group.id) ?? [];
	const groupIssueId = useId();
	return (
		<fieldset
			data-slot='query-group'
			data-depth={depth}
			aria-describedby={groupIssues.length ? groupIssueId : undefined}
			className={cn('border-base-300 min-w-0', root ? 'border-0' : 'bg-base-100 rounded-md border border-s-2')}
		>
			<legend className='sr-only'>{messages.conditionCount(countQueryRules(group))}</legend>
			<div className={cn('flex min-h-10 min-w-0 flex-wrap items-center gap-2 px-2 py-1.5', !root && 'bg-base-200/30')}>
				<button
					type='button'
					className='btn btn-ghost btn-xs btn-square'
					title={collapsed ? messages.expandGroup : messages.collapseGroup}
					aria-label={collapsed ? messages.expandGroup : messages.collapseGroup}
					aria-expanded={!collapsed}
					onClick={() => context.toggleCollapsed(group.id)}
				>
					{collapsed ? (
						<ChevronRight aria-hidden='true' className='size-4' />
					) : (
						<ChevronDown aria-hidden='true' className='size-4' />
					)}
				</button>
				<span className='text-base-content/65 text-xs font-medium'>{messages.match}</span>
				{context.readOnly ? (
					<span className='badge badge-outline badge-sm'>
						{group.combinator === 'and' ? messages.all : messages.any}
					</span>
				) : (
					<div role='radiogroup' aria-label={messages.match} className='join'>
						{(['and', 'or'] as const).map((combinator) => (
							<label
								key={combinator}
								className={cn('btn btn-xs join-item min-w-11', group.combinator === combinator && 'btn-active')}
							>
								<input
									type='radio'
									className='sr-only'
									name={`query-combinator-${context.instanceId}-${group.id}`}
									value={combinator}
									checked={group.combinator === combinator}
									disabled={context.disabled}
									onChange={() => context.dispatch({ type: 'update-group', id: group.id, patch: { combinator } })}
								/>
								{combinator === 'and' ? messages.all : messages.any}
							</label>
						))}
					</div>
				)}
				{context.readOnly ? (
					group.negated ? (
						<span className='badge badge-outline badge-sm'>{messages.not}</span>
					) : null
				) : (
					<label className='label text-base-content cursor-pointer gap-1.5 py-0 text-xs'>
						<input
							type='checkbox'
							className='toggle toggle-xs'
							checked={group.negated}
							disabled={context.disabled}
							onChange={(event) =>
								context.dispatch({ type: 'update-group', id: group.id, patch: { negated: event.target.checked } })
							}
						/>
						{messages.not}
					</label>
				)}
				<span className='text-base-content/65 text-[11px]'>{messages.conditionCount(countQueryRules(group))}</span>
				{groupIssues.length ? (
					<span
						className='badge badge-warning badge-xs'
						title={groupIssues[0].message}
						aria-label={groupIssues[0].message}
					>
						{groupIssues.length}
					</span>
				) : null}
				<div className='min-w-2 flex-1' />
				{!root && parentId && !context.readOnly ? (
					<NodeActions node={group} parentId={parentId} context={context} index={index} siblingCount={siblingCount} />
				) : null}
			</div>
			{context.showValidation && groupIssues.length ? (
				<div
					id={groupIssueId}
					className='border-warning/40 bg-warning/15 text-base-content mx-2 mb-1 rounded-sm border px-2 py-1 text-xs'
					role='alert'
				>
					{groupIssues[0].message}
				</div>
			) : null}
			{!collapsed ? (
				<div className={cn('min-w-0 space-y-2', root ? 'pt-1' : 'p-2')}>
					{group.children.length === 0 ? (
						<div className='border-base-300 text-base-content/65 rounded-sm border border-dashed px-3 py-8 text-center text-sm'>
							{messages.emptyGroup}
						</div>
					) : (
						group.children.map((child, childIndex) =>
							child.type === 'group' ? (
								<QueryBuilderGroup
									key={child.id}
									group={child}
									context={context}
									depth={depth + 1}
									index={childIndex}
									siblingCount={group.children.length}
									parentId={group.id}
								/>
							) : (
								<QueryBuilderRule
									key={child.id}
									rule={child}
									parentId={group.id}
									context={context}
									index={childIndex}
									siblingCount={group.children.length}
								/>
							),
						)
					)}
					{!context.readOnly ? (
						<div className='flex flex-wrap items-center gap-2 pt-1'>
							<QueryFieldPicker
								fields={context.fields}
								label={
									<>
										<Plus aria-hidden='true' className='size-3.5' /> {messages.addCondition}
									</>
								}
								searchLabel={messages.searchFields}
								emptyLabel={messages.noFields}
								disabled={context.disabled}
								onSelect={(field) =>
									context.dispatch({
										type: 'insert-node',
										parentId: group.id,
										node: createQueryRuleForField(field, context.createId('rule'), context.operators),
									})
								}
							/>
							<button
								type='button'
								className='btn btn-ghost btn-sm'
								disabled={context.disabled || depth >= context.maxDepth}
								onClick={() =>
									context.dispatch({
										type: 'insert-node',
										parentId: group.id,
										node: createQueryGroup(context.createId('group')),
									})
								}
							>
								<Layers3 aria-hidden='true' className='size-4' />
								{messages.addGroup}
							</button>
						</div>
					) : null}
				</div>
			) : null}
		</fieldset>
	);
}

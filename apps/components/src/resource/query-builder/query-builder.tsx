import type { ComponentPropsWithRef, ReactNode } from 'react';
import { useId, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import type { QueryBuilderContext } from './query-builder-context';
import { QueryBuilderGroup } from './query-builder-group';
import type { QueryValueEditorComponent, QueryValueEditorRenderer } from './query-editors';
import type { QueryBuilderMessages } from './query-messages';
import { defaultQueryBuilderMessages } from './query-messages';
import type { QueryField, QueryGroup, QueryIdFactory, QueryOperator } from './query-model';
import { createQueryId, defaultQueryOperators } from './query-model';
import type { QueryAction, QueryValidationIssue } from './query-state';
import { countQueryRules, isQueryGroupValue, validateQuery } from './query-state';
import { useQueryBuilderController } from './use-query-builder';

export type QueryBuilderHeadingLevel = 'h2' | 'h3' | 'h4';

export type QueryBuilderProps = Omit<ComponentPropsWithRef<'section'>, 'onChange' | 'title'> & {
	query: QueryGroup;
	fields: readonly QueryField[];
	operators?: readonly QueryOperator[];
	onQueryChange: (query: QueryGroup, action: QueryAction) => void;
	title?: ReactNode;
	description?: ReactNode;
	actions?: ReactNode;
	headingLevel?: QueryBuilderHeadingLevel;
	messages?: Partial<QueryBuilderMessages>;
	valueEditors?: Readonly<Record<string, QueryValueEditorComponent>>;
	renderValueEditor?: QueryValueEditorRenderer;
	createId?: QueryIdFactory;
	maxDepth?: number;
	readOnly?: boolean;
	disabled?: boolean;
	showValidation?: boolean;
};

export function QueryBuilder({
	query,
	fields,
	operators = defaultQueryOperators,
	onQueryChange,
	title,
	description,
	actions,
	headingLevel: Heading = 'h2',
	messages: messageOverrides,
	valueEditors,
	renderValueEditor,
	createId = createQueryId,
	maxDepth = 4,
	readOnly = false,
	disabled = false,
	showValidation = true,
	className,
	'aria-label': ariaLabel,
	...props
}: QueryBuilderProps) {
	const instanceId = useId();
	const messages = useMemo(() => ({ ...defaultQueryBuilderMessages, ...messageOverrides }), [messageOverrides]);
	const effectiveMaxDepth = Number.isInteger(maxDepth) && maxDepth >= 0 ? Math.min(maxDepth, 64) : 4;
	const reducerOptions = useMemo(() => ({ maxDepth: effectiveMaxDepth }), [effectiveMaxDepth]);
	const { dispatch } = useQueryBuilderController({ query, onQueryChange, reducerOptions });
	const fieldMap = useMemo(() => new Map(fields.map((field) => [field.name, field])), [fields]);
	const operatorMap = useMemo(() => new Map(operators.map((operator) => [operator.name, operator])), [operators]);
	const queryIsValid = useMemo(() => isQueryGroupValue(query), [query]);
	const issues = useMemo(
		() =>
			showValidation
				? validateQuery(query, { fields, operators, maxDepth: effectiveMaxDepth }).map((issue) => ({
						...issue,
						message: messages.validationIssue(issue),
					}))
				: [],
		[effectiveMaxDepth, fields, messages, operators, query, showValidation],
	);
	const issuesByNode = useMemo(() => groupIssuesByNode(issues), [issues]);
	const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(() => new Set());
	const context: QueryBuilderContext = {
		fields,
		fieldMap,
		operators,
		operatorMap,
		messages,
		issuesByNode,
		valueEditors,
		renderValueEditor,
		createId,
		maxDepth: effectiveMaxDepth,
		readOnly,
		disabled,
		showValidation,
		instanceId,
		dispatch,
		collapsed,
		toggleCollapsed: (id) =>
			setCollapsed((current) => {
				const next = new Set(current);
				if (next.has(id)) next.delete(id);
				else next.add(id);
				return next;
			}),
	};
	const ruleCount = queryIsValid ? countQueryRules(query) : 0;
	return (
		<section
			data-slot='query-builder'
			data-valid={queryIsValid && issues.length === 0 ? 'true' : 'false'}
			aria-label={ariaLabel ?? (typeof title === 'string' ? title : messages.title)}
			data-readonly={readOnly || undefined}
			className={cn('border-base-300 bg-base-100 min-w-0 overflow-hidden rounded-md border', className)}
			{...props}
		>
			<header className='border-base-300 bg-base-200/35 flex min-h-14 flex-wrap items-start gap-3 border-b px-3 py-3 md:px-4'>
				<div className='min-w-0 flex-1'>
					<div className='flex flex-wrap items-center gap-2'>
						<Heading className='text-sm font-semibold'>{title ?? messages.title}</Heading>
						<span className='badge badge-outline badge-sm'>{messages.conditionCount(ruleCount)}</span>
						{issues.length ? (
							<span className='badge badge-warning badge-sm'>{messages.validationCount(issues.length)}</span>
						) : null}
					</div>
					{description ? <div className='text-base-content/65 mt-0.5 text-xs'>{description}</div> : null}
				</div>
				{actions ? (
					<div className='flex w-full max-w-full min-w-0 flex-wrap items-center gap-1 sm:w-auto sm:shrink-0 sm:justify-end'>
						{actions}
					</div>
				) : null}
			</header>
			<div className='p-2 sm:p-3'>
				{queryIsValid ? (
					<QueryBuilderGroup group={query} context={context} depth={0} index={0} siblingCount={1} root />
				) : (
					<div
						className='border-error/40 bg-error/10 text-base-content rounded-sm border px-3 py-4 text-sm'
						role='alert'
					>
						{messages.invalidQuery}
					</div>
				)}
			</div>
			{showValidation ? (
				<div className='sr-only' role='status' aria-live='polite'>
					{issues.length ? messages.validationCount(issues.length) : ''}
				</div>
			) : null}
		</section>
	);
}

function groupIssuesByNode(issues: readonly QueryValidationIssue[]) {
	const map = new Map<string, QueryValidationIssue[]>();
	for (const issue of issues) map.set(issue.nodeId, [...(map.get(issue.nodeId) ?? []), issue]);
	return map;
}

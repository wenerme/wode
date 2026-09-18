'use client';

import { Bot, Box, BrainCircuit, Cable, Network, Plus, ServerCog, Sparkles, Trash2 } from 'lucide-react';
import type { ComponentType, KeyboardEvent } from 'react';
import { useId, useRef } from 'react';
import { type ResourceCollections, renderSelectedStudioEditor, resourcesForKind } from './agent-config-studio-editor';
import type {
	AgentConfigResourceKind,
	AgentConfigStudioMessages,
	AgentConfigStudioProps,
} from './agent-config-studio-types';

const defaultMessages: AgentConfigStudioMessages = {
	title: 'Agent 配置工作室',
	description: '集中浏览独立资源，并使用 canonical editor 修改当前选择。',
	resourceList: '资源列表',
	resourceTypes: '配置资源类型',
	emptyList: '此分类暂无资源',
	emptySelection: '请选择一个资源开始编辑',
	create: '新建资源',
	remove: '删除资源',
	identityConflict: (id) => `资源 ID“${id}”已存在，请使用不同的 ID。`,
	kinds: {
		provider: 'AI 提供方',
		endpoint: 'AI Endpoint',
		model: 'AI 模型',
		service: 'AI 服务',
		mcp: 'MCP 服务',
		persona: '角色',
		skill: '技能',
	},
};

const kinds: readonly {
	kind: AgentConfigResourceKind;
	icon: ComponentType<{ className?: string; 'aria-hidden'?: 'true' }>;
}[] = [
	{ kind: 'provider', icon: Cable },
	{ kind: 'endpoint', icon: Network },
	{ kind: 'model', icon: BrainCircuit },
	{ kind: 'service', icon: ServerCog },
	{ kind: 'mcp', icon: Box },
	{ kind: 'persona', icon: Bot },
	{ kind: 'skill', icon: Sparkles },
];

export function AgentConfigStudio({
	providers,
	endpoints,
	models,
	services,
	mcpServers,
	personas,
	skills,
	onProvidersChange,
	onEndpointsChange,
	onModelsChange,
	onServicesChange,
	onMcpServersChange,
	onPersonasChange,
	onSkillsChange,
	selection,
	onSelectionChange,
	onCreate,
	onRemove,
	disabled = false,
	readOnly = false,
	messages: overrides,
	empty,
	className,
	...props
}: AgentConfigStudioProps) {
	const messages: AgentConfigStudioMessages = {
		...defaultMessages,
		...overrides,
		kinds: { ...defaultMessages.kinds, ...overrides?.kinds },
	};
	const id = useId();
	const tabRefs = useRef<Partial<Record<AgentConfigResourceKind, HTMLButtonElement | null>>>({});
	const collections = { providers, endpoints, models, services, mcpServers, personas, skills };
	const counts = {
		provider: providers.length,
		endpoint: endpoints.length,
		model: models.length,
		service: services.length,
		mcp: mcpServers.length,
		persona: personas.length,
		skill: skills.length,
	};
	const selectKind = (kind: AgentConfigResourceKind) => {
		const first = resourcesForKind(kind, collections)[0];
		onSelectionChange({ kind, id: first?.id });
	};
	const moveTabFocus = (event: KeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
		let nextIndex: number | undefined;
		if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % kinds.length;
		else if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + kinds.length) % kinds.length;
		else if (event.key === 'Home') nextIndex = 0;
		else if (event.key === 'End') nextIndex = kinds.length - 1;
		if (nextIndex === undefined) return;
		event.preventDefault();
		const nextKind = kinds[nextIndex]!.kind;
		selectKind(nextKind);
		tabRefs.current[nextKind]?.focus();
	};
	return (
		<section data-slot='agent-config-studio' className={`bg-base-100 min-w-0 ${className ?? ''}`} {...props}>
			<header className='border-base-300 border-b px-3 py-4 md:px-5'>
				<h1 className='text-base font-semibold'>{messages.title}</h1>
				<p className='text-base-content/60 mt-0.5 text-sm'>{messages.description}</p>
			</header>
			<div
				className='border-base-300 flex min-w-0 gap-1 overflow-x-auto border-b px-2 py-2'
				role='tablist'
				aria-label={messages.resourceTypes}
			>
				{kinds.map(({ kind, icon: Icon }, index) => (
					<button
						ref={(element) => {
							tabRefs.current[kind] = element;
						}}
						key={kind}
						id={`${id}-tab-${kind}`}
						type='button'
						role='tab'
						aria-controls={`${id}-panel-${kind}`}
						aria-selected={selection.kind === kind}
						tabIndex={selection.kind === kind ? 0 : -1}
						className={`btn btn-sm shrink-0 ${selection.kind === kind ? 'btn-active' : 'btn-ghost'}`}
						onClick={() => selectKind(kind)}
						onKeyDown={(event) => moveTabFocus(event, index)}
					>
						<Icon aria-hidden='true' className='size-4' />
						<span>{messages.kinds[kind]}</span>
						<span className='badge badge-sm'>{counts[kind]}</span>
					</button>
				))}
			</div>
			{kinds.map(({ kind }) => (
				<div
					key={kind}
					id={`${id}-panel-${kind}`}
					role='tabpanel'
					aria-labelledby={`${id}-tab-${kind}`}
					hidden={selection.kind !== kind}
				>
					{selection.kind === kind ? (
						<StudioKindPanel
							kind={kind}
							collections={collections}
							messages={messages}
							selectionId={selection.id}
							disabled={disabled}
							readOnly={readOnly}
							onCreate={onCreate}
							onRemove={onRemove}
							empty={empty}
							editorProps={{
								onProvidersChange,
								onEndpointsChange,
								onModelsChange,
								onServicesChange,
								onMcpServersChange,
								onPersonasChange,
								onSkillsChange,
								onSelectionChange,
							}}
						/>
					) : null}
				</div>
			))}
		</section>
	);
}

type StudioKindPanelProps = {
	kind: AgentConfigResourceKind;
	collections: ResourceCollections;
	messages: AgentConfigStudioMessages;
	selectionId?: string;
	disabled: boolean;
	readOnly: boolean;
	onCreate?: AgentConfigStudioProps['onCreate'];
	onRemove?: AgentConfigStudioProps['onRemove'];
	empty?: AgentConfigStudioProps['empty'];
	editorProps: Pick<
		AgentConfigStudioProps,
		| 'onProvidersChange'
		| 'onEndpointsChange'
		| 'onModelsChange'
		| 'onServicesChange'
		| 'onMcpServersChange'
		| 'onPersonasChange'
		| 'onSkillsChange'
		| 'onSelectionChange'
	>;
};

function StudioKindPanel({
	kind,
	collections,
	messages,
	selectionId,
	disabled,
	readOnly,
	onCreate,
	onRemove,
	empty,
	editorProps,
}: StudioKindPanelProps) {
	const resources = resourcesForKind(kind, collections);
	const selected = resources.find((resource) => resource.id === selectionId);
	const selection = { kind, id: selectionId };
	return (
		<div className='grid min-w-0 md:min-h-[42rem] md:grid-cols-[16rem_minmax(0,1fr)]'>
			<aside className='border-base-300 min-w-0 border-b md:border-e md:border-b-0' aria-label={messages.resourceList}>
				<div className='border-base-300 flex min-h-12 items-center justify-between gap-2 border-b px-3'>
					<h2 className='text-sm font-semibold'>{messages.kinds[kind]}</h2>
					{onCreate && !readOnly ? (
						<button
							type='button'
							className='btn btn-ghost btn-sm btn-square'
							title={messages.create}
							aria-label={messages.create}
							disabled={disabled}
							onClick={() => onCreate(kind)}
						>
							<Plus aria-hidden='true' className='size-4' />
						</button>
					) : null}
				</div>
				<nav className='max-h-56 overflow-auto p-2 md:max-h-[calc(100vh-16rem)]'>
					{resources.length ? (
						resources.map((resource) => (
							<button
								key={resource.id}
								type='button'
								className={`mb-1 flex min-h-11 w-full min-w-0 items-center rounded-sm px-2 text-left ${selectionId === resource.id ? 'bg-primary text-primary-content' : 'hover:bg-base-200'}`}
								aria-current={selectionId === resource.id ? 'page' : undefined}
								onClick={() => editorProps.onSelectionChange({ kind, id: resource.id })}
							>
								<span className='min-w-0 flex-1'>
									<span className='block truncate text-sm font-medium'>{resource.label}</span>
									<span className='text-base-content/55 block truncate text-xs'>{resource.id}</span>
								</span>
							</button>
						))
					) : (
						<div className='text-base-content/55 px-2 py-8 text-center text-sm'>{messages.emptyList}</div>
					)}
				</nav>
			</aside>
			<main className='min-w-0 p-2 sm:p-4'>
				{selected ? (
					<div className='min-w-0'>
						{onRemove && !readOnly ? (
							<div className='mb-2 flex justify-end'>
								<button
									type='button'
									className='btn btn-ghost btn-sm text-error'
									disabled={disabled}
									onClick={() => onRemove(selection)}
								>
									<Trash2 aria-hidden='true' className='size-4' />
									{messages.remove}
								</button>
							</div>
						) : null}
						{renderSelectedStudioEditor({ ...collections, ...editorProps, selection, disabled, readOnly }, messages)}
					</div>
				) : (
					(empty ?? (
						<div className='grid min-h-72 place-items-center text-center'>
							<div>
								<BrainCircuit aria-hidden='true' className='text-base-content/30 mx-auto size-10' />
								<p className='text-base-content/60 mt-3 text-sm'>{messages.emptySelection}</p>
							</div>
						</div>
					))
				)}
			</main>
		</div>
	);
}

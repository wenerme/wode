'use client';

import type { Persona } from '@wener/ai/agent/persona';
import { getSkillIdentity, type Skill } from '@wener/ai/agent/skill';
import { Code2, MessageSquare, RefreshCw, Settings2, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AgentPlaygroundMode } from './playground-runtime';

export type AgentPlaygroundControlMessages = {
	chatMode: string;
	codingMode: string;
	contextError: string;
	contextIdle: string;
	contextLoading: string;
	contextReady: string;
	noPersona: string;
	noSkills: string;
	persona: string;
	refreshWorkspace: string;
	skills: string;
	workMode: string;
};

export const defaultAgentPlaygroundControlMessages: AgentPlaygroundControlMessages = {
	chatMode: '对话',
	codingMode: '编码',
	contextError: '上下文错误',
	contextIdle: '对话模式不读取工作区',
	contextLoading: '正在加载上下文',
	contextReady: '上下文就绪',
	noPersona: '无',
	noSkills: '无可用 Skill',
	persona: 'Persona',
	refreshWorkspace: '刷新工作区',
	skills: 'Skills',
	workMode: '工作',
};

export function getAgentSkillIdentity(skill: Pick<Skill, 'id' | 'name' | 'version'>): string {
	return getSkillIdentity(skill);
}

export type AgentPlaygroundControlsProps = {
	contextStatus: 'error' | 'idle' | 'loading' | 'ready';
	messages?: Partial<AgentPlaygroundControlMessages>;
	mode: AgentPlaygroundMode;
	onModeChange: (mode: AgentPlaygroundMode) => void;
	onPersonaChange: (id: string) => void;
	onRefreshWorkspace: () => void;
	onSkillChange: (identity: string, selected: boolean) => void;
	personas: readonly Persona[];
	selectedPersonaId: string;
	selectedSkillIdentities: ReadonlySet<string>;
	skills: readonly Skill[];
};

export function AgentPlaygroundControls({
	contextStatus,
	messages,
	mode,
	onModeChange,
	onPersonaChange,
	onRefreshWorkspace,
	onSkillChange,
	personas,
	selectedPersonaId,
	selectedSkillIdentities,
	skills,
}: AgentPlaygroundControlsProps) {
	const copy = { ...defaultAgentPlaygroundControlMessages, ...messages };
	return (
		<div className='border-border bg-muted/25 flex min-h-12 shrink-0 flex-wrap items-center gap-2 border-b px-3 py-2'>
			<fieldset className='join min-w-0 border-0 p-0'>
				<legend className='sr-only'>Agent 模式</legend>
				<ModeButton active={mode === 'chat'} icon={<MessageSquare />} onClick={() => onModeChange('chat')}>
					{copy.chatMode}
				</ModeButton>
				<ModeButton active={mode === 'work'} icon={<Wrench />} onClick={() => onModeChange('work')}>
					{copy.workMode}
				</ModeButton>
				<ModeButton active={mode === 'coding'} icon={<Code2 />} onClick={() => onModeChange('coding')}>
					{copy.codingMode}
				</ModeButton>
			</fieldset>
			<label className='flex min-w-40 items-center gap-2 text-xs'>
				<span>{copy.persona}</span>
				<select
					className='select select-bordered select-sm min-w-0 flex-1'
					aria-label='Persona'
					value={selectedPersonaId}
					onChange={(event) => onPersonaChange(event.currentTarget.value)}
				>
					<option value=''>{copy.noPersona}</option>
					{personas.map((persona) => (
						<option key={persona.id} value={persona.id}>
							{persona.name}
						</option>
					))}
				</select>
			</label>
			<details className='dropdown'>
				<summary className='btn btn-ghost btn-sm'>
					<Settings2 aria-hidden='true' className='size-4' />
					{copy.skills}
				</summary>
				<div className='dropdown-content bg-base-100 border-border z-30 mt-1 w-64 border p-2 shadow-lg'>
					{skills.length === 0 ? (
						<p className='text-muted-foreground px-2 py-1 text-xs'>{copy.noSkills}</p>
					) : (
						skills.map((skill) => {
							const identity = getAgentSkillIdentity(skill);
							return (
								<label
									key={identity}
									aria-label={`选择 Skill ${skill.name} 版本 ${skill.version}`}
									className='hover:bg-muted flex cursor-pointer items-start gap-2 px-2 py-1.5 text-xs'
								>
									<input
										type='checkbox'
										className='checkbox checkbox-sm mt-0.5'
										checked={selectedSkillIdentities.has(identity)}
										onChange={(event) => onSkillChange(identity, event.currentTarget.checked)}
									/>
									<span className='min-w-0'>
										<strong className='block truncate'>{skill.name}</strong>
										<span className='text-muted-foreground line-clamp-2'>{skill.description}</span>
									</span>
								</label>
							);
						})
					)}
				</div>
			</details>
			<span
				className={cn(
					'badge badge-sm',
					contextStatus === 'error'
						? 'badge-error'
						: contextStatus === 'loading'
							? 'badge-warning'
							: contextStatus === 'idle'
								? 'badge-ghost'
								: 'badge-success',
				)}
			>
				{contextStatus === 'error'
					? copy.contextError
					: contextStatus === 'loading'
						? copy.contextLoading
						: contextStatus === 'idle'
							? copy.contextIdle
							: copy.contextReady}
			</span>
			<div className='min-w-2 flex-1' />
			<button type='button' className='btn btn-ghost btn-sm' onClick={onRefreshWorkspace}>
				<RefreshCw aria-hidden='true' className='size-4' />
				{copy.refreshWorkspace}
			</button>
		</div>
	);
}

function ModeButton({
	active,
	children,
	icon,
	onClick,
}: {
	active: boolean;
	children: string;
	icon: import('react').ReactNode;
	onClick: () => void;
}) {
	return (
		<button
			type='button'
			className={cn('btn btn-sm join-item', active ? 'btn-neutral' : 'btn-ghost')}
			aria-pressed={active}
			onClick={onClick}
		>
			<span aria-hidden='true' className='[&>svg]:size-4'>
				{icon}
			</span>
			{children}
		</button>
	);
}

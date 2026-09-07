'use client';

import type { Skill } from '@wener/ai/agent/skill';
import { useEffect, useRef, useState } from 'react';
import { loadAgentWorkspaceContext } from './workspace-context';
import type { AgentWorkspace, AgentWorkspaceContext, AgentWorkspaceContextLimits } from './workspace-types';

export type UseAgentWorkspaceContextOptions = {
	agentsPath?: string;
	enabled?: boolean;
	limits?: Partial<AgentWorkspaceContextLimits>;
	skills: readonly Skill[];
	workspace: AgentWorkspace;
};

export type AgentWorkspaceContextState = {
	context?: AgentWorkspaceContext;
	error?: Error;
	status: 'error' | 'idle' | 'loading' | 'ready';
};

export function useAgentWorkspaceContext(options: UseAgentWorkspaceContextOptions): AgentWorkspaceContextState {
	const [state, setState] = useState<AgentWorkspaceContextState>({
		status: options.enabled === false ? 'idle' : 'loading',
	});
	const stableOptions = useStableContextOptions(options);
	useEffect(() => {
		if (stableOptions.enabled === false) {
			setState({ status: 'idle' });
			return;
		}
		const controller = new AbortController();
		let current = true;
		setState({ status: 'loading' });
		void loadAgentWorkspaceContext({ ...stableOptions, signal: controller.signal }).then(
			(context) => {
				if (current && !controller.signal.aborted) setState({ context, status: 'ready' });
			},
			(error: unknown) => {
				if (current && !controller.signal.aborted) {
					setState({ error: error instanceof Error ? error : new Error(String(error)), status: 'error' });
				}
			},
		);
		return () => {
			current = false;
			controller.abort();
		};
	}, [stableOptions]);
	return state;
}

function useStableContextOptions(options: UseAgentWorkspaceContextOptions): UseAgentWorkspaceContextOptions {
	const stable = useRef(options);
	if (!sameContextOptions(stable.current, options)) stable.current = options;
	return stable.current;
}

function sameContextOptions(left: UseAgentWorkspaceContextOptions, right: UseAgentWorkspaceContextOptions): boolean {
	return (
		left.agentsPath === right.agentsPath &&
		left.enabled === right.enabled &&
		left.workspace.id === right.workspace.id &&
		left.workspace.fileSystem === right.workspace.fileSystem &&
		left.workspace.rootPath === right.workspace.rootPath &&
		left.workspace.revision === right.workspace.revision &&
		sameLimits(left.limits, right.limits) &&
		left.skills.length === right.skills.length &&
		left.skills.every((skill, index) => skill === right.skills[index])
	);
}

function sameLimits(
	left: Partial<AgentWorkspaceContextLimits> | undefined,
	right: Partial<AgentWorkspaceContextLimits> | undefined,
): boolean {
	return (
		left?.maxAgentsBytes === right?.maxAgentsBytes &&
		left?.maxAggregateBytes === right?.maxAggregateBytes &&
		left?.maxSkillBytes === right?.maxSkillBytes &&
		left?.maxSkills === right?.maxSkills
	);
}

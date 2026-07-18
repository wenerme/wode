import type { Persona } from '@wener/ai/agent/persona';
import type { ToolSet } from 'ai';
import {
	type AgentCommandExecutor,
	type AgentCommandRuntime,
	type AgentTerminalResult,
	type CreateAgentCodingToolsOptions,
	createAgentCodingTools,
} from '../agent-coding';
import {
	type AgentWorkspace,
	type AgentWorkspaceContext,
	composeAgentInstructions,
	createAgentWorkspaceReadTools,
} from '../agent-work';

export type AgentPlaygroundMode = 'chat' | 'coding' | 'work';

export const AgentRuntimeIdentityChangedCancelReason = 'agent-runtime-identity-changed';

export type AgentPlaygroundRuntimeOptions = {
	coding?: Omit<CreateAgentCodingToolsOptions, 'runtime' | 'workspace'>;
	commandRuntime?: AgentCommandRuntime;
	context?: AgentWorkspaceContext;
	mode: AgentPlaygroundMode;
	persona?: Persona;
	workspace: AgentWorkspace;
};

export type AgentPlaygroundRuntimeConfiguration = {
	instructions: string;
	tools?: ToolSet;
};

export function createAgentPlaygroundRuntimeConfiguration({
	coding,
	commandRuntime,
	context,
	mode,
	persona,
	workspace,
}: AgentPlaygroundRuntimeOptions): AgentPlaygroundRuntimeConfiguration {
	const instructions = composeAgentInstructions({
		context: mode === 'chat' ? undefined : context,
		persona,
	}).instructions;
	if (mode === 'chat') return { instructions };
	const readonlyTools = createAgentWorkspaceReadTools(workspace);
	if (mode === 'work') return { instructions, tools: readonlyTools };
	if (!commandRuntime) return { instructions, tools: readonlyTools };
	return {
		instructions,
		tools: {
			...readonlyTools,
			...createAgentCodingTools({ ...coding, runtime: commandRuntime, workspace }),
		},
	};
}

export function isUnsafeAgentTerminalResult(result: AgentTerminalResult): boolean {
	return result.poisoned === true || result.settled === false || result.mutationMayContinue === true;
}

export function createUnavailableAgentExecutor(message: string): AgentCommandExecutor {
	return {
		async execute() {
			return {
				durationMs: 0,
				exitCode: 127,
				settled: true,
				stderr: `${message}\n`,
				stdout: '',
				truncated: false,
			};
		},
	};
}

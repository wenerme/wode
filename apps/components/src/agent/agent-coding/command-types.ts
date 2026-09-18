export type AgentCommandRequest = {
	command: string;
	stdin?: string;
};

export type AgentTerminalResult = {
	aborted?: boolean;
	durationMs: number;
	exitCode: number;
	mutationMayContinue?: boolean;
	poisoned?: boolean;
	settled: boolean;
	stderr: string;
	stdout: string;
	timedOut?: boolean;
	truncated: boolean;
	workspaceChanged?: boolean;
};

export type AgentCommandExecutor = {
	execute(request: AgentCommandRequest, options?: { signal?: AbortSignal }): Promise<AgentTerminalResult>;
};

export type AgentTerminalEntry = {
	command: string;
	finishedAt?: number;
	id: string;
	result?: AgentTerminalResult;
	startedAt: number;
	status: 'cancelled' | 'failed' | 'running' | 'succeeded';
};

export type AgentActiveCommand = Pick<AgentTerminalEntry, 'command' | 'id' | 'startedAt'>;

export type AgentCommandRuntimeState = {
	mutationMayContinue: boolean;
	poisoned: boolean;
	running: boolean;
};

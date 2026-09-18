import type { Skill } from '@wener/ai/agent/skill';
import type { IFileSystem } from '@wener/common/fs';

export type AgentWorkspace = {
	id: string;
	fileSystem: IFileSystem;
	rootPath: string;
	label?: string;
	revision?: number | string;
};

export type AgentWorkspaceContextLimits = {
	maxAgentsBytes: number;
	maxAggregateBytes: number;
	maxSkillBytes: number;
	maxSkills: number;
};

export const defaultAgentWorkspaceContextLimits: Readonly<AgentWorkspaceContextLimits> = Object.freeze({
	maxAgentsBytes: 64 * 1024,
	maxAggregateBytes: 256 * 1024,
	maxSkillBytes: 32 * 1024,
	maxSkills: 32,
});

export type AgentWorkspaceContextIssue = {
	code:
		| 'aborted'
		| 'agents-read-failed'
		| 'agents-too-large'
		| 'aggregate-too-large'
		| 'invalid-text'
		| 'skill-count-exceeded'
		| 'skill-too-large';
	message: string;
	path?: string;
	skillIdentity?: string;
	skillName?: string;
};

export type AgentWorkspaceAgentsContext = {
	bytes: number;
	content: string;
	path: string;
};

export type AgentWorkspaceSkillContext = Pick<Skill, 'description' | 'instructions' | 'name' | 'version'> & {
	bytes: number;
	identity: string;
};

export type AgentWorkspaceContext = {
	agents?: AgentWorkspaceAgentsContext;
	bytes: number;
	issues: AgentWorkspaceContextIssue[];
	skills: AgentWorkspaceSkillContext[];
	workspaceId: string;
	workspaceRevision?: number | string;
};

export type LoadAgentWorkspaceContextOptions = {
	agentsPath?: string;
	limits?: Partial<AgentWorkspaceContextLimits>;
	signal?: AbortSignal;
	skills: readonly Skill[];
	workspace: AgentWorkspace;
};

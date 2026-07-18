import type { Persona } from '@wener/ai/agent/persona';
import type { AgentWorkspaceContext, AgentWorkspaceContextIssue } from './workspace-types';

export const AgentInstructionSeparator = '\n\n---\n\n';
export const defaultAgentInstructionMaxBytes = 256 * 1024;

export type ComposeAgentInstructionsOptions = {
	context?: AgentWorkspaceContext;
	maxBytes?: number;
	persona?: Persona;
};

export type ComposedAgentInstructions = {
	bytes: number;
	included: Array<'agents' | 'persona' | `skill:${string}`>;
	instructions: string;
	issues: AgentWorkspaceContextIssue[];
};

export function composeAgentInstructions({
	context,
	maxBytes = defaultAgentInstructionMaxBytes,
	persona,
}: ComposeAgentInstructionsOptions): ComposedAgentInstructions {
	if (!Number.isSafeInteger(maxBytes) || maxBytes <= 0) throw new Error('指令总量限制必须是正整数。');
	const sections: string[] = [];
	const included: ComposedAgentInstructions['included'] = [];
	const issues = [...(context?.issues ?? [])];
	let bytes = 0;
	const append = (kind: ComposedAgentInstructions['included'][number], content: string, label: string) => {
		if (!content.trim()) return;
		const section = `## ${label}\n\n${content.trim()}`;
		const addition = `${sections.length ? AgentInstructionSeparator : ''}${section}`;
		const additionBytes = utf8Bytes(addition);
		if (bytes + additionBytes > maxBytes) {
			issues.push({ code: 'aggregate-too-large', message: `${label} 超过指令总量限制，已整体排除。` });
			return;
		}
		sections.push(section);
		included.push(kind);
		bytes += additionBytes;
	};

	if (persona) append('persona', composePersona(persona), `Persona: ${persona.name}`);
	if (context?.agents) append('agents', context.agents.content, `AGENTS: ${context.agents.path}`);
	for (const skill of context?.skills ?? []) {
		append(
			`skill:${skill.identity}`,
			`描述：${skill.description}\n\n指令：\n${skill.instructions}`,
			`Skill: ${skill.name}@${skill.version}`,
		);
	}
	return { bytes, included, instructions: sections.join(AgentInstructionSeparator), issues };
}

function composePersona(persona: Persona): string {
	const parts: string[] = [];
	appendLabeled(parts, '描述', persona.description);
	appendLabeled(parts, 'System', persona.prompts?.system);
	appendLabeled(parts, 'Persona', persona.prompts?.persona);
	appendLabeled(parts, '场景', persona.prompts?.scenario);
	appendLabeled(parts, '对话后指令', persona.prompts?.postHistoryInstructions);
	appendLabeled(parts, '背景', persona.authoring?.background);
	appendLabeled(parts, '性格', persona.authoring?.personality);
	appendLabeled(parts, '行为策略', persona.authoring?.behaviorPolicy);
	appendLabeled(parts, '表达风格', persona.authoring?.speechStyle);
	if (persona.authoring?.values?.length) parts.push(`价值观：${persona.authoring.values.join('；')}`);
	if (persona.authoring?.goals?.length) parts.push(`目标：${persona.authoring.goals.join('；')}`);
	return parts.join('\n\n');
}

function appendLabeled(target: string[], label: string, value?: string): void {
	if (value?.trim()) target.push(`${label}：${value.trim()}`);
}

function utf8Bytes(value: string): number {
	return new TextEncoder().encode(value).byteLength;
}

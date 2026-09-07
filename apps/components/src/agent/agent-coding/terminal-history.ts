import type { AgentTerminalEntry, AgentTerminalResult } from './command-types';

export const MaxAgentTerminalEntries = 64;

export function appendAgentTerminalEntry(
	entries: readonly AgentTerminalEntry[],
	entry: AgentTerminalEntry,
): AgentTerminalEntry[] {
	return [...entries, entry].slice(-MaxAgentTerminalEntries);
}

export function appendCompletedAgentTerminalEntry(
	entries: readonly AgentTerminalEntry[],
	entry: Pick<AgentTerminalEntry, 'command' | 'id' | 'startedAt'>,
	result: AgentTerminalResult,
	finishedAt = Date.now(),
): AgentTerminalEntry[] {
	return completeAgentTerminalEntry(
		appendAgentTerminalEntry(entries, { ...entry, status: 'running' }),
		entry.id,
		result,
		finishedAt,
	);
}

export function completeAgentTerminalEntry(
	entries: readonly AgentTerminalEntry[],
	id: string,
	result: AgentTerminalResult,
	finishedAt = Date.now(),
): AgentTerminalEntry[] {
	return entries.map((entry) =>
		entry.id === id
			? {
					...entry,
					finishedAt,
					result,
					status: result.aborted ? 'cancelled' : result.exitCode === 0 ? 'succeeded' : 'failed',
				}
			: entry,
	);
}

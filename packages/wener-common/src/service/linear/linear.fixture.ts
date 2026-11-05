import { vi } from 'vitest';
import { LinearConnectionConfigSchema, type LinearConnectionConfigInput } from '@wener/client/linear';
import type { LinearAdapter } from './interface';
import type { LinearIssue } from './schema';

export function connection(input: LinearConnectionConfigInput = { apiKey: 'example-key' }) {
	return LinearConnectionConfigSchema.parse({ baseUrl: 'https://example.test/graphql', ...input });
}
export const viewer = { id: 'user-id', name: 'Example User', displayName: null, email: null, active: true };
export const pageInfo = { hasNextPage: false, endCursor: null };
export const comment = { id: 'comment-id', body: 'hello', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z', user: null };
export function issue(): LinearIssue {
	return {
		id: 'issue-id', identifier: 'DEMO-1', title: 'Issue', description: null,
		url: 'https://example.test/issue/DEMO-1', branchName: null, priority: 2,
		estimate: null, dueDate: null, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
		archivedAt: null, completedAt: null, canceledAt: null,
		team: { id: 'team-id', key: 'DEMO', name: 'Example Team', description: null },
		state: null, assignee: null, creator: null, project: null, labels: { nodes: [] },
	};
}
export function adapter(): LinearAdapter {
	return {
		getViewer: vi.fn(async () => viewer),
		listTeam: vi.fn(async () => ({ nodes: [], pageInfo })),
		listIssueState: vi.fn(async () => ({ nodes: [], pageInfo })),
		listUser: vi.fn(async () => ({ nodes: [], pageInfo })),
		listProject: vi.fn(async () => ({ nodes: [], pageInfo })),
		listIssue: vi.fn(async () => ({ nodes: [issue()], pageInfo })),
		getIssue: vi.fn(async () => issue()), createIssue: vi.fn(async () => issue()), updateIssue: vi.fn(async () => issue()),
		listComment: vi.fn(async () => ({ nodes: [], pageInfo })), createComment: vi.fn(async () => comment),
		close: vi.fn(async () => undefined),
	};
}

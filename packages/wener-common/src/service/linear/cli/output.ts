import type { CliTable } from '../../../cli/render/CliTable';

export type LinearCliOutputKind =
	| 'viewer'
	| 'teams'
	| 'states'
	| 'users'
	| 'projects'
	| 'issues'
	| 'issue'
	| 'comments'
	| 'comment';

export const LinearCliOutputColumns: Record<LinearCliOutputKind, string[]> = {
	viewer: ['id', 'name', 'displayName', 'email', 'active'],
	teams: ['key', 'name', 'description', 'id'],
	states: ['name', 'type', 'position', 'color', 'id'],
	users: ['name', 'displayName', 'email', 'active', 'id'],
	projects: ['name', 'status.name', 'priority', 'health', 'startDate', 'targetDate', 'updatedAt', 'id'],
	issues: ['identifier', 'title', 'state', 'priority', 'assignee', 'project', 'updatedAt', 'id'],
	issue: ['identifier', 'title', 'state', 'priority', 'assignee', 'project', 'updatedAt', 'url'],
	comments: ['createdAt', 'user', 'body', 'id'],
	comment: ['createdAt', 'user', 'body', 'id'],
};

const outputKinds: Record<string, LinearCliOutputKind> = {
	status: 'viewer',
	'team list': 'teams',
	'state list': 'states',
	'user list': 'users',
	'project list': 'projects',
	'issue list': 'issues',
	'issue get': 'issue',
	'issue create': 'issue',
	'issue update': 'issue',
	'comment list': 'comments',
	'comment create': 'comment',
};

export function linearCliOutputKind(operation: string): LinearCliOutputKind {
	const kind = Object.hasOwn(outputKinds, operation) ? outputKinds[operation] : undefined;
	if (!kind) throw new Error(`Unknown Linear CLI operation: ${operation}`);
	return kind;
}

export function linearCliOutputRows(kind: LinearCliOutputKind, value: unknown): Record<string, unknown>[] {
	const source = isRecord(value) && Array.isArray(value.nodes) ? value.nodes : [value];
	return source.filter(isRecord).map((item) => {
		if (kind === 'issue' || kind === 'issues')
			return {
				...item,
				state: field(item.state, 'name'),
				assignee: field(item.assignee, 'displayName') ?? field(item.assignee, 'name'),
				project: field(item.project, 'name'),
			};
		if (kind === 'comment' || kind === 'comments')
			return {
				...item,
				user: field(item.user, 'displayName') ?? field(item.user, 'name'),
			};
		return item;
	});
}

export function linearCliTable(kind: LinearCliOutputKind): (value: unknown) => CliTable {
	return (value) => {
		const rows = linearCliOutputRows(kind, value);
		const columns = LinearCliOutputColumns[kind];
		const pageInfo = field(value, 'pageInfo');
		const next = field(pageInfo, 'hasNextPage') ? `, next ${String(field(pageInfo, 'endCursor') ?? '')}` : '';
		return {
			headers: columns,
			rows: rows.map((row) =>
				columns.map((column) => (column === 'status.name' ? field(row.status, 'name') : row[column])),
			),
			emptyMessage: 'No items.',
			footer: pageInfo ? `${rows.length} item(s)${next}` : undefined,
		};
	};
}

function field(value: unknown, key: string): unknown {
	return isRecord(value) ? value[key] : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
}

import type { CliTable } from '../../../cli/render/CliTable';

function record(value: unknown): Record<string, unknown> {
	return value !== null && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function at(value: unknown, path: string): unknown {
	let current: unknown = value;
	for (const key of path.split('.')) current = record(current)[key];
	return current;
}

export type FeishuCliOutputKind = 'chats' | 'chat' | 'members' | 'user' | 'messages' | 'message' | 'reaction' | 'resource';

export const FeishuCliOutputColumns: Record<FeishuCliOutputKind, readonly string[]> = {
	chats: ['chat_id', 'name', 'owner_id', 'external', 'chat_status'],
	chat: ['chat_id', 'name', 'description', 'owner_id', 'external', 'chat_status'],
	members: ['member_id', 'member_id_type', 'name'],
	user: ['open_id', 'user_id', 'name', 'email', 'department_ids'],
	messages: ['message_id', 'msg_type', 'create_time', 'sender.id', 'parent_id', 'thread_id'],
	message: ['message_id', 'msg_type', 'create_time', 'sender.id', 'chat_id'],
	reaction: ['reaction_id', 'reaction_type.emoji_type', 'action_time'],
	resource: ['filename', 'contentType', 'byteLength', 'path'],
};

/** Table projection for people; JSON keeps the complete result, including unknown fields. */
export function feishuCliTable(kind: FeishuCliOutputKind): (value: unknown) => CliTable {
	const headers = FeishuCliOutputColumns[kind];
	return (value) => {
		const source = record(value);
		const list = Array.isArray(source.items) ? source.items : [value];
		const pageToken = typeof source.pageToken === 'string' ? source.pageToken : undefined;
		return {
			kind: Array.isArray(source.items) ? 'list' : 'detail',
			headers,
			rows: list.map((item) => headers.map((path) => {
				const cell = at(item, path);
				return Array.isArray(cell) ? cell.join(',') : cell;
			})),
			...(source.hasMore === true ? { pagination: { hasNext: true } } : {}),
			...(pageToken ? { footer: `Next page: --page-token ${pageToken}` } : {}),
		};
	};
}

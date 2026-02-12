import { ListChatsInputSchema, ListMessagesInputSchema, ReplyMessageInputSchema, SendMessageInputSchema } from '../schemas';
import type { FeishuMcpContext } from '../server';

export function registerImTools(ctx: FeishuMcpContext) {
	const { server, getClient, log, jsonResult, textResult } = ctx;

	server.registerTool(
		'send_message',
		{
			description: `Send a message to a Feishu/Lark chat or user.
- For text messages: content should be JSON like {"text":"hello @all"}
- For interactive (card) messages: content should be card JSON
- receive_id_type determines how receive_id is interpreted`,
			inputSchema: SendMessageInputSchema,
			annotations: { readOnlyHint: false },
		},
		async ({ receive_id, receive_id_type, msg_type, content }) => {
			log.info(`send_message: type=${msg_type} to=${receive_id_type}:${receive_id}`);
			try {
				const client = await getClient();
				const res = await client.im.message.create({
					params: { receive_id_type },
					data: {
						receive_id,
						content,
						msg_type,
					},
				});
				return jsonResult(res.data);
			} catch (e: any) {
				return { content: [{ type: 'text' as const, text: `Error: ${e.message}` }], isError: true };
			}
		},
	);

	server.registerTool(
		'reply_message',
		{
			description: 'Reply to a specific message in Feishu/Lark',
			inputSchema: ReplyMessageInputSchema,
			annotations: { readOnlyHint: false },
		},
		async ({ message_id, msg_type, content }) => {
			log.info(`reply_message: ${message_id}`);
			try {
				const client = await getClient();
				const res = await client.im.message.reply({
					path: { message_id },
					data: { content, msg_type },
				});
				return jsonResult(res.data);
			} catch (e: any) {
				return { content: [{ type: 'text' as const, text: `Error: ${e.message}` }], isError: true };
			}
		},
	);

	server.registerTool(
		'list_messages',
		{
			description: 'List messages in a Feishu/Lark chat. Returns messages in reverse chronological order.',
			inputSchema: ListMessagesInputSchema,
			annotations: { readOnlyHint: true },
		},
		async ({ container_id, start_time, end_time, page_size, page_token }) => {
			log.info(`list_messages: chat=${container_id}`);
			try {
				const client = await getClient();
				const res = await client.im.message.list({
					params: {
						container_id_type: 'chat',
						container_id,
						start_time,
						end_time,
						page_size,
						page_token,
					},
				});

				const messages = (res.data?.items || []).map((msg: any) => ({
					message_id: msg.message_id,
					msg_type: msg.msg_type,
					sender: msg.sender?.id,
					create_time: msg.create_time,
					body: msg.body?.content,
				}));

				return jsonResult({
					messages,
					has_more: res.data?.has_more,
					page_token: res.data?.page_token,
				});
			} catch (e: any) {
				return { content: [{ type: 'text' as const, text: `Error: ${e.message}` }], isError: true };
			}
		},
	);

	server.registerTool(
		'list_chats',
		{
			description: 'List chats/groups the bot has joined. Useful for finding chat_id to send messages.',
			inputSchema: ListChatsInputSchema,
			annotations: { readOnlyHint: true },
		},
		async ({ page_size, page_token }) => {
			log.info('list_chats');
			try {
				const client = await getClient();
				const res = await client.im.chat.list({
					params: {
						page_size,
						page_token,
					},
				});

				const chats = (res.data?.items || []).map((chat: any) => ({
					chat_id: chat.chat_id,
					name: chat.name,
					description: chat.description,
					owner_id: chat.owner_id,
					chat_mode: chat.chat_mode,
					member_count: chat.user_count,
				}));

				return jsonResult({
					chats,
					has_more: res.data?.has_more,
					page_token: res.data?.page_token,
				});
			} catch (e: any) {
				return { content: [{ type: 'text' as const, text: `Error: ${e.message}` }], isError: true };
			}
		},
	);
}

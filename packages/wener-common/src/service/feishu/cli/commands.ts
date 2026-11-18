import { resolveCliOutputSelection } from '../../../cli/CliCommand';
import { type ServiceCliDefinition, type ServiceCliOperation, serviceCliString } from '../../cli/ServiceCliDefinition';
import { ServiceCliInputError } from '../../cli/ServiceCliInputError';
import type { IFeishuService } from '../IFeishuService';
import { sanitizeFeishuOutput } from '../sanitize';
import * as schema from '../schema';
import { decodeFeishuBase64, encodeFeishuBase64 } from '../transport';
import {
	FEISHU_ID_TYPES,
	feishuBaseName,
	feishuChoice,
	feishuFileSource,
	feishuInteger,
	feishuPageInput,
	feishuParseInput,
	feishuReadText,
	feishuRequireYes,
} from './input';
import { feishuCliTable } from './output';
import { feishuApiCommands } from './api';

function requireYes(options: Record<string, unknown>, message: string): void {
	if (options.yes !== true) throw new ServiceCliInputError(message);
}

type FeishuCommand = ServiceCliOperation<IFeishuService>;
const yesOption = { name: 'yes', description: 'Confirm the write operation', type: 'boolean' } as const;
const pageOptions = (max: number) => [
	{ name: 'page-size', description: `Page size, 1..${max}` },
	{ name: 'page-token', description: 'Page token from a previous result' },
] as const;
const idTypeOption = { name: 'id-type', description: 'User id type: open_id (default), union_id or user_id' } as const;
const FILE_TYPES = ['image', 'opus', 'mp4', 'pdf', 'doc', 'xls', 'ppt', 'stream'] as const;
const MIB = 1024 * 1024;

function requiredArg(args: readonly string[], index: number, label: string): string {
	const value = args[index]?.trim();
	if (!value) throw new ServiceCliInputError(`${label} is required`);
	return value;
}

/**
 * Raw text budget for a `--base64` argument: encoded length plus room for line wrapping
 * (e.g. 76-column MIME adds ~2.6%) and surrounding whitespace. The decoded byte length still
 * enforces the real upload limit.
 */
function base64TextLimit(maxBytes: number): number {
	return Math.ceil(schema.feishuBase64Length(maxBytes) * 1.03) + 64 * 1024;
}

/** Decode Base64 text strictly; whitespace (line wrapping) is ignored. */
function decodeBase64Argument(text: string, maxBytes: number): Uint8Array {
	const value = text.replace(/\s+/gu, '');
	const padding = value.endsWith('==') ? 2 : value.endsWith('=') ? 1 : 0;
	const byteLength = (value.length / 4) * 3 - padding;
	if (!value || value.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/u.test(value) || byteLength < 1)
		throw new ServiceCliInputError('--base64 must contain valid Base64');
	if (byteLength > maxBytes) throw new ServiceCliInputError(`Upload exceeds ${maxBytes / MIB} MiB`);
	try {
		return decodeFeishuBase64(value, byteLength);
	} catch {
		throw new ServiceCliInputError('--base64 must contain valid Base64');
	}
}

function feishuImCommands(): FeishuCommand[] {
	return [
		{
			group: 'chat', name: 'list', aliases: ['ls'],
			description: 'List chats the app bot belongs to',
			examples: [{ command: 'woctl feishu chat list --page-size 20' }],
			options: [{ name: 'sort', description: 'Sort order: created or active' }, idTypeOption, ...pageOptions(100)],
			table: feishuCliTable('chats'),
			prepare({ options }) {
				const input = feishuParseInput(schema.FeishuListChatInputSchema, {
					...feishuPageInput(options, 100),
					userIdType: feishuChoice(options, 'id-type', FEISHU_ID_TYPES),
					sortType: feishuChoice(options, 'sort', { created: 'ByCreateTimeAsc', active: 'ByActiveTimeDesc' } as const),
				});
				return async (client, { signal }) => sanitizeFeishuOutput(await client.listChat(input, { signal }));
			},
		},
		{
			group: 'chat', name: 'get', argument: 'chat-id',
			description: 'Get chat information',
			examples: [{ command: 'woctl feishu chat get oc_xxx' }],
			options: [idTypeOption],
			table: feishuCliTable('chat'),
			prepare({ args, options }) {
				const input = feishuParseInput(schema.FeishuGetChatInputSchema, {
					chatId: requiredArg(args, 0, 'Chat id'),
					userIdType: feishuChoice(options, 'id-type', FEISHU_ID_TYPES),
				});
				return async (client, { signal }) => sanitizeFeishuOutput(await client.getChat(input, { signal }));
			},
		},
		{
			group: 'chat', name: 'members', argument: 'chat-id',
			description: 'List chat members',
			examples: [{ command: 'woctl feishu chat members oc_xxx' }],
			options: [idTypeOption, ...pageOptions(100)],
			table: feishuCliTable('members'),
			prepare({ args, options }) {
				const input = feishuParseInput(schema.FeishuListChatMemberInputSchema, {
					chatId: requiredArg(args, 0, 'Chat id'),
					memberIdType: feishuChoice(options, 'id-type', FEISHU_ID_TYPES),
					...feishuPageInput(options, 100),
				});
				return async (client, { signal }) => sanitizeFeishuOutput(await client.listChatMember(input, { signal }));
			},
		},
		{
			group: 'user', name: 'get', arguments: '[user-id]',
			description: 'Get a contact user by id, or by --email',
			examples: [{ command: 'woctl feishu user get ou_xxx' }, { command: 'woctl feishu user get --email user@example.com' }],
			options: [idTypeOption, { name: 'email', description: 'Resolve the user by email instead of id' }],
			table: feishuCliTable('user'),
			prepare({ args, options }) {
				const userId = args[0]?.trim() || undefined;
				const email = serviceCliString(options, 'email');
				if ((userId === undefined) === (email === undefined)) throw new ServiceCliInputError('Provide a user id or --email');
				const input = feishuParseInput(schema.FeishuGetUserInputSchema, {
					userId, email, userIdType: feishuChoice(options, 'id-type', FEISHU_ID_TYPES),
				});
				return async (client, { signal }) => sanitizeFeishuOutput(await client.getUser(input, { signal }));
			},
		},
		{
			group: 'message', name: 'list', aliases: ['ls'],
			description: 'List messages in a chat',
			examples: [{ command: 'woctl feishu message list --chat oc_xxx --sort desc --page-size 20' }],
			options: [
				{ name: 'chat', description: 'Chat id' },
				{ name: 'start-time', description: 'Start time in Unix seconds' },
				{ name: 'end-time', description: 'End time in Unix seconds' },
				{ name: 'sort', description: 'Sort order: asc or desc' },
				...pageOptions(50),
			],
			table: feishuCliTable('messages'),
			prepare({ options }) {
				const chatId = serviceCliString(options, 'chat');
				if (!chatId?.trim()) throw new ServiceCliInputError('--chat is required');
				const input = feishuParseInput(schema.FeishuListMessageInputSchema, {
					chatId,
					startTime: serviceCliString(options, 'start-time'),
					endTime: serviceCliString(options, 'end-time'),
					sortType: feishuChoice(options, 'sort', { asc: 'ByCreateTimeAsc', desc: 'ByCreateTimeDesc' } as const),
					...feishuPageInput(options, 50),
				});
				return async (client, { signal }) => sanitizeFeishuOutput(await client.listMessage(input, { signal }));
			},
		},
		{
			group: 'message', name: 'get', argument: 'message-id',
			description: 'Get a message',
			examples: [{ command: 'woctl feishu message get om_xxx' }],
			table: feishuCliTable('messages'),
			prepare({ args }) {
				const input = feishuParseInput(schema.FeishuGetMessageInputSchema, { messageId: requiredArg(args, 0, 'Message id') });
				return async (client, { signal }) => sanitizeFeishuOutput(await client.getMessage(input, { signal }));
			},
		},
		{
			group: 'message', name: 'reply', argument: 'message-id', mutating: true,
			description: 'Reply to a message; requires --yes and a writable service',
			examples: [{ command: 'woctl feishu message reply om_xxx --text "ack" --yes' }],
			options: [
				{ name: 'text', description: 'Reply text, @file or - for stdin' },
				{ name: 'content', description: 'Raw Feishu content JSON, @file or - for stdin; requires --msg-type' },
				{ name: 'msg-type', description: 'Feishu msg_type for --content, such as post or interactive' },
				{ name: 'reply-in-thread', description: 'Reply in a thread', type: 'boolean' },
				{ name: 'uuid', description: 'Idempotency key, at most 50 characters' },
				yesOption,
			],
			table: feishuCliTable('message'),
			async prepare(context) {
				const { args, options } = context;
				feishuRequireYes(options, 'Feishu message reply requires --yes');
				const messageId = requiredArg(args, 0, 'Message id');
				const textArgument = serviceCliString(options, 'text');
				const contentArgument = serviceCliString(options, 'content');
				const msgType = serviceCliString(options, 'msg-type');
				if ((textArgument === undefined) === (contentArgument === undefined))
					throw new ServiceCliInputError('Provide exactly one of --text or --content');
				if (contentArgument !== undefined && !msgType) throw new ServiceCliInputError('--content requires --msg-type');
				const fields = { messageId, msgType, replyInThread: options['reply-in-thread'] === true || undefined, uuid: serviceCliString(options, 'uuid') };
				let input: ReturnType<typeof schema.FeishuReplyMessageInputSchema.parse>;
				if (textArgument !== undefined) {
					input = feishuParseInput(schema.FeishuReplyMessageInputSchema, { ...fields, text: await feishuReadText(context, textArgument, 'Feishu reply text') });
				} else {
					const content = await feishuReadText(context, contentArgument!, 'Feishu reply content', 150_000);
					try {
						JSON.parse(content);
					} catch {
						throw new ServiceCliInputError('--content must contain valid JSON');
					}
					input = feishuParseInput(schema.FeishuReplyMessageInputSchema, { ...fields, content });
				}
				return async (client, { signal }) => sanitizeFeishuOutput(await client.replyMessage(input, { signal }));
			},
		},
		{
			group: 'message', name: 'delete', argument: 'message-id', mutating: true,
			description: 'Recall (delete) a message sent by the app; requires --yes and a writable service',
			examples: [{ command: 'woctl feishu message delete om_xxx --yes' }],
			options: [yesOption],
			prepare({ args, options }) {
				feishuRequireYes(options, 'Feishu message delete requires --yes');
				const input = feishuParseInput(schema.FeishuDeleteMessageInputSchema, { messageId: requiredArg(args, 0, 'Message id') });
				return async (client, { signal }) => sanitizeFeishuOutput(await client.deleteMessage(input, { signal }));
			},
		},
		{
			group: 'message', name: 'react', argument: 'message-id', mutating: true,
			description: 'Add an emoji reaction; requires --yes and a writable service',
			examples: [{ command: 'woctl feishu message react om_xxx --emoji THUMBSUP --yes' }],
			options: [{ name: 'emoji', description: 'Feishu emoji_type, such as THUMBSUP' }, yesOption],
			table: feishuCliTable('reaction'),
			prepare({ args, options }) {
				feishuRequireYes(options, 'Feishu message react requires --yes');
				const emojiType = serviceCliString(options, 'emoji');
				if (!emojiType) throw new ServiceCliInputError('--emoji is required');
				const input = feishuParseInput(schema.FeishuAddMessageReactionInputSchema, { messageId: requiredArg(args, 0, 'Message id'), emojiType });
				return async (client, { signal }) => sanitizeFeishuOutput(await client.addMessageReaction(input, { signal }));
			},
		},
		{
			group: 'message', name: 'unreact', argument: 'message-id', mutating: true,
			description: 'Remove a reaction added by the app; requires --yes and a writable service',
			examples: [{ command: 'woctl feishu message unreact om_xxx --reaction REACTION_ID --yes' }],
			options: [{ name: 'reaction', description: 'Reaction id' }, yesOption],
			table: feishuCliTable('reaction'),
			prepare({ args, options }) {
				feishuRequireYes(options, 'Feishu message unreact requires --yes');
				const reactionId = serviceCliString(options, 'reaction');
				if (!reactionId) throw new ServiceCliInputError('--reaction is required');
				const input = feishuParseInput(schema.FeishuDeleteMessageReactionInputSchema, { messageId: requiredArg(args, 0, 'Message id'), reactionId });
				return async (client, { signal }) => sanitizeFeishuOutput(await client.deleteMessageReaction(input, { signal }));
			},
		},
		{
			group: 'file', name: 'upload', mutating: true,
			description: 'Upload an image (10 MiB) or file (30 MiB) for messages; requires --yes and a writable service',
			examples: [
				{ command: 'woctl feishu file upload --type image --file ./diagram.png --yes' },
				{ command: 'woctl feishu file upload --type pdf --base64 @report.b64 --name report.pdf --yes' },
			],
			options: [
				{ name: 'type', description: `Upload type: ${FILE_TYPES.join(', ')}` },
				{ name: 'file', description: 'Local file path, @file or - for stdin; needs host binary input' },
				{ name: 'base64', description: 'Base64 content, @file or - for stdin' },
				{ name: 'name', description: 'File name sent to Feishu; defaults to the --file base name' },
				{ name: 'duration', description: 'Media duration in milliseconds for opus or mp4' },
				yesOption,
			],
			async prepare(context) {
				const { options } = context;
				feishuRequireYes(options, 'Feishu file upload requires --yes');
				const type = serviceCliString(options, 'type');
				if (!type || !(FILE_TYPES as readonly string[]).includes(type))
					throw new ServiceCliInputError(`--type must be one of ${FILE_TYPES.join(', ')}`);
				const fileArgument = serviceCliString(options, 'file');
				const base64Argument = serviceCliString(options, 'base64');
				if ((fileArgument === undefined) === (base64Argument === undefined))
					throw new ServiceCliInputError('Provide exactly one of --file or --base64');
				const isImage = type === 'image';
				const duration = feishuInteger(options, 'duration', 0, 24 * 3600 * 1000);
				if (duration !== undefined && type !== 'opus' && type !== 'mp4') throw new ServiceCliInputError('--duration applies to opus or mp4');
				const source = fileArgument === undefined ? undefined : feishuFileSource(fileArgument);
				const name = serviceCliString(options, 'name') ?? (source ? feishuBaseName(source) : undefined);
				if (!isImage && !name) throw new ServiceCliInputError('--name is required for this upload');
				if (source !== undefined && !context.readBytes)
					throw new ServiceCliInputError('Host does not support binary file input; use --base64');
				const limit = isImage ? schema.FEISHU_MAX_IMAGE_BYTES : schema.FEISHU_MAX_FILE_BYTES;
				// Every check above is pure; only now is the input read.
				const bytes = source !== undefined
					? await context.readBytes!(source, { label: 'Feishu upload', maxBytes: limit })
					: decodeBase64Argument(
						await context.readText(base64Argument!, { label: 'Feishu upload Base64', maxBytes: base64TextLimit(limit) }),
						limit,
					);
				if (!(bytes instanceof Uint8Array) || bytes.byteLength === 0) throw new ServiceCliInputError('Upload must not be empty');
				if (bytes.byteLength > limit) throw new ServiceCliInputError(`Upload exceeds ${limit / MIB} MiB`);
				if (isImage) {
					const input = feishuParseInput(schema.FeishuUploadImageInputSchema, { image: bytes, filename: name });
					return async (client, { signal }) => client.uploadImage(input, { signal });
				}
				const input = feishuParseInput(schema.FeishuUploadFileInputSchema, { file: bytes, fileType: type, fileName: name, duration });
				return async (client, { signal }) => client.uploadFile(input, { signal });
			},
		},
		{
			group: 'file', name: 'download', arguments: '<message-id> <file-key>',
			description: 'Download a message image or file; writes --out, or returns Base64 with --json',
			examples: [
				{ command: 'woctl feishu file download om_xxx file_xxx --type file --out ./report.pdf' },
				{ command: 'woctl feishu file download om_xxx img_xxx --type image --json' },
			],
			options: [
				{ name: 'type', description: 'Resource type: image or file' },
				{ name: 'out', description: 'Write the raw bytes to this path; needs host binary output' },
				{ name: 'max-bytes', description: `Maximum download size, at most ${schema.FEISHU_MAX_RESOURCE_BYTES / MIB} MiB` },
			],
			table: feishuCliTable('resource'),
			prepare(context) {
				const { args, options } = context;
				const out = serviceCliString(options, 'out');
				if (out !== undefined && !out.trim()) throw new ServiceCliInputError('--out requires a path');
				if (out !== undefined && !context.writeBytes) throw new ServiceCliInputError('Host does not support binary file output; use --json');
				if (out === undefined && !['json', 'jsonl', 'yaml', 'yml'].includes(resolveCliOutputSelection(options).format))
					throw new ServiceCliInputError('Provide --out <path>, or use --json to receive Base64 content');
				const input = feishuParseInput(schema.FeishuDownloadMessageResourceInputSchema, {
					messageId: requiredArg(args, 0, 'Message id'),
					fileKey: requiredArg(args, 1, 'File key'),
					type: serviceCliString(options, 'type'),
					maxBytes: feishuInteger(options, 'max-bytes', 1, schema.FEISHU_MAX_RESOURCE_BYTES),
				});
				const writeBytes = context.writeBytes;
				return async (client, { signal }) => {
					const { data, contentType, filename } = await client.downloadMessageResource(input, { signal });
					const metadata = { messageId: input.messageId, fileKey: input.fileKey, byteLength: data.byteLength, contentType, filename };
					if (out === undefined) return { ...metadata, contentBase64: encodeFeishuBase64(data) };
					signal?.throwIfAborted();
					await writeBytes!(out, data, { signal });
					return { ...metadata, path: out };
				};
			},
		},
	];
}

export const FeishuCliDefinition: ServiceCliDefinition<IFeishuService> = {
	name: 'feishu',
	description: 'Send Feishu/Lark messages and call the Feishu OpenAPI',
	examples: [
		{ command: 'woctl feishu send --to ou_xxx --text "hello" --yes', description: 'Send a message via app credential.' },
		{ command: 'woctl feishu webhook --text "hello" --yes', description: 'Send a message to the configured group webhook.' },
		{ command: 'woctl feishu chat list --page-size 20', description: 'List chats the app bot belongs to.' },
	],
	options: [],
	commands: [
		{
			name: 'send',
			description: 'Send a Feishu/Lark message via app credential; requires --yes and a writable service',
			examples: [{ command: 'woctl feishu send --to ou_xxx --text "hello" --yes' }],
			options: [
				{ name: 'to', description: 'Target open_id / user_id / chat_id / email' },
				{ name: 'text', description: 'Message text, @file or - for stdin' },
				{ name: 'yes', description: 'Confirm sending the message', type: 'boolean' },
			],
			mutating: true,
			async prepare(context) {
				const to = serviceCliString(context.options, 'to');
				if (!to) throw new ServiceCliInputError('--to is required');
				const textArgument = serviceCliString(context.options, 'text');
				if (!textArgument) throw new ServiceCliInputError('--text is required');
				requireYes(context.options, 'Feishu send requires --yes');
				const text = (await context.readText(textArgument, { label: 'Feishu message text', maxBytes: 64 * 1024 })).trim();
				if (!text) throw new ServiceCliInputError('Feishu message text is required');
				const input = { to, text };
				return async (service, callOptions) => sanitizeFeishuOutput(await service.sendMessage(input, callOptions));
			},
		},
		{
			name: 'webhook',
			description:
				'Send a message to a Feishu/Lark group custom bot webhook configured on the service; requires --yes and a writable service',
			examples: [{ command: 'woctl feishu webhook --text "hello" --yes' }],
			options: [
				{ name: 'text', description: 'Plain text message, @file or - for stdin' },
				{ name: 'markdown', description: 'Markdown card message, @file or - for stdin' },
				{ name: 'yes', description: 'Confirm sending the message', type: 'boolean' },
			],
			mutating: true,
			async prepare(context) {
				const textArgument = serviceCliString(context.options, 'text');
				const markdownArgument = serviceCliString(context.options, 'markdown');
				if (!textArgument && !markdownArgument) throw new ServiceCliInputError('--text or --markdown is required');
				if (textArgument && markdownArgument) throw new ServiceCliInputError('--text and --markdown cannot be combined');
				requireYes(context.options, 'Feishu webhook requires --yes');
				const text = textArgument
					? (await context.readText(textArgument, { label: 'Feishu webhook text', maxBytes: 64 * 1024 })).trim()
					: undefined;
				const markdown = markdownArgument
					? (await context.readText(markdownArgument, { label: 'Feishu webhook markdown', maxBytes: 64 * 1024 })).trim()
					: undefined;
				if ((text !== undefined && !text) || (markdown !== undefined && !markdown)) {
					throw new ServiceCliInputError('Feishu webhook content must not be empty');
				}
				const input = { text, markdown };
				return async (service, callOptions) => sanitizeFeishuOutput(await service.sendWebhook(input, callOptions));
			},
		},
		...feishuImCommands(),
		...feishuApiCommands(),
	],
};

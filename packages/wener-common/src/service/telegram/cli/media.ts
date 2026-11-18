import { TELEGRAM_MAX_FILE_BYTES, TELEGRAM_MAX_PHOTO_BYTES } from '@wener/client/telegram';
import { ArrayBuffers } from '@wener/utils';
import { resolveCliOutputSelection } from '../../../cli/CliCommand';
import { type ServiceCliOperation, serviceCliString } from '../../cli/ServiceCliDefinition';
import { ServiceCliInputError } from '../../cli/ServiceCliInputError';
import type { ITelegramService } from '../ITelegramService';
import { TelegramServiceContract as contract } from '../TelegramServiceContract';
import { argument, chatId, integer, parseInput, requireYes } from './input';

type Command = ServiceCliOperation<ITelegramService>;

export function telegramFileCommands(): Command[] {
	return [
		...(['photo', 'document'] as const).map((kind): Command => ({
			name: `send-${kind}`, mutating: true,
			description: `Send a ${kind} by file id, HTTPS URL or local upload; local limit ${kind === 'photo' ? 10 : 20} MiB`,
			options: [
				{ name: 'chat', aliases: ['chat-id'], description: 'Target chat id or @channel username' },
				{ name: 'file', description: 'Local file path, @file or - for stdin' },
				{ name: 'source', description: 'Existing Telegram file id or HTTPS URL' },
				{ name: 'name', description: 'Upload filename; defaults to local file basename (required for stdin)' },
				{ name: 'caption', description: 'Caption text, @file or - for stdin' },
				{ name: 'parse-mode', description: 'Caption parse mode: HTML, MarkdownV2 or Markdown' },
				{ name: 'silent', description: 'Send without a notification sound', type: 'boolean' },
				{ name: 'reply-to', description: 'Message id to reply to' },
				{ name: 'yes', description: 'Confirm sending the media', type: 'boolean' },
			],
			async prepare(context) {
				const { options } = context;
				requireYes(options);
				const fields = { chatId: chatId(options), parseMode: serviceCliString(options, 'parse-mode'),
					disableNotification: options.silent === true || undefined, replyToMessageId: integer(options, 'reply-to') };
				const source = serviceCliString(options, 'source');
				const file = serviceCliString(options, 'file');
				if ((source === undefined) === (file === undefined)) throw new ServiceCliInputError('Provide exactly one of --file or --source');
				if (file !== undefined && !context.readBytes) throw new ServiceCliInputError('Host does not support binary file input; use --source');
				if (file !== undefined && !file.trim()) throw new ServiceCliInputError('--file must not be empty');
				const fileSource = file === undefined ? undefined : file === '-' || file.startsWith('@') ? file : `@${file}`;
				const filename = serviceCliString(options, 'name') ?? file?.replace(/^@/u, '').split(/[\\/]/u).at(-1);
				if (file !== undefined && (!filename || filename === '-' || /[\\/\u0000-\u001f\u007f]/u.test(filename)))
					throw new ServiceCliInputError('--name must be a filename (required for stdin)');
				const captionSource = serviceCliString(options, 'caption');
				if (fileSource === '-' && captionSource === '-') throw new ServiceCliInputError('Media and caption cannot both read stdin');
				// Validate non-file fields before touching either input port.
				const schema = kind === 'photo' ? contract.sendPhoto['~orpc'].inputSchema! : contract.sendDocument['~orpc'].inputSchema!;
				parseInput(schema, { ...fields, [kind]: source ?? { bytes: new Uint8Array([0]), filename } });
				const media = source ?? { bytes: await context.readBytes!(fileSource!, {
					label: `Telegram ${kind}`, maxBytes: kind === 'photo' ? TELEGRAM_MAX_PHOTO_BYTES : TELEGRAM_MAX_FILE_BYTES,
				}), filename: filename! };
				const caption = captionSource === undefined ? undefined : await context.readText(captionSource, { label: 'Telegram caption', maxBytes: 8 * 1024 });
				if (kind === 'photo') {
					const input = parseInput(contract.sendPhoto['~orpc'].inputSchema!, { ...fields, photo: media, caption });
					return async (client, callOptions) => client.sendPhoto(input, callOptions);
				}
				const input = parseInput(contract.sendDocument['~orpc'].inputSchema!, { ...fields, document: media, caption });
				return async (client, callOptions) => client.sendDocument(input, callOptions);
			},
		})),
		{
			group: 'file', name: 'info', argument: 'file-id', description: 'Get a file path for downloading by Telegram file id',
			prepare({ args }) {
				const input = parseInput(contract.getFile['~orpc'].inputSchema!, { fileId: argument(args, 0, 'File id') });
				return async (client, options) => client.getFile(input, options);
			},
		},
		{
			group: 'file', name: 'download', argument: 'file-path', description: 'Download a file path from file info; writes --out or returns Base64 with --json',
			options: [{ name: 'out', description: 'Output file path; raw bytes are written through the host' }],
			prepare(context) {
				const input = parseInput(contract.downloadFile['~orpc'].inputSchema!, { filePath: argument(context.args, 0, 'File path') });
				const out = serviceCliString(context.options, 'out');
				if (out !== undefined && (!out.trim() || out === '-')) throw new ServiceCliInputError('--out must be a file path');
				if (out !== undefined && !context.writeBytes) throw new ServiceCliInputError('Host does not support binary file output; use --json');
				if (out === undefined && !['json', 'jsonl', 'yaml', 'yml'].includes(resolveCliOutputSelection(context.options).format))
					throw new ServiceCliInputError('Provide --out <path> or use --json to receive Base64 content');
				return async (client, options) => {
					const { bytes, ...metadata } = await client.downloadFile(input, options);
					if (out !== undefined) {
						await context.writeBytes!(out, bytes, options);
						return { ...metadata, out };
					}
					return { ...metadata, base64: ArrayBuffers.toString(bytes, 'base64') };
				};
			},
		},
	];
}

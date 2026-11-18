import { oc, type ContractRouterClient, type InferContractRouterInputs, type InferContractRouterOutputs } from '@orpc/contract';
import { TELEGRAM_MAX_FILE_BYTES, TELEGRAM_MAX_PHOTO_BYTES, validateTelegramFilePath, type TelegramRequestOptions } from '@wener/client/telegram';
import { z } from 'zod';
import type { ServiceToolMeta } from '../runtime/contract';

const telegram = oc.$meta<ServiceToolMeta>({});
const read = (description: string): ServiceToolMeta => ({ readOnlyHint: true, destructiveHint: false, description });
const write = (description: string, destructiveHint = true): ServiceToolMeta => ({ readOnlyHint: false, destructiveHint, description });
const method = z.string().min(1).max(64).regex(/^[A-Za-z][A-Za-z0-9]*$/u, { message: 'Invalid Telegram API method' });
const chatId = z.union([z.string().min(1).regex(/^\S+$/u), z.number().int()]);
const messageId = z.number().int().min(1);
const optionalString = z.string().min(1).refine((value) => !/[\r\n]/u.test(value), { message: 'Value must not contain line breaks' }).optional();
const updates = z.array(z.string().min(1)).max(100).optional();
const dynamicRecord = z.record(z.string(), z.unknown());

/** Telegram's stable response envelope; method-specific result fields remain dynamic. */
export const TelegramApiSuccessOutputSchema = z.strictObject({ ok: z.literal(true), result: z.unknown() });

export const TelegramGetMeInputSchema = z.strictObject({}).default({});
export const TelegramGetMeOutputSchema = TelegramApiSuccessOutputSchema;
export const TelegramWhoamiInputSchema = z.strictObject({}).default({});
export const TelegramWhoamiOutputSchema = TelegramApiSuccessOutputSchema;

export const TelegramSendMessageInputSchema = z.strictObject({
	chatId, text: z.string().min(1).max(4096), parseMode: optionalString,
	disableNotification: z.boolean().optional(), replyToMessageId: messageId.optional(),
});
export const TelegramSendMessageOutputSchema = TelegramApiSuccessOutputSchema;

export const TelegramChatInputSchema = z.strictObject({ chatId });
export const TelegramChatMemberInputSchema = z.strictObject({ chatId, userId: z.number().int().min(1) });
export const TelegramGetUpdatesInputSchema = z.strictObject({
	offset: z.number().int().optional(), limit: z.number().int().min(1).max(100).optional(),
	timeout: z.number().int().min(0).max(50).optional(), allowedUpdates: updates,
}).default({});
export const TelegramGetWebhookInfoInputSchema = z.strictObject({}).default({});
export const TelegramSetWebhookInputSchema = z.strictObject({
	url: z.string().url().refine((value) => value.startsWith('https://'), { message: 'Webhook URL must use HTTPS' }),
	secretToken: z.string().regex(/^[A-Za-z0-9_-]{1,256}$/u).optional(), dropPendingUpdates: z.boolean().optional(),
	allowedUpdates: updates, maxConnections: z.number().int().min(1).max(100).optional(),
});
export const TelegramDeleteWebhookInputSchema = z.strictObject({ dropPendingUpdates: z.boolean().optional() }).default({});

export const TelegramEditMessageTextInputSchema = z.strictObject({
	chatId, messageId, text: z.string().min(1).max(4096), parseMode: optionalString, replyMarkup: dynamicRecord.optional(),
});
export const TelegramDeleteMessageInputSchema = z.strictObject({ chatId, messageId });
export const TelegramForwardMessageInputSchema = z.strictObject({ chatId, fromChatId: chatId, messageId, disableNotification: z.boolean().optional() });
export const TelegramCopyMessageInputSchema = TelegramForwardMessageInputSchema;
export const TelegramPinChatMessageInputSchema = z.strictObject({ chatId, messageId, disableNotification: z.boolean().optional() });
export const TelegramUnpinChatMessageInputSchema = z.strictObject({ chatId, messageId: messageId.optional() });
export const TelegramAnswerCallbackQueryInputSchema = z.strictObject({
	callbackQueryId: z.string().min(1), text: z.string().max(200).optional(), showAlert: z.boolean().optional(),
	url: z.string().url().optional(), cacheTime: z.number().int().min(0).optional(),
});

export const TelegramGetMyCommandsInputSchema = z.strictObject({ languageCode: optionalString }).default({});
export const TelegramSetMyCommandsInputSchema = z.strictObject({
	commands: z.array(z.strictObject({ command: z.string().regex(/^[a-z0-9_]{1,32}$/u), description: z.string().min(1).max(256) })).min(1).max(100),
	languageCode: optionalString,
});
export const TelegramDeleteMyCommandsInputSchema = z.strictObject({ languageCode: optionalString }).default({});
export const TelegramGetFileInputSchema = z.strictObject({ fileId: z.string().min(1) });

const filename = z.string().min(1).max(255).refine((value) => !/[\\/\u0000-\u001f\u007f]/u.test(value), { message: 'Invalid media filename' });
const mediaReference = z.string().min(1).refine((value) => !/[\s\r\n]/u.test(value) && (!value.includes('://') || value.startsWith('https://')), { message: 'Media reference must be a file id or HTTPS URL' });
const nativeBytes = (max: number) => z.custom<Uint8Array>((value) => value instanceof Uint8Array && value.byteLength > 0 && value.byteLength <= max, { message: `Expected 1..${max} bytes` });
const contentType = z.string().max(255).refine((value) => !/[\r\n]/u.test(value), { message: 'Invalid media content type' }).optional();
const mediaUpload = (max: number) => z.strictObject({ bytes: nativeBytes(max), filename, contentType });
const nativeMedia = (max: number) => z.union([mediaReference, mediaUpload(max)]);

export const TelegramSendPhotoInputSchema = z.strictObject({
	chatId, photo: nativeMedia(TELEGRAM_MAX_PHOTO_BYTES), caption: z.string().max(1024).optional(), parseMode: optionalString,
	disableNotification: z.boolean().optional(), replyToMessageId: messageId.optional(),
});
export const TelegramSendDocumentInputSchema = z.strictObject({
	chatId, document: nativeMedia(TELEGRAM_MAX_FILE_BYTES), caption: z.string().max(1024).optional(), parseMode: optionalString,
	disableNotification: z.boolean().optional(), replyToMessageId: messageId.optional(),
});
const filePath = z.string().min(1).refine((value) => {
	try { validateTelegramFilePath(value); return true; }
	catch { return false; }
}, { message: 'Invalid Telegram file path' });
export const TelegramDownloadFileInputSchema = z.strictObject({ filePath });
export const TelegramDownloadFileOutputSchema = z.strictObject({
	bytes: nativeBytes(TELEGRAM_MAX_FILE_BYTES), byteLength: z.number().int().min(1).max(TELEGRAM_MAX_FILE_BYTES),
	filePath: z.string().min(1), contentType: z.string().max(256).optional(),
}).superRefine((value, context) => {
	if (value.bytes.byteLength !== value.byteLength) context.addIssue({ code: 'custom', path: ['byteLength'], message: 'byteLength does not match bytes' });
});

export const TelegramRequestInputSchema = z.strictObject({ method, params: dynamicRecord.optional() });
export const TelegramRequestReadInputSchema = TelegramRequestInputSchema;
export const TelegramRequestOutputSchema = TelegramApiSuccessOutputSchema;

/** In-process contract. Binary methods use native Uint8Array values. */
export const TelegramServiceContract = {
	getMe: telegram.input(TelegramGetMeInputSchema).output(TelegramGetMeOutputSchema).meta(read('Read the configured Telegram bot identity.')),
	whoami: telegram.input(TelegramWhoamiInputSchema).output(TelegramWhoamiOutputSchema).meta(read('Read the configured Telegram bot identity.')),
	sendMessage: telegram.input(TelegramSendMessageInputSchema).output(TelegramSendMessageOutputSchema).meta(write('Send a Telegram message.')),
	getChat: telegram.input(TelegramChatInputSchema).output(TelegramApiSuccessOutputSchema).meta(read('Read Telegram chat information.')),
	getChatMember: telegram.input(TelegramChatMemberInputSchema).output(TelegramApiSuccessOutputSchema).meta(read('Read a Telegram chat member.')),
	getChatAdministrators: telegram.input(TelegramChatInputSchema).output(TelegramApiSuccessOutputSchema).meta(read('List Telegram chat administrators.')),
	getChatMemberCount: telegram.input(TelegramChatInputSchema).output(TelegramApiSuccessOutputSchema).meta(read('Read the Telegram chat member count.')),
	getUpdates: telegram.input(TelegramGetUpdatesInputSchema).output(TelegramApiSuccessOutputSchema).meta(write('Receive Telegram updates; this may consume or change update queue state.')),
	getWebhookInfo: telegram.input(TelegramGetWebhookInfoInputSchema).output(TelegramApiSuccessOutputSchema).meta(read('Read Telegram webhook status.')),
	setWebhook: telegram.input(TelegramSetWebhookInputSchema).output(TelegramApiSuccessOutputSchema).meta(write('Set the Telegram webhook.')),
	deleteWebhook: telegram.input(TelegramDeleteWebhookInputSchema).output(TelegramApiSuccessOutputSchema).meta(write('Delete the Telegram webhook.')),
	editMessageText: telegram.input(TelegramEditMessageTextInputSchema).output(TelegramApiSuccessOutputSchema).meta(write('Edit a Telegram message.')),
	deleteMessage: telegram.input(TelegramDeleteMessageInputSchema).output(TelegramApiSuccessOutputSchema).meta(write('Delete a Telegram message.')),
	forwardMessage: telegram.input(TelegramForwardMessageInputSchema).output(TelegramApiSuccessOutputSchema).meta(write('Forward a Telegram message.')),
	copyMessage: telegram.input(TelegramCopyMessageInputSchema).output(TelegramApiSuccessOutputSchema).meta(write('Copy a Telegram message.')),
	pinChatMessage: telegram.input(TelegramPinChatMessageInputSchema).output(TelegramApiSuccessOutputSchema).meta(write('Pin a Telegram chat message.')),
	unpinChatMessage: telegram.input(TelegramUnpinChatMessageInputSchema).output(TelegramApiSuccessOutputSchema).meta(write('Unpin a Telegram chat message.')),
	answerCallbackQuery: telegram.input(TelegramAnswerCallbackQueryInputSchema).output(TelegramApiSuccessOutputSchema).meta(write('Answer a Telegram callback query.')),
	getMyCommands: telegram.input(TelegramGetMyCommandsInputSchema).output(TelegramApiSuccessOutputSchema).meta(read('Read Telegram bot commands.')),
	setMyCommands: telegram.input(TelegramSetMyCommandsInputSchema).output(TelegramApiSuccessOutputSchema).meta(write('Set Telegram bot commands.')),
	deleteMyCommands: telegram.input(TelegramDeleteMyCommandsInputSchema).output(TelegramApiSuccessOutputSchema).meta(write('Delete Telegram bot commands.')),
	getFile: telegram.input(TelegramGetFileInputSchema).output(TelegramApiSuccessOutputSchema).meta(read('Read Telegram file metadata.')),
	sendPhoto: telegram.input(TelegramSendPhotoInputSchema).output(TelegramApiSuccessOutputSchema).meta(write('Send a Telegram photo.')),
	sendDocument: telegram.input(TelegramSendDocumentInputSchema).output(TelegramApiSuccessOutputSchema).meta(write('Send a Telegram document.')),
	downloadFile: telegram.input(TelegramDownloadFileInputSchema).output(TelegramDownloadFileOutputSchema).meta(read('Download a Telegram file by its returned file path.')),
	request: telegram.input(TelegramRequestInputSchema).output(TelegramRequestOutputSchema).meta(write('Call a Telegram Bot API method; unknown methods require write access.')),
	requestRead: telegram.input(TelegramRequestReadInputSchema).output(TelegramRequestOutputSchema).meta(read('Call a whitelisted read-only Telegram Bot API method.')),
};

// Keep the regexp flat: repeated groups overflow the JS regexp stack on multi-MiB inputs.
const base64 = (max: number) => z.string().min(4).max(Math.ceil(max / 3) * 4).regex(/^[A-Za-z0-9+/]*={0,2}$/u);
function base64Length(field: string, byteLength: number, value: string, context: z.RefinementCtx) {
	const padding = value.endsWith('==') ? 2 : value.endsWith('=') ? 1 : 0;
	if (value.length % 4 !== 0 || (value.length / 4) * 3 - padding !== byteLength)
		context.addIssue({ code: 'custom', path: [field], message: 'Base64 length does not match byteLength' });
}
const wireMedia = (max: number) => z.strictObject({ base64: base64(max), byteLength: z.number().int().min(1).max(max), filename, contentType })
	.superRefine((value, context) => base64Length('base64', value.byteLength, value.base64, context));
const wireMediaReference = (max: number) => z.union([mediaReference, wireMedia(max)]);
export const TelegramSendPhotoWireInputSchema = TelegramSendPhotoInputSchema.extend({ photo: wireMediaReference(TELEGRAM_MAX_PHOTO_BYTES) });
export const TelegramSendDocumentWireInputSchema = TelegramSendDocumentInputSchema.extend({ document: wireMediaReference(TELEGRAM_MAX_FILE_BYTES) });
export const TelegramDownloadFileWireOutputSchema = z.strictObject({
	base64: base64(TELEGRAM_MAX_FILE_BYTES), byteLength: z.number().int().min(1).max(TELEGRAM_MAX_FILE_BYTES), filePath: z.string().min(1), contentType: z.string().max(256).optional(),
}).superRefine((value, context) => base64Length('base64', value.byteLength, value.base64, context));

/** Tool transport projection; binary values become bounded Base64 objects. */
export const TelegramServiceWireContract = {
	...TelegramServiceContract,
	sendPhoto: telegram.input(TelegramSendPhotoWireInputSchema).output(TelegramApiSuccessOutputSchema).meta(TelegramServiceContract.sendPhoto['~orpc'].meta),
	sendDocument: telegram.input(TelegramSendDocumentWireInputSchema).output(TelegramApiSuccessOutputSchema).meta(TelegramServiceContract.sendDocument['~orpc'].meta),
	downloadFile: telegram.input(TelegramDownloadFileInputSchema).output(TelegramDownloadFileWireOutputSchema).meta(TelegramServiceContract.downloadFile['~orpc'].meta),
};

export type TelegramOperationName = keyof typeof TelegramServiceContract;
export type TelegramServiceInputs = InferContractRouterInputs<typeof TelegramServiceContract>;
export type TelegramServiceOutputs = InferContractRouterOutputs<typeof TelegramServiceContract>;
export type TelegramServiceWireInputs = InferContractRouterInputs<typeof TelegramServiceWireContract>;
export type TelegramServiceWireOutputs = InferContractRouterOutputs<typeof TelegramServiceWireContract>;
export type TelegramRequestInput = TelegramServiceInputs['request'];
export type TelegramSendMessageInput = TelegramServiceInputs['sendMessage'];
export type TelegramSendPhotoInput = TelegramServiceInputs['sendPhoto'];
export type TelegramSendDocumentInput = TelegramServiceInputs['sendDocument'];
export type TelegramDownloadFileInput = TelegramServiceInputs['downloadFile'];
export type TelegramDownloadFileOutput = TelegramServiceOutputs['downloadFile'];
export type TelegramServiceClientContext = Pick<TelegramRequestOptions, 'timeoutMs'>;
export type ITelegramServiceContract = ContractRouterClient<typeof TelegramServiceContract, TelegramServiceClientContext>;
export type TelegramServiceCallOptions = NonNullable<Parameters<ITelegramServiceContract['request']>[1]>;
export const TelegramWriteOperations: ReadonlySet<TelegramOperationName> = new Set(
	(Object.keys(TelegramServiceContract) as TelegramOperationName[]).filter((name) => TelegramServiceContract[name]['~orpc'].meta.readOnlyHint !== true),
);

import { FEISHU_MAX_FILE_BYTES, FEISHU_MAX_IMAGE_BYTES, FEISHU_MAX_RESOURCE_BYTES } from '@wener/client/feishu/server';
import { z } from 'zod';

export { FEISHU_MAX_FILE_BYTES, FEISHU_MAX_IMAGE_BYTES, FEISHU_MAX_RESOURCE_BYTES };
export const feishuBase64Length = (bytes: number) => Math.ceil(bytes / 3) * 4;

// The shared exporter annotates optional schemas with nullable. Give optional unknown
// an explicit JSON value domain so AJV can compile it without a typeless nullable.
export const optionalDynamicValue = z.unknown().optional().meta({ type: ['object', 'array', 'string', 'number', 'boolean', 'null'] });

const id = z.string().trim().min(1).max(256);
const pageToken = z.string().min(1).max(2048).optional();
const pageSize = (max: number) => z.number().int().min(1).max(max).optional();
export const FeishuUserIdTypeSchema = z.enum(['open_id', 'union_id', 'user_id']);
const unixSeconds = z.string().regex(/^\d{1,13}$/u);

/** Message bodies, cards, sender identifiers and future API fields remain extensible. */
export const FeishuMessageSchema = z.looseObject({
	message_id: z.string().optional(),
	root_id: z.string().optional(),
	parent_id: z.string().optional(),
	thread_id: z.string().optional(),
	msg_type: z.string().optional(),
	create_time: z.string().optional(),
	update_time: z.string().optional(),
	deleted: z.boolean().optional(),
	updated: z.boolean().optional(),
	chat_id: z.string().optional(),
	body: optionalDynamicValue,
	sender: optionalDynamicValue,
	mentions: z.array(z.unknown()).optional(),
});
export const FeishuChatSchema = z.looseObject({
	chat_id: z.string().optional(),
	name: z.string().optional(),
	description: z.string().optional(),
	avatar: z.string().optional(),
	owner_id: z.string().optional(),
	owner_id_type: z.string().optional(),
	external: z.boolean().optional(),
	tenant_key: z.string().optional(),
	chat_status: z.string().optional(),
});
export const FeishuChatMemberSchema = z.looseObject({
	member_id: z.string().optional(),
	member_id_type: z.string().optional(),
	name: z.string().optional(),
	tenant_key: z.string().optional(),
});
/** Contact fields depend on granted scopes; anything not listed is preserved as-is. */
export const FeishuUserSchema = z.looseObject({
	open_id: z.string().optional(),
	union_id: z.string().optional(),
	user_id: z.string().optional(),
	name: z.string().optional(),
	en_name: z.string().optional(),
	email: z.string().optional(),
	department_ids: z.array(z.string()).optional(),
	avatar: optionalDynamicValue,
	status: optionalDynamicValue,
});
export const FeishuReactionSchema = z.looseObject({
	reaction_id: z.string().optional(),
	operator: optionalDynamicValue,
	action_time: z.string().optional(),
	reaction_type: z.looseObject({ emoji_type: z.string().optional() }).optional(),
});

function pageOf<T extends z.ZodType>(item: T) {
	return z.strictObject({ items: z.array(item), hasMore: z.boolean(), pageToken: z.string().optional() });
}

export const FeishuListChatInputSchema = z
	.strictObject({
		userIdType: FeishuUserIdTypeSchema.optional(),
		sortType: z.enum(['ByCreateTimeAsc', 'ByActiveTimeDesc']).optional(),
		pageSize: pageSize(100),
		pageToken,
	})
	.default({});
export const FeishuListChatOutputSchema = pageOf(FeishuChatSchema);

export const FeishuGetChatInputSchema = z.strictObject({ chatId: id, userIdType: FeishuUserIdTypeSchema.optional() });
export const FeishuGetChatOutputSchema = FeishuChatSchema;

export const FeishuListChatMemberInputSchema = z.strictObject({
	chatId: id,
	memberIdType: FeishuUserIdTypeSchema.optional(),
	pageSize: pageSize(100),
	pageToken,
});
export const FeishuListChatMemberOutputSchema = pageOf(FeishuChatMemberSchema).extend({ memberTotal: z.number().int().optional() });

/** Exactly one of `userId` (with `userIdType`) or `email` (resolved through batch_get_id). */
export const FeishuGetUserInputSchema = z
	.strictObject({
		userId: id.optional(),
		email: z.string().trim().min(3).max(320).regex(/^[^\s@]+@[^\s@]+$/u).optional(),
		userIdType: FeishuUserIdTypeSchema.optional(),
	})
	.refine((value) => (value.userId === undefined) !== (value.email === undefined), {
		message: 'Provide exactly one of userId or email',
	});
export const FeishuGetUserOutputSchema = FeishuUserSchema;

export const FeishuListMessageInputSchema = z.strictObject({
	chatId: id,
	startTime: unixSeconds.optional(),
	endTime: unixSeconds.optional(),
	sortType: z.enum(['ByCreateTimeAsc', 'ByCreateTimeDesc']).optional(),
	pageSize: pageSize(50),
	pageToken,
});
export const FeishuListMessageOutputSchema = pageOf(FeishuMessageSchema);

export const FeishuGetMessageInputSchema = z.strictObject({ messageId: id });
/** Merge-forwarded messages return their child messages as additional items. */
export const FeishuGetMessageOutputSchema = z.strictObject({ items: z.array(FeishuMessageSchema) });

/** `text` is a shortcut for a text message; `content` is a raw Feishu content JSON string. */
export const FeishuReplyMessageInputSchema = z
	.strictObject({
		messageId: id,
		text: z.string().min(1).max(30_000).optional(),
		content: z.string().min(2).max(150_000).optional(),
		msgType: z.string().regex(/^[a-z_]{1,32}$/u).optional(),
		replyInThread: z.boolean().optional(),
		uuid: z.string().min(1).max(50).optional(),
	})
	.refine((value) => (value.text === undefined) !== (value.content === undefined), {
		message: 'Provide exactly one of text or content',
	})
	.refine((value) => value.text === undefined || value.msgType === undefined || value.msgType === 'text', {
		message: 'text can only be sent as msgType text',
	})
	.refine((value) => value.content === undefined || value.msgType !== undefined, {
		message: 'content requires msgType',
	});
export const FeishuReplyMessageOutputSchema = FeishuMessageSchema;

export const FeishuDeleteMessageInputSchema = z.strictObject({ messageId: id });
export const FeishuDeleteMessageOutputSchema = z.strictObject({ messageId: z.string(), deleted: z.literal(true) });

export const FeishuAddMessageReactionInputSchema = z.strictObject({
	messageId: id,
	emojiType: z.string().regex(/^[A-Za-z0-9_]{1,64}$/u),
});
export const FeishuDeleteMessageReactionInputSchema = z.strictObject({ messageId: id, reactionId: id });
export const FeishuMessageReactionOutputSchema = FeishuReactionSchema;

const fileName = z
	.string()
	.trim()
	.min(1)
	.max(255)
	.refine((value) => !/[\\/]/u.test(value), 'File name must not contain path separators');
const bytes = (max: number) =>
	z.custom<Uint8Array>((value) => value instanceof Uint8Array && value.byteLength > 0 && value.byteLength <= max, {
		message: `Expected 1..${max} bytes`,
	});
const base64 = (max: number) =>
	z
		.string()
		.min(4)
		.max(feishuBase64Length(max))
		.regex(/^[A-Za-z0-9+/]*={0,2}$/u);
function base64Length(field: string, byteLength: number, value: string, context: z.RefinementCtx) {
	const padding = value.endsWith('==') ? 2 : value.endsWith('=') ? 1 : 0;
	if (value.length % 4 !== 0 || (value.length / 4) * 3 - padding !== byteLength)
		context.addIssue({ code: 'custom', path: [field], message: 'Base64 length does not match byteLength' });
}

export const FeishuImageTypeSchema = z.enum(['message', 'avatar']);
export const FeishuFileTypeSchema = z.enum(['opus', 'mp4', 'pdf', 'doc', 'xls', 'ppt', 'stream']);

/** Native (in-process) upload inputs carry bytes; they are never exported as JSON Schema. */
export const FeishuUploadImageInputSchema = z.strictObject({
	image: bytes(FEISHU_MAX_IMAGE_BYTES),
	imageType: FeishuImageTypeSchema.optional(),
	filename: fileName.optional(),
});
export const FeishuUploadFileInputSchema = z.strictObject({
	file: bytes(FEISHU_MAX_FILE_BYTES),
	fileType: FeishuFileTypeSchema,
	fileName,
	/** Media duration in milliseconds for opus/mp4. */
	duration: z.number().int().min(0).max(24 * 3600 * 1000).optional(),
});
export const FeishuUploadImageOutputSchema = z.strictObject({ imageKey: z.string().min(1) });
export const FeishuUploadFileOutputSchema = z.strictObject({ fileKey: z.string().min(1) });

/** Bounded Base64 projections used only when crossing a service transport. */
export const FeishuUploadImageWireInputSchema = z
	.strictObject({
		imageBase64: base64(FEISHU_MAX_IMAGE_BYTES),
		byteLength: z.number().int().min(1).max(FEISHU_MAX_IMAGE_BYTES),
		imageType: FeishuImageTypeSchema.optional(),
		filename: fileName.optional(),
	})
	.superRefine((value, context) => base64Length('imageBase64', value.byteLength, value.imageBase64, context));
export const FeishuUploadFileWireInputSchema = z
	.strictObject({
		fileBase64: base64(FEISHU_MAX_FILE_BYTES),
		byteLength: z.number().int().min(1).max(FEISHU_MAX_FILE_BYTES),
		fileType: FeishuFileTypeSchema,
		fileName,
		duration: z.number().int().min(0).max(24 * 3600 * 1000).optional(),
	})
	.superRefine((value, context) => base64Length('fileBase64', value.byteLength, value.fileBase64, context));

export const FeishuDownloadMessageResourceInputSchema = z.strictObject({
	messageId: id,
	fileKey: id,
	type: z.enum(['image', 'file']),
	maxBytes: z.number().int().min(1).max(FEISHU_MAX_RESOURCE_BYTES).optional(),
});
const contentType = z.string().max(256).optional();
const downloadName = z.string().max(255).optional();
export const FeishuDownloadMessageResourceOutputSchema = z.strictObject({
	data: bytes(FEISHU_MAX_RESOURCE_BYTES),
	contentType,
	filename: downloadName,
});
export const FeishuDownloadMessageResourceWireOutputSchema = z
	.strictObject({
		contentBase64: base64(FEISHU_MAX_RESOURCE_BYTES),
		byteLength: z.number().int().min(1).max(FEISHU_MAX_RESOURCE_BYTES),
		contentType,
		filename: downloadName,
	})
	.superRefine((value, context) => base64Length('contentBase64', value.byteLength, value.contentBase64, context));

export type FeishuUploadImageWireInput = z.infer<typeof FeishuUploadImageWireInputSchema>;
export type FeishuUploadFileWireInput = z.infer<typeof FeishuUploadFileWireInputSchema>;
export type FeishuDownloadMessageResourceWireOutput = z.infer<typeof FeishuDownloadMessageResourceWireOutputSchema>;

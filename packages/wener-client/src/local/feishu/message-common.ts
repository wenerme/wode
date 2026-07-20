import { z } from 'zod';

type EnumValues<T> = T[Exclude<keyof T, '__proto__'>];

export const MessageType = Object.freeze({
	__proto__: null,
	text: 'text',
	post: 'post',
	image: 'image',
	file: 'file',
	audio: 'audio',
	media: 'media',
	sticker: 'sticker',
	interactive: 'interactive',
	share_chat: 'share_chat',
	share_user: 'share_user',
	system: 'system',
});
export type MessageType = EnumValues<typeof MessageType>;
export const MessageTypeSchema = z
	.union([
		z.literal(MessageType.text).describe('文本消息'),
		z.literal(MessageType.post).describe('富文本消息'),
		z.literal(MessageType.image).describe('图片消息'),
		z.literal(MessageType.file).describe('文件消息'),
		z.literal(MessageType.audio).describe('语音消息'),
		z.literal(MessageType.media).describe('视频消息'),
		z.literal(MessageType.sticker).describe('表情包消息'),
		z.literal(MessageType.interactive).describe('卡片消息'),
		z.literal(MessageType.share_chat).describe('分享群名片消息'),
		z.literal(MessageType.share_user).describe('分享个人名片消息'),
		z.literal(MessageType.system).describe('系统消息'),
	])
	.describe('飞书发送消息类型');

// Additional receive-only message types
export const RecvMessageType = Object.freeze({
	__proto__: null,
	folder: 'folder',
	hongbao: 'hongbao',
	share_calendar_event: 'share_calendar_event',
	calendar: 'calendar',
	general_calendar: 'general_calendar',
	location: 'location',
	video_chat: 'video_chat',
	todo: 'todo',
	vote: 'vote',
	merge_forward: 'merge_forward',
});
export type RecvMessageType = EnumValues<typeof RecvMessageType>;

export const RecvMessageTypeSchema = z
	.union([
		z.literal(MessageType.text).describe('文本消息'),
		z.literal(MessageType.post).describe('富文本消息'),
		z.literal(MessageType.image).describe('图片消息'),
		z.literal(MessageType.file).describe('文件消息'),
		z.literal(RecvMessageType.folder).describe('文件夹消息'),
		z.literal(MessageType.audio).describe('语音消息'),
		z.literal(MessageType.media).describe('视频消息'),
		z.literal(MessageType.sticker).describe('表情包消息'),
		z.literal(MessageType.interactive).describe('卡片消息'),
		z.literal(MessageType.share_chat).describe('分享群名片消息'),
		z.literal(MessageType.share_user).describe('分享个人名片消息'),
		z.literal(MessageType.system).describe('系统消息'),
		z.literal(RecvMessageType.hongbao).describe('红包消息'),
		z.literal(RecvMessageType.share_calendar_event).describe('日程分享卡片'),
		z.literal(RecvMessageType.calendar).describe('日程邀请卡片'),
		z.literal(RecvMessageType.general_calendar).describe('日程转让/附言/切换日历卡片'),
		z.literal(RecvMessageType.location).describe('位置消息'),
		z.literal(RecvMessageType.video_chat).describe('视频通话消息'),
		z.literal(RecvMessageType.todo).describe('任务消息'),
		z.literal(RecvMessageType.vote).describe('投票消息'),
		z.literal(RecvMessageType.merge_forward).describe('合并转发消息'),
	])
	.describe('飞书接收消息类型');

// Common enums and base types
export const MessageStyleSchema = z.enum(['bold', 'underline', 'lineThrough', 'italic']);
export type MessageStyle = z.infer<typeof MessageStyleSchema>;

// Common field schemas
export const FileKeySchema = z.string().describe('文件的 Key');
export const ImageKeySchema = z.string().describe('图片的 Key');
export const TimestampSchema = z.string().describe('毫秒级时间戳');

// Shared message content schemas that are identical in both send and receive
export const TextContentSchema = z.object({
	text: z.string().describe('文本内容'),
});

export const ImageContentSchema = z.object({
	image_key: ImageKeySchema,
});

export const ShareChatContentSchema = z.object({
	chat_id: z.string().describe('群 ID'),
});

export const ShareUserContentSchema = z.object({
	user_id: z.string().describe('用户的 open_id'),
});

export const StickerContentSchema = z.object({
	file_key: FileKeySchema.describe('表情包文件的 Key'),
});

// Export types
export type TextContent = z.infer<typeof TextContentSchema>;
export type ImageContent = z.infer<typeof ImageContentSchema>;
export type ShareChatContent = z.infer<typeof ShareChatContentSchema>;
export type ShareUserContent = z.infer<typeof ShareUserContentSchema>;
export type StickerContent = z.infer<typeof StickerContentSchema>;

// Base element schemas for rich text
export const PostElementBaseSchema = z.object({
	tag: z.string(),
	style: z.array(MessageStyleSchema).optional(),
});

export const PostTextElementSchema = PostElementBaseSchema.extend({
	tag: z.literal('text'),
	text: z.string(),
	un_escape: z.boolean().optional(),
});

export const PostLinkElementSchema = PostElementBaseSchema.extend({
	tag: z.literal('a'),
	text: z.string(),
	href: z.string().url(),
});

export const PostImageElementSchema = z.object({
	tag: z.literal('img'),
	image_key: ImageKeySchema,
});

export const PostMediaElementSchema = z.object({
	tag: z.literal('media'),
	file_key: FileKeySchema,
	image_key: ImageKeySchema.optional(),
});

export const PostEmotionElementSchema = z.object({
	tag: z.literal('emotion'),
	emoji_type: z.string(),
});

export const PostCodeBlockElementSchema = z.object({
	tag: z.literal('code_block'),
	language: z.string().optional(),
	text: z.string(),
});

export const PostHrElementSchema = z.object({
	tag: z.literal('hr'),
});

export const PostMdElementSchema = z.object({
	tag: z.literal('md'),
	text: z.string(),
});

// Language content structure (used by both send and receive post messages)
export const PostLanguageContentSchema = z.object({
	title: z.string().optional(),
	content: z.array(z.array(z.any())), // Will be overridden with specific element types
});

// Base file content schemas
export const BaseFileContentSchema = z.object({
	file_key: FileKeySchema,
});

export const BaseAudioContentSchema = BaseFileContentSchema.extend({
	duration: z.number().optional().describe('音频时长，单位：毫秒'),
});

export const BaseMediaContentSchema = BaseFileContentSchema.extend({
	image_key: ImageKeySchema.optional().describe('视频封面图片的 Key'),
	file_name: z.string().optional().describe('文件名'),
	duration: z.number().optional().describe('视频时长，单位：毫秒'),
});

// Common calendar event schema
export const CalendarEventContentSchema = z.object({
	summary: z.string().describe('日程标题'),
	start_time: TimestampSchema.describe('开始时间'),
	end_time: TimestampSchema.describe('结束时间'),
});

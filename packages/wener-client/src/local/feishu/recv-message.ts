import { z } from 'zod';
import {
	BaseAudioContentSchema,
	BaseFileContentSchema,
	BaseMediaContentSchema,
	CalendarEventContentSchema,
	PostCodeBlockElementSchema,
	PostElementBaseSchema,
	PostEmotionElementSchema,
	PostHrElementSchema,
	PostImageElementSchema,
	PostLanguageContentSchema,
	PostLinkElementSchema,
	PostMediaElementSchema,
	PostTextElementSchema,
} from './message-common';

// Receive-specific @ element (uses @_user_X format)
export const RecvPostAtElementSchema = PostElementBaseSchema.extend({
	tag: z.literal('at'),
	user_id: z.string().describe('被 @ 的用户序号，如 @_user_1'),
	user_name: z.string().describe('用户姓名'),
});

export const RecvPostElementSchema = z.union([
	PostTextElementSchema,
	PostLinkElementSchema,
	RecvPostAtElementSchema,
	PostImageElementSchema,
	PostMediaElementSchema,
	PostEmotionElementSchema,
	PostCodeBlockElementSchema,
	PostHrElementSchema,
	// Note: md element is send-only, not included in receive
]);

export const RecvPostContentSchema = PostLanguageContentSchema.extend({
	content: z.array(z.array(RecvPostElementSchema)),
}).describe('接收富文本消息内容，@ 格式不同于发送');

export type RecvPostContent = z.infer<typeof RecvPostContentSchema>;

// Receive file message schema (has additional file_name field)
export const RecvFileContentSchema = BaseFileContentSchema.extend({
	file_name: z.string().describe('文件名'),
});

export type RecvFileContent = z.infer<typeof RecvFileContentSchema>;

// Receive folder message schema (receive only)
export const RecvFolderContentSchema = z.object({
	file_key: z.string().describe('文件夹唯一标识'),
	file_name: z.string().describe('文件夹名'),
});

export type RecvFolderContent = z.infer<typeof RecvFolderContentSchema>;

// Receive audio message schema (has additional duration field)
export const RecvAudioContentSchema = BaseAudioContentSchema.extend({
	duration: z.number().describe('音频时长，单位：毫秒'),
});

export type RecvAudioContent = z.infer<typeof RecvAudioContentSchema>;

// Receive media/video message schema (has all fields)
export const RecvMediaContentSchema = BaseMediaContentSchema.extend({
	file_name: z.string().describe('视频文件名'),
	duration: z.number().describe('视频时长，单位：毫秒'),
});

export type RecvMediaContent = z.infer<typeof RecvMediaContentSchema>;

// Receive interactive card message schema (different structure)
export const RecvInteractiveElementSchema = z.union([
	z.object({ tag: z.literal('button'), text: z.string(), type: z.enum(['primary', 'default', 'danger']) }),
	z.object({ tag: z.literal('a'), href: z.string(), text: z.string() }),
	z.object({ tag: z.literal('text'), text: z.string() }),
	z.object({ tag: z.literal('at'), user_id: z.string(), user_name: z.string() }),
	z.object({ tag: z.literal('img'), image_key: z.string() }),
	z.object({ tag: z.literal('hr') }),
	z.object({
		tag: z.literal('note'),
		elements: z.array(z.object({ tag: z.string() }).passthrough()),
	}),
	z.object({
		tag: z.literal('select_static'),
		options: z.array(z.string()),
		placeholder: z.string(),
	}),
	z.object({
		tag: z.literal('overflow'),
		options: z.array(z.string()),
	}),
	z.object({
		tag: z.literal('date_picker'),
		placeholder: z.string(),
		initial_date: z.string(),
	}),
]);

export const RecvInteractiveContentSchema = z.object({
	title: z.string().describe('卡片标题'),
	elements: z.array(z.array(RecvInteractiveElementSchema)).describe('卡片元素'),
});

export type RecvInteractiveContent = z.infer<typeof RecvInteractiveContentSchema>;

// Receive system message schema (completely different from send)
export const RecvSystemDividerTextSchema = z.object({
	text: z.string().describe('分割线默认文本'),
	i18n_text: z.record(z.string(), z.string()).optional().describe('国际化文本'),
});

export const RecvSystemContentSchema = z.object({
	template: z.string().describe('系统消息模板'),
	from_user: z.array(z.string()).optional().describe('发起者用户列表'),
	to_chatters: z.array(z.string()).optional().describe('被邀请用户列表'),
	divider_text: RecvSystemDividerTextSchema.optional().describe('分割线文本内容'),
});

export type RecvSystemContent = z.infer<typeof RecvSystemContentSchema>;

// Calendar event schemas (receive only, all use same structure)
export const RecvCalendarEventContentSchema = CalendarEventContentSchema;
export const RecvCalendarContentSchema = CalendarEventContentSchema;
export const RecvGeneralCalendarContentSchema = CalendarEventContentSchema;

export type RecvCalendarEventContent = z.infer<typeof RecvCalendarEventContentSchema>;
export type RecvCalendarContent = z.infer<typeof RecvCalendarContentSchema>;
export type RecvGeneralCalendarContent = z.infer<typeof RecvGeneralCalendarContentSchema>;

// Hongbao message schema (receive only)
export const RecvHongbaoContentSchema = z.object({
	text: z.literal('[红包]').describe('红包消息固定文本'),
});

export type RecvHongbaoContent = z.infer<typeof RecvHongbaoContentSchema>;

// Location message schema (receive only)
export const RecvLocationContentSchema = z.object({
	name: z.string().describe('位置名称'),
	longitude: z.string().describe('经度'),
	latitude: z.string().describe('纬度'),
});

export type RecvLocationContent = z.infer<typeof RecvLocationContentSchema>;

// Video chat message schema (receive only)
export const RecvVideoChatContentSchema = z.object({
	topic: z.string().describe('视频通话标题'),
	start_time: z.string().describe('通话开始时间，毫秒级时间戳'),
});

export type RecvVideoChatContent = z.infer<typeof RecvVideoChatContentSchema>;

// Todo message schema (receive only)
export const RecvTodoContentSchema = z.object({
	task_id: z.string().describe('任务 ID'),
	summary: RecvPostContentSchema.describe('富文本格式的任务标题'),
	due_time: z.string().describe('任务截止时间，毫秒级时间戳'),
});

export type RecvTodoContent = z.infer<typeof RecvTodoContentSchema>;

// Vote message schema (receive only)
export const RecvVoteContentSchema = z.object({
	topic: z.string().describe('投票主题'),
	options: z.array(z.string()).describe('投票选项列表'),
});

export type RecvVoteContent = z.infer<typeof RecvVoteContentSchema>;

// Merge forward message schema (receive only)
export const RecvMergeForwardContentSchema = z.object({
	content: z.literal('Merged and Forwarded Message').describe('合并转发消息固定内容'),
});

export type RecvMergeForwardContent = z.infer<typeof RecvMergeForwardContentSchema>;

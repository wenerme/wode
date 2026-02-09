import { z } from 'zod';
import {
	BaseAudioContentSchema,
	BaseFileContentSchema,
	BaseMediaContentSchema,
	PostCodeBlockElementSchema,
	PostElementBaseSchema,
	PostEmotionElementSchema,
	PostHrElementSchema,
	PostImageElementSchema,
	PostLanguageContentSchema,
	PostLinkElementSchema,
	PostMdElementSchema,
	PostMediaElementSchema,
	PostTextElementSchema,
} from './message-common';

// Send-specific @ element (uses real user ID)
export const SendPostAtElementSchema = PostElementBaseSchema.extend({
	tag: z.literal('at'),
	user_id: z.string().describe('用户的 user_id、open_id 或 union_id'),
});

export const PostElementSchema = z.union([
	PostTextElementSchema,
	PostLinkElementSchema,
	SendPostAtElementSchema,
	PostImageElementSchema,
	PostMediaElementSchema,
	PostEmotionElementSchema,
	PostCodeBlockElementSchema,
	PostHrElementSchema,
	PostMdElementSchema,
]);

export const PostContentSchema = z
	.record(
		z.string(),
		PostLanguageContentSchema.extend({
			content: z.array(z.array(PostElementSchema)),
		}),
	)
	.describe('多语言富文本内容，如 zh_cn, en_us');

export type PostContent = z.infer<typeof PostContentSchema>;

// Interactive card message schema
export const CardEntityContentSchema = z.object({
	type: z.literal('card'),
	data: z.object({
		card_id: z.string(),
	}),
});

export const CardTemplateContentSchema = z.object({
	type: z.literal('template'),
	data: z.object({
		template_id: z.string(),
		template_version_name: z.string().optional(),
		template_variable: z.record(z.string(), z.any()).optional(),
	}),
});

export const InteractiveContentSchema = z.union([
	CardEntityContentSchema,
	CardTemplateContentSchema,
	z.record(z.string(), z.any()).describe('卡片 JSON 内容'),
]);

export type InteractiveContent = z.infer<typeof InteractiveContentSchema>;

// Audio message schema (send only has file_key)
export const AudioContentSchema = BaseAudioContentSchema.pick({ file_key: true });
export type AudioContent = z.infer<typeof AudioContentSchema>;

// Media/video message schema (send only has file_key and optional image_key)
export const MediaContentSchema = BaseMediaContentSchema.pick({
	file_key: true,
	image_key: true,
});
export type MediaContent = z.infer<typeof MediaContentSchema>;

// File message schema (send only has file_key)
export const FileContentSchema = BaseFileContentSchema;
export type FileContent = z.infer<typeof FileContentSchema>;

// System message schema
export const SystemDividerTextSchema = z.object({
	text: z.string().max(20).describe('默认文本，最多20字符或10汉字'),
	i18n_text: z
		.record(
			z.enum([
				'en_US',
				'zh_CN',
				'zh_HK',
				'zh_TW',
				'ja_JP',
				'id_ID',
				'vi_VN',
				'th_TH',
				'pt_BR',
				'es_ES',
				'ko_KR',
				'de_DE',
				'fr_FR',
				'it_IT',
				'ru_RU',
				'ms_MY',
			]),
			z.string().max(20),
		)
		.optional()
		.describe('国际化文本'),
});

export const SystemContentSchema = z.object({
	type: z.literal('divider').describe('系统消息类型，目前仅支持分割线'),
	params: z.object({
		divider_text: SystemDividerTextSchema.optional(),
	}),
	options: z
		.object({
			need_rollup: z.boolean().optional().describe('是否需要滚动清屏'),
		})
		.optional(),
});

export type SystemContent = z.infer<typeof SystemContentSchema>;

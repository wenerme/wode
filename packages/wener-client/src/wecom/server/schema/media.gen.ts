// Code generated from WeChat Work API documentation. DO NOT EDIT.
import { z } from 'zod';

/**
 * 获取临时素材
 * @see https://developer.work.weixin.qq.com/document/path/90077
 */
export const GetTempMediaRequestSchema = z.object({
  /** 媒体文件id，见上传临时素材，以及异步上传临时素材 */
  media_id: z.string().min(1),
});
export type GetTempMediaRequest = z.infer<typeof GetTempMediaRequestSchema>;

/**
 * 获取高清语音素材
 * @see https://developer.work.weixin.qq.com/document/path/90078
 */
export const GetMediaVoiceRequestSchema = z.object({
  /** 通过JSSDK的uploadVoice接口上传的语音文件id */
  media_id: z.string(),
});
export type GetMediaVoiceRequest = z.infer<typeof GetMediaVoiceRequestSchema>;

/**
 * 上传临时素材
 * @see https://developer.work.weixin.qq.com/document/path/90076
 */
export const UploadMediaRequestSchema = z.object({
  /** 媒体文件类型 (image-图片, voice-语音, video-视频, file-普通文件) */
  type: z.string(),
  /** 媒体文件（multipart/form-data） [binary] */
  media: z.string().min(6).max(20971520),
});
export type UploadMediaRequest = z.infer<typeof UploadMediaRequestSchema>;
export const UploadMediaResponseSchema = z.object({
  /** 媒体文件类型 (image-图片, voice-语音, video-视频, file-普通文件) */
  type: z.string().optional(),
  /** 媒体文件上传后获取的唯一标识，3天内有效 */
  media_id: z.string().optional(),
  /** 媒体文件上传时间戳 [timestamp] */
  created_at: z.number().optional(),
});
export type UploadMediaResponse = z.infer<typeof UploadMediaResponseSchema>;

/**
 * 异步上传临时素材
 * @see https://developer.work.weixin.qq.com/document/path/97078
 */
export const UploadMediaByUrlRequestSchema = z.object({
  /** 场景值。1-客户联系入群欢迎语素材（目前仅支持1）。 (1-客户联系入群欢迎语素材) */
  scene: z.number(),
  /** 媒体文件类型。目前仅支持video-视频，file-普通文件。不超过32字节。 (video-视频, file-普通文件) */
  type: z.string(),
  /** 文件名，标识文件展示的名称。不超过128字节。 */
  filename: z.string().min(1).max(128),
  /** 文件cdn url。要求支持Range分块下载。不超过1024字节。如果为腾讯云cos链接，则需要设置为公有读权限。 */
  url: z.string().min(1).max(1024),
  /** 文件md5。对比从url下载下来的文件md5是否一致。不超过32字节。 [md5] */
  md5: z.string().min(1).max(32),
});
export type UploadMediaByUrlRequest = z.infer<typeof UploadMediaByUrlRequestSchema>;
export const UploadMediaByUrlResponseSchema = z.object({
  /** 任务id。可通过此jobid查询结果 */
  jobid: z.string().optional(),
});
export type UploadMediaByUrlResponse = z.infer<typeof UploadMediaByUrlResponseSchema>;

/**
 * 上传图片
 * @see https://developer.work.weixin.qq.com/document/path/90079
 */
export const UploadImageRequestSchema = z.object({
  /** 媒体文件（multipart/form-data中的图片文件） */
  media: z.object({ filename: z.string().min(1).max(256), content_type: z.string().min(1).max(64), size: z.number().min(5).max(2097152) }),
});
export type UploadImageRequest = z.infer<typeof UploadImageRequestSchema>;
export const UploadImageResponseSchema = z.object({
  /** 上传后得到的图片URL。永久有效 */
  url: z.string().min(1).optional(),
});
export type UploadImageResponse = z.infer<typeof UploadImageResponseSchema>;

/**
 * 上传文档图片
 * @see https://developer.work.weixin.qq.com/document/path/99933
 */
export const UploadWedocImageRequestSchema = z.object({
  /** 文档ID，通过新建文档接口创建后获得 */
  docid: z.string(),
  /** base64之后的图片内容 [base64] */
  base64_content: z.string(),
});
export type UploadWedocImageRequest = z.infer<typeof UploadWedocImageRequestSchema>;
export const UploadWedocImageResponseSchema = z.object({
  /** 图片的url */
  url: z.string().optional(),
  /** 图片的高 */
  height: z.number().optional(),
  /** 图片的宽 */
  width: z.number().optional(),
  /** 图片的大小 */
  size: z.number().optional(),
});
export type UploadWedocImageResponse = z.infer<typeof UploadWedocImageResponseSchema>;


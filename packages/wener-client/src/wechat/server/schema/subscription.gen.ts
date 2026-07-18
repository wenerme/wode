// Code generated from WeChat API documentation. DO NOT EDIT.
import { z } from 'zod';

/**
 * 创建卡券接口
 * @see https://developers.weixin.qq.com/doc/subscription/guide/product/card/Create_a_Coupon_Voucher_or_Card.html
 */
export const CreateCardMemberRequestSchema = z.object({
  /** 卡券信息对象 */
  card: z.object({ card_type: z.string(), groupon: z.object({ base_info: z.object({ logo_url: z.string().min(1).max(128), brand_name: z.string().min(1).max(36), code_type: z.string(), title: z.string().min(1).max(24), color: z.string(), notice: z.string().min(1).max(36), service_phone: z.string().min(1).max(30), description: z.string().min(1).max(45), date_info: z.object({ type: z.string(), begin_timestamp: z.number().min(1000000000), end_timestamp: z.number().min(1000000000), begin_relative_days: z.number().min(0), end_relative_days: z.number().min(0) }), sku: z.object({ quantity: z.number().min(1).max(5000000) }), use_limit: z.number().min(1).max(100), get_limit: z.number().min(1).max(3), use_custom_code: z.boolean().default(false), bind_openid: z.boolean().default(false), can_share: z.boolean().default(true), can_give_friend: z.boolean().default(true), location_id_list: z.array(z.number()), center_title: z.string().min(1).max(18), center_sub_title: z.string().min(1).max(18), center_url: z.string().min(1).max(3072), custom_url_name: z.string().min(1).max(18), custom_url: z.string().min(1).max(3072), custom_url_sub_title: z.string().min(1).max(18), promotion_url_name: z.string().min(1).max(18), promotion_url: z.string().min(1).max(3072), source: z.string().min(1).max(18) }), advanced_info: z.object({ use_condition: z.object({ accept_category: z.string().min(1).max(45), reject_category: z.string().min(1).max(45), can_use_with_other_discount: z.boolean().default(true) }), abstract: z.object({ abstract: z.string().min(1).max(30), icon_url_list: z.array(z.string()) }), text_image_list: z.array(z.object({ image_url: z.string().min(1).max(3072), text: z.string().min(1).max(30) })), time_limit: z.array(z.object({ type: z.string(), begin_hour: z.number().min(0).max(23), end_hour: z.number().min(0).max(23), begin_minute: z.number().min(0).max(59), end_minute: z.number().min(0).max(59) })), business_service: z.array(z.string()) }), deal_detail: z.string().min(1).max(9216) }), cash: z.object({ base_info: z.record(z.string(), z.any()), advanced_info: z.record(z.string(), z.any()), least_cost: z.number().min(0).default(0), reduce_cost: z.number().min(1) }), discount: z.object({ base_info: z.record(z.string(), z.any()), advanced_info: z.record(z.string(), z.any()), discount: z.number().min(1).max(99) }), gift: z.object({ base_info: z.record(z.string(), z.any()), advanced_info: z.record(z.string(), z.any()), gift: z.string().min(1).max(9216) }), general_coupon: z.object({ base_info: z.record(z.string(), z.any()), advanced_info: z.record(z.string(), z.any()), default_detail: z.string().min(1).max(9216) }) }),
});
export type CreateCardMemberRequest = z.infer<typeof CreateCardMemberRequestSchema>;
export const CreateCardMemberResponseSchema = z.object({
  /** 卡券ID，创建成功后获取 */
  card_id: z.string().min(1).optional(),
});
export type CreateCardMemberResponse = z.infer<typeof CreateCardMemberResponseSchema>;

/**
 * 创建二维码接口
 * @see https://developers.weixin.qq.com/doc/subscription/guide/product/card/Distributing_Coupons_Vouchers_and_Cards.html
 */
export const CreateCardQrCodeRequestSchema = z.object({
  /** 创建二维码动作名，QR_CARD（单张卡券）或 QR_MULTIPLE_CARD（多张卡券）。 (QR_CARD-单张卡券, QR_MULTIPLE_CARD-多张卡券) */
  action_name: z.string(),
  /** 指定二维码的有效时间，范围是60 ~ 1800秒。不填默认为365天有效（24小时？文档示例为1800，文字描述有歧义，按范围提取）。 */
  expire_seconds: z.number().min(60).max(1800).optional(),
  /** 二维码具体信息对象。 */
  action_info: z.object({ card: z.object({ card_id: z.string().max(32), code: z.string().max(20), openid: z.string().max(32), is_unique_code: z.boolean(), outer_str: z.string().max(128) }), multiple_card: z.object({ card_list: z.array(z.object({ card_id: z.string().max(32), code: z.string().max(20), outer_str: z.string().max(128) })) }) }),
  /** 领取场景值，整型，长度限制为60位数字。默认值为0。 */
  outer_id: z.number().default(0).optional(),
});
export type CreateCardQrCodeRequest = z.infer<typeof CreateCardQrCodeRequestSchema>;
export const CreateCardQrCodeResponseSchema = z.object({
  /** 获取的二维码ticket，凭借此ticket调用换取二维码接口可以在有效时间内换取二维码。 */
  ticket: z.string().optional(),
  /** 二维码有效时间（秒）。 */
  expire_seconds: z.number().optional(),
  /** 二维码图片解析后的地址。 */
  url: z.string().optional(),
  /** 二维码显示地址，点击后跳转二维码页面。 */
  show_qrcode_url: z.string().optional(),
});
export type CreateCardQrCodeResponse = z.infer<typeof CreateCardQrCodeResponseSchema>;

/**
 * 第三方代制模式 - 创建子商户接口
 * @see https://developers.weixin.qq.com/doc/subscription/guide/product/card/Third-party_developer_mode.html
 */
export const CardSubMerchantSubmitRequestSchema = z.object({
  /** 子商户信息结构体 */
  info: z.object({ brand_name: z.string().min(1).max(36), app_id: z.string().min(1).max(36), logo_url: z.string().min(1).max(128), protocol: z.string().min(1).max(36), end_time: z.number().min(0), primary_category_id: z.number().min(1), secondary_category_id: z.number().min(1), agreement_media_id: z.string().min(1).max(36), operator_media_id: z.string().min(1).max(36) }),
});
export type CardSubMerchantSubmitRequest = z.infer<typeof CardSubMerchantSubmitRequestSchema>;
export const CardSubMerchantSubmitResponseSchema = z.object({
  /** 返回的子商户信息 */
  info: z.object({ merchant_id: z.number().min(0), app_id: z.string().min(1).max(36), create_time: z.number().min(0), update_time: z.number().min(0), brand_name: z.string().min(1).max(36), logo_url: z.string().min(1).max(128), status: z.string(), begin_time: z.number().min(0), end_time: z.number().min(0), primary_category_id: z.number().min(1), secondary_category_id: z.number().min(1) }).optional(),
});
export type CardSubMerchantSubmitResponse = z.infer<typeof CardSubMerchantSubmitResponseSchema>;

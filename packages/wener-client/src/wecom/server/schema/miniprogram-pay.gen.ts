// Code generated from WeChat Work API documentation. DO NOT EDIT.
import { z } from 'zod';

/**
 * 关闭订单
 * @see https://developer.work.weixin.qq.com/document/path/97324
 */
export const CloseMiniAppPayOrderRequestSchema = z.object({
  /** 二级商户号，由企业微信生成并下发 */
  mchid: z.string().min(1).max(32),
  /** 商户系统内部订单号，只能是数字、大小写字母_-*且在同一个商户号下唯一 */
  out_trade_no: z.string().min(6).max(32),
});
export type CloseMiniAppPayOrderRequest = z.infer<typeof CloseMiniAppPayOrderRequestSchema>;

/**
 * 小程序下单
 * @see https://developer.work.weixin.qq.com/document/path/97322
 */
export const CreateMiniAppOrderRequestSchema = z.object({
  /** 二级商户申请的公众号或移动应用appid */
  appid: z.string().min(1).max(32),
  /** 二级商户号，由企业微信生成并下发 */
  mchid: z.string().min(1).max(32),
  /** 商户系统内部订单号，只能是数字、大小写字母、_-*|<>*且在该商户号下唯一 */
  out_trade_no: z.string().min(6).max(32),
  /** 商品描述 */
  description: z.string().min(1).max(127),
  /** 用来统计企微成员发出小程序的交易业绩，可从小程序URL获取。若不传入该项，则不做统计 */
  scenekey: z.string().min(1).max(256).optional(),
  /** 订单金额信息 */
  amount: z.object({ total: z.number(), currency: z.string().min(1).max(16) }),
  /** 支付者标识 */
  payer: z.object({ openid: z.string().min(1).max(128) }),
  /** 订单失效时间，遵循rfc3339标准，格式为 yyyy-MM-DDTHH:mm:ss+TIMEZONE [timestamp] */
  time_expire: z.string().min(1).max(64).optional(),
  /** 附加数据，在查单和支付通知中原样返回 */
  attach: z.string().min(1).max(128).optional(),
  /** 订单优惠标记 */
  goods_tag: z.string().min(1).max(32).optional(),
  /** 商品明细信息 */
  detail: z.object({ cost_price: z.number(), invoice_id: z.string().min(1).max(32), goods_detail: z.array(z.object({ merchant_goods_id: z.string().min(1).max(32), wechatpay_goods_id: z.string().min(1).max(32), goods_name: z.string().min(1).max(256), quantity: z.number(), unit_price: z.number() })) }).optional(),
  /** 场景信息 */
  scene_info: z.object({ payer_client_ip: z.string().min(1).max(45), device_id: z.string().min(1).max(32), store_info: z.object({ id: z.string().min(1).max(32), name: z.string().min(1).max(256), area_code: z.string().min(1).max(32), address: z.string().min(1).max(512) }) }).optional(),
});
export type CreateMiniAppOrderRequest = z.infer<typeof CreateMiniAppOrderRequestSchema>;
export const CreateMiniAppOrderResponseSchema = z.object({
  /** 预支付交易会话标识。用于后续接口调用中使用，该值有效期为2小时 */
  prepay_id: z.string().min(1).max(64).optional(),
});
export type CreateMiniAppOrderResponse = z.infer<typeof CreateMiniAppOrderResponseSchema>;

/**
 * 查询订单
 * @see https://developer.work.weixin.qq.com/document/path/97323
 */
export const GetOrderRequestSchema = z.object({
  /** 二级商户号，由企业微信生成并下发 */
  mchid: z.string().min(1).max(32),
  /** 商户系统内部订单号，只能是数字、大小写字母_-*且在同一个商户号下唯一 */
  out_trade_no: z.string().min(6).max(32),
});
export type GetOrderRequest = z.infer<typeof GetOrderRequestSchema>;
export const GetOrderResponseSchema = z.object({
  /** 二级商户号 */
  mchid: z.string().min(1).max(32).optional(),
  /** 商户系统内部订单号 */
  out_trade_no: z.string().min(6).max(32).optional(),
  /** 交易状态 (SUCCESS-支付成功, REFUND-转入退款, NOTPAY-未支付, CLOSED-已关闭, REVOKE...) */
  trade_state: z.string().optional(),
  /** 交易状态描述 */
  trade_state_desc: z.string().min(1).max(256).optional(),
  /** 支付者标识 */
  payer: z.object({ openid: z.string().min(1).max(128) }).optional(),
  /** 微信支付系统生成的订单号 */
  transaction_id: z.string().min(1).max(32).optional(),
  /** 银行类型 */
  bank_type: z.string().min(1).max(32).optional(),
  /** 附加数据 */
  attach: z.string().min(1).max(128).optional(),
  /** 支付完成时间 [rfc3339] */
  success_time: z.string().min(1).max(64).optional(),
  /** 金额信息 */
  amount: z.object({ total: z.number(), payer_total: z.number(), currency: z.string(), payer_currency: z.string().min(1).max(16) }).optional(),
  /** 商户端设备号 */
  scene_info: z.object({ total: z.string().min(1).max(32) }).optional(),
  /** 优惠信息 */
  promotion_detail: z.object({ coupon_id: z.string().min(1).max(32), name: z.string().min(1).max(64), scope: z.string(), type: z.string(), amount: z.number(), stock_id: z.string().min(1).max(32), wechatpay_contribute: z.number(), merchant_contribute: z.number(), other_contribute: z.number(), currency: z.string(), goods_detail: z.array(z.object({ goods_id: z.string().min(1).max(32), quantity: z.number(), unit_price: z.number(), discount_amount: z.number(), goods_remark: z.string().min(1).max(128) })) }).optional(),
});
export type GetOrderResponse = z.infer<typeof GetOrderResponseSchema>;

/**
 * 查询退款
 * @see https://developer.work.weixin.qq.com/document/path/97352
 */
export const GetRefundDetailRequestSchema = z.object({
  /** 企业微信分配的商户号 */
  mchid: z.string().min(1).max(32),
  /** 商户系统内部的退款单号 */
  out_refund_no: z.string().min(1).max(64),
});
export type GetRefundDetailRequest = z.infer<typeof GetRefundDetailRequestSchema>;
export const GetRefundDetailResponseSchema = z.object({
  /** 微信支付退款订单号 */
  refund_id: z.string().optional(),
  /** 商户系统内部的退款单号 */
  out_refund_no: z.string().optional(),
  /** 微信支付交易订单号 */
  transaction_id: z.string().optional(),
  /** 返回的原交易订单号 */
  out_trade_no: z.string().optional(),
  /** 退款渠道 (ORIGINAL-原路退款, BALANCE-退回到余额) */
  channel: z.string().optional(),
  /** 退款入账方 */
  user_received_account: z.string().optional(),
  /** 退款成功时间 [rfc3339] */
  success_time: z.string().optional(),
  /** 退款受理时间 [rfc3339] */
  create_time: z.string().optional(),
  /** 退款状态 (SUCCESS-退款成功, CLOSE-退款关闭, PROCESSING-退款处理中, ABNORMAL-退款异常) */
  status: z.string().optional(),
  /** 订单退款金额信息 */
  amount: z.record(z.string(), z.any()).optional(),
  /** 优惠退款信息 */
  promotion_detail: z.array(z.record(z.string(), z.any())).optional(),
});
export type GetRefundDetailResponse = z.infer<typeof GetRefundDetailResponseSchema>;

/**
 * 获取支付签名
 * @see https://developer.work.weixin.qq.com/document/path/98130
 */
export const GetMiniAppPaySignRequestSchema = z.object({
  /** 二级商户申请的公众号或移动应用appid。 */
  appid: z.string().min(1).max(32),
  /** 小程序下单接口返回的prepay_id参数值.仅支持下单两小时内的prepay_id */
  prepay_id: z.string().min(1).max(128),
  /** 签名类型，默认为RSA，仅支持RSA。 (RSA-RSA) */
  sign_type: z.string().optional(),
  /** 随机字符串，不长于32位，内容仅支持数字、大小写字母。 */
  nonce: z.string().min(1).max(32),
  /** 当前的秒级时间戳 [timestamp] */
  timestamp: z.number(),
});
export type GetMiniAppPaySignRequest = z.infer<typeof GetMiniAppPaySignRequestSchema>;
export const GetMiniAppPaySignResponseSchema = z.object({
  /** 签名，使用字段appid、timestamp、nonce、prepay_id计算得出的签名值 */
  pay_sign: z.string().min(1).max(512).optional(),
});
export type GetMiniAppPaySignResponse = z.infer<typeof GetMiniAppPaySignResponseSchema>;


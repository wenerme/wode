// Code generated from WeChat Work API documentation. DO NOT EDIT.
import { z } from 'zod';

/**
 * 获取对外收款记录
 * @see https://developer.work.weixin.qq.com/document/path/93667
 */
export const ListExternalPayBillRequestSchema = z.object({
  /** 收款记录开始时间戳，单位为秒 [timestamp] */
  begin_time: z.number(),
  /** 收款记录结束时间戳，单位为秒 [timestamp] */
  end_time: z.number(),
  /** 企业收款成员userid，不填则为全部成员 */
  payee_userid: z.string().min(1).max(64).optional(),
  /** 用于分页查询的游标，字符串类型，由上一次调用返回，首次调用可不填 */
  cursor: z.string().min(1).max(64).optional(),
  /** 返回的最大记录数，整型，最大值1000 */
  limit: z.number().min(1).max(1000).optional(),
});
export type ListExternalPayBillRequest = z.infer<typeof ListExternalPayBillRequestSchema>;
export const ListExternalPayBillResponseSchema = z.object({
  /** 分页游标，在下次请求时填写以获取之后分页的记录，如果已经没有更多的数据则不返回该字段 */
  next_cursor: z.string().optional(),
  /** 交易单详情列表 */
  bill_list: z.array(z.object({ transaction_id: z.string(), bill_type: z.number(), trade_state: z.number(), pay_time: z.number(), out_trade_no: z.string(), out_refund_no: z.string(), external_userid: z.string(), total_fee: z.number(), payee_userid: z.string(), payment_type: z.number(), mch_id: z.string(), remark: z.string(), commodity_list: z.array(z.object({ description: z.string(), amount: z.number() })), total_refund_fee: z.number(), refund_list: z.array(z.object({ out_refund_no: z.string(), refund_userid: z.string(), refund_comment: z.string(), refund_reqtime: z.number(), refund_status: z.number(), refund_fee: z.number() })), contact_info: z.object({ name: z.string(), phone: z.string(), address: z.string() }), miniprogram_info: z.object({ appid: z.string(), name: z.string() }) })).optional(),
});
export type ListExternalPayBillResponse = z.infer<typeof ListExternalPayBillResponseSchema>;

/**
 * 获取资金流水
 * @see https://developer.work.weixin.qq.com/document/path/98100
 */
export const GetFundFlowRequestSchema = z.object({
  /** 资金流水记录开始时间 [timestamp] */
  begin_time: z.number(),
  /** 资金流水记录结束时间 [timestamp] */
  end_time: z.number(),
  /** 商户号ID，若不填写则拉取所有商户号的资金流水 */
  mch_id: z.string().min(0).optional(),
  /** 用于分页查询的游标，字符串类型，由上一次调用返回，首次调用可不填 */
  cursor: z.string().min(0).optional(),
  /** 返回的最大记录数，默认值100，最大不超过200 */
  limit: z.number().min(1).max(200).default(100).optional(),
});
export type GetFundFlowRequest = z.infer<typeof GetFundFlowRequestSchema>;
export const GetFundFlowResponseSchema = z.object({
  /** 分页游标，在下次请求时填写以获取之后分页的记录，如果已经没有更多的数据则不返回该字段 */
  next_cursor: z.string().optional(),
  /** 资金流水记录列表 */
  fund_flow_list: z.array(z.object({ timestamp: z.number(), request_no: z.string(), transaction_type: z.number(), fund_flow_type: z.number(), transaction_amount: z.number(), account_balance: z.number(), out_trade_no: z.string(), mch_id: z.string(), operator_userid: z.string(), group_list: z.array(z.object({ group_name: z.string() })), remark: z.string() })).optional(),
});
export type GetFundFlowResponse = z.infer<typeof GetFundFlowResponseSchema>;

/**
 * 获取收款项目的商户单号
 * @see https://developer.work.weixin.qq.com/document/path/96076
 */
export const GetPaymentInfoRequestSchema = z.object({
  /** 收款项目单号。在发起对外收款中返回 */
  payment_id: z.string().min(1),
});
export type GetPaymentInfoRequest = z.infer<typeof GetPaymentInfoRequestSchema>;
export const GetPaymentInfoResponseSchema = z.object({
  /** 收款单号列表。每笔支付对应一个收款单号 */
  out_trade_no_list: z.array(z.string()).optional(),
});
export type GetPaymentInfoResponse = z.infer<typeof GetPaymentInfoResponseSchema>;

/**
 * 查询商户号详情
 * @see https://developer.work.weixin.qq.com/document/path/93666
 */
export const GetMerchantDetailRequestSchema = z.object({
  /** 微信支付商户号 */
  mch_id: z.string().max(32),
});
export type GetMerchantDetailRequest = z.infer<typeof GetMerchantDetailRequestSchema>;
export const GetMerchantDetailResponseSchema = z.object({
  /** 微信支付商户号 */
  mch_id: z.string().max(32).optional(),
  /** 微信支付商户号全称 */
  merchant_name: z.string().max(50).optional(),
  /** 商户号绑定状态。1:申请中 2:已绑定 3:已撤销 (1-申请中, 2-已绑定, 3-已撤销) */
  bind_status: z.number().optional(),
  /** 该商户号使用范围，仅当商户号已绑定时才返回 */
  allow_use_scope: z.object({ user: z.array(z.string()), partyid: z.array(z.number()), tagid: z.array(z.number()) }).optional(),
});
export type GetMerchantDetailResponse = z.infer<typeof GetMerchantDetailResponseSchema>;

/**
 * 提交创建对外收款账户的申请单
 * @see https://developer.work.weixin.qq.com/document/path/99106
 */
export const ApplyMchRequestSchema = z.object({
  /** 业务申请编号 */
  out_request_no: z.string().min(1).max(32),
  /** 主体类型 (0-企业, 1-个体, 2-社会团体组织, 3-事业单位) */
  organization_type: z.number(),
  /** 营业执照/登记证书信息 */
  business_license_info: z.object({ cert_type: z.number(), business_license_copy_open_wx_pay_media_id: z.string().min(1).max(64), business_license_number: z.string().min(15).max(18), merchant_name: z.string().min(2).max(128), legal_person: z.string().min(2).max(100), company_address: z.string().min(4).max(128), business_time_begin_time: z.string().min(10).max(10), business_time_end_time: z.string().min(10).max(10) }),
  /** 金融机构许可证信息 */
  finance_institution_info: z.object({ finance_type: z.string(), finance_license_pics_open_wx_pay_media_id: z.array(z.string()) }).optional(),
  /** 商户简称 */
  merchant_short_name: z.string().min(1).max(21),
  /** 经营者/法人证件信息 */
  id_card_info: z.object({ id_card_copy_open_wx_pay_media_id: z.string().min(1).max(64), id_card_national_open_wx_pay_media_id: z.string().min(1).max(64), id_card_name: z.string().min(2).max(100), id_card_number: z.string().min(4).max(17), id_card_address: z.string().min(4).max(128), id_card_valid_time_begin: z.string().min(10).max(10), id_card_valid_time: z.string().min(10).max(10), id_doc_type: z.number() }),
  /** 经营者/法人是否为受益人 (true-是, false-否) */
  owner: z.boolean().optional(),
  /** 受益人证件信息 */
  ubo_info: z.object({ id_card_copy_open_wx_pay_media_id: z.string().min(1).max(64), id_card_national_open_wx_pay_media_id: z.string().min(1).max(64), id_card_name: z.string().min(2).max(100), id_card_number: z.string().min(4).max(17), id_card_address: z.string().min(4).max(128), id_card_valid_time_begin: z.string().min(10).max(10), id_card_valid_time: z.string().min(10).max(10), id_doc_type: z.number() }).optional(),
  /** 超级管理员信息 */
  contact_info: z.object({ contact_type: z.string(), contact_info: z.object({ id_card_copy_open_wx_pay_media_id: z.string().min(1).max(64), id_card_national_open_wx_pay_media_id: z.string().min(1).max(64), id_card_name: z.string().min(2).max(100), id_card_number: z.string().min(4).max(17), id_card_valid_time_begin: z.string().min(10).max(10), id_card_valid_time: z.string().min(10).max(10), id_doc_type: z.number() }), business_authorization_letter_open_wx_pay_media_id: z.string().min(1).max(64), mobile_phone: z.string().min(11).max(20), contact_email: z.string().min(1).max(64) }),
  /** 结算账户信息 */
  account_info: z.object({ bank_account_type: z.number(), account_bank: z.string().min(1).max(64), account_name: z.string().min(1).max(64), bank_address_code: z.string().min(1).max(64), bank_name: z.string().min(1).max(64), account_number: z.string().min(1).max(64), bank_card_supplement: z.object({ settlement_certificate_open_wx_pay_media_id: z.string().min(1).max(64), relationship_certificate_open_wx_pay_media_id: z.string().min(1).max(64), other_certificate_open_wx_pay_media_id: z.array(z.string()) }) }),
  /** 经营场景证明 */
  sales_scene_info: z.object({ type: z.number(), store_url: z.string().min(1).max(256), store_pic_open_wx_pay_media_id: z.string().min(1).max(64), address_code: z.string().min(1).max(64), offline_address: z.string().min(1).max(256), entrance_pic_open_wx_pay_media_id: z.string().min(1).max(64), indoor_pic_open_wx_pay_media_id: z.string().min(1).max(64) }),
  /** 经营范围 */
  business_id: z.number().min(1).max(100),
  /** 特殊资质 */
  qualifications: z.object({ id: z.array(z.string()) }).optional(),
  /** 补充材料 */
  business_addition_pics: z.object({ id: z.array(z.string()) }).optional(),
  /** 提现人员 */
  userid: z.string().min(1).max(64),
});
export type ApplyMchRequest = z.infer<typeof ApplyMchRequestSchema>;

/**
 * 查询申请单状态
 * @see https://developer.work.weixin.qq.com/document/path/98974
 */
export const GetApplymentStatusRequestSchema = z.object({
  /** 业务申请编号，长度限制为1~32个字符 */
  out_request_no: z.string().min(1).max(32),
});
export type GetApplymentStatusRequest = z.infer<typeof GetApplymentStatusRequestSchema>;
export const GetApplymentStatusResponseSchema = z.object({
  /** 申请单的具体状态 */
  status: z.object({ applyment_state: z.string(), applyment_state_desc: z.string(), sign_state: z.string(), sign_url: z.string(), sub_mchid: z.string(), audit_detail: z.array(z.object({ param_name: z.string(), reject_reason: z.string() })), account_validation: z.object({ account_name: z.string(), account_no: z.string(), pay_amount: z.number(), destination_account_number: z.string(), destination_account_name: z.string(), destination_account_bank: z.string(), city: z.string(), remark: z.string(), deadline: z.string() }), legal_validation_url: z.string() }).optional(),
  /** 申请单当前所处阶段 (0-初始状态, 1-申请中, 2-绑定成功, 3-已撤销申请, 4-绑定失败, 5-未申请, 6-待法人验证) */
  apply_state: z.number().optional(),
  /** 当前签约阶段 (0-不可签约, 1-未签约, 2-已签约) */
  real_sign_state: z.number().optional(),
  /** 驳回理由 */
  reject_reason: z.string().optional(),
});
export type GetApplymentStatusResponse = z.infer<typeof GetApplymentStatusResponseSchema>;

/**
 * 提交图片
 * @see https://developer.work.weixin.qq.com/document/path/98972
 */
export const UploadMiniAppImageRequestSchema = z.object({
  /** 媒体文件，multipart/form-data上传 */
  media: z.object({ filename: z.string(), content_type: z.string(), size: z.number().min(5).max(2097152) }),
});
export type UploadMiniAppImageRequest = z.infer<typeof UploadMiniAppImageRequestSchema>;
export const UploadMiniAppImageResponseSchema = z.object({
  /** 上传后得到的图片id，30天后过期 */
  open_wx_pay_media_id: z.string().optional(),
});
export type UploadMiniAppImageResponse = z.infer<typeof UploadMiniAppImageResponseSchema>;

/**
 * 向员工付款
 * @see https://developer.work.weixin.qq.com/document/path/90097
 */
export const PayEmployeeRequestSchema = z.object({
  /** 微信分配的公众账号ID（企业微信corpid） */
  appid: z.string().min(1).max(128),
  /** 微信支付分配的商户号 */
  mch_id: z.string().min(1).max(32),
  /** 微信支付分配的终端设备号 */
  device_info: z.string().min(1).max(32).optional(),
  /** 随机字符串，不长于32位 */
  nonce_str: z.string().min(1).max(32),
  /** 微信支付签名 */
  sign: z.string().min(1).max(32),
  /** 商户订单号，需保持唯一性（只能是字母或者数字） */
  partner_trade_no: z.string().min(1).max(32),
  /** 商户appid下，某用户的openid */
  openid: z.string().min(1).max(64),
  /** 校验用户姓名选项 (NO_CHECK-不校验真实姓名, FORCE_CHECK-强校验真实姓名) */
  check_name: z.string(),
  /** 收款用户真实姓名。如果check_name设置为FORCE_CHECK，则必填 */
  re_user_name: z.string().min(1).max(64).optional(),
  /** 企业微信企业付款金额，单位为分。单笔最小金额默认为1元（100分） */
  amount: z.number().min(100),
  /** 向员工付款说明信息 */
  desc: z.string().min(1).max(81),
  /** 调用接口的机器Ip地址 */
  spbill_create_ip: z.string().min(1).max(32),
  /** 企业微信签名（使用agentid对应的自建应用secret计算） */
  workwx_sign: z.string().min(1).max(128),
  /** 付款消息类型 (NORMAL_MSG-普通付款消息, APPROVAL_MSG-审批付款消息) */
  ww_msg_type: z.string(),
  /** 审批单号。ww_msg_type为APPROVAL_MSG时必填 */
  approval_number: z.string().min(1).optional(),
  /** 审批类型。ww_msg_type为APPROVAL_MSG时必填，值为1 (1-审批类型) */
  approval_type: z.number().optional(),
  /** 项目名称，最长50个utf8字符 */
  act_name: z.string().min(1).max(50),
  /** 付款的应用id，以企业应用的名义付款 */
  agentid: z.number().min(1).optional(),
});
export type PayEmployeeRequest = z.infer<typeof PayEmployeeRequestSchema>;
export const PayEmployeeResponseSchema = z.object({
  /** 返回状态码（SUCCESS/FAIL） (SUCCESS-成功, FAIL-失败) */
  return_code: z.string().optional(),
  /** 返回信息，如非空，为错误原因 */
  return_msg: z.string().min(1).max(128).optional(),
  /** 微信分配的公众账号ID */
  appid: z.string().min(1).max(128).optional(),
  /** 微信支付分配的商户号 */
  mch_id: z.string().min(1).max(32).optional(),
  /** 终端设备号 */
  device_info: z.string().min(1).max(32).optional(),
  /** 随机字符串 */
  nonce_str: z.string().min(1).max(32).optional(),
  /** 业务结果（SUCCESS/FAIL） (SUCCESS-成功, FAIL-失败) */
  result_code: z.string().optional(),
  /** 错误码信息 */
  err_code: z.string().min(1).max(32).optional(),
  /** 错误码描述 */
  err_code_des: z.string().min(1).max(128).optional(),
  /** 商户订单号 */
  partner_trade_no: z.string().min(1).max(32).optional(),
  /** 微信订单号 */
  payment_no: z.string().min(1).max(64).optional(),
  /** 微信支付成功时间 [timestamp] */
  payment_time: z.string().min(1).max(32).optional(),
});
export type PayEmployeeResponse = z.infer<typeof PayEmployeeResponseSchema>;

/**
 * 查询付款记录
 * @see https://developer.work.weixin.qq.com/document/path/90098
 */
export const QueryWxPaymentRecordRequestSchema = z.object({
  /** 随机字符串，不长于32位 */
  nonce_str: z.string().max(32),
  /** 微信支付签名，参见签名算法 */
  sign: z.string().max(32),
  /** 商户调用企业微信企业付款API时使用的商户订单号 */
  partner_trade_no: z.string().max(28),
  /** 微信支付分配的商户号 */
  mch_id: z.string().max(32),
  /** 商户号的appid */
  appid: z.string().max(128),
});
export type QueryWxPaymentRecordRequest = z.infer<typeof QueryWxPaymentRecordRequestSchema>;
export const QueryWxPaymentRecordResponseSchema = z.object({
  /** 返回状态码，SUCCESS/FAIL (SUCCESS-成功, FAIL-失败) */
  return_code: z.string().optional(),
  /** 返回信息，如非空，为错误原因 */
  return_msg: z.string().max(128).optional(),
  /** 业务结果，SUCCESS/FAIL (SUCCESS-成功, FAIL-失败) */
  result_code: z.string().optional(),
  /** 错误代码信息 */
  err_code: z.string().max(32).optional(),
  /** 错误代码描述信息 */
  err_code_des: z.string().max(128).optional(),
  /** 付款详情对象（仅在return_code和result_code均为SUCCESS时返回） */
  detail: z.object({ partner_trade_no: z.string().max(32), mch_id: z.string().max(32), detail_id: z.string().max(64), status: z.string(), reason: z.string().max(128), openid: z.string().max(64), transfer_name: z.string().max(64), payment_amount: z.number(), transfer_time: z.string().max(32), desc: z.string().max(100) }).optional(),
});
export type QueryWxPaymentRecordResponse = z.infer<typeof QueryWxPaymentRecordResponseSchema>;

/**
 * 查询红包记录
 * @see https://developer.work.weixin.qq.com/document/path/90095
 */
export const QueryWorkWxRedpackRequestSchema = z.object({
  /** 随机字符串 */
  nonce_str: z.string().max(32),
  /** 微信支付签名 */
  sign: z.string().max(32),
  /** 商户订单号 */
  mch_billno: z.string().max(28),
  /** 商户号 */
  mch_id: z.string().max(32),
  /** Appid */
  appid: z.string().max(32),
});
export type QueryWorkWxRedpackRequest = z.infer<typeof QueryWorkWxRedpackRequestSchema>;
export const QueryWorkWxRedpackResponseSchema = z.object({
  /** 返回状态码 (SUCCESS-成功, FAIL-失败) */
  return_code: z.string().optional(),
  /** 返回信息 */
  return_msg: z.string().max(128).optional(),
  /** 微信支付签名 */
  sign: z.string().max(32).optional(),
  /** 业务结果 (SUCCESS-成功, FAIL-失败) */
  result_code: z.string().optional(),
  /** 错误代码 (SYSTEMERROR-系统错误) */
  err_code: z.string().optional(),
  /** 错误代码描述 */
  err_code_des: z.string().max(128).optional(),
  /** 商户订单号 */
  mch_billno: z.string().max(28).optional(),
  /** 商户号 */
  mch_id: z.string().max(32).optional(),
  /** 红包单号 */
  detail_id: z.string().max(32).optional(),
  /** 红包状态 (SENDING-发放中, SENT-已发放待领取, FAILED-发放失败, RECEIVED-已领取, RFUN...) */
  status: z.string().optional(),
  /** 发放类型 (API-通过API接口发放) */
  send_type: z.string().optional(),
  /** 红包总金额（单位分） */
  total_amount: z.number().optional(),
  /** 失败原因 */
  reason: z.string().max(32).optional(),
  /** 红包发送时间 */
  send_time: z.string().max(32).optional(),
  /** 红包退款时间 */
  refund_time: z.string().max(32).optional(),
  /** 红包退款金额 */
  refund_amount: z.number().optional(),
  /** 祝福语 */
  wishing: z.string().max(128).optional(),
  /** 活动描述 */
  remark: z.string().max(256).optional(),
  /** 活动名称 */
  act_name: z.string().max(32).optional(),
  /** 领取红包的Openid */
  openid: z.string().max(32).optional(),
  /** 领取金额 */
  amount: z.number().optional(),
  /** 接收时间 */
  rcv_time: z.string().max(32).optional(),
  /** 发送者名称 */
  sender_name: z.string().max(128).optional(),
  /** 发送者头像 */
  sender_header_media_id: z.string().max(128).optional(),
});
export type QueryWorkWxRedpackResponse = z.infer<typeof QueryWorkWxRedpackResponseSchema>;

/**
 * 发放企业红包
 * @see https://developer.work.weixin.qq.com/document/path/90094
 */
export const SendWorkWxRedPacketRequestSchema = z.object({
  /** 随机字符串，不长于32位 */
  nonce_str: z.string().max(32),
  /** 微信支付签名 */
  sign: z.string().max(32),
  /** 商户订单号，每个订单号必须唯一 */
  mch_billno: z.string().max(28),
  /** 微信支付分配的商户号 */
  mch_id: z.string().max(32),
  /** 微信分配的公众账号ID（企业微信corpid） */
  wxappid: z.string().max(32),
  /** 以个人名义发红包，红包发送者名称（与agentid互斥） */
  sender_name: z.string().max(128).optional(),
  /** 以企业应用的名义发红包，企业应用id（与sender_name互斥） */
  agentid: z.number().optional(),
  /** 发送者头像素材id */
  sender_header_media_id: z.string().max(128).optional(),
  /** 接受红包的用户openid */
  re_openid: z.string().max(32),
  /** 金额，单位分，单笔最小金额默认为1元 */
  total_amount: z.number().min(100),
  /** 红包祝福语 */
  wishing: z.string().max(128),
  /** 项目名称 */
  act_name: z.string().max(32),
  /** 备注信息 */
  remark: z.string().max(256),
  /** 发放红包使用场景，金额大于200或小于1元时必传 (PRODUCT_1-商品促销, PRODUCT_2-抽奖, PRODUCT_3-虚拟物品兑奖, PRODUCT_4...) */
  scene_id: z.string().optional(),
  /** 企业微信签名 */
  workwx_sign: z.string().max(32),
});
export type SendWorkWxRedPacketRequest = z.infer<typeof SendWorkWxRedPacketRequestSchema>;
export const SendWorkWxRedPacketResponseSchema = z.object({
  /** 返回状态码：SUCCESS/FAIL */
  return_code: z.string().optional(),
  /** 返回信息，如非空为错误原因 */
  return_msg: z.string().optional(),
  /** 微信支付签名 */
  sign: z.string().optional(),
  /** 业务结果：SUCCESS/FAIL */
  result_code: z.string().optional(),
  /** 错误码信息 */
  err_code: z.string().optional(),
  /** 错误代码描述 */
  err_code_des: z.string().optional(),
  /** 商户订单号 */
  mch_billno: z.string().optional(),
  /** 商户号 */
  mch_id: z.string().optional(),
  /** 公众账号appid */
  wxappid: z.string().optional(),
  /** 用户openid */
  re_openid: z.string().optional(),
  /** 付款金额，单位分 */
  total_amount: z.number().optional(),
  /** 红包订单的微信单号 */
  send_listid: z.string().optional(),
  /** 红包发送者名称 */
  sender_name: z.string().optional(),
  /** 发送者头像素材id */
  sender_header_media_id: z.string().optional(),
});
export type SendWorkWxRedPacketResponse = z.infer<typeof SendWorkWxRedPacketResponseSchema>;


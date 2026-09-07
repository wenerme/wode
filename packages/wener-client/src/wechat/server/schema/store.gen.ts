// Code generated from WeChat API documentation. DO NOT EDIT.
import { z } from 'zod';

/**
 * 网络通信检测
 * @see https://developers.weixin.qq.com/doc/store/shop/API/apimgnt/api_callbackcheck.html
 */
export const CallbackCheckRequestSchema = z.object({
  /** 检测动作：dns(域名解析)/ping(ping检测)/all(全部) (dns-dns, ping-ping, all-all) */
  action: z.string(),
  /** 检测运营商：CHINANET(电信)/UNICOM(联通)/CAP(腾讯)/DEFAULT(自动) (CHINANET-电信, UNICOM-联通, CAP-腾讯, DEFAULT-自动) */
  check_operator: z.string(),
});
export type CallbackCheckRequest = z.infer<typeof CallbackCheckRequestSchema>;
export const CallbackCheckResponseSchema = z.object({
  /** DNS解析结果列表 */
  dns: z.array(z.object({ ip: z.string(), real_operator: z.string() })).optional(),
  /** PING检测结果列表 */
  ping: z.array(z.object({ ip: z.string(), from_operator: z.string(), package_loss: z.string(), time: z.string() })).optional(),
});
export type CallbackCheckResponse = z.infer<typeof CallbackCheckResponseSchema>;

/**
 * 重置API调用次数
 * @see https://developers.weixin.qq.com/doc/store/shop/API/apimgnt/api_clearquota.html
 */
export const ClearQuotaRequestSchema = z.object({
  /** 要被清空的账号的appid */
  appid: z.string(),
});
export type ClearQuotaRequest = z.infer<typeof ClearQuotaRequestSchema>;

/**
 * 使用AppSecret重置API调用次数
 * @see https://developers.weixin.qq.com/doc/store/shop/API/apimgnt/api_clearquotabyappsecret.html
 */
export const ClearQuotaByAppSecretRequestSchema = z.object({
  /** 要被清空的账号的appid */
  appid: z.string(),
  /** 唯一凭证密钥，即 AppSecret */
  appsecret: z.string(),
});
export type ClearQuotaByAppSecretRequest = z.infer<typeof ClearQuotaByAppSecretRequestSchema>;

export const GetApiDomainIpResponseSchema = z.object({
  /** 微信服务器IP地址列表 */
  ip_list: z.array(z.string()).optional(),
});
export type GetApiDomainIpResponse = z.infer<typeof GetApiDomainIpResponseSchema>;

export const GetCallbackIpResponseSchema = z.object({
  /** 微信服务器IP地址列表 */
  ip_list: z.array(z.string()).optional(),
});
export type GetCallbackIpResponse = z.infer<typeof GetCallbackIpResponseSchema>;

/**
 * 重置指定API调用次数
 * @see https://developers.weixin.qq.com/doc/store/shop/API/apimgnt/api_clearapiquota.html
 */
export const ClearApiQuotaRequestSchema = z.object({
  /** api 的请求地址，必须以"/channels/ec/"开头，不要前缀https://api.weixin.qq.com，也不要漏了/ */
  cgi_path: z.string().min(1),
});
export type ClearApiQuotaRequest = z.infer<typeof ClearApiQuotaRequestSchema>;

/**
 * 查询API调用额度
 * @see https://developers.weixin.qq.com/doc/store/shop/API/apimgnt/api_getapiquota.html
 */
export const GetApiQuotaRequestSchema = z.object({
  /** api的请求地址，例如"/cgi-bin/message/custom/send";不要前缀“https://api.weixin.qq.com”，也不要漏了" */
  cgi_path: z.string().min(1),
});
export type GetApiQuotaRequest = z.infer<typeof GetApiQuotaRequestSchema>;
export const GetApiQuotaResponseSchema = z.object({
  /** quota详情 */
  quota: z.object({ daily_limit: z.number(), used: z.number(), remain: z.number() }).optional(),
  /** 普通调用频率限制 */
  rate_limit: z.object({ call_count: z.number(), refresh_second: z.number() }).optional(),
  /** 代调用频率限制 */
  component_rate_limit: z.object({ call_count: z.number(), refresh_second: z.number() }).optional(),
});
export type GetApiQuotaResponse = z.infer<typeof GetApiQuotaResponseSchema>;

/**
 * 查询rid信息
 * @see https://developers.weixin.qq.com/doc/store/shop/API/apimgnt/api_getridinfo.html
 */
export const GetRidInfoRequestSchema = z.object({
  /** 调用接口报错返回的rid */
  rid: z.string(),
});
export type GetRidInfoRequest = z.infer<typeof GetRidInfoRequestSchema>;
export const GetRidInfoResponseSchema = z.object({
  /** 该rid对应的请求详情 */
  request: z.object({ invoke_time: z.number(), cost_in_ms: z.number(), request_url: z.string(), request_body: z.string(), response_body: z.string(), client_ip: z.string() }).optional(),
});
export type GetRidInfoResponse = z.infer<typeof GetRidInfoResponseSchema>;

/**
 * 获取稳定版接口调用凭据
 * @see https://developers.weixin.qq.com/doc/store/shop/API/apimgnt/api_getstableaccesstoken.html
 */
export const GetStableAccessTokenRequestSchema = z.object({
  /** 填写 client_credential (client_credential-client_credential) */
  grant_type: z.string(),
  /** 账号的唯一凭证，即 AppID */
  appid: z.string(),
  /** 唯一凭证密钥，即 AppSecret */
  secret: z.string(),
  /** 默认使用 false。false 时为普通调用模式，access_token 有效期内重复调用该接口不会更新 access_token；true 时为强制刷新模 (false-普通模式, true-强制刷新模式) */
  force_refresh: z.boolean().optional(),
});
export type GetStableAccessTokenRequest = z.infer<typeof GetStableAccessTokenRequestSchema>;
export const GetStableAccessTokenResponseSchema = z.object({
  /** 获取到的凭证 */
  access_token: z.string().optional(),
  /** 凭证有效时间，单位：秒。目前是7200秒之内的值 */
  expires_in: z.number().min(0).max(7200).optional(),
});
export type GetStableAccessTokenResponse = z.infer<typeof GetStableAccessTokenResponseSchema>;

/**
 * 获取接口调用凭据
 * @see https://developers.weixin.qq.com/doc/store/shop/API/apimgnt/api_getaccesstoken.html
 */
export const GetAccessTokenRequestSchema = z.object({
  /** 填写 client_credential */
  grant_type: z.string(),
  /** 账号的唯一凭证，即 AppID */
  appid: z.string(),
  /** 唯一凭证密钥，即 AppSecret */
  secret: z.string(),
});
export type GetAccessTokenRequest = z.infer<typeof GetAccessTokenRequestSchema>;
export const GetAccessTokenResponseSchema = z.object({
  /** 获取到的凭证 */
  access_token: z.string().optional(),
  /** 凭证有效时间，单位：秒。目前是7200秒之内的值 */
  expires_in: z.number().max(7200).optional(),
});
export type GetAccessTokenResponse = z.infer<typeof GetAccessTokenResponseSchema>;

/**
 * 同意售后
 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-aftersale/api_acceptapply.html
 */
export const AcceptapplyRequestSchema = z.object({
  /** 售后单号 */
  after_sale_order_id: z.string(),
  /** 同意退货时传入地址id，否则后续接口在处理缺少地址信息的请求时将报错 */
  address_id: z.string().optional(),
  /** 同意类型：1用于退货退款或者换货场景表示同意退货，不能使用在仅退款或者收到货同意退款场景; 2用于收到货或者仅退款场景表示同意退款，不能使用在换货或者同意用户退 (1-同意退货, 2-同意退款) */
  accept_type: z.number().optional(),
});
export type AcceptapplyRequest = z.infer<typeof AcceptapplyRequestSchema>;

/**
 * 换货发货
 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-aftersale/api_acceptexchangereship.html
 */
export const AcceptexchangereshipRequestSchema = z.object({
  /** 售后单号 */
  after_sale_order_id: z.string(),
  /** 快递单号 */
  waybill_id: z.string(),
  /** 快递公司id，通过获取快递公司列表接口获得，非主流快递公司可以填OTHER */
  delivery_id: z.string(),
});
export type AcceptexchangereshipRequest = z.infer<typeof AcceptexchangereshipRequestSchema>;

/**
 * 商家补充纠纷单留言
 * @see https://developers.weixin.qq.com/doc/store/shop/API/complaint/api_addcomplaintmaterial.html
 */
export const AddcomplaintmaterialRequestSchema = z.object({
  /** 纠纷单号 */
  complaint_id: z.string(),
  /** 留言内容，最多500字 */
  content: z.string().max(500),
  /** 图片media_id列表，所有留言总图片数量最多20张 */
  media_id_list: z.array(z.string()).optional(),
});
export type AddcomplaintmaterialRequest = z.infer<typeof AddcomplaintmaterialRequestSchema>;

/**
 * 商家举证
 * @see https://developers.weixin.qq.com/doc/store/shop/API/complaint/api_addcomplaintproof.html
 */
export const AddcomplaintproofRequestSchema = z.object({
  /** 纠纷单号 */
  complaint_id: z.string(),
  /** 举证文字内容，最多500字 */
  content: z.string().max(500),
  /** 举证图片media_id列表，可通过上传图片接口获取 */
  media_id_list: z.array(z.string()).optional(),
});
export type AddcomplaintproofRequest = z.infer<typeof AddcomplaintproofRequestSchema>;

/**
 * 售后单兑换虚拟号
 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-aftersale/api_applyvirtualtelnum.html
 */
export const ApplyvirtualtelnumRequestSchema = z.object({
  /** 售后单ID */
  after_sale_order_id: z.number(),
});
export type ApplyvirtualtelnumRequest = z.infer<typeof ApplyvirtualtelnumRequestSchema>;
export const ApplyvirtualtelnumResponseSchema = z.object({
  /** 虚拟号号码 */
  virtual_tel_number: z.string().optional(),
  /** 虚拟号有效期 [timestamp] */
  virtual_tel_expire_time: z.number().optional(),
});
export type ApplyvirtualtelnumResponse = z.infer<typeof ApplyvirtualtelnumResponseSchema>;

/**
 * 代用户发起售后
 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-aftersale/api_genaftersaleorder.html
 */
export const GenaftersaleorderRequestSchema = z.object({
  /** 请求唯一ID，失败时可用相同ID进行重试，可避免重复发起售后 */
  request_id: z.string(),
  /** 订单ID */
  order_id: z.string(),
  /** 商品ID */
  product_id: z.string(),
  /** 商品SKUID */
  sku_id: z.string(),
  /** 发起售后数量 */
  count: z.number(),
  /** 售后退款金额，单位分 */
  amount: z.number(),
  /** 售后原因 (10000014-双方协商一致退款, 10000002-拍错/多拍, 10000000-不想要了, 1000000...) */
  reason: z.string(),
  /** 售后类型，REFUND：仅退款；RETURN：退货退款 (REFUND-仅退款, RETURN-退货退款) */
  type: z.string(),
  /** 售后类型为退货退款时，退货的地址ID */
  address_id: z.string().optional(),
  /** 代发起售后补充说明 */
  desc: z.string().optional(),
});
export type GenaftersaleorderRequest = z.infer<typeof GenaftersaleorderRequestSchema>;
export const GenaftersaleorderResponseSchema = z.object({
  /** 售后ID */
  aftersale_id: z.number().optional(),
});
export type GenaftersaleorderResponse = z.infer<typeof GenaftersaleorderResponseSchema>;

/**
 * 获取售后单列表
 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-aftersale/api_getaftersalelist.html
 */
export const GetaftersalelistRequestSchema = z.object({
  /** 售后单创建启始时间；begin_create_time/end_create_time和begin_update_time/end_update_time成对使 [timestamp] */
  begin_create_time: z.number().optional(),
  /** 售后单创建结束时间，end_create_time减去begin_create_time不得大于24小时；begin_create_time/end_creat [timestamp] */
  end_create_time: z.number().optional(),
  /** 翻页参数，从第二页开始传，来源于上一页的返回值 */
  next_key: z.string().optional(),
  /** 售后单更新起始时间；begin_create_time/end_create_time和begin_update_time/end_update_time成对使 [timestamp] */
  begin_update_time: z.number().optional(),
  /** 售后单更新结束时间，end_update_time减去begin_update_time不得大于24小时；begin_create_time/end_creat [timestamp] */
  end_update_time: z.number().optional(),
});
export type GetaftersalelistRequest = z.infer<typeof GetaftersalelistRequestSchema>;
export const GetaftersalelistResponseSchema = z.object({
  /** 售后单号列表 */
  after_sale_order_id_list: z.array(z.string()).optional(),
  /** 是否还有数据 */
  has_more: z.boolean().optional(),
  /** 翻页参数 */
  next_key: z.string().optional(),
});
export type GetaftersalelistResponse = z.infer<typeof GetaftersalelistResponseSchema>;

/**
 * 获取售后单
 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-aftersale/api_getaftersaleorder.html
 */
export const GetaftersaleorderRequestSchema = z.object({
  /** 售后单号 */
  after_sale_order_id: z.string(),
});
export type GetaftersaleorderRequest = z.infer<typeof GetaftersaleorderRequestSchema>;
export const GetaftersaleorderResponseSchema = z.object({
  /** 售后单详情 */
  after_sale_order: z.object({ after_sale_order_id: z.string(), status: z.string(), openid: z.string(), unionid: z.string(), present_giver_openid: z.string(), present_giver_unionid: z.string(), product_info: z.object({ product_id: z.string(), sku_id: z.string(), count: z.number(), fast_refund: z.boolean(), gift_product_list: z.array(z.object({ product_id: z.string(), sku_id: z.string(), count: z.number(), sku_code: z.string() })), sku_code: z.string() }), refund_info: z.object({ amount: z.number(), refund_reason: z.number(), platform_discount_return_amount: z.number(), is_low_price_insurance_refund: z.boolean(), is_final_refund_by_insurance: z.boolean() }), return_info: z.object({ waybill_id: z.string(), delivery_id: z.string(), delivery_name: z.string(), return_type: z.number() }), merchant_upload_info: z.object({ reject_reason: z.string(), refund_certificates: z.array(z.string()) }), create_time: z.number(), update_time: z.number(), reason: z.string(), reason_text: z.string(), type: z.string(), complaint_id: z.string(), order_id: z.string(), refund_resp: z.object({ code: z.string(), ret: z.number(), message: z.string() }), deadline: z.number(), exchange_product_info: z.object({ product_id: z.string(), old_sku_id: z.string(), new_sku_id: z.string(), product_cnt: z.number(), old_sku_price: z.number(), new_sku_price: z.number(), old_sku_code: z.string(), new_sku_code: z.string() }), exchange_delivery_info: z.object({ waybill_id: z.string(), delivery_id: z.string(), delivery_name: z.string(), address_info: z.object({ user_name: z.string(), postal_code: z.string(), province_name: z.string(), city_name: z.string(), county_name: z.string(), detail_info: z.string(), national_code: z.string(), tel_number: z.string(), house_number: z.string(), virtual_order_tel_number: z.string() }) }), virtual_tel_num_info: z.object({ virtual_tel_number: z.string(), virtual_tel_expire_time: z.number() }), compensation_liability_amount: z.number(), details: z.object({ desc: z.string(), receive_product: z.boolean(), media_infos: z.array(z.object({ media_type: z.number(), picture_media_id: z.string(), video_media_id: z.string(), video_play_length: z.number() })) }), sub_type: z.string(), merchant_update_detail: z.object({ merchant_update_type: z.number(), update_reason_type: z.number(), merchant_update_desc: z.string(), old_after_sale_type: z.number(), new_after_sale_type: z.number(), old_after_sale_amount: z.number(), new_after_sale_amount: z.number(), media_ids: z.array(z.string()) }), complete_time: z.number(), need_offline_refund: z.boolean(), exchange_info: z.object({ fast_exchange_info: z.object({ fast_exchange: z.boolean(), fast_exchange_act: z.object({ merchant_confirm: z.number(), merchant_confirm_time: z.number(), merchant_reject: z.number(), merchant_reject_time: z.number() }) }) }) }).optional(),
});
export type GetaftersaleorderResponse = z.infer<typeof GetaftersaleorderResponseSchema>;

/**
 * 获取纠纷单
 * @see https://developers.weixin.qq.com/doc/store/shop/API/complaint/api_getcomplaintorder.html
 */
export const GetcomplaintorderRequestSchema = z.object({
  /** 纠纷单号 */
  complaint_id: z.string(),
});
export type GetcomplaintorderRequest = z.infer<typeof GetcomplaintorderRequestSchema>;
export const GetcomplaintorderResponseSchema = z.object({
  /** 售后单号 */
  after_sale_order_id: z.string().optional(),
  /** 订单号 */
  order_id: z.string().optional(),
  /** 纠纷历史 */
  history: z.array(z.object({ item_type: z.number(), time: z.number(), content: z.string(), media_id_list: z.array(z.string()), after_sale_type: z.number(), after_sale_reason: z.number() })).optional(),
  /** 纠纷单状态 (100-待商家处理纠纷, 101-待客服处理, 102-取消客服介入, 103-客服处理中, 104-待用户补充凭...) */
  status: z.number().optional(),
  /** 虚拟号码 */
  virtual_tel_num_info: z.object({ virtual_tel_number: z.string(), virtual_tel_expire_time: z.number() }).optional(),
});
export type GetcomplaintorderResponse = z.infer<typeof GetcomplaintorderResponseSchema>;

/**
 * 获取保障单详情
 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-aftersale/api_getguaranteeorder.html
 */
export const GetguaranteeorderRequestSchema = z.object({
  /** 保障单号 */
  guarantee_order_id: z.number(),
});
export type GetguaranteeorderRequest = z.infer<typeof GetguaranteeorderRequestSchema>;
export const GetguaranteeorderResponseSchema = z.object({
  /** 保障单详情 */
  guarantee_order: z.object({ guarantee_order_id: z.number(), type: z.number(), order_id: z.number(), status: z.string(), create_time: z.number(), update_time: z.number(), apply_reason: z.string(), product_info: z.object({ thumb_img: z.string(), title: z.string(), real_price: z.number(), product_cnt: z.number(), detail: z.string(), product_id: z.string(), sku_id: z.string() }), expire_time: z.number(), openid: z.string(), unionid: z.string(), pay_amount: z.number(), merchant_refuse_reason: z.string(), order_pay_info: z.object({ transaction_id: z.string() }), complete_time: z.number(), apply_reason_type: z.number(), order_present_info: z.object({ present_order_id: z.number(), accept_present_time: z.number(), giver_nickname: z.string() }), order_type: z.number(), fake_one_pay_four_info: z.object({ identify_fee: z.number(), product_fee: z.number(), total_pay_fee: z.number(), identify_proof_pic_list: z.array(z.string()), fee_proof_pic_list: z.array(z.string()), apply_reason: z.number(), acctual_pay: z.number() }), bad_pay_info: z.object({ bad_level: z.number(), content: z.string(), pic_list: z.array(z.string()), pay_fee: z.number(), merchant_modify_level: z.number(), merchant_remark: z.string(), platform_modify_level: z.number(), refund_type: z.number(), receive_product: z.number(), refund_reason: z.number(), refund_reason_text: z.string(), title_pic_list: z.array(z.string()) }), wxa_vip_discounted_price: z.number(), history_list: z.array(z.record(z.string(), z.any())) }).optional(),
});
export type GetguaranteeorderResponse = z.infer<typeof GetguaranteeorderResponseSchema>;

/**
 * 商家处理极速换货用户退货
 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-aftersale/api_handlefastexchangereceipt.html
 */
export const HandlefastexchangereceiptRequestSchema = z.object({
  /** 售后单号 */
  after_sale_order_id: z.string(),
  /** 1-同意，2-拒绝 (1-同意, 2-拒绝) */
  act: z.number(),
  /** 拒绝原因具体描述，可使用默认描述，也可以自定义描述 */
  reject_reason: z.string().optional(),
  /** 拒绝原因枚举值，选择reject_scene为7的场景 */
  reject_reason_type: z.number().optional(),
  /** 补充描述 */
  merchant_text: z.string().optional(),
  /** 举证材料 */
  reject_confirm_exchange: z.array(z.string()).optional(),
});
export type HandlefastexchangereceiptRequest = z.infer<typeof HandlefastexchangereceiptRequestSchema>;

/**
 * 商家同意保障单申请
 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-aftersale/api_merchantacceptguarantee.html
 */
export const MerchantacceptguaranteeRequestSchema = z.object({
  /** 保障单号 */
  guarantee_order_id: z.number(),
});
export type MerchantacceptguaranteeRequest = z.infer<typeof MerchantacceptguaranteeRequestSchema>;

/**
 * 商家协商保障单
 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-aftersale/api_merchantmodifyguarantee.html
 */
export const MerchantmodifyguaranteeRequestSchema = z.object({
  /** 保障单号 */
  guarantee_order_id: z.number(),
  /** 商家修改坏损比例，可填10/30/50/80/100 (10-10, 30-30, 50-50, 80-80, 100-100) */
  bad_level: z.number(),
  /** 商家备注 */
  merchant_remark: z.string().optional(),
});
export type MerchantmodifyguaranteeRequest = z.infer<typeof MerchantmodifyguaranteeRequestSchema>;

/**
 * 商家举证保障单
 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-aftersale/api_merchantproofguarantee.html
 */
export const MerchantproofguaranteeRequestSchema = z.object({
  /** 保障单号 */
  guarantee_order_id: z.number(),
  /** 商家举证文字内容 */
  content: z.string(),
  /** 拒绝凭证id列表，可使用图片上传接口获取media_id（数据类型填0） */
  pic_list: z.array(z.string()),
});
export type MerchantproofguaranteeRequest = z.infer<typeof MerchantproofguaranteeRequestSchema>;

/**
 * 商家拒绝保障单申请
 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-aftersale/api_merchantrefuseguarantee.html
 */
export const MerchantrefuseguaranteeRequestSchema = z.object({
  /** 保障单号 */
  guarantee_order_id: z.number(),
  /** 商家拒绝原因 */
  reason: z.string(),
  /** 拒绝凭证id列表，可使用图片上传接口获取media_id（数据类型填0） */
  pic_list: z.array(z.string()),
});
export type MerchantrefuseguaranteeRequest = z.infer<typeof MerchantrefuseguaranteeRequestSchema>;

/**
 * 商家协商
 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-aftersale/api_merchantupdateaftersale.html
 */
export const MerchantupdateaftersaleRequestSchema = z.object({
  /** 售后单号 */
  after_sale_order_id: z.string(),
  /** 协商修改把售后单修改成该售后类型。1:退款；2:退货退款 (1-退款, 2-退货退款) */
  type: z.number(),
  /** 金额（单位：分） */
  amount: z.number().min(0),
  /** 协商描述 */
  merchant_update_desc: z.string(),
  /** 协商原因枚举值 (6-已协商一致新的售后方案（当售后类型选择仅退款时，若买家同意协商，平台将自动退款）, 7-无法联系或联系不上买家...) */
  update_reason_type: z.number(),
  /** 1:已协商一致，邀请买家取消售后; 2:邀请买家核实与补充凭证; 3:修改买家售后申请 (1-已协商一致，邀请买家取消售后, 2-邀请买家核实与补充凭证, 3-修改买家售后申请) */
  merchant_update_type: z.number(),
  /** 协商凭证id列表，可使用图片上传接口获取media_id（数据类型填0），当update_reason_type对应的need_image为1时必填 */
  media_ids: z.array(z.string()),
});
export type MerchantupdateaftersaleRequest = z.infer<typeof MerchantupdateaftersaleRequestSchema>;

export const GetaftersalereasonResponseSchema = z.object({
  /** 售后原因列表 */
  reason_list: z.array(z.object({ reason: z.string(), reason_text: z.string() })).optional(),
});
export type GetaftersalereasonResponse = z.infer<typeof GetaftersalereasonResponseSchema>;

/**
 * 代用户发起退差价
 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-aftersale/api_refundpricediff.html
 */
export const RefundpricediffRequestSchema = z.object({
  /** 请求唯一ID，失败时可用相同ID进行重试，可避免重复发起售后 */
  request_id: z.string(),
  /** 订单ID */
  order_id: z.string(),
  /** 商品ID */
  product_id: z.string(),
  /** 商品SKUID */
  sku_id: z.string(),
  /** 售后退款金额，单位分 */
  amount: z.number(),
  /** 售后原因 (10001336-双方协商一致退差价, 10001337-商品降价, 10001338-未使用优惠券) */
  reason: z.string(),
  /** 代发起售后补充说明 */
  desc: z.string().optional(),
});
export type RefundpricediffRequest = z.infer<typeof RefundpricediffRequestSchema>;
export const RefundpricediffResponseSchema = z.object({
  /** 售后ID */
  aftersale_id: z.string().optional(),
});
export type RefundpricediffResponse = z.infer<typeof RefundpricediffResponseSchema>;

/**
 * 拒绝售后
 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-aftersale/api_rejectapply.html
 */
export const RejectapplyRequestSchema = z.object({
  /** 售后单号 */
  after_sale_order_id: z.string(),
  /** 拒绝原因具体描述，可使用默认描述，也可以自定义描述 */
  reject_reason: z.string().optional(),
  /** 拒绝原因枚举值 */
  reject_reason_type: z.number(),
});
export type RejectapplyRequest = z.infer<typeof RejectapplyRequestSchema>;

/**
 * 换货拒绝发货
 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-aftersale/api_rejectexchangereship.html
 */
export const RejectexchangereshipRequestSchema = z.object({
  /** 售后单号 */
  after_sale_order_id: z.string(),
  /** 拒绝原因具体描述，可使用默认描述，也可以自定义描述 */
  reject_reason: z.string().optional(),
  /** 拒绝原因枚举值 */
  reject_reason_type: z.number().optional(),
  /** 退款凭证，可使用图片上传接口获取media_id（数据类型填0） */
  reject_certificates: z.array(z.string()).optional(),
});
export type RejectexchangereshipRequest = z.infer<typeof RejectexchangereshipRequestSchema>;

export const GetaftersalerejectreasonResponseSchema = z.object({
  /** 售后拒绝原因列表 */
  reason_list: z.array(z.object({ reject_reason_type: z.number(), reject_reason_type_text: z.string(), reject_reason: z.string(), reject_scene: z.number() })).optional(),
});
export type GetaftersalerejectreasonResponse = z.infer<typeof GetaftersalerejectreasonResponseSchema>;

/**
 * 商家获取保障单列表
 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-aftersale/api_searchguaranteeorder.html
 */
export const SearchguaranteeorderRequestSchema = z.object({
  /** 保障单号列表 */
  guarantee_order_id_list: z.array(z.number()).optional(),
  /** 订单号列表 */
  order_id_list: z.array(z.number()).optional(),
  /** 想要获取的保障单类型；0-全部类型，1-假一赔三，2-坏损包退 (0-全部类型, 1-假一赔三, 2-坏损包退) */
  type: z.number().optional(),
  /** 保障单申请的开始时间戳 [timestamp] */
  begin_time: z.number().optional(),
  /** 保障单申请的结束时间戳 [timestamp] */
  end_time: z.number().optional(),
  /** 保障单当前状态筛选。枚举值：STATUS_WAIT_MERCHANT_HANDLE(等待商家处理), STATUS_WAIT_PLATFORM_HANDLE(等 (STATUS_WAIT_MERCHANT_HANDLE-等待商家处理, ST */
  status_list: z.string().optional(),
  /** 列表起始下标，默认从0开始 */
  offset: z.number().default(0).optional(),
  /** 需要的保障单列表条数 */
  limit: z.number(),
});
export type SearchguaranteeorderRequest = z.infer<typeof SearchguaranteeorderRequestSchema>;
export const SearchguaranteeorderResponseSchema = z.object({
  /** 保障单详情列表 */
  guarantee_order_list: z.array(z.object({ guarantee_order_id: z.number(), type: z.number(), order_id: z.number(), status: z.string(), create_time: z.number(), update_time: z.number(), apply_reason: z.string(), product_info: z.array(z.object({ thumb_img: z.string(), title: z.string(), real_price: z.number(), product_cnt: z.number(), detail: z.string() })), expire_time: z.number(), openid: z.string(), unionid: z.string(), pay_amount: z.number(), merchant_refuse_reason: z.string(), order_pay_info: z.object({ transaction_id: z.string() }), complete_time: z.number(), apply_reason_type: z.number(), order_present_info: z.object({ present_order_id: z.number(), accept_present_time: z.number(), giver_nickname: z.string() }), order_type: z.number(), fake_one_pay_four_info: z.object({ identify_fee: z.number(), product_fee: z.number(), total_pay_fee: z.number(), identify_proof_pic_list: z.array(z.string()), fee_proof_pic_list: z.array(z.string()), apply_reason: z.number(), acctual_pay: z.number() }), bad_pay_info: z.object({ bad_level: z.number(), content: z.string(), pic_list: z.array(z.string()), pay_fee: z.number(), merchant_modify_level: z.number(), merchant_remark: z.string(), platform_modify_level: z.number(), refund_type: z.number(), receive_product: z.number(), refund_reason: z.number(), refund_reason_text: z.string(), title_pic_list: z.array(z.string()) }), wxa_vip_discounted_price: z.number(), history_list: z.array(z.string()) })).optional(),
  /** 保障单列表总数 */
  total_num: z.number().optional(),
});
export type SearchguaranteeorderResponse = z.infer<typeof SearchguaranteeorderResponseSchema>;

/**
 * 上传退款凭证
 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-aftersale/api_uploadrefundcertificate.html
 */
export const UploadrefundcertificateRequestSchema = z.object({
  /** 售后单号 */
  after_sale_order_id: z.string(),
  /** 退款凭证，可使用图片上传接口获取media_id（数据类型填0） */
  refund_certificates: z.array(z.string()),
  /** 描述 */
  desc: z.string(),
});
export type UploadrefundcertificateRequest = z.infer<typeof UploadrefundcertificateRequestSchema>;

/**
 * 查询礼物活动详情
 * @see https://developers.weixin.qq.com/doc/store/shop/API/miniandstore/cooperation_gift/api_get_activity.html
 */
export const GetGetRequestSchema = z.object({
  /** 小店appid */
  shop_appid: z.string(),
  /** 小店活动id */
  activity_id: z.number(),
});
export type GetGetRequest = z.infer<typeof GetGetRequestSchema>;
export const GetGetResponseSchema = z.object({
  /** 活动信息 */
  activity: z.object({ activity_id: z.number(), info: z.object({ basic_info: z.object({ activity_start_time: z.number(), activity_end_time: z.number(), shop_info: z.object({ nickname: z.string(), appid: z.string() }) }), prize_info: z.object({ product_info_list: z.array(z.object({ product_id: z.number(), sku_id: z.number(), product_img_url: z.string(), product_name: z.string(), price: z.number(), sku_name: z.string(), stock_num: z.number(), can_use_stock_num: z.number() })) }) }), status: z.number() }).optional(),
});
export type GetGetResponse = z.infer<typeof GetGetResponseSchema>;

/**
 * 查询小店礼物活动列表
 * @see https://developers.weixin.qq.com/doc/store/shop/API/miniandstore/cooperation_gift/api_list_present_activity.html
 */
export const ListRequestSchema = z.object({
  /** 偏移量 */
  offset: z.number(),
  /** 单次请求个数 */
  limit: z.number().max(100),
  /** 小店appid */
  shop_appid: z.string().optional(),
  /** 活动状态 (1-未开始, 2-进行中, 4-已开奖, 5-失效) */
  status: z.number().optional(),
  /** 类型 (0-小店授权, 1-自购, 2-全部) */
  type: z.number().optional(),
});
export type ListRequest = z.infer<typeof ListRequestSchema>;
export const ListResponseSchema = z.object({
  /** 信息列表 */
  list: z.array(z.object({ shop_appid: z.string(), shop_nickname: z.string(), activity_id: z.string(), status: z.number(), type: z.number() })).optional(),
  /** 总数 */
  total_num: z.number().optional(),
});
export type ListResponse = z.infer<typeof ListResponseSchema>;

/**
 * 获取地址行政编码
 * @see https://developers.weixin.qq.com/doc/store/shop/API/warehouse/api_getaddresscode.html
 */
export const GetaddresscodeRequestSchema = z.object({
  /** 地址行政编码，不填或者填0时，获取全国的省级行政编码 */
  addr_code: z.number().optional(),
});
export type GetaddresscodeRequest = z.infer<typeof GetaddresscodeRequestSchema>;
export const GetaddresscodeResponseSchema = z.object({
  /** 本行政编码地址信息 */
  addrs_msg: z.object({ name: z.string(), code: z.number(), level: z.number() }).optional(),
  /** 下一级所有地址信息 */
  next_level_addrs: z.array(z.object({ name: z.string(), code: z.number(), level: z.number() })).optional(),
});
export type GetaddresscodeResponse = z.infer<typeof GetaddresscodeResponseSchema>;

/**
 * 撤销主页背景图申请
 * @see https://developers.weixin.qq.com/doc/store/shop/API/homepage/background/api_cancelbackgroundapply.html
 */
export const CancelbackgroundapplyRequestSchema = z.object({
  /** 申请编号 */
  apply_id: z.number(),
});
export type CancelbackgroundapplyRequest = z.infer<typeof CancelbackgroundapplyRequestSchema>;

/**
 * 提交背景图申请
 * @see https://developers.weixin.qq.com/doc/store/shop/API/homepage/background/api_submitbackgroundapply.html
 */
export const SubmitbackgroundapplyRequestSchema = z.object({
  /** 图片链接。请务必使用接口上传图片，并将返回的img_url填入此处，不接受其他任何格式的图片url。若url曾经做过转换（ url前缀为mmecimage.cn */
  img_url: z.string(),
});
export type SubmitbackgroundapplyRequest = z.infer<typeof SubmitbackgroundapplyRequestSchema>;
export const SubmitbackgroundapplyResponseSchema = z.object({
  /** 申请编号 */
  apply_id: z.number().optional(),
});
export type SubmitbackgroundapplyResponse = z.infer<typeof SubmitbackgroundapplyResponseSchema>;

export const GetbackgroundResponseSchema = z.object({
  /** 当前生效的背景图片url。 */
  img_url: z.string().optional(),
  /** 最近一次流程中的申请。已生效/已撤销的申请不返回。 */
  apply: z.object({ apply_id: z.number(), state: z.number(), audit_desc: z.string(), img_url: z.string() }).optional(),
});
export type GetbackgroundResponse = z.infer<typeof GetbackgroundResponseSchema>;

/**
 * 撤销精选展示位申请
 * @see https://developers.weixin.qq.com/doc/store/shop/API/homepage/banner/api_cancelbannerapply.html
 */
export const CancelbannerapplyRequestSchema = z.object({
  /** 申请编号 */
  apply_id: z.number(),
});
export type CancelbannerapplyRequest = z.infer<typeof CancelbannerapplyRequestSchema>;

/**
 * 提交精选展示位申请
 * @see https://developers.weixin.qq.com/doc/store/shop/API/homepage/banner/api_submitbannerapply.html
 */
export const SubmitbannerapplyRequestSchema = z.object({
  /** 精选展示位。 */
  banner: z.object({ scale: z.number(), title: z.string().max(32), banner: z.array(z.object({ banner: z.object({ img_url: z.string(), title: z.string().max(40), description: z.string().max(100) }), type: z.number(), product: z.object({ product_id: z.number() }), finder: z.object({ finder_user_name: z.string(), feed_id: z.string() }), official_account: z.object({ url: z.string() }) })) }),
});
export type SubmitbannerapplyRequest = z.infer<typeof SubmitbannerapplyRequestSchema>;
export const SubmitbannerapplyResponseSchema = z.object({
  /** 申请编号 */
  apply_id: z.number().optional(),
});
export type SubmitbannerapplyResponse = z.infer<typeof SubmitbannerapplyResponseSchema>;

export const GetbannerResponseSchema = z.object({
  /** 当前生效的展示位。 */
  banner: z.object({ scale: z.number(), banner: z.array(z.object({ type: z.number(), product: z.object({ product_id: z.number() }), finder: z.object({ finder_user_name: z.string(), feed_id: z.string() }), official_account: z.object({ url: z.string() }), banner: z.object({ img_url: z.string(), title: z.string(), description: z.string() }) })) }).optional(),
  /** 最近一次流程中的申请。不返回已生效或已撤销的申请。 */
  apply: z.object({ apply_id: z.number(), state: z.number(), scale: z.number(), banner: z.array(z.object({ audit_state: z.number(), audit_desc: z.string(), banner: z.object({ type: z.number(), product: z.object({ product_id: z.number() }), finder: z.object({ finder_user_name: z.string(), feed_id: z.string() }), official_account: z.object({ url: z.string() }), banner: z.object({ img_url: z.string(), title: z.string(), description: z.string() }) }) })) }).optional(),
});
export type GetbannerResponse = z.infer<typeof GetbannerResponseSchema>;

export const MmecapiResponseSchema = z.object({
  /** 店铺信息 */
  info: z.object({ nickname: z.string(), headimg_url: z.string(), subject_type: z.string(), status: z.string(), username: z.string(), is_local_life: z.number(), open_timestamp: z.number() }).optional(),
});
export type MmecapiResponse = z.infer<typeof MmecapiResponseSchema>;

/**
 * 通过mediaid获取数据
 * @see https://developers.weixin.qq.com/doc/store/shop/API/apimgnt/api_getdatabymediaid.html
 */
export const GetdatabymediaidRequestSchema = z.object({
  /** 售后单，纠纷单等接口返回的媒体 id */
  media_id: z.string(),
});
export type GetdatabymediaidRequest = z.infer<typeof GetdatabymediaidRequestSchema>;

/**
 * 获取店铺H5链接
 * @see https://developers.weixin.qq.com/doc/store/shop/API/storemanage/api_getshoph5url.html
 */
export const Getshoph5urlRequestSchema = z.object({
  /** 小店通过关联账号绑定的企业微信id */
  wecom_corp_id: z.string().optional(),
  /** 小店通过关联账号绑定的企业微信下的成员id */
  wecom_user_id: z.string().optional(),
});
export type Getshoph5urlRequest = z.infer<typeof Getshoph5urlRequestSchema>;
export const Getshoph5urlResponseSchema = z.object({
  /** 店铺h5链接 */
  shop_h5url: z.string().optional(),
});
export type Getshoph5urlResponse = z.infer<typeof Getshoph5urlResponseSchema>;

/**
 * 获取店铺二维码
 * @see https://developers.weixin.qq.com/doc/store/shop/API/storemanage/api_getshopqrcode.html
 */
export const GetshopqrcodeRequestSchema = z.object({
  /** 小店通过关联账号绑定的企业微信id */
  wecom_corp_id: z.string().optional(),
  /** 小店通过关联账号绑定的企业微信下的成员id */
  wecom_user_id: z.string().optional(),
  /** 二维码类型 (1-二维码, 2-标准物料, 3-送礼物物料) */
  qrcode_type: z.number(),
});
export type GetshopqrcodeRequest = z.infer<typeof GetshopqrcodeRequestSchema>;
export const GetshopqrcodeResponseSchema = z.object({
  /** 店铺二维码链接 */
  shop_qrcode: z.string().optional(),
});
export type GetshopqrcodeResponse = z.infer<typeof GetshopqrcodeResponseSchema>;

/**
 * 获取店铺口令
 * @see https://developers.weixin.qq.com/doc/store/shop/API/storemanage/api_getshoptaglink.html
 */
export const GetshoptaglinkRequestSchema = z.object({
  /** 小店通过关联账号绑定的企业微信id，获取方式见获取关联账号企微id */
  wecom_corp_id: z.string().optional(),
  /** 小店通过关联账号绑定的企业微信下的成员id，获取方式见获取关联账号企微id */
  wecom_user_id: z.string().optional(),
});
export type GetshoptaglinkRequest = z.infer<typeof GetshoptaglinkRequestSchema>;
export const GetshoptaglinkResponseSchema = z.object({
  /** 店铺微信口令 */
  shop_taglink: z.string().optional(),
});
export type GetshoptaglinkResponse = z.infer<typeof GetshoptaglinkResponseSchema>;

/**
 * 删除品牌资质
 * @see https://developers.weixin.qq.com/doc/store/shop/API/brand/api_deletebrandlogic.html
 */
export const DeletebrandlogicRequestSchema = z.object({
  /** 品牌库中的品牌编号 */
  brand_id: z.string(),
});
export type DeletebrandlogicRequest = z.infer<typeof DeletebrandlogicRequestSchema>;

/**
 * 获取品牌资质申请详情
 * @see https://developers.weixin.qq.com/doc/store/shop/API/brand/api_getbrandlogic.html
 */
export const GetbrandlogicRequestSchema = z.object({
  /** 品牌库中的品牌编号 */
  brand_id: z.string(),
});
export type GetbrandlogicRequest = z.infer<typeof GetbrandlogicRequestSchema>;
export const GetbrandlogicResponseSchema = z.object({
  /** 品牌资质申请信息 */
  brand: z.object({ brand_id: z.number(), ch_name: z.string(), en_name: z.string(), classification_no: z.string(), trade_mark_symbol: z.number(), register_details: z.object({ registrant: z.string(), register_no: z.string(), start_time: z.number(), end_time: z.number(), is_permanent: z.boolean(), register_certifications: z.array(z.string()), renew_certifications: z.array(z.string()) }), application_details: z.object({ acceptance_time: z.number(), acceptance_certification: z.array(z.string()), acceptance_no: z.string() }), grant_type: z.number(), grant_details: z.object({ grant_certifications: z.array(z.string()), grant_level: z.number().min(1).max(3), start_time: z.number(), end_time: z.number(), is_permanent: z.boolean(), brand_owner_id_photos: z.array(z.string()), use_split_grant_info: z.number().min(0), grant_info_lv1: z.object({ grant_certifications: z.array(z.string()), start_time: z.number(), end_time: z.number(), is_permanent: z.boolean() }), grant_info_lv2: z.object({ grant_certifications: z.array(z.string()), start_time: z.number(), end_time: z.number(), is_permanent: z.boolean() }), grant_info_lv3: z.object({ grant_certifications: z.array(z.string()), start_time: z.number(), end_time: z.number(), is_permanent: z.boolean() }), contact_info_list: z.array(z.object({ key: z.string(), value: z.string() })) }), status: z.number(), create_time: z.number(), update_time: z.number(), audit_result: z.object({ audit_id: z.number(), reject_reason: z.string() }) }).optional(),
});
export type GetbrandlogicResponse = z.infer<typeof GetbrandlogicResponseSchema>;

/**
 * 获取品牌资质申请列表
 * @see https://developers.weixin.qq.com/doc/store/shop/API/brand/api_getbrandlistlogic.html
 */
export const GetbrandlistlogicRequestSchema = z.object({
  /** 每页数量 */
  page_size: z.number().min(1).max(50).default(10),
  /** 审核单状态 (0-默认值，获取全部, 1-审核中, 2-审核失败, 3-审核通过(包括即将过期和已过期), 4-已撤回) */
  status: z.number().optional(),
  /** 由上次请求返回，记录翻页的上下文 */
  next_key: z.string().min(0).optional(),
});
export type GetbrandlistlogicRequest = z.infer<typeof GetbrandlistlogicRequestSchema>;
export const GetbrandlistlogicResponseSchema = z.object({
  /** 品牌资质申请信息列表 */
  brands: z.array(z.object({ brand_id: z.string(), ch_name: z.string(), en_name: z.string(), classification_no: z.string(), trade_mark_symbol: z.number(), register_details: z.object({ registrant: z.string(), register_no: z.string(), start_time: z.number(), end_time: z.number(), is_permanent: z.boolean(), register_certifications: z.array(z.string()), renew_certifications: z.array(z.string()) }), application_details: z.object({ acceptance_time: z.number(), acceptance_certification: z.array(z.string()), acceptance_no: z.string() }), grant_type: z.number(), grant_details: z.object({ grant_certifications: z.array(z.string()), grant_level: z.number().min(1).max(3), start_time: z.number(), end_time: z.number(), is_permanent: z.boolean(), brand_owner_id_photos: z.array(z.string()), use_split_grant_info: z.number().min(0), grant_info_lv1: z.object({ grant_certifications: z.array(z.string()), start_time: z.number(), end_time: z.number(), is_permanent: z.boolean() }), grant_info_lv2: z.object({ grant_certifications: z.array(z.string()), start_time: z.number(), end_time: z.number(), is_permanent: z.boolean() }), grant_info_lv3: z.object({ grant_certifications: z.array(z.string()), start_time: z.number(), end_time: z.number(), is_permanent: z.boolean() }), contact_info_list: z.array(z.object({ key: z.string(), value: z.string() })) }), status: z.number(), create_time: z.number(), update_time: z.number(), audit_result: z.object({ audit_id: z.number(), reject_reason: z.string() }) })).optional(),
  /** 品牌资质总数 */
  total_num: z.number().min(0).optional(),
  /** 本次翻页的上下文，用于请求下一页 */
  next_key: z.string().optional(),
});
export type GetbrandlistlogicResponse = z.infer<typeof GetbrandlistlogicResponseSchema>;

/**
 * 更新品牌资质
 * @see https://developers.weixin.qq.com/doc/store/shop/API/brand/api_updatebrandlogic.html
 */
export const UpdatebrandlogicRequestSchema = z.object({
  /** 品牌详情 */
  brand: z.object({ brand_id: z.number(), ch_name: z.string(), en_name: z.string(), classification_no: z.string(), trade_mark_symbol: z.number(), register_details: z.object({ registrant: z.string(), register_no: z.string(), start_time: z.number(), end_time: z.number(), is_permanent: z.boolean(), register_certifications: z.array(z.string()), renew_certifications: z.array(z.string()) }), application_details: z.object({ acceptance_time: z.number(), acceptance_certification: z.array(z.string()), acceptance_no: z.string() }), grant_type: z.number(), grant_details: z.object({ grant_certifications: z.array(z.string()), grant_level: z.number().min(1).max(3), start_time: z.number(), end_time: z.number(), is_permanent: z.boolean(), brand_owner_id_photos: z.array(z.string()), use_split_grant_info: z.number().min(0), grant_info_lv1: z.object({ grant_certifications: z.array(z.string()), start_time: z.number(), end_time: z.number(), is_permanent: z.boolean() }), grant_info_lv2: z.object({ grant_certifications: z.array(z.string()), start_time: z.number(), end_time: z.number(), is_permanent: z.boolean() }), grant_info_lv3: z.object({ grant_certifications: z.array(z.string()), start_time: z.number(), end_time: z.number(), is_permanent: z.boolean() }), contact_info_list: z.array(z.object({ key: z.string(), value: z.string() })) }) }),
});
export type UpdatebrandlogicRequest = z.infer<typeof UpdatebrandlogicRequestSchema>;
export const UpdatebrandlogicResponseSchema = z.object({
  /** 审核单ID，提交审核成功后返回 */
  audit_id: z.number().optional(),
});
export type UpdatebrandlogicResponse = z.infer<typeof UpdatebrandlogicResponseSchema>;

/**
 * 获取生效中的品牌资质列表
 * @see https://developers.weixin.qq.com/doc/store/shop/API/brand/api_getvalidbrandlistlogic.html
 */
export const GetvalidbrandlistlogicRequestSchema = z.object({
  /** 每页数量，默认10，不超过50 */
  page_size: z.number().min(1).max(50).default(10),
  /** 由上次请求返回，记录翻页的上下文，传入时会从上次返回的结果往后翻一页，不传则默认获取第一页数据 */
  next_key: z.string().optional(),
});
export type GetvalidbrandlistlogicRequest = z.infer<typeof GetvalidbrandlistlogicRequestSchema>;
export const GetvalidbrandlistlogicResponseSchema = z.object({
  /** 品牌资质申请信息列表 */
  brands: z.array(z.object({ brand_id: z.number(), ch_name: z.string(), en_name: z.string(), classification_no: z.string(), trade_mark_symbol: z.number(), register_details: z.object({ registrant: z.string(), register_no: z.string(), start_time: z.number(), end_time: z.number(), is_permanent: z.boolean(), register_certifications: z.array(z.string()), renew_certifications: z.array(z.string()) }), application_details: z.object({ acceptance_time: z.number(), acceptance_certification: z.array(z.string()), acceptance_no: z.string() }), grant_type: z.number(), grant_details: z.object({ grant_certifications: z.array(z.string()), grant_level: z.number().min(1).max(3), start_time: z.number(), end_time: z.number(), is_permanent: z.boolean(), brand_owner_id_photos: z.array(z.string()), use_split_grant_info: z.number().min(0), grant_info_lv1: z.object({ grant_certifications: z.array(z.string()), start_time: z.number(), end_time: z.number(), is_permanent: z.boolean() }), grant_info_lv2: z.object({ grant_certifications: z.array(z.string()), start_time: z.number(), end_time: z.number(), is_permanent: z.boolean() }), grant_info_lv3: z.object({ grant_certifications: z.array(z.string()), start_time: z.number(), end_time: z.number(), is_permanent: z.boolean() }), contact_info_list: z.array(z.object({ key: z.string(), value: z.string() })) }), status: z.number(), create_time: z.number(), update_time: z.number(), audit_result: z.object({ audit_id: z.number(), reject_reason: z.string() }) })).optional(),
  /** 品牌资质总数 */
  total_num: z.number().min(0).optional(),
  /** 本次翻页的上下文，用于请求下一页 */
  next_key: z.string().optional(),
});
export type GetvalidbrandlistlogicResponse = z.infer<typeof GetvalidbrandlistlogicResponseSchema>;

/**
 * 申请类目
 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-category/api_addcategory.html
 */
export const AddcategoryRequestSchema = z.object({
  /** 类目信息对象 */
  category_info: z.object({ level1: z.number(), level2: z.number(), level3: z.number(), cats_v2: z.array(z.object({ cat_id: z.number() })), certificate: z.array(z.record(z.string(), z.any())), baobeihan: z.array(z.record(z.string(), z.any())), jingyingzhengming: z.array(z.record(z.string(), z.any())), daihuokoubei: z.array(z.record(z.string(), z.any())), ruzhuzhizhi: z.array(z.record(z.string(), z.any())), jingyingliushui: z.array(z.record(z.string(), z.any())), buchongcailiao: z.array(z.record(z.string(), z.any())), jingyingpingtai: z.string(), zhanghaomingcheng: z.string(), brand_list: z.array(z.object({ brand_id: z.number() })), license_group_list: z.array(z.object({ license_group_id: z.number(), license: z.object({ license_id: z.number(), file_id_list: z.array(z.string()), license_field_list: z.array(z.object({ key: z.string(), value: z.string() })) }) })), is_new_apply_cat: z.boolean() }),
});
export type AddcategoryRequest = z.infer<typeof AddcategoryRequestSchema>;
export const AddcategoryResponseSchema = z.object({
  /** 审核单id */
  audit_id: z.number().optional(),
});
export type AddcategoryResponse = z.infer<typeof AddcategoryResponseSchema>;

/**
 * 上传多媒体资源
 * @see https://developers.weixin.qq.com/doc/store/shop/API/kf/api_cosupload.html
 */
export const CosuploadRequestSchema = z.object({
  /** 文件类型，目前支持的视频/图片/文件有（video/file/image） (video-视频, file-文件, image-图片) */
  msg_type: z.string(),
  /** 用户的 open_id，用于标识上传资源的用户 */
  open_id: z.string(),
  /** 需要上传的视频/图片/文件 */
  file: z.string(),
});
export type CosuploadRequest = z.infer<typeof CosuploadRequestSchema>;
export const CosuploadResponseSchema = z.object({
  /** 多媒体cos_url */
  cos_url: z.string().optional(),
});
export type CosuploadResponse = z.infer<typeof CosuploadResponseSchema>;

/**
 * 发送消息
 * @see https://developers.weixin.qq.com/doc/store/shop/API/kf/api_sendmsg.html
 */
export const SendmsgRequestSchema = z.object({
  /** 唯一任务ID，如果填写则以该任务ID进行去重 */
  request_id: z.string().optional(),
  /** 用户的 open_id，用于标识上传资源的用户 */
  open_id: z.string(),
  /** 文件类型，file（文件）、text（文本）、image（图片）、video（视频）、product_share (商品卡片)、order_share（订单卡片 (file-文件, text-文本, image-图片, video-视频,  */
  msg_type: z.string(),
  /** msg_type 为 text 时必填，包含消息内容 */
  text: z.object({ content: z.string() }).optional(),
  /** msg_type 为 image 时必填，包含消息内容 */
  image: z.object({ cos_url: z.string() }).optional(),
  /** msg_type 为 video 时必填，包含消息内容 */
  video: z.object({ cos_url: z.string() }).optional(),
  /** msg_type 为 product_share 时必填，包含消息内容 */
  product_share: z.object({ product_id: z.string() }).optional(),
  /** msg_type 为 order_share 时必填，包含消息内容 */
  order_share: z.object({ order_id: z.string() }).optional(),
  /** msg_type 为 file 时必填，包含消息内容 */
  file: z.object({ cos_url: z.string() }).optional(),
});
export type SendmsgRequest = z.infer<typeof SendmsgRequestSchema>;
export const SendmsgResponseSchema = z.object({
  /** 消息的单调自增msg_id */
  msg_id: z.string().optional(),
});
export type SendmsgResponse = z.infer<typeof SendmsgResponseSchema>;

export const GetshopfinderauthorizationlistResponseSchema = z.object({
  /** 授权视频号id列表 */
  authorized_finder_id_list: z.array(z.string()).optional(),
});
export type GetshopfinderauthorizationlistResponse = z.infer<typeof GetshopfinderauthorizationlistResponseSchema>;

/**
 * 获取带货达人列表
 * @see https://developers.weixin.qq.com/doc/store/shop/API/compass/api_getshopfinderlist.html
 */
export const GetshopfinderlistRequestSchema = z.object({
  /** 日期，格式YYYYMMDD [datetime] */
  ds: z.string(),
  /** 填'v2'会返回带货者身份的id */
  version: z.string().optional(),
});
export type GetshopfinderlistRequest = z.infer<typeof GetshopfinderlistRequestSchema>;
export const GetshopfinderlistResponseSchema = z.object({
  /** 视频号列表 */
  finder_list: z.array(z.object({ finder_id: z.string(), finder_nickname: z.string(), data: z.object({ pay_gmv: z.number(), pay_product_id_cnt: z.number(), pay_uv: z.number(), refund_gmv: z.number(), pay_refund_gmv: z.number() }), talent_id: z.string(), talent_nickname: z.string(), mp_id: z.string(), mp_nickname: z.string() })).optional(),
});
export type GetshopfinderlistResponse = z.infer<typeof GetshopfinderlistResponseSchema>;

/**
 * 获取带货数据概览
 * @see https://developers.weixin.qq.com/doc/store/shop/API/compass/api_getshopfinderoverall.html
 */
export const GetshopfinderoverallRequestSchema = z.object({
  /** 日期，格式YYYYMMDD */
  ds: z.string(),
});
export type GetshopfinderoverallRequest = z.infer<typeof GetshopfinderoverallRequestSchema>;
export const GetshopfinderoverallResponseSchema = z.object({
  /** 带货数据 */
  data: z.object({ pay_gmv: z.number(), pay_sales_finder_cnt: z.number(), pay_product_id_cnt: z.number(), click_to_pay_uv_ratio: z.number() }).optional(),
});
export type GetshopfinderoverallResponse = z.infer<typeof GetshopfinderoverallResponseSchema>;

/**
 * 获取带货达人商品列表
 * @see https://developers.weixin.qq.com/doc/store/shop/API/compass/api_getshopfinderproductlist.html
 */
export const GetshopfinderproductlistRequestSchema = z.object({
  /** 日期，格式YYYYMMDD */
  ds: z.string(),
  /** 视频号ID（finder_id、talent_id、mp_id三者必填其一） */
  finder_id: z.string().optional(),
  /** 达人号ID（finder_id、talent_id、mp_id三者必填其一） */
  talent_id: z.string().optional(),
  /** 公众号ID（finder_id、talent_id、mp_id三者必填其一） */
  mp_id: z.string().optional(),
});
export type GetshopfinderproductlistRequest = z.infer<typeof GetshopfinderproductlistRequestSchema>;
export const GetshopfinderproductlistResponseSchema = z.object({
  /** 商品信息 */
  product_list: z.array(z.object({ product_id: z.number(), head_img_url: z.string(), title: z.string(), price: z.string(), first_category_id: z.number(), second_category_id: z.number(), third_category_id: z.number(), data: z.object({ commission_ratio: z.number(), pay_gmv: z.string() }) })).optional(),
});
export type GetshopfinderproductlistResponse = z.infer<typeof GetshopfinderproductlistResponseSchema>;

/**
 * 获取带货达人详情
 * @see https://developers.weixin.qq.com/doc/store/shop/API/compass/api_getshopfinderproductoverall.html
 */
export const GetshopfinderproductoverallRequestSchema = z.object({
  /** 日期，格式YYYYMMDD */
  ds: z.string(),
  /** 视频号id（finder_id、talent_id、mp_id三者必填其一） */
  finder_id: z.string().optional(),
  /** 达人号ID（finder_id、talent_id、mp_id三者必填其一） */
  talent_id: z.string().optional(),
  /** 公众号ID（finder_id、talent_id、mp_id三者必填其一） */
  mp_id: z.string().optional(),
});
export type GetshopfinderproductoverallRequest = z.infer<typeof GetshopfinderproductoverallRequestSchema>;
export const GetshopfinderproductoverallResponseSchema = z.object({
  /** 返回数据对象 */
  data: z.object({ pay_gmv: z.string(), pay_product_id_cnt: z.string(), pay_uv: z.string(), refund_gmv: z.string(), pay_refund_gmv: z.string() }).optional(),
});
export type GetshopfinderproductoverallResponse = z.infer<typeof GetshopfinderproductoverallResponseSchema>;

/**
 * 获取店铺开播列表
 * @see https://developers.weixin.qq.com/doc/store/shop/API/compass/api_getshoplivelist.html
 */
export const GetshoplivelistRequestSchema = z.object({
  /** 日期，格式YYYYMMDD */
  ds: z.string(),
  /** 视频号ID */
  finder_id: z.string(),
});
export type GetshoplivelistRequest = z.infer<typeof GetshoplivelistRequestSchema>;
export const GetshoplivelistResponseSchema = z.object({
  /** 开播列表 */
  live_list: z.array(z.object({ live_id: z.string(), live_title: z.string(), live_time: z.string(), live_duration: z.string(), live_cover_img_url: z.string() })).optional(),
});
export type GetshoplivelistResponse = z.infer<typeof GetshoplivelistResponseSchema>;

/**
 * 获取电商数据概览
 * @see https://developers.weixin.qq.com/doc/store/shop/API/compass/api_getshopoverall.html
 */
export const GetshopoverallRequestSchema = z.object({
  /** 日期，格式YYYYMMDD [datetime] */
  ds: z.string().min(8).max(8),
});
export type GetshopoverallRequest = z.infer<typeof GetshopoverallRequestSchema>;
export const GetshopoverallResponseSchema = z.object({
  /** 电商数据 */
  data: z.object({ pay_gmv: z.string(), pay_uv: z.string(), pay_order_cnt: z.string(), pay_refund_gmv: z.string(), live_pay_gmv: z.string(), feed_pay_gmv: z.string(), product_click_uv: z.string() }).optional(),
});
export type GetshopoverallResponse = z.infer<typeof GetshopoverallResponseSchema>;

/**
 * 获取商品详细信息
 * @see https://developers.weixin.qq.com/doc/store/shop/API/compass/api_getshopproductdata.html
 */
export const GetshopproductdataRequestSchema = z.object({
  /** 日期，格式YYYYMMDD */
  ds: z.string(),
  /** 商品id */
  product_id: z.number(),
});
export type GetshopproductdataRequest = z.infer<typeof GetshopproductdataRequestSchema>;
export const GetshopproductdataResponseSchema = z.object({
  /** 商品详细信息 */
  product_info: z.object({ product_id: z.string(), head_img_url: z.string(), title: z.string(), price: z.string(), first_category_id: z.string(), second_category_id: z.string(), third_category_id: z.string(), data: z.object({ pay_gmv: z.string(), create_gmv: z.string(), create_cnt: z.string(), create_uv: z.string(), create_product_cnt: z.string(), pay_cnt: z.string(), pay_uv: z.string(), pay_product_cnt: z.string(), pure_pay_gmv: z.string(), pay_gmv_per_uv: z.string(), seller_actual_settle_amount: z.string(), platform_actual_commission: z.string(), finderuin_actual_commission: z.string(), captain_actual_commission: z.string(), seller_predict_settle_amount: z.string(), platform_predict_commission: z.string(), finderuin_predict_commission: z.string(), captain_predict_commission: z.string(), product_click_uv: z.string(), product_click_cnt: z.string(), pay_refund_gmv: z.string(), pay_refund_uv: z.string(), pay_refund_ratio: z.number(), pay_refund_after_send_ratio: z.number(), pay_refund_cnt: z.string(), pay_refund_product_cnt: z.string(), pay_refund_before_send_ratio: z.number(), refund_gmv: z.string(), refund_product_cnt: z.string(), refund_cnt: z.string(), refund_uv: z.string() }) }).optional(),
});
export type GetshopproductdataResponse = z.infer<typeof GetshopproductdataResponseSchema>;

/**
 * 获取商品列表
 * @see https://developers.weixin.qq.com/doc/store/shop/API/compass/api_getshopproductlist.html
 */
export const GetshopproductlistRequestSchema = z.object({
  /** 日期，格式YYYYMMDD */
  ds: z.string(),
  /** 分页参数，如果不填，默认只会返回10条商品数据 */
  limit: z.number().default(10).optional(),
  /** 分页参数，如果不填，默认只会返回10条商品数据 */
  offset: z.number().default(0).optional(),
});
export type GetshopproductlistRequest = z.infer<typeof GetshopproductlistRequestSchema>;
export const GetshopproductlistResponseSchema = z.object({
  /** 一共有多少条商品信息 */
  total_count: z.number().optional(),
  /** 商品列表 */
  product_list: z.array(z.object({ product_id: z.string(), head_img_url: z.string(), title: z.string(), price: z.string(), first_category_id: z.string(), second_category_id: z.string(), third_category_id: z.string(), data: z.object({ pay_gmv: z.string(), create_gmv: z.string(), create_cnt: z.string(), create_uv: z.string(), create_product_cnt: z.string(), pay_cnt: z.string(), pay_uv: z.string(), pay_product_cnt: z.string(), pure_pay_gmv: z.string(), pay_gmv_per_uv: z.string(), seller_actual_settle_amount: z.string(), platform_actual_commission: z.string(), finderuin_actual_commission: z.string(), captain_actual_commission: z.string(), seller_predict_settle_amount: z.string(), platform_predict_commission: z.string(), finderuin_predict_commission: z.string(), captain_predict_commission: z.string(), product_click_uv: z.string(), product_click_cnt: z.string(), pay_refund_gmv: z.string(), pay_refund_uv: z.string(), pay_refund_ratio: z.number(), pay_refund_after_send_ratio: z.number(), pay_refund_cnt: z.string(), pay_refund_product_cnt: z.string(), pay_refund_before_send_ratio: z.number(), refund_gmv: z.string(), refund_product_cnt: z.string(), refund_cnt: z.string(), refund_uv: z.string() }) })).optional(),
});
export type GetshopproductlistResponse = z.infer<typeof GetshopproductlistResponseSchema>;

/**
 * 获取店铺人群数据
 * @see https://developers.weixin.qq.com/doc/store/shop/API/compass/api_getshopsaleprofiledata.html
 */
export const GetshopsaleprofiledataRequestSchema = z.object({
  /** 日期，格式YYYYMMDD */
  ds: z.string().min(8).max(8),
  /** 用户类型 (1-商品曝光用户, 2-商品点击用户, 3-购买用户, 4-首购用户, 5-复购用户) */
  type: z.number(),
});
export type GetshopsaleprofiledataRequest = z.infer<typeof GetshopsaleprofiledataRequestSchema>;
export const GetshopsaleprofiledataResponseSchema = z.object({
  /** 店铺人群数据 */
  data: z.object({ field_list: z.array(z.object({ field_name: z.string(), data_list: z.array(z.object({ dim_key: z.string(), dim_value: z.string() })) })) }).optional(),
});
export type GetshopsaleprofiledataResponse = z.infer<typeof GetshopsaleprofiledataResponseSchema>;

/**
 * 创建优惠券
 * @see https://developers.weixin.qq.com/doc/store/shop/API/coupon/api_createcoupon.html
 */
export const CreatecouponRequestSchema = z.object({
  /** 优惠券类型 (1-商品条件折券, 2-商品满减券, 3-商品统一折扣券, 4-商品直减券, 101-店铺条件折扣券, 102-店...) */
  type: z.number(),
  /** 优惠券名称，最长10个中文字符 */
  name: z.string().max(30),
  /** 推广信息 */
  promote_info: z.object({ promote_type: z.number() }),
  /** 优惠信息 */
  discount_info: z.object({ discount_condition: z.object({ product_cnt: z.number(), product_price: z.number(), product_ids: z.array(z.string()) }), discount_num: z.number().min(1000).max(10000), discount_fee: z.number().max(20000) }).optional(),
  /** 领取信息 */
  receive_info: z.object({ start_time: z.number(), end_time: z.number(), limit_num_one_person: z.number().min(1), total_num: z.number().min(1) }),
  /** 有效期信息 */
  valid_info: z.object({ valid_type: z.number(), valid_day_num: z.number(), start_time: z.number(), end_time: z.number() }).optional(),
  /** 扩展信息 */
  ext_info: z.object({ jump_product_id: z.number(), notes: z.string() }).optional(),
  /** 自动生效信息 */
  auto_valid_info: z.object({ auto_valid_type: z.number() }).optional(),
});
export type CreatecouponRequest = z.infer<typeof CreatecouponRequestSchema>;
export const CreatecouponResponseSchema = z.object({
  /** 优惠券信息 */
  data: z.object({ coupon_id: z.string() }).optional(),
});
export type CreatecouponResponse = z.infer<typeof CreatecouponResponseSchema>;

/**
 * 获取优惠券详情
 * @see https://developers.weixin.qq.com/doc/store/shop/API/coupon/api_getcoupon.html
 */
export const GetcouponRequestSchema = z.object({
  /** 优惠券id */
  coupon_id: z.string(),
});
export type GetcouponRequest = z.infer<typeof GetcouponRequestSchema>;
export const GetcouponResponseSchema = z.object({
  /** 优惠券详情对象 */
  coupon: z.object({ coupon_id: z.string(), type: z.number(), status: z.number(), create_time: z.number(), update_time: z.number(), coupon_info: z.object({ name: z.string(), promote_info: z.object({ promote_type: z.number() }), discount_info: z.object({ discount_condition: z.object({ product_cnt: z.number(), product_price: z.number(), product_ids: z.array(z.string()) }), discount_num: z.number(), discount_fee: z.number() }), receive_info: z.object({ start_time: z.number(), end_time: z.number(), limit_num_one_person: z.number(), total_num: z.number() }), valid_info: z.object({ valid_type: z.number(), valid_day_num: z.number(), start_time: z.string(), end_time: z.string() }), ext_info: z.object({ jump_product_id: z.string(), notes: z.string(), valid_time: z.number(), invalid_time: z.number() }) }), stock_info: z.object({ issued_num: z.number(), receive_num: z.number(), used_num: z.number() }) }).optional(),
});
export type GetcouponResponse = z.infer<typeof GetcouponResponseSchema>;

/**
 * 获取优惠券ID列表
 * @see https://developers.weixin.qq.com/doc/store/shop/API/coupon/api_getcouponlist.html
 */
export const GetcouponlistRequestSchema = z.object({
  /** 优惠券状态 (1-未生效，编辑中, 2-生效, 3-已过期, 4-已作废, 5-删除, 200-过期 or 作废的券) */
  status: z.number(),
  /** 第几页（最小填1） */
  page: z.number().min(1),
  /** 每页数量(不超过200) */
  page_size: z.number().max(200),
  /** 翻页上下文，第一次请求填空，后续请求值为上次请求的返回 */
  page_ctx: z.string(),
});
export type GetcouponlistRequest = z.infer<typeof GetcouponlistRequestSchema>;
export const GetcouponlistResponseSchema = z.object({
  /** 优惠券列表 */
  coupons: z.array(z.object({ coupon_id: z.string() })).optional(),
  /** 优惠券总数 */
  total_num: z.number().optional(),
  /** 翻页上下文 */
  page_ctx: z.string().optional(),
});
export type GetcouponlistResponse = z.infer<typeof GetcouponlistResponseSchema>;

/**
 * 获取用户优惠券详情
 * @see https://developers.weixin.qq.com/doc/store/shop/API/coupon/api_getusercoupon.html
 */
export const GetusercouponRequestSchema = z.object({
  /** 用户优惠券ID */
  user_coupon_id: z.string(),
  /** 用户openid */
  openid: z.string(),
});
export type GetusercouponRequest = z.infer<typeof GetusercouponRequestSchema>;
export const GetusercouponResponseSchema = z.object({
  /** openid */
  openid: z.string().optional(),
  /** 用户unionid，小店接入open平台后生成的用户券会返回 */
  unionid: z.string().optional(),
  /** 用户优惠券详情对象 */
  user_coupon: z.object({ user_coupon_id: z.string(), coupon_id: z.string(), status: z.number(), create_time: z.number(), update_time: z.number(), end_time: z.number(), ext_info: z.object({ use_time: z.number() }), start_time: z.number(), order_id: z.string(), discount_fee: z.number() }).optional(),
});
export type GetusercouponResponse = z.infer<typeof GetusercouponResponseSchema>;

/**
 * 获取用户优惠券ID列表
 * @see https://developers.weixin.qq.com/doc/store/shop/API/coupon/api_getusercouponlist.html
 */
export const GetusercouponlistRequestSchema = z.object({
  /** 用户openid */
  openid: z.string(),
  /** 优惠券状态，不填时获取所有优惠券，填时获取特定状态优惠券 (100-生效中, 101-已过期, 102-已使用) */
  status: z.number().optional(),
  /** 页码 */
  page: z.number().min(1).max(10),
  /** 页大小 */
  page_size: z.number().max(200),
  /** 翻页上下文，第一次请求填空，后续请求值为上次请求的返回 */
  page_ctx: z.string(),
});
export type GetusercouponlistRequest = z.infer<typeof GetusercouponlistRequestSchema>;
export const GetusercouponlistResponseSchema = z.object({
  /** 优惠券列表 */
  user_coupon_list: z.array(z.object({ user_coupon_id: z.number(), coupon_id: z.number() })).optional(),
  /** 翻页上下文 */
  page_ctx: z.string().optional(),
});
export type GetusercouponlistResponse = z.infer<typeof GetusercouponlistResponseSchema>;

/**
 * 更新优惠券内容
 * @see https://developers.weixin.qq.com/doc/store/shop/API/coupon/api_updatecoupon.html
 */
export const UpdatecouponRequestSchema = z.object({
  /** 优惠券类型 (1-商品条件折券, 2-商品满减券, 3-商品统一折扣券, 4-商品直减券, 101-店铺条件折扣券, 102-店...) */
  type: z.number(),
  /** 优惠券名称，最长10个中文字符 */
  name: z.string().max(30),
  /** 推广信息对象 */
  promote_info: z.object({ promote_type: z.number() }),
  /** 优惠信息对象 */
  discount_info: z.object({ discount_condition: z.object({ product_cnt: z.number(), product_price: z.number(), product_ids: z.array(z.string()) }), discount_num: z.number().min(1000).max(10000), discount_fee: z.number().max(20000) }).optional(),
  /** 领取信息对象 */
  receive_info: z.object({ start_time: z.number(), end_time: z.number(), limit_num_one_person: z.number(), total_num: z.number() }),
  /** 有效期信息对象 */
  valid_info: z.object({ valid_type: z.number(), valid_day_num: z.number(), start_time: z.number(), end_time: z.number() }),
  /** 扩展信息对象 */
  ext_info: z.object({ jump_product_id: z.string(), notes: z.string() }).optional(),
  /** 优惠券ID */
  coupon_id: z.string(),
});
export type UpdatecouponRequest = z.infer<typeof UpdatecouponRequestSchema>;
export const UpdatecouponResponseSchema = z.object({
  /** 优惠券信息 */
  data: z.object({ coupon_id: z.string() }).optional(),
});
export type UpdatecouponResponse = z.infer<typeof UpdatecouponResponseSchema>;

/**
 * 更新优惠券状态
 * @see https://developers.weixin.qq.com/doc/store/shop/API/coupon/api_updatecouponstatus.html
 */
export const UpdatecouponstatusRequestSchema = z.object({
  /** 优惠券ID */
  coupon_id: z.string(),
  /** 优惠券状态，对应关系为：2：生效 4：已作废 5：删除 (2-生效, 4-已作废, 5-删除) */
  status: z.number(),
});
export type UpdatecouponstatusRequest = z.infer<typeof UpdatecouponstatusRequestSchema>;

export const GetFavoritesCountResponseSchema = z.object({
  /** 店铺首页收藏用户数 */
  favor_uv_acc_shop_homepage: z.number().optional(),
  /** 订单详情页收藏用户数 */
  favor_uv_acc_order_detail: z.number().optional(),
  /** 商品详情页收藏用户数 */
  favor_uv_acc_product_detail: z.number().optional(),
  /** 其他场景收藏用户数 */
  favor_uv_acc_other_scene: z.number().optional(),
  /** 所有收藏用户数 */
  favor_uv_acc_all: z.number().optional(),
});
export type GetFavoritesCountResponse = z.infer<typeof GetFavoritesCountResponseSchema>;

export const GetbalanceResponseSchema = z.object({
  /** 可提现余额 */
  available_amount: z.number().optional(),
  /** 待结算余额 */
  pending_amount: z.number().optional(),
  /** 二级商户号 */
  sub_mchid: z.string().optional(),
});
export type GetbalanceResponse = z.infer<typeof GetbalanceResponseSchema>;

export const GetbankacctResponseSchema = z.object({
  /** 结算账户信息 */
  account_info: z.object({ bank_account_type: z.string(), account_bank: z.string(), bank_address_code: z.string(), bank_branch_id: z.string(), bank_name: z.string(), account_number: z.string(), account_name: z.string() }).optional(),
});
export type GetbankacctResponse = z.infer<typeof GetbankacctResponseSchema>;

/**
 * 获取资金流水详情
 * @see https://developers.weixin.qq.com/doc/store/shop/API/funds/funds/api_getfundsflowdetail.html
 */
export const GetfundsflowdetailRequestSchema = z.object({
  /** 流水id，可通过获取资金流水列表获取 */
  flow_id: z.string(),
});
export type GetfundsflowdetailRequest = z.infer<typeof GetfundsflowdetailRequestSchema>;
export const GetfundsflowdetailResponseSchema = z.object({
  /** 流水信息 */
  funds_flow: z.object({ flow_id: z.string(), funds_type: z.number(), flow_type: z.number(), amount: z.number(), balance: z.number(), related_info_list: z.array(z.object({ related_type: z.number(), order_id: z.string(), aftersale_id: z.string(), withdraw_id: z.string(), bookkeeping_time: z.string(), insurance_id: z.string(), transaction_id: z.string(), guarantee_id: z.number(), present_id: z.number(), group_present_sub_order_id_list: z.string(), intra_city_shop_id: z.number() })), bookkeeping_time: z.string(), remark: z.string(), funds_type_desc: z.string() }).optional(),
});
export type GetfundsflowdetailResponse = z.infer<typeof GetfundsflowdetailResponseSchema>;

/**
 * 获取资金流水列表
 * @see https://developers.weixin.qq.com/doc/store/shop/API/funds/funds/api_getfundsflowlist.html
 */
export const GetfundsflowlistRequestSchema = z.object({
  /** 页码，从1开始 */
  page: z.number().min(1).optional(),
  /** 页数，不填默认为10 */
  page_size: z.number().min(1).default(10).optional(),
  /** 分页参数，翻页时写入上一页返回的next_key(page为上一页加一，并且page_size与上一页相同的时候才生效)，page * page_size >= */
  next_key: z.string().optional(),
  /** 流水产生的开始时间，unix时间戳 [timestamp] */
  start_time: z.number().optional(),
  /** 流水产生的结束时间，unix时间戳。当日资金流水出账时间为次日16点后，因此16点前end_time最大值为前1天的0点0分0秒，16点后end_time最大值 [timestamp] */
  end_time: z.number().optional(),
  /** 支付单号 */
  transaction_id: z.string().optional(),
});
export type GetfundsflowlistRequest = z.infer<typeof GetfundsflowlistRequestSchema>;
export const GetfundsflowlistResponseSchema = z.object({
  /** 流水单号列表 */
  flow_ids: z.array(z.string()).optional(),
  /** 是否还有下一页 */
  has_more: z.boolean().optional(),
  /** 分页参数，深翻页时使用 */
  next_key: z.string().optional(),
});
export type GetfundsflowlistResponse = z.infer<typeof GetfundsflowlistResponseSchema>;

/**
 * 获取提现记录
 * @see https://developers.weixin.qq.com/doc/store/shop/API/funds/funds/api_getwithdrawdetail.html
 */
export const GetwithdrawdetailRequestSchema = z.object({
  /** 提现单号，可从获取提现记录列表接口获取 */
  withdraw_id: z.string(),
});
export type GetwithdrawdetailRequest = z.infer<typeof GetwithdrawdetailRequestSchema>;
export const GetwithdrawdetailResponseSchema = z.object({
  /** 金额（分） */
  amount: z.number().optional(),
  /** 创建时间 [timestamp] */
  create_time: z.number().optional(),
  /** 更新时间 [timestamp] */
  update_time: z.number().optional(),
  /** 失败原因 */
  reason: z.string().optional(),
  /** 备注 */
  remark: z.string().optional(),
  /** 银行附言 */
  bank_memo: z.string().optional(),
  /** 银行名称 */
  bank_name: z.string().optional(),
  /** 银行账户 */
  bank_num: z.string().optional(),
  /** 提现状态 (CREATE_SUCCESS-受理成功, SUCCESS-提现成功, FAIL-提现失败, REFUND-提现退票...) */
  status: z.string().optional(),
});
export type GetwithdrawdetailResponse = z.infer<typeof GetwithdrawdetailResponseSchema>;

/**
 * 获取提现记录列表
 * @see https://developers.weixin.qq.com/doc/store/shop/API/funds/funds/api_getwithdrawlist.html
 */
export const GetwithdrawlistRequestSchema = z.object({
  /** 页码 */
  page_num: z.number(),
  /** 每页大小 */
  page_size: z.number(),
  /** 开始时间 [timestamp] */
  start_time: z.number().optional(),
  /** 结束时间 [timestamp] */
  end_time: z.number().optional(),
});
export type GetwithdrawlistRequest = z.infer<typeof GetwithdrawlistRequestSchema>;
export const GetwithdrawlistResponseSchema = z.object({
  /** 提现单号列表 */
  withdraw_ids: z.array(z.string()).optional(),
  /** 提现单号总数 */
  total_num: z.number().optional(),
});
export type GetwithdrawlistResponse = z.infer<typeof GetwithdrawlistResponseSchema>;

/**
 * 查询订单流水列表
 * @see https://developers.weixin.qq.com/doc/store/shop/API/funds/funds/api_listorderflow.html
 */
export const ListorderflowRequestSchema = z.object({
  /** 订单结算状态 (0-无，查询全部, 1-待结算, 2-无需结算, 60-结算完成, 100-部分结算) */
  order_settle_state: z.number(),
  /** 订单状态 (0-全部, 20-待发货, 30-待收货, 100-订单完成) */
  order_state: z.number().optional(),
  /** 订单支付方式 (0-全部, 1-普通支付, 2-先用后付) */
  order_pay_method: z.number().optional(),
  /** 指定订单id查询 */
  order_id: z.string().optional(),
  /** 分页信息 */
  pagination_info: z.object({ limit: z.number(), offset: z.number(), use_page_ctx: z.boolean(), page_ctx: z.string() }).optional(),
  /** 订单创建时间范围 */
  create_time_range: z.object({ begin: z.number(), end: z.number() }).optional(),
});
export type ListorderflowRequest = z.infer<typeof ListorderflowRequestSchema>;
export const ListorderflowResponseSchema = z.object({
  /** 满足条件的总数量，仅供参考（翻页的过程可能变动） */
  total_count: z.number().optional(),
  /** 订单流水列表 */
  data_list: z.array(z.object({ order_id: z.string(), order_state: z.number(), order_settle_state: z.number(), order_create_time: z.number(), order_paid_time: z.number(), order_pay_method: z.number(), order_type: z.number(), mch_received_amount: z.number(), expense_amount: z.number(), mch_settle_amount: z.number(), mch_settle_time: z.number(), product_list: z.array(z.object({ product_id: z.number(), param_list: z.array(z.object({ key: z.string(), value: z.string() })), sale_price: z.number(), count: z.number(), product_name: z.string(), is_gift: z.boolean() })), product_total_amount: z.number(), freight_amount: z.number(), change_down_price: z.number(), mch_discount_amount: z.number(), score_discount_amount: z.number(), buyer_paid_amount: z.number(), promoter_discount_amount: z.number(), platform_discount_amount: z.number(), national_subsidy_discount_amount: z.number(), freight_make_up_amount: z.number(), cross_shop_discount_amount: z.number(), buyer_refund_amount: z.number(), platform_discount_refund_amount: z.number(), promoter_discount_refund_amount: z.number(), original_platform_commission_amount: z.number(), platform_commission_amount: z.number(), freight_insurance_subsidy_amount: z.number(), supplier_commission_amount: z.number(), supplier_commission_settle_state: z.number(), promoter_commission_amount: z.number(), promoter_commission_settle_state: z.number(), freight_insurance_amount: z.number(), freight_insurance_settle_state: z.number(), freight_insurance_make_up_amount: z.number(), freight_insurance_make_up_order_id_list: z.array(z.number()), platform_commission_settle_time: z.number(), promoter_commission_settle_time: z.number(), supplier_commission_settle_time: z.number(), freight_insurance_settle_time: z.number(), freight_insurance_make_up_settle_time: z.number(), pre_freight_refund_amount: z.number(), post_settlement_expense: z.object({ buyer_refund_amount: z.number(), platform_discount_refund_amount: z.number(), promoter_refund_amount: z.number(), freight_insurance_make_up_amount: z.number(), freight_insurance_make_up_settle_state: z.number(), freight_insurance_make_up_order_id: z.number() }), refund_before_settlement: z.number(), other_expense_amount: z.number(), platform_commission_settle_state: z.number(), freight_insurance_make_up_settle_state: z.number(), intra_city_shop_id: z.number() })).optional(),
  /** 如果使用分页上下文，则返回此字段 */
  page_ctx: z.string().optional(),
});
export type ListorderflowResponse = z.infer<typeof ListorderflowResponseSchema>;

/**
 * 修改结算账户
 * @see https://developers.weixin.qq.com/doc/store/shop/API/funds/funds/api_setbankacct.html
 */
export const SetbankacctRequestSchema = z.object({
  /** 结算账户信息对象 */
  account_info: z.object({ bank_account_type: z.string(), account_bank: z.string(), bank_address_code: z.string(), bank_branch_id: z.string(), bank_name: z.string(), account_number: z.string(), account_bank4show: z.string(), account_name: z.string() }),
});
export type SetbankacctRequest = z.infer<typeof SetbankacctRequestSchema>;

/**
 * 商户提现
 * @see https://developers.weixin.qq.com/doc/store/shop/API/funds/funds/api_submitwithdraw.html
 */
export const SubmitwithdrawRequestSchema = z.object({
  /** 提现金额（单位：分） */
  amount: z.number(),
  /** 提现备注 */
  remark: z.string().optional(),
  /** 银行附言 */
  bank_memo: z.string().optional(),
});
export type SubmitwithdrawRequest = z.infer<typeof SubmitwithdrawRequestSchema>;
export const SubmitwithdrawResponseSchema = z.object({
  /** 提现单号 */
  withdraw_id: z.string().optional(),
  /** 二维码ticket，可用于获取二维码和查询二维码状态 */
  qrcode_ticket: z.string().optional(),
});
export type SubmitwithdrawResponse = z.infer<typeof SubmitwithdrawResponseSchema>;

/**
 * 批量新增联盟商品
 * @see https://developers.weixin.qq.com/doc/store/shop/API/league/item/api_batchadditem.html
 */
export const BatchadditemRequestSchema = z.object({
  /** 获取商品推广类别 (1-普通推广商品, 2-定向推广商品, 3-专属推广商品) */
  type: z.number(),
  /** 商品列表 */
  list: z.array(z.object({ product_id: z.number(), ratio: z.number().min(0).max(90) })),
  /** 推广达人列表，不超过30个，待废除后续以promoter_ids为准（类别为特殊推广商品时和promoter_ids二选一填） */
  finder_ids: z.array(z.string()).optional(),
  /** 推广开始时间戳 [timestamp] */
  begin_time: z.number().optional(),
  /** 推广结束时间戳 [timestamp] */
  end_time: z.number().optional(),
  /** 是否永久推广 */
  is_forerver: z.boolean().optional(),
  /** 达人带货id列表，不超过30个（类别为特殊推广商品时和finder_ids二选一填） */
  promoter_ids: z.array(z.string()).optional(),
});
export type BatchadditemRequest = z.infer<typeof BatchadditemRequestSchema>;
export const BatchadditemResponseSchema = z.object({
  /** 信息 */
  result_info_list: z.array(z.object({ errcode: z.number(), errmsg: z.string(), info_id: z.number(), product_id: z.number(), fail_finder_ids: z.array(z.string()), fail_promoter_ids: z.array(z.string()) })).optional(),
});
export type BatchadditemResponse = z.infer<typeof BatchadditemResponseSchema>;

/**
 * 删除联盟商品
 * @see https://developers.weixin.qq.com/doc/store/shop/API/league/item/api_deleteitem.html
 */
export const DeleteitemRequestSchema = z.object({
  /** 获取商品推广类别 (1-普通推广商品, 2-定向推广商品, 3-专属推广商品) */
  type: z.number(),
  /** 商品id，type为普通推广商品时必填 */
  product_id: z.number().optional(),
  /** 特殊推广商品计划id，type为特殊推广商品时必填 */
  info_id: z.number().optional(),
});
export type DeleteitemRequest = z.infer<typeof DeleteitemRequestSchema>;

/**
 * 获取联盟商品详情
 * @see https://developers.weixin.qq.com/doc/store/shop/API/league/item/api_getitem.html
 */
export const GetitemRequestSchema = z.object({
  /** 获取商品推广类别 (1-普通推广商品, 2-定向推广商品, 3-专属推广商品) */
  type: z.number(),
  /** 商品id，ype为普通推广商品时必填 */
  product_id: z.number().optional(),
  /** 特殊推广商品计划id，type为特殊推广商品时必填 */
  info_id: z.number().optional(),
  /** 是否获取特殊推广商品绑定的达人列表，type为特殊推广商品时有效 */
  need_relation: z.boolean().optional(),
  /** need_relation为真时有效，页面下标，下标从1开始，默认为1 */
  page_index: z.number().min(1).default(1).optional(),
  /** 获取达人数，不超过50，need_relation为真时必填 */
  page_size: z.number().min(1).max(50).optional(),
  /** need_relation为真时有效，是否需要返回该计划绑定达人总数 */
  need_total_num: z.boolean().optional(),
});
export type GetitemRequest = z.infer<typeof GetitemRequestSchema>;
export const GetitemResponseSchema = z.object({
  /** 推广商品信息 */
  item: z.object({ product_id: z.number(), type: z.number(), status: z.number(), ratio: z.number().min(0).max(90), exclusive_info: z.object({ info_id: z.number(), finder_num: z.number(), finder_info_list: z.array(z.object({ finder_id: z.string(), begin_time: z.number(), end_time: z.number(), is_forerver: z.number() })), promoter_info_list: z.array(z.object({ promoter_id: z.string(), begin_time: z.number(), end_time: z.number(), is_forerver: z.boolean() })) }), ext_info: z.object({ is_sale_forbidden: z.boolean(), is_banned: z.boolean() }) }).optional(),
});
export type GetitemResponse = z.infer<typeof GetitemResponseSchema>;

/**
 * 批量新增联盟机构推广
 * @see https://developers.weixin.qq.com/doc/store/shop/API/league/item/api_batchaddheadsupplieritem.html
 */
export const BatchaddheadsupplieritemRequestSchema = z.object({
  /** 机构开放唯一凭证，即 账号ID，机构可在「微信小店·联盟带货机构管理平台 - 设置 - 开放信息」中获得。（需要已完成机构开通，且账号没有异常状态） */
  headsupplier_appid: z.string(),
  /** 商品列表 */
  list: z.array(z.object({ product_id: z.number(), ratio: z.number().min(0).max(90), service_ratio: z.number().min(0).max(90), commission_type: z.number() })),
  /** 推广开始时间戳 [timestamp] */
  begin_time: z.number().optional(),
  /** 推广结束时间戳 [timestamp] */
  end_time: z.number().optional(),
  /** 是否永久推广 */
  is_forerver: z.boolean().optional(),
});
export type BatchaddheadsupplieritemRequest = z.infer<typeof BatchaddheadsupplieritemRequestSchema>;
export const BatchaddheadsupplieritemResponseSchema = z.object({
  /** 信息 */
  result_info_list: z.array(z.object({ errcode: z.number(), errmsg: z.string(), product_id: z.number() })).optional(),
});
export type BatchaddheadsupplieritemResponse = z.infer<typeof BatchaddheadsupplieritemResponseSchema>;

/**
 * 获取联盟商品推广列表
 * @see https://developers.weixin.qq.com/doc/store/shop/API/league/item/api_getitemlist.html
 */
export const GetitemlistRequestSchema = z.object({
  /** 商品推广类别 (1-普通推广商品, 2-定向推广商品, 3-专属推广商品) */
  type: z.number(),
  /** 单页商品数（不超过100） */
  page_size: z.number().min(1).max(100),
  /** 页面下标，下标从1开始，默认为1 */
  page_index: z.number().min(1).default(1).optional(),
  /** 商品id，获取特殊推广商品时有效 */
  product_id: z.number().optional(),
  /** 视频号id，获取特殊推广商品时有效，待废除后续以promoter_id为准 */
  finder_id: z.string().optional(),
  /** 由上次请求返回，顺序翻页时需要传入，会从上次返回的结果往后翻一页（填了该值后page_index不生效） */
  last_buffer: z.string().optional(),
  /** 是否需要返回满足筛选条件的商品总数（填last_buffer后该值无效） */
  need_total_num: z.boolean().default(false).optional(),
  /** 达人带货id，获取特殊推广商品时有效 */
  promoter_id: z.string().optional(),
});
export type GetitemlistRequest = z.infer<typeof GetitemlistRequestSchema>;
export const GetitemlistResponseSchema = z.object({
  /** 商品信息 */
  items: z.array(z.object({ product_id: z.number(), info_id: z.number() })).optional(),
  /** 是否还有剩余商品 */
  has_more: z.boolean().optional(),
  /** 商品总数 */
  total_num: z.number().optional(),
  /** 本次翻页的上下文，用于顺序翻页请求 */
  last_buffer: z.string().optional(),
});
export type GetitemlistResponse = z.infer<typeof GetitemlistResponseSchema>;

/**
 * 更新联盟商品信息
 * @see https://developers.weixin.qq.com/doc/store/shop/API/league/item/api_upditem.html
 */
export const UpditemRequestSchema = z.object({
  /** 获取商品推广类别 (1-普通推广商品, 2-定向推广商品, 3-专属推广商品) */
  type: z.number(),
  /** 商品id，可从获取联盟商品推广列表接口中获取，type为普通推广商品时必填 */
  product_id: z.number().optional(),
  /** 特殊推广商品计划id，type为特殊推广商品时必填 */
  info_id: z.number().optional(),
  /** 更新操作类别 (1-编辑并上架, 2-下架, 4-上架) */
  operate_type: z.number(),
  /** 推广佣金[0, 90]%，操作为编辑时必填 */
  ratio: z.number().min(0).max(90).optional(),
  /** 特殊推广信息，类别为特殊推广商品且操作为编辑时必填 */
  exclusive_info: z.object({ begin_time: z.number(), end_time: z.number(), add_finder_ids: z.array(z.string()), del_finder_ids: z.array(z.string()), is_forerver: z.boolean(), add_promoter_ids: z.array(z.string()), del_promoter_ids: z.array(z.string()) }).optional(),
});
export type UpditemRequest = z.infer<typeof UpditemRequestSchema>;
export const UpditemResponseSchema = z.object({
  /** 特殊推广商品计划id */
  info_id: z.number().optional(),
});
export type UpditemResponse = z.infer<typeof UpditemResponseSchema>;

/**
 * 新增达人
 * @see https://developers.weixin.qq.com/doc/store/shop/API/league/promoter/api_addpromoter.html
 */
export const AddpromoterRequestSchema = z.object({
  /** 视频号finder_id，待废除后续以promoter_id为准（和promoter_id二选一） */
  finder_id: z.string().optional(),
  /** 达人带货id（和finder_id二选一） */
  promoter_id: z.string().optional(),
});
export type AddpromoterRequest = z.infer<typeof AddpromoterRequestSchema>;

/**
 * 删除达人
 * @see https://developers.weixin.qq.com/doc/store/shop/API/league/promoter/api_deletepromoter.html
 */
export const DeletepromoterRequestSchema = z.object({
  /** 视频号finder_id，待废除后续以promoter_id为准 */
  finder_id: z.string().optional(),
  /** 达人带货id */
  promoter_id: z.string().optional(),
});
export type DeletepromoterRequest = z.infer<typeof DeletepromoterRequestSchema>;

/**
 * 获取达人详情信息
 * @see https://developers.weixin.qq.com/doc/store/shop/API/league/promoter/api_getpromoter.html
 */
export const GetpromoterRequestSchema = z.object({
  /** 视频号finder_id，待废除后续以promoter_id为准（和promoter_id二选一） */
  finder_id: z.string().optional(),
  /** 达人带货id（和finder_id二选一） */
  promoter_id: z.string().optional(),
});
export type GetpromoterRequest = z.infer<typeof GetpromoterRequestSchema>;
export const GetpromoterResponseSchema = z.object({
  /** 达人合作信息 */
  promoter: z.object({ finder_id: z.string(), status: z.number(), invite_time: z.number(), sale_product_number: z.number(), sale_gmv: z.number(), promoter_id: z.string() }).optional(),
});
export type GetpromoterResponse = z.infer<typeof GetpromoterResponseSchema>;

/**
 * 获取商店达人列表
 * @see https://developers.weixin.qq.com/doc/store/shop/API/league/promoter/api_getpromoterlist.html
 */
export const GetpromoterlistRequestSchema = z.object({
  /** 获取该状态下的达人列表 */
  status: z.number().optional(),
  /** 页面下标，下标从1开始，默认为1 */
  page_index: z.number().min(1).default(1).optional(),
  /** 单页达人数（不超过200） */
  page_size: z.number().min(1).max(200),
});
export type GetpromoterlistRequest = z.infer<typeof GetpromoterlistRequestSchema>;
export const GetpromoterlistResponseSchema = z.object({
  /** 达人finder_id列表 */
  finder_ids: z.array(z.string()).optional(),
  /** 达人总数 */
  total_num: z.number().min(0).optional(),
  /** 后面是否还有（true: 还有内容; false: 已结束） */
  continue_flag: z.boolean().optional(),
  /** 达人带货id列表 */
  promoter_ids: z.array(z.string()).optional(),
});
export type GetpromoterlistResponse = z.infer<typeof GetpromoterlistResponseSchema>;

/**
 * 编辑达人
 * @see https://developers.weixin.qq.com/doc/store/shop/API/league/promoter/api_updpromoter.html
 */
export const UpdpromoterRequestSchema = z.object({
  /** 操作枚举值 (1-取消邀请, 2-结束合作) */
  type: z.number(),
  /** 视频号finder_id，待废除后续以promoter_id为准 */
  finder_id: z.string().optional(),
  /** 达人带货id */
  promoter_id: z.string().optional(),
});
export type UpdpromoterRequest = z.infer<typeof UpdpromoterRequestSchema>;

/**
 * 查询开通的电子面单网点/账号信息
 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-delivery/ewaybill/api_ewaybill_getacct.html
 */
export const EwaybillGetRequestSchema = z.object({
  /** 快递公司编码 (ZTO-中通, YTO-圆通, YUNDA-韵达, JTSD-极兔, STO-申通, SF-顺丰, JD-京东, ...) */
  delivery_id: z.string().optional(),
  /** 是否需要查询库存 */
  need_balance: z.boolean(),
  /** 状态过滤 (1-绑定审核中, 2-取消绑定审核中, 3-已绑定, 4-已解除绑定, 5-绑定未通过, 6-取消绑定未通过) */
  status: z.number().optional(),
  /** 分页起始位置，默认0 */
  offset: z.number().min(0).default(0).optional(),
  /** 单次请求数量，当need_balance=true请注意设置合理的limit推荐值小于20 */
  limit: z.number().min(1).max(20),
  /** 物流账号编码：每绑定一个物流商网点/月结账号分配一个acct_id */
  acct_id: z.string().optional(),
});
export type EwaybillGetRequest = z.infer<typeof EwaybillGetRequestSchema>;
export const EwaybillGetResponseSchema = z.object({
  /** 总条数 */
  total_num: z.number().min(0).optional(),
  /** 账号列表 */
  account_list: z.array(z.object({ delivery_id: z.string(), acct_type: z.number(), company_type: z.number(), shop_id: z.string(), acct_id: z.string(), status: z.number(), available: z.number().min(0), allocated: z.number().min(0), recycled: z.number().min(0), cancel: z.number().min(0), monthly_card: z.string(), site_info: z.object({ delivery_id: z.string(), site_status: z.number().min(1), site_code: z.string(), site_name: z.string(), address: z.object({ city_code: z.string(), city_name: z.string(), country_code: z.string(), detail_address: z.string(), district_code: z.string(), district_name: z.string(), province_code: z.string(), province_name: z.string(), street_code: z.string(), street_name: z.string() }), contact: z.object({ mobile: z.string(), name: z.string(), phone: z.string() }), site_fullname: z.string() }), share: z.object({ delivery_id: z.string(), site_code: z.string(), site_name: z.string(), acct_id: z.string(), nickname: z.string(), share_id: z.string(), shop_id: z.string(), monthly_card: z.string(), update_time: z.number().min(0) }), sender_address: z.object({ province: z.string(), city: z.string(), county: z.string(), street: z.string(), address: z.string() }), balance_retcode: z.number().min(0), balance_retmsg: z.string(), delivery_msg: z.string(), available: z.number().min(0), allocated: z.number().min(0), recycled: z.number().min(0), cancel: z.number().min(0) })).optional(),
});
export type EwaybillGetResponse = z.infer<typeof EwaybillGetResponseSchema>;

/**
 * 电子面单子件追加
 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-delivery/ewaybill/api_ewaybill_addsuborder.html
 */
export const EwaybillAddsuborderRequestSchema = z.object({
  /** 电子面单订单号 */
  ewaybill_order_id: z.number(),
  /** 运单号 */
  waybill_id: z.string(),
  /** 快递公司id */
  delivery_id: z.string(),
  /** 追加面单数量 */
  add_package_quantity: z.number().min(1).max(300),
  /** 面单模板id */
  template_id: z.string().optional(),
  /** 店铺id（从查询开通账号信息接口获取） */
  shop_id: z.string(),
  /** 电子面单账号id（从查询开通账号信息接口获取） */
  ewaybill_acct_id: z.string(),
  /** 包裹的体积和重量信息，顺丰支持该字段 */
  subpackage_list: z.array(z.object({ weight_g: z.number(), space_x: z.number(), space_y: z.number(), space_z: z.number(), package_no: z.string() })).optional(),
  /** 子单额外信息，如用于填写商家与快递定义的交易分单类型等 */
  sub_order_ext_info: z.string().optional(),
});
export type EwaybillAddsuborderRequest = z.infer<typeof EwaybillAddsuborderRequestSchema>;
export const EwaybillAddsuborderResponseSchema = z.object({
  /** 快递公司错误码 */
  delivery_error_msg: z.string().optional(),
  /** 快递单号 */
  waybill_id: z.string().optional(),
  /** 子母单号列表 */
  waybill_id_list: z.array(z.object({ waybill_id: z.string(), waybill_type: z.number(), create_time: z.number() })).optional(),
  /** 如果请求参数填了template_id，则返回打印报文信息，可以传给打印组件打印面单。 */
  print_info: z.string().optional(),
  /** 电子面单订单id */
  ewaybill_order_id: z.string().optional(),
});
export type EwaybillAddsuborderResponse = z.infer<typeof EwaybillAddsuborderResponseSchema>;

/**
 * 批量打印通知
 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-delivery/ewaybill/api_ewaybill_batchprintorder.html
 */
export const EwaybillBatchprintRequestSchema = z.object({
  /** 订单信息数组 */
  req_list: z.array(z.object({ ewaybill_order_id: z.string(), delivery_id: z.string(), waybill_id: z.string(), re_print: z.number() })),
});
export type EwaybillBatchprintRequest = z.infer<typeof EwaybillBatchprintRequestSchema>;
export const EwaybillBatchprintResponseSchema = z.object({
  /** 成功的单号列表 */
  succ_ewaybill_order_id: z.array(z.string()).optional(),
  /** 失败的单号列表 */
  fail_ewaybill_order_id: z.array(z.string()).optional(),
});
export type EwaybillBatchprintResponse = z.infer<typeof EwaybillBatchprintResponseSchema>;

/**
 * 电子面单取消下单
 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-delivery/ewaybill/api_ewaybill_cancelorder.html
 */
export const EwaybillCancelRequestSchema = z.object({
  /** 电子面单订单id，全局唯一id */
  ewaybill_order_id: z.string(),
  /** 快递公司id */
  delivery_id: z.string(),
  /** 快递单号 */
  waybill_id: z.string(),
});
export type EwaybillCancelRequest = z.infer<typeof EwaybillCancelRequestSchema>;
export const EwaybillCancelResponseSchema = z.object({
  /** 快递公司错误码 */
  delivery_error_msg: z.string().optional(),
});
export type EwaybillCancelResponse = z.infer<typeof EwaybillCancelResponseSchema>;

/**
 * 电子面单取号
 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-delivery/ewaybill/api_ewaybill_createorder.html
 */
export const EwaybillCreateRequestSchema = z.object({
  /** 电子面单订单 id，全局唯一 id（从预取号接口获取或者自定义），数据内容要求是 Uint64 */
  ewaybill_order_id: z.string(),
  /** 快递公司 id，可通过获取快递公司列表查询 */
  delivery_id: z.string(),
  /** 网点编码 */
  site_code: z.string().optional(),
  /** 物流账号编码：每绑定一个物流商网点/月结账号分配一个 acct_id */
  ewaybill_acct_id: z.string(),
  /** 寄件人，传明文 */
  sender: z.object({ name: z.string(), mobile: z.string(), province: z.string(), city: z.string(), county: z.string(), street: z.string(), address: z.string() }),
  /** 收件人，传小店订单内的用户收件人的信息文本即可。此字段只做非空参数校验 */
  receiver: z.object({ name: z.string(), mobile: z.string(), province: z.string(), city: z.string(), county: z.string(), street: z.string(), address: z.string() }),
  /** 订单信息 */
  ec_order_list: z.array(z.object({ ec_order_id: z.number(), goods_list: z.array(z.object({ good_name: z.string(), good_count: z.number(), product_id: z.number(), sku_id: z.number(), out_product_id: z.string(), out_sku_id: z.string(), out_goods_info: z.string(), goods_ext: z.string(), sn_info: z.object({ imei1: z.string(), imei2: z.string(), sn_code: z.string() }) })), ewaybill_order_code: z.string(), ewaybill_order_appid: z.string() })),
  /** 备注 */
  remark: z.string().optional(),
  /** 面单主体 ID：每个商家分配的唯一 shop_id */
  shop_id: z.string(),
  /** 退货地址 */
  return_address: z.object({ name: z.string(), mobile: z.string(), province: z.string(), city: z.string(), county: z.string(), street: z.string(), address: z.string() }).optional(),
  /** 如果需要获取打印报文，则填该字段。回包返回 print_info。如无需使用后台模板，可直接传递 template_type 做为默认模板 */
  template_id: z.string().optional(),
  /** 支持的类型，枚举值默认为 1，加盟型可以不填 (1-京东标快, 2-京东特快, 3-生鲜标快, 4-生鲜特快, 5-电商标快, 6-特惠包裹, 7-京东特惠, 8...) */
  order_type: z.number().optional(),
  /** 保价等增值服务 */
  order_vas_list: z.array(z.object({ vas_type: z.string(), vas_value: z.string(), vas_detail: z.string() })).optional(),
  /** 温层等补充字段 */
  ext_info: z.object({ temperature_range: z.number(), package_weight_g: z.number(), package_space_x: z.number(), package_space_y: z.number(), package_space_z: z.number(), package_volume_ccm: z.number() }).optional(),
  /** 预约上门取件、子母件等发货信息字段 */
  delivery_info: z.object({ delivery_type: z.number(), collected_time_begin: z.string(), collected_time_end: z.string(), package_quantity: z.number().min(2).max(300), subpackage_list: z.array(z.object({ weight_g: z.number(), space_x: z.number(), space_y: z.number(), space_z: z.number(), package_no: z.string() })) }).optional(),
});
export type EwaybillCreateRequest = z.infer<typeof EwaybillCreateRequestSchema>;
export const EwaybillCreateResponseSchema = z.object({
  /** 电子面单订单 id */
  ewaybill_order_id: z.string().optional(),
  /** 快递单号 */
  waybill_id: z.string().optional(),
  /** 快递公司错误码 */
  delivery_error_msg: z.string().optional(),
  /** 如果请求参数填了 template_id，则返回打印报文信息 */
  print_info: z.string().optional(),
  /** 子母单号列表 */
  waybill_id_list: z.array(z.object({ waybill_id: z.string(), waybill_type: z.number(), create_time: z.string() })).optional(),
  /** 商品订单存在被判断疑似存在风险时返回 */
  order_risk_info: z.array(z.object({ risk_ec_order_info: z.object({ ec_order_id: z.number(), goods_list: z.array(z.object({ good_name: z.string(), good_count: z.number(), product_id: z.number(), sku_id: z.number(), out_product_id: z.string(), out_sku_id: z.string(), out_goods_info: z.string(), goods_ext: z.string() })), ewaybill_order_code: z.string(), ewaybill_order_appid: z.string() }), risk_msg: z.string() })).optional(),
});
export type EwaybillCreateResponse = z.infer<typeof EwaybillCreateResponseSchema>;

/**
 * 电子面单预取号
 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-delivery/ewaybill/api_ewaybill_precreateorder.html
 */
export const EwaybillPrecreateRequestSchema = z.object({
  /** 快递公司id */
  delivery_id: z.string(),
  /** 网点编码 */
  site_code: z.string().optional(),
  /** 物流账号客户编码：每绑定一个物流商网点/月结账号分配一个acct_id */
  ewaybill_acct_id: z.string(),
  /** 寄件人，传明文 */
  sender: z.object({ name: z.string(), mobile: z.string(), province: z.string(), city: z.string(), county: z.string(), street: z.string(), address: z.string() }),
  /** 收件人，传小店订单内获取到的用户信息即可 */
  receiver: z.object({ name: z.string(), mobile: z.string(), province: z.string(), city: z.string(), county: z.string(), street: z.string(), address: z.string() }),
  /** 订单信息 */
  ec_order_list: z.array(z.object({ ec_order_id: z.number(), goods_list: z.array(z.object({ good_name: z.string(), good_count: z.number(), product_id: z.number(), sku_id: z.number() })), ewaybill_order_code: z.string(), ewaybill_order_appid: z.string() })),
  /** 备注 */
  remark: z.string().optional(),
  /** 面单主体ID：每个供货商分配的唯一shop_id（从ewaybill_getacct接口获取） */
  shop_id: z.string(),
});
export type EwaybillPrecreateRequest = z.infer<typeof EwaybillPrecreateRequestSchema>;
export const EwaybillPrecreateResponseSchema = z.object({
  /** 电子面单订单id，用于取号接口请求参数 */
  ewaybill_order_id: z.string().optional(),
});
export type EwaybillPrecreateResponse = z.infer<typeof EwaybillPrecreateResponseSchema>;

/**
 * 打印成功通知
 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-delivery/ewaybill/api_ewaybill_printorder.html
 */
export const EwaybillRequestSchema = z.object({
  /** 电子面单订单id，全局唯一id */
  ewaybill_order_id: z.string(),
  /** 快递公司id */
  delivery_id: z.string(),
  /** 快递单号 */
  waybill_id: z.string(),
  /** 1 补打单成功 0 首次打单成功 (0-首次打单成功, 1-补打单成功) */
  re_print: z.number(),
});
export type EwaybillRequest = z.infer<typeof EwaybillRequestSchema>;

export const EwaybillConfigResponseSchema = z.object({
  /** 所有快递公司模板信息汇总，delivery_id为快递公司id，template_type为模版类型 */
  config: z.object({ template_type: z.object({ type: z.string().default('"single"'), desc: z.string().default('"一联单标准模板"'), width: z.number(), height: z.number(), url: z.string(), custom_config: z.object({ width: z.number(), height: z.number(), top: z.number(), left: z.number() }) }) }).optional(),
});
export type EwaybillConfigResponse = z.infer<typeof EwaybillConfigResponseSchema>;

/**
 * 删除面单模版
 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-delivery/ewaybill/api_ewaybill_deltemplate.html
 */
export const EwaybillDeleteRequestSchema = z.object({
  /** 快递公司编码 */
  delivery_id: z.string(),
  /** 模板id */
  template_id: z.string(),
});
export type EwaybillDeleteRequest = z.infer<typeof EwaybillDeleteRequestSchema>;

/**
 * 根据模板ID获取面单模板信息
 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-delivery/ewaybill/api_ewaybill_gettemplatebyid.html
 */
export const EwaybillGetbyidRequestSchema = z.object({
  /** 快递公司编码 */
  delivery_id: z.string(),
  /** 模板id */
  template_id: z.string(),
});
export type EwaybillGetbyidRequest = z.infer<typeof EwaybillGetbyidRequestSchema>;
export const EwaybillGetbyidResponseSchema = z.object({
  /** 模板信息 */
  template_info: z.object({ template_id: z.string(), template_name: z.string(), template_desc: z.string().default('一联单标准模板'), template_type: z.string().default('single'), options: z.array(z.object({ option_id: z.number(), font_size: z.number(), is_bold: z.boolean(), is_open: z.boolean() })), is_default: z.boolean(), create_time: z.number(), update_time: z.number() }).optional(),
});
export type EwaybillGetbyidResponse = z.infer<typeof EwaybillGetbyidResponseSchema>;

/**
 * 更新面单模版
 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-delivery/ewaybill/api_ewaybill_updatetemplate.html
 */
export const EwaybillUpdateRequestSchema = z.object({
  /** 快递公司编码 */
  delivery_id: z.string(),
  /** 模板信息 */
  info: z.object({ template_id: z.string(), template_name: z.string().max(200), template_desc: z.string().default('一联单标准模板'), template_type: z.string().default('single'), options: z.array(z.object({ option_id: z.number(), font_size: z.number().min(0).max(1), is_bold: z.boolean(), is_open: z.boolean() })), is_default: z.boolean() }),
});
export type EwaybillUpdateRequest = z.infer<typeof EwaybillUpdateRequestSchema>;

/**
 * 根据运单号获取真实手机号
 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-delivery/phonenumber/api_getrealnumber.html
 */
export const GetrealnumberRequestSchema = z.object({
  /** 运单号 */
  waybill_id: z.string(),
  /** 虚拟号 */
  private_phone: z.string().optional(),
});
export type GetrealnumberRequest = z.infer<typeof GetrealnumberRequestSchema>;
export const GetrealnumberResponseSchema = z.object({
  /** 真实手机号 */
  phone: z.string().optional(),
});
export type GetrealnumberResponse = z.infer<typeof GetrealnumberResponseSchema>;

/**
 * 获取虚拟号码池
 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-delivery/phonenumber/api_getprivatenumberpool.html
 */
export const GetprivatenumberpoolRequestSchema = z.object({
  /** 分页参数，上一页请求返回。第一页可以不填 */
  next_key: z.string(),
  /** 每页数量 */
  page_size: z.number().max(100),
});
export type GetprivatenumberpoolRequest = z.infer<typeof GetprivatenumberpoolRequestSchema>;
export const GetprivatenumberpoolResponseSchema = z.object({
  /** 总数 */
  total_num: z.number().optional(),
  /** 是否还有下一页，true:有下一页；false:已经结束，没有下一页。 */
  has_more: z.boolean().optional(),
  /** 分页参数，下一个页请求回传 */
  next_key: z.string().optional(),
  /** 订单号列表 */
  phonenumbers: z.array(z.string()).optional(),
});
export type GetprivatenumberpoolResponse = z.infer<typeof GetprivatenumberpoolResponseSchema>;

/**
 * 根据运单号获取虚拟手机号
 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-delivery/phonenumber/api_getvirtualnumber.html
 */
export const GetvirtualnumberRequestSchema = z.object({
  /** 运单号 */
  waybill_id: z.string(),
});
export type GetvirtualnumberRequest = z.infer<typeof GetvirtualnumberRequestSchema>;
export const GetvirtualnumberResponseSchema = z.object({
  /** 打码的真实手机号 */
  masked_real_phone: z.string().optional(),
  /** 完整虚拟号:主机号-分机号 */
  virtual_phone: z.string().optional(),
  /** 虚拟号的主机号 */
  main_phone: z.string().optional(),
});
export type GetvirtualnumberResponse = z.infer<typeof GetvirtualnumberResponseSchema>;

/**
 * 增加运费模版
 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-delivery/merchant/api_addfreighttemplate.html
 */
export const AddfreighttemplateRequestSchema = z.object({
  /** 运费模板详细信息 */
  freight_template: z.object({ template_id: z.number(), name: z.string(), valuation_type: z.number(), send_time: z.string(), address_info: z.object({ user_name: z.string(), postal_code: z.string(), province_name: z.string(), city_name: z.string(), county_name: z.string(), detail_info: z.string(), national_code: z.string(), tel_number: z.string(), lat: z.number(), lng: z.number(), house_number: z.string() }), delivery_type: z.number(), shipping_method: z.number(), all_condition_free_detail: z.object({ condition_free_detail_list: z.array(z.object({ address_infos: z.array(z.object({ user_name: z.string(), postal_code: z.string(), province_name: z.string(), city_name: z.string(), county_name: z.string(), detail_info: z.string(), national_code: z.string(), tel_number: z.string(), lat: z.number(), lng: z.number(), house_number: z.string() })), min_piece: z.number(), min_weight: z.number(), min_amount: z.number(), valuation_flag: z.number(), amount_flag: z.number() })) }), all_freight_calc_method: z.object({ freight_calc_method_list: z.array(z.object({ address_infos: z.array(z.object({ user_name: z.string(), postal_code: z.string(), province_name: z.string(), city_name: z.string(), county_name: z.string(), detail_info: z.string(), national_code: z.string(), tel_number: z.string(), lat: z.number(), lng: z.number(), house_number: z.string() })), is_default: z.boolean(), delivery_id: z.string(), first_val_amount: z.number(), first_price: z.number(), second_val_amount: z.number(), second_price: z.number() })) }), create_time: z.number(), update_time: z.number(), is_default: z.boolean(), not_send_area: z.object({ address_infos: z.array(z.object({ user_name: z.string(), postal_code: z.string(), province_name: z.string(), city_name: z.string(), county_name: z.string(), detail_info: z.string(), national_code: z.string(), tel_number: z.string(), lat: z.number(), lng: z.number(), house_number: z.string() })) }) }),
});
export type AddfreighttemplateRequest = z.infer<typeof AddfreighttemplateRequestSchema>;
export const AddfreighttemplateResponseSchema = z.object({
  /** 运费模板id */
  template_id: z.string().optional(),
});
export type AddfreighttemplateResponse = z.infer<typeof AddfreighttemplateResponseSchema>;

/**
 * 添加地址
 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-delivery/address/api_addaddress.html
 */
export const AddaddressRequestSchema = z.object({
  /** 地址信息 */
  address_detail: z.object({ address_id: z.number(), name: z.string(), address_info: z.object({ user_name: z.string(), postal_code: z.string(), province_name: z.string(), city_name: z.string(), county_name: z.string(), detail_info: z.string(), national_code: z.string(), tel_number: z.string(), lat: z.number(), lng: z.number(), house_number: z.string() }), landline: z.string(), send_addr: z.boolean(), default_send: z.boolean(), recv_addr: z.boolean(), default_recv: z.boolean(), create_time: z.number(), update_time: z.number(), address_type: z.object({ same_city: z.number(), pickup: z.number() }) }),
});
export type AddaddressRequest = z.infer<typeof AddaddressRequestSchema>;
export const AddaddressResponseSchema = z.object({
  /** 新的地址id */
  address_id: z.string().optional(),
});
export type AddaddressResponse = z.infer<typeof AddaddressResponseSchema>;

/**
 * 删除地址
 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-delivery/address/api_deleteaddress.html
 */
export const DeleteaddressRequestSchema = z.object({
  /** 地址id */
  address_id: z.string(),
});
export type DeleteaddressRequest = z.infer<typeof DeleteaddressRequestSchema>;

/**
 * 获取地址详情
 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-delivery/address/api_getaddress.html
 */
export const GetaddressRequestSchema = z.object({
  /** 地址id */
  address_id: z.string(),
});
export type GetaddressRequest = z.infer<typeof GetaddressRequestSchema>;
export const GetaddressResponseSchema = z.object({
  /** 地址详情 */
  address_detail: z.object({ address_id: z.number(), name: z.string(), address_info: z.object({ user_name: z.string(), postal_code: z.string(), province_name: z.string(), city_name: z.string(), county_name: z.string(), detail_info: z.string(), national_code: z.string(), tel_number: z.string(), lat: z.number(), lng: z.number(), house_number: z.string() }), landline: z.string(), send_addr: z.boolean(), default_send: z.boolean(), recv_addr: z.boolean(), default_recv: z.boolean(), create_time: z.number(), update_time: z.number(), address_type: z.object({ same_city: z.number(), pickup: z.number() }) }).optional(),
});
export type GetaddressResponse = z.infer<typeof GetaddressResponseSchema>;

/**
 * 获取地址列表
 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-delivery/address/api_getaddresslist.html
 */
export const GetaddresslistRequestSchema = z.object({
  /** 获取的偏移量 */
  offset: z.number(),
  /** 获取的个数 */
  limit: z.number(),
});
export type GetaddresslistRequest = z.infer<typeof GetaddresslistRequestSchema>;
export const GetaddresslistResponseSchema = z.object({
  /** 地址id列表 */
  address_id_list: z.array(z.string()).optional(),
});
export type GetaddresslistResponse = z.infer<typeof GetaddresslistResponseSchema>;

/**
 * 更新地址
 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-delivery/address/api_updateaddress.html
 */
export const UpdateaddressRequestSchema = z.object({
  /** 地址信息 */
  address_detail: z.object({ address_id: z.number(), name: z.string(), address_info: z.object({ user_name: z.string(), postal_code: z.string(), province_name: z.string(), city_name: z.string(), county_name: z.string(), detail_info: z.string(), national_code: z.string(), tel_number: z.string(), lat: z.number(), lng: z.number(), house_number: z.string() }), landline: z.string(), send_addr: z.boolean(), default_send: z.boolean(), recv_addr: z.boolean(), default_recv: z.boolean(), create_time: z.number(), update_time: z.number(), address_type: z.object({ same_city: z.number(), pickup: z.number() }) }),
});
export type UpdateaddressRequest = z.infer<typeof UpdateaddressRequestSchema>;

/**
 * 查询运费模版
 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-delivery/merchant/api_getfreighttemplatedetail.html
 */
export const GetfreighttemplatedetailRequestSchema = z.object({
  /** 运费模板id */
  template_id: z.string(),
});
export type GetfreighttemplatedetailRequest = z.infer<typeof GetfreighttemplatedetailRequestSchema>;
export const GetfreighttemplatedetailResponseSchema = z.object({
  /** 运费模板详细信息 */
  freight_template: z.object({ template_id: z.string(), name: z.string(), valuation_type: z.string(), send_time: z.string(), address_info: z.object({ user_name: z.string(), postal_code: z.string(), province_name: z.string(), city_name: z.string(), county_name: z.string(), detail_info: z.string(), national_code: z.string(), tel_number: z.string(), lat: z.number(), lng: z.number(), house_number: z.string() }), delivery_type: z.string(), shipping_method: z.string(), all_condition_free_detail: z.object({ condition_free_detail_list: z.array(z.object({ address_infos: z.array(z.object({ user_name: z.string(), postal_code: z.string(), province_name: z.string(), city_name: z.string(), county_name: z.string(), detail_info: z.string(), national_code: z.string(), tel_number: z.string(), lat: z.number(), lng: z.number(), house_number: z.string() })), min_piece: z.number(), min_weight: z.number(), min_amount: z.number(), valuation_flag: z.number(), amount_flag: z.number() })) }), all_freight_calc_method: z.object({ freight_calc_method_list: z.array(z.object({ address_infos: z.array(z.object({ user_name: z.string(), postal_code: z.string(), province_name: z.string(), city_name: z.string(), county_name: z.string(), detail_info: z.string(), national_code: z.string(), tel_number: z.string(), lat: z.number(), lng: z.number(), house_number: z.string() })), is_default: z.boolean(), delivery_id: z.string(), first_val_amount: z.number(), first_price: z.number(), second_val_amount: z.number(), second_price: z.number() })) }), create_time: z.number(), update_time: z.number(), is_default: z.boolean(), not_send_area: z.object({ address_infos: z.array(z.object({ user_name: z.string(), postal_code: z.string(), province_name: z.string(), city_name: z.string(), county_name: z.string(), detail_info: z.string(), national_code: z.string(), tel_number: z.string(), lat: z.number(), lng: z.number(), house_number: z.string() })) }) }).optional(),
});
export type GetfreighttemplatedetailResponse = z.infer<typeof GetfreighttemplatedetailResponseSchema>;

/**
 * 获取运费模板列表
 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-delivery/merchant/api_getfreighttemplatelist.html
 */
export const GetfreighttemplatelistRequestSchema = z.object({
  /** 起始位置 */
  offset: z.number(),
  /** 获取个数 */
  limit: z.number(),
});
export type GetfreighttemplatelistRequest = z.infer<typeof GetfreighttemplatelistRequestSchema>;
export const GetfreighttemplatelistResponseSchema = z.object({
  /** 运费模板id列表 */
  template_id_list: z.array(z.string()).optional(),
});
export type GetfreighttemplatelistResponse = z.infer<typeof GetfreighttemplatelistResponseSchema>;

/**
 * 添加待认证的手机号
 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-order/api_privatenumberaddphone.html
 */
export const PrivatenumberAddPhoneRequestSchema = z.object({
  /** 待认证的手机号 */
  mobile: z.string(),
  /** 通过PrivateNumberSendVerifyCode接口获取的短信验证码 */
  verify_code: z.string(),
  /** 小店成员的微信号 */
  wxusername: z.string(),
});
export type PrivatenumberAddPhoneRequest = z.infer<typeof PrivatenumberAddPhoneRequestSchema>;
export const PrivatenumberAddPhoneResponseSchema = z.object({
  /** 认证链接，获取认证链接后在手机上打开进入运营商的页面进行实名认证 */
  qrcode_url: z.string().optional(),
  /** 认证状态 (1-认证成功, 2-认证失败, 3-运营商审核中) */
  status: z.number().optional(),
});
export type PrivatenumberAddPhoneResponse = z.infer<typeof PrivatenumberAddPhoneResponseSchema>;

/**
 * 获取小店手机号认证状态
 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-order/api_privatenumbergetshopphone.html
 */
export const PrivateNumberGetShopPhoneRequestSchema = z.object({
  /** 手机号 */
  mobile: z.string(),
});
export type PrivateNumberGetShopPhoneRequest = z.infer<typeof PrivateNumberGetShopPhoneRequestSchema>;
export const PrivateNumberGetShopPhoneResponseSchema = z.object({
  /** 认证状态 (1-认证成功, 2-认证失败, 3-运营商审核中) */
  status: z.number().optional(),
  /** 审核失败原因 */
  fail_reason: z.string().optional(),
});
export type PrivateNumberGetShopPhoneResponse = z.infer<typeof PrivateNumberGetShopPhoneResponseSchema>;

/**
 * 获取短信验证码
 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-order/api_privatenumbersendverifycode.html
 */
export const PrivateNumberSendVerifyCodeRequestSchema = z.object({
  /** 需要实名认证的手机号 */
  mobile: z.string(),
});
export type PrivateNumberSendVerifyCodeRequest = z.infer<typeof PrivateNumberSendVerifyCodeRequestSchema>;

/**
 * 更新运费模版
 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-delivery/merchant/api_updatefreighttemplate.html
 */
export const UpdatefreighttemplateRequestSchema = z.object({
  /** 运费模板详细信息 */
  freight_template: z.object({ template_id: z.string(), name: z.string(), valuation_type: z.string(), send_time: z.string(), address_info: z.object({ user_name: z.string(), postal_code: z.string(), province_name: z.string(), city_name: z.string(), county_name: z.string(), detail_info: z.string(), national_code: z.string(), tel_number: z.string(), lat: z.number(), lng: z.number(), house_number: z.string() }), delivery_type: z.string(), shipping_method: z.string(), all_condition_free_detail: z.object({ condition_free_detail_list: z.array(z.object({ address_infos: z.array(z.object({ user_name: z.string(), postal_code: z.string(), province_name: z.string(), city_name: z.string(), county_name: z.string(), detail_info: z.string(), national_code: z.string(), tel_number: z.string(), lat: z.number(), lng: z.number(), house_number: z.string() })), min_piece: z.number(), min_weight: z.number(), min_amount: z.number(), valuation_flag: z.number(), amount_flag: z.number() })) }), all_freight_calc_method: z.object({ freight_calc_method_list: z.array(z.object({ address_infos: z.array(z.object({ user_name: z.string(), postal_code: z.string(), province_name: z.string(), city_name: z.string(), county_name: z.string(), detail_info: z.string(), national_code: z.string(), tel_number: z.string(), lat: z.number(), lng: z.number(), house_number: z.string() })), is_default: z.boolean(), delivery_id: z.string(), first_val_amount: z.number(), first_price: z.number(), second_val_amount: z.number(), second_price: z.number() })) }), create_time: z.number(), update_time: z.number(), is_default: z.boolean(), not_send_area: z.object({ address_infos: z.array(z.object({ user_name: z.string(), postal_code: z.string(), province_name: z.string(), city_name: z.string(), county_name: z.string(), detail_info: z.string(), national_code: z.string(), tel_number: z.string(), lat: z.number(), lng: z.number(), house_number: z.string() })) }) }),
});
export type UpdatefreighttemplateRequest = z.infer<typeof UpdatefreighttemplateRequestSchema>;
export const UpdatefreighttemplateResponseSchema = z.object({
  /** 运费模板id */
  template_id: z.string().optional(),
});
export type UpdatefreighttemplateResponse = z.infer<typeof UpdatefreighttemplateResponseSchema>;

/**
 * 获取文件下载链接
 * @see https://developers.weixin.qq.com/doc/store/shop/API/miniandstore/basic/api_getdownloadurl.html
 */
export const GetdownloadurlRequestSchema = z.object({
  /** 下单用户openid */
  openid: z.string(),
  /** 用户下单的订单号 */
  order_id: z.string(),
});
export type GetdownloadurlRequest = z.infer<typeof GetdownloadurlRequestSchema>;
export const GetdownloadurlResponseSchema = z.object({
  /** 文件下载链接 */
  url: z.string().optional(),
  /** 链接到期时间(秒)，有效期10分钟 */
  expire_time: z.number().optional(),
});
export type GetdownloadurlResponse = z.infer<typeof GetdownloadurlResponseSchema>;

/**
 * 上传资料
 * @see https://developers.weixin.qq.com/doc/store/shop/API/miniandstore/basic/api_uploadec.html
 */
export const UploadecRequestSchema = z.object({
  /** 上传方式 (0-上传文件二进制, 1-文件url上传) */
  upload_type: z.number(),
  /** 上传资料的用户openid（upload_type=0时必填，upload_type=1时也必填） */
  openid: z.string(),
  /** 上传的资料文件内容，支持图片、CAD、3dMax、压缩包、PDF、Excel、Word等。upload_type=0时必填，支持<10M大小的文件 */
  file: z.string().optional(),
  /** 上传文件的url，支持图片、CAD、3dMax、压缩包、PDF、Excel、Word等。upload_type=1时必填，支持<50M大小的文件 */
  file_url: z.string().optional(),
});
export type UploadecRequest = z.infer<typeof UploadecRequestSchema>;
export const UploadecResponseSchema = z.object({
  /** 文件media_id */
  media_id: z.string().optional(),
});
export type UploadecResponse = z.infer<typeof UploadecResponseSchema>;

/**
 * 修改订单地址
 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-order/api_changeorderaddress.html
 */
export const ChangeorderaddressRequestSchema = z.object({
  /** 订单id，可通过获取订单列表接口获取 */
  order_id: z.number(),
  /** 新地址 */
  user_address: z.object({ user_name: z.string(), postal_code: z.string(), province_name: z.string(), city_name: z.string(), county_name: z.string(), detail_info: z.string(), national_code: z.string(), tel_number: z.string(), house_number: z.string(), virtual_order_tel_number: z.string() }),
});
export type ChangeorderaddressRequest = z.infer<typeof ChangeorderaddressRequestSchema>;

/**
 * 同意用户修改收货地址申请
 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-order/api_acceptorderaddressmodifyapply.html
 */
export const AcceptorderaddressmodifyapplyRequestSchema = z.object({
  /** 订单id，可通过获取订单列表接口获取 */
  order_id: z.string(),
});
export type AcceptorderaddressmodifyapplyRequest = z.infer<typeof AcceptorderaddressmodifyapplyRequestSchema>;

/**
 * 拒绝用户修改收货地址申请
 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-order/api_rejectorderaddressmodifyapply.html
 */
export const RejectorderaddressmodifyapplyRequestSchema = z.object({
  /** 订单id，可在获取订单列表获取 */
  order_id: z.string(),
});
export type RejectorderaddressmodifyapplyRequest = z.infer<typeof RejectorderaddressmodifyapplyRequestSchema>;

/**
 * 订单补发货
 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-delivery/delivery/api_delivery_compensation.html
 */
export const DeliveryRequestSchema = z.object({
  /** 订单id */
  order_id: z.number(),
  /** 补发原因 (1-商品漏发, 2-商品拆分包裹, 3-商品坏损, 4-赠品) */
  reason: z.number(),
  /** 物流信息 */
  delivery_list: z.array(z.object({ deliver_type: z.number(), waybill_id: z.string(), delivery_id: z.string(), product_infos: z.array(z.object({ product_id: z.string(), sku_id: z.string(), product_cnt: z.number().min(1) })) })),
});
export type DeliveryRequest = z.infer<typeof DeliveryRequestSchema>;

/**
 * 订单发货
 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-delivery/delivery/api_senddelivery.html
 */
export const SenddeliveryRequestSchema = z.object({
  /** 订单id */
  order_id: z.number(),
  /** 物流信息 */
  delivery_list: z.array(z.object({ waybill_id: z.string(), delivery_id: z.string(), product_infos: z.array(z.object({ product_id: z.string(), sku_id: z.string(), product_cnt: z.number() })), deliver_type: z.number(), course_info: z.object({ start_time: z.number(), end_time: z.number(), course_path: z.object({ type: z.number(), wxa_appid: z.string(), wxa_path: z.string() }) }), sn_info: z.object({ sn_code: z.string(), imei1: z.string(), imei2: z.string() }) })),
});
export type SenddeliveryRequest = z.infer<typeof SenddeliveryRequestSchema>;

export const GetdeliverycompanylistResponseSchema = z.object({
  /** 快递公司列表 */
  company_list: z.array(z.object({ delivery_id: z.string(), delivery_name: z.string() })).optional(),
});
export type GetdeliverycompanylistResponse = z.infer<typeof GetdeliverycompanylistResponseSchema>;

/**
 * 获取快递公司列表
 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-delivery/delivery/api_getdeliverycompanylistnew.html
 */
export const GetdeliverycompanylistnewRequestSchema = z.object({
  /** 是否仅返回支持电子面单功能的快递公司 */
  ewaybill_only: z.boolean(),
});
export type GetdeliverycompanylistnewRequest = z.infer<typeof GetdeliverycompanylistnewRequestSchema>;
export const GetdeliverycompanylistnewResponseSchema = z.object({
  /** 快递公司列表 */
  company_list: z.array(z.object({ delivery_id: z.string(), delivery_name: z.string() })).optional(),
});
export type GetdeliverycompanylistnewResponse = z.infer<typeof GetdeliverycompanylistnewResponseSchema>;

/**
 * 修改物流信息
 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-order/api_changedeliveryinfo.html
 */
export const ChangedeliveryinfoRequestSchema = z.object({
  /** 订单id，可通过获取订单列表接口获取 */
  order_id: z.string(),
  /** 整单物流信息，不支持拆单 */
  delivery_list: z.array(z.object({ deliver_type: z.number(), delivery_id: z.string(), waybill_id: z.string(), product_infos: z.array(z.object({ product_id: z.string(), sku_id: z.string(), product_cnt: z.number() })) })).optional(),
  /** 更新包裹物流信息，支持拆单 */
  change_infos: z.array(z.object({ old: z.object({ delivery_id: z.string(), waybill_id: z.string(), product_infos: z.array(z.object({ product_id: z.string(), sku_id: z.string(), product_cnt: z.number() })) }), new: z.object({ delivery_id: z.string(), waybill_id: z.string(), product_infos: z.array(z.object({ product_id: z.string(), sku_id: z.string(), product_cnt: z.number() })) }) })).optional(),
});
export type ChangedeliveryinfoRequest = z.infer<typeof ChangedeliveryinfoRequestSchema>;

/**
 * 分配订单代发
 * @see https://developers.weixin.qq.com/doc/store/shop/API/supplier/order/api_dropship_assign.html
 */
export const DropshipAssignRequestSchema = z.object({
  /** 订单号 */
  order_id: z.string(),
  /** 供货商appid */
  supplier_appid: z.string(),
  /** 代发商品信息 */
  dropship_product_list: z.array(z.object({ spu_id: z.string(), sku_id: z.string(), product_cnt: z.number() })).optional(),
});
export type DropshipAssignRequest = z.infer<typeof DropshipAssignRequestSchema>;

/**
 * 取消分配代发单
 * @see https://developers.weixin.qq.com/doc/store/shop/API/supplier/order/api_dropship_cancel.html
 */
export const DropshipCancelRequestSchema = z.object({
  /** 订单号 */
  order_id: z.string(),
  /** 代发单号 */
  ds_order_id: z.string(),
  /** 代发商品信息 */
  dropship_product_list: z.array(z.object({ spu_id: z.string(), sku_id: z.string(), product_cnt: z.number() })).optional(),
});
export type DropshipCancelRequest = z.infer<typeof DropshipCancelRequestSchema>;

/**
 * 查询代发单详情
 * @see https://developers.weixin.qq.com/doc/store/shop/API/supplier/order/api_dropship_get.html
 */
export const DropshipRequestSchema = z.object({
  /** 代发单号 */
  ds_order_id: z.string(),
});
export type DropshipRequest = z.infer<typeof DropshipRequestSchema>;
export const DropshipResponseSchema = z.object({
  /** 代发单结构 */
  dropship_order: z.object({ ds_order_id: z.number(), create_time: z.number(), update_time: z.number(), status: z.number(), supplier_appid: z.string(), supplier_name: z.string(), order_id: z.number(), dropship_order_detail: z.object({ product_infos: z.array(z.object({ product_id: z.number(), sku_id: z.number(), thumb_img: z.string(), sku_cnt: z.number(), title: z.string(), sku_code: z.string(), out_product_id: z.string(), out_sku_id: z.string(), out_warehouse_id: z.string(), sku_deliver_info: z.object({ stock_type: z.number(), predict_delivery_time: z.number(), full_payment_presale_delivery_type: z.number() }), dropship_info: z.object({ ds_order_id: z.number(), delivery_status: z.number(), aftersale_status: z.number(), cancel_time: z.number(), cancel_scene: z.number(), preshipment_change_sku_state: z.number() }) })), delivery_info: z.object({ address_info: z.object({ user_name: z.string(), postal_code: z.string(), province_name: z.string(), city_name: z.string(), county_name: z.string(), detail_info: z.string(), national_code: z.string(), tel_number: z.string(), house_number: z.string(), virtual_order_tel_number: z.string(), tel_number_ext_info: z.object({ real_tel_number: z.string(), virtual_tel_number: z.string(), get_virtual_tel_cnt: z.number(), virtual_tel_expire_time: z.number() }), use_tel_number: z.number(), hash_code: z.string() }), delivery_product_info: z.array(z.object({ waybill_id: z.string(), delivery_id: z.string(), product_infos: z.array(z.object({ product_id: z.number(), sku_id: z.number(), product_cnt: z.number() })), delivery_name: z.string(), delivery_time: z.number(), deliver_type: z.number(), delivery_address: z.object({ user_name: z.string(), postal_code: z.string(), province_name: z.string(), city_name: z.string(), county_name: z.string(), detail_info: z.string(), national_code: z.string(), tel_number: z.string(), house_number: z.string(), virtual_order_tel_number: z.string(), tel_number_ext_info: z.object({ real_tel_number: z.string(), virtual_tel_number: z.string(), get_virtual_tel_cnt: z.number(), virtual_tel_expire_time: z.number() }), use_tel_number: z.number(), hash_code: z.string() }) })), ship_done_time: z.number(), deliver_method: z.number() }), ext_info: z.object({ customer_notes: z.string(), merchant_notes: z.string(), present_notes: z.string() }), greeting_card_info: z.object({ giver_name: z.string(), receiver_name: z.string(), greeting_message: z.string() }), custom_info: z.object({ custom_img_url: z.string(), custom_word: z.string(), custom_type: z.number(), custom_preview_img_url: z.string() }) }) }).optional(),
});
export type DropshipResponse = z.infer<typeof DropshipResponseSchema>;

/**
 * 拉取代发单列表
 * @see https://developers.weixin.qq.com/doc/store/shop/API/supplier/order/api_dropship_list.html
 */
export const DropshipListRequestSchema = z.object({
  /** 订单号，非必填，可根据订单号反查代发单 */
  order_id: z.string().optional(),
  /** 供货商appid */
  supplier_appid: z.string().optional(),
  /** 代发单状态 (100-待发货, 199-部分发货, 200-已发货, 300-已取消) */
  status: z.number().optional(),
  /** 代发单创建时间范围 */
  create_time_range: z.object({ start_time: z.number(), end_time: z.number() }).optional(),
  /** 分页参数，上一页请求返回 */
  page_info: z.object({ offset: z.number().min(0), limit: z.number().max(100) }).optional(),
  /** 代发单更新时间范围 */
  update_time_range: z.object({ start_time: z.number(), end_time: z.number() }).optional(),
});
export type DropshipListRequest = z.infer<typeof DropshipListRequestSchema>;
export const DropshipListResponseSchema = z.object({
  /** 代发单号列表 */
  ds_order_id_list: z.array(z.string()).optional(),
  /** 分页参数，下一页请求返回 */
  next_page: z.object({ offset: z.number().min(0), limit: z.number().max(100) }).optional(),
  /** 总数 */
  total: z.number().optional(),
  /** 是否还有下一页，true:有下一页；false:已经结束，没有下一页。 */
  has_more: z.boolean().optional(),
});
export type DropshipListResponse = z.infer<typeof DropshipListResponseSchema>;

/**
 * 搜索代发单
 * @see https://developers.weixin.qq.com/doc/store/shop/API/supplier/order/api_dropship_search.html
 */
export const DropshipSearchRequestSchema = z.object({
  /** 搜索条件 */
  search_condition: z.object({ order_id: z.string(), supplier_appid: z.string(), status: z.number(), create_time_range: z.object({ start_time: z.number(), end_time: z.number() }), waybill_id: z.string(), order_create_time_range: z.object({ start_time: z.number(), end_time: z.number() }), product_code: z.string(), spu_name: z.string(), supplier_appname: z.string(), merchant_notes: z.string(), update_time_range: z.object({ start_time: z.number(), end_time: z.number() }) }),
  /** 分页参数，上一页请求返回 */
  page_info: z.object({ offset: z.number().min(0), limit: z.number().max(10), next_key: z.string() }).optional(),
});
export type DropshipSearchRequest = z.infer<typeof DropshipSearchRequestSchema>;
export const DropshipSearchResponseSchema = z.object({
  /** 代发单号列表 */
  ds_order_id_list: z.array(z.string()).optional(),
  /** 分页参数，下一页请求返回 */
  next_page: z.object({ offset: z.number().min(0), limit: z.number().max(100) }).optional(),
  /** 总数 */
  total: z.number().optional(),
  /** 是否还有下一页，true:有下一页；false:已经结束，没有下一页。 */
  has_more: z.boolean().optional(),
});
export type DropshipSearchResponse = z.infer<typeof DropshipSearchResponseSchema>;

/**
 * 上传生鲜质检信息
 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-order/api_submitfreshinspectinfo.html
 */
export const SubmitfreshinspectinfoRequestSchema = z.object({
  /** 订单id */
  order_id: z.string(),
  /** 审核项 */
  audit_items: z.array(z.object({ item_name: z.string(), item_value: z.string() })),
});
export type SubmitfreshinspectinfoRequest = z.infer<typeof SubmitfreshinspectinfoRequestSchema>;

/**
 * 获取订单详情
 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-order/api_getorder.html
 */
export const GetorderRequestSchema = z.object({
  /** 订单ID，可从获取订单列表中获得 */
  order_id: z.string(),
});
export type GetorderRequest = z.infer<typeof GetorderRequestSchema>;
export const GetorderResponseSchema = z.object({
  /** 订单结构 */
  order: z.object({ order_id: z.number(), create_time: z.number(), update_time: z.number(), status: z.number(), order_detail: z.object({ product_infos: z.array(z.object({ product_id: z.number(), sku_id: z.number(), thumb_img: z.string(), sale_price: z.number(), sku_cnt: z.number(), title: z.string(), sku_attrs: z.array(z.object({ attr_key: z.string(), attr_value: z.string() })) })), pay_info: z.object({ payment_method: z.number(), pay_time: z.number(), transaction_id: z.string() }), price_info: z.object({ product_price: z.number(), order_price: z.number(), freight: z.number(), discounted_price: z.number(), is_discounted: z.boolean(), original_order_price: z.number() }), delivery_info: z.record(z.string(), z.any()), ext_info: z.record(z.string(), z.any()), coupon_info: z.record(z.string(), z.any()), commission_infos: z.array(z.record(z.string(), z.any())), settle_info: z.record(z.string(), z.any()), agent_info: z.record(z.string(), z.any()), source_infos: z.array(z.record(z.string(), z.any())), refund_info: z.record(z.string(), z.any()), greeting_card_info: z.record(z.string(), z.any()), custom_info: z.record(z.string(), z.any()) }), aftersale_detail: z.record(z.string(), z.any()), openid: z.string(), unionid: z.string(), is_present: z.boolean(), present_note: z.string(), present_giver_openid: z.string(), present_giver_unionid: z.string(), present_order_id_str: z.number(), present_send_type: z.number(), order_present_info: z.record(z.string(), z.any()), is_flash_sale_order: z.boolean(), intra_city_order_info: z.record(z.string(), z.any()) }).optional(),
});
export type GetorderResponse = z.infer<typeof GetorderResponseSchema>;

/**
 * 获取订单列表
 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-order/api_getorderlist.html
 */
export const GetorderlistRequestSchema = z.object({
  /** 订单创建时间范围，时间范围至少填一个 */
  create_time_range: z.object({ start_time: z.number(), end_time: z.number() }),
  /** 订单更新时间范围，时间范围至少填一个 */
  update_time_range: z.object({ start_time: z.number(), end_time: z.number() }),
  /** 订单状态，具体枚举值请参考下文 (10-待付款, 12-礼物待收下, 13-一起买待成团, 20-待发货（包括部分发货）, 21-部分发货, 30-...) */
  status: z.number().optional(),
  /** 买家身份标识，可通过 订单下单通知、订单通知：合作帐号小程序 获取 */
  openid: z.string().optional(),
  /** 每页数量(不超过100) */
  page_size: z.number().max(100).optional(),
  /** 分页参数，上一页请求返回 */
  next_key: z.string(),
});
export type GetorderlistRequest = z.infer<typeof GetorderlistRequestSchema>;
export const GetorderlistResponseSchema = z.object({
  /** 订单号列表 */
  order_id_list: z.array(z.string()).optional(),
  /** 分页参数，下一页请求返回 */
  next_key: z.string().optional(),
  /** bool 是否还有下一页，true:有下一页；false:已经结束，没有下一页。 */
  has_more: z.boolean().optional(),
});
export type GetorderlistResponse = z.infer<typeof GetorderlistResponseSchema>;

/**
 * 修改订单备注
 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-order/api_changemerchantnotes.html
 */
export const ChangemerchantnotesRequestSchema = z.object({
  /** 订单id，可通过获取订单列表接口获取 */
  order_id: z.string(),
  /** 备注内容 */
  merchant_notes: z.string(),
});
export type ChangemerchantnotesRequest = z.infer<typeof ChangemerchantnotesRequestSchema>;

/**
 * 礼物订单新增备注信息
 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-order/api_presentnote.html
 */
export const PresentnoteRequestSchema = z.object({
  /** 礼物订单ID */
  present_order_id: z.string(),
  /** 礼物订单备注信息 */
  notes: z.string(),
});
export type PresentnoteRequest = z.infer<typeof PresentnoteRequestSchema>;

/**
 * 创建并发送礼物
 * @see https://developers.weixin.qq.com/doc/store/shop/API/miniandstore/cooperation_gift/api_create_present_order.html
 */
export const CreateRequestSchema = z.object({
  /** 活动id */
  activity_id: z.number(),
  /** 用户openid */
  openid: z.string(),
  /** 合作小店appid */
  shop_appid: z.string(),
  /** 礼物祝福语信息 */
  wishmessage: z.string().max(100),
  /** 指定活动商品 */
  product_id: z.number(),
  /** 指定活动sku */
  sku_id: z.number(),
  /** 幂等id */
  idempotent_id: z.string().optional(),
});
export type CreateRequest = z.infer<typeof CreateRequestSchema>;
export const CreateResponseSchema = z.object({
  /** 礼物单id */
  present_order_id: z.number().optional(),
});
export type CreateResponse = z.infer<typeof CreateResponseSchema>;

/**
 * 指定礼物收礼者
 * @see https://developers.weixin.qq.com/doc/store/shop/API/miniandstore/cooperation_gift/api_set_present_receiver.html
 */
export const SetSetRequestSchema = z.object({
  /** 礼物单ID */
  present_order_id: z.string(),
  /** 礼物单子单列表 */
  sub_order_list: z.array(z.object({ order_id: z.string(), openid: z.string() })),
});
export type SetSetRequest = z.infer<typeof SetSetRequestSchema>;

/**
 * 查询礼物订单列表-旧
 * @see https://developers.weixin.qq.com/doc/store/shop/API/miniandstore/cooperation_gift/api_list_present_order.html
 */
export const ListGetRequestSchema = z.object({
  /** 小店appid */
  shop_appid: z.string(),
  /** 用户openid */
  openid: z.string().optional(),
  /** 订单创建时间范围 */
  create_time_range: z.object({ start_time: z.number(), end_time: z.number() }).optional(),
  /** 订单更新时间范围 */
  update_time_range: z.object({ start_time: z.number(), end_time: z.number() }).optional(),
  /** 订单数量 */
  page_size: z.number().min(1).max(100),
  /** 分页参数，上一页请求返回，首次置空即可 */
  next_key: z.string().optional(),
});
export type ListGetRequest = z.infer<typeof ListGetRequestSchema>;
export const ListGetResponseSchema = z.object({
  /** 礼物单列表 */
  present_order_list: z.array(z.object({ present_order_id: z.string(), order_id: z.array(z.string()) })).optional(),
  /** 分页参数 */
  next_key: z.string().optional(),
});
export type ListGetResponse = z.infer<typeof ListGetResponseSchema>;

/**
 * 获取礼物单的子单列表
 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-order/api_getpresentsuborder.html
 */
export const GetpresentsuborderRequestSchema = z.object({
  /** 礼物单号 */
  present_order_id: z.string(),
});
export type GetpresentsuborderRequest = z.infer<typeof GetpresentsuborderRequestSchema>;
export const GetpresentsuborderResponseSchema = z.object({
  /** 订单号列表 */
  order_ids: z.array(z.string()).optional(),
});
export type GetpresentsuborderResponse = z.infer<typeof GetpresentsuborderResponseSchema>;

/**
 * 同意待发货前更换sku请求
 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-order/api_approvepreshipmentchangesku.html
 */
export const ApprovepreshipmentchangeskuRequestSchema = z.object({
  /** 订单id */
  order_id: z.string(),
});
export type ApprovepreshipmentchangeskuRequest = z.infer<typeof ApprovepreshipmentchangeskuRequestSchema>;

/**
 * 获取所有待发货前更换sku待处理请求
 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-order/api_getpreshipmentchangeskuwaithandlelist.html
 */
export const GetpreshipmentchangeskuwaithandlelistRequestSchema = z.object({
  /** 分页参数 */
  page: z.number(),
  /** 每一页需要展示的条数 */
  page_size: z.number(),
});
export type GetpreshipmentchangeskuwaithandlelistRequest = z.infer<typeof GetpreshipmentchangeskuwaithandlelistRequestSchema>;
export const GetpreshipmentchangeskuwaithandlelistResponseSchema = z.object({
  /** 等待商家处理的换款请求订单id */
  order_ids: z.array(z.string()).optional(),
});
export type GetpreshipmentchangeskuwaithandlelistResponse = z.infer<typeof GetpreshipmentchangeskuwaithandlelistResponseSchema>;

/**
 * 拒绝待发货前更换sku请求
 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-order/api_rejectpreshipmentchangesku.html
 */
export const RejectpreshipmentchangeskuRequestSchema = z.object({
  /** 订单id */
  order_id: z.string(),
});
export type RejectpreshipmentchangeskuRequest = z.infer<typeof RejectpreshipmentchangeskuRequestSchema>;

/**
 * 修改订单价格
 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-order/api_changeorderprice.html
 */
export const ChangeorderpriceRequestSchema = z.object({
  /** 订单id，可通过获取订单列表接口获取 */
  order_id: z.number(),
  /** 商品信息 */
  change_order_infos: z.array(z.object({ product_id: z.number(), sku_id: z.number(), change_price: z.number() })),
  /** 是否修改运费 */
  change_express: z.boolean(),
  /** 修改后的运费价格（change_express=true时要指定，不填默认为0），以分为单位 */
  express_fee: z.number().default(0).optional(),
});
export type ChangeorderpriceRequest = z.infer<typeof ChangeorderpriceRequestSchema>;

/**
 * 申请查看订单真实号码
 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-order/api_applyrealnumber.html
 */
export const ApplyrealnumberRequestSchema = z.object({
  /** 订单号 */
  order_id: z.string(),
  /** 申请原因枚举值 (1-无法发货, 2-无法售后, 3-无法处理客诉, 4-无法处理物流包裹, 5-其他) */
  apply_type: z.number(),
  /** 申请原因 */
  apply_reason: z.string(),
  /** 申请原因图片证明 */
  pic_media_ids: z.array(z.string()),
});
export type ApplyrealnumberRequest = z.infer<typeof ApplyrealnumberRequestSchema>;

/**
 * 查看订单真实号审核状态
 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-order/api_getrealnumberviewaudit.html
 */
export const GetrealnumberviewauditRequestSchema = z.object({
  /** 订单号 */
  order_id: z.string(),
});
export type GetrealnumberviewauditRequest = z.infer<typeof GetrealnumberviewauditRequestSchema>;
export const GetrealnumberviewauditResponseSchema = z.object({
  /** 申请时间 [timestamp] */
  apply_time: z.number().optional(),
  /** 审核状态 1 审核中 2 审核拒绝 3 审核通过 (1-审核中, 2-审核拒绝, 3-审核通过) */
  audit_state: z.number().optional(),
  /** 申请原因 */
  apply_reason: z.string().optional(),
  /** 申请id */
  task_id: z.number().optional(),
});
export type GetrealnumberviewauditResponse = z.infer<typeof GetrealnumberviewauditResponseSchema>;

/**
 * 订单搜索
 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-order/api_searchorder.html
 */
export const SearchorderRequestSchema = z.object({
  /** 搜索条件，备注：搜索条件下的参数必须至少设置一个字段，否则接口报错 */
  search_condition: z.object({ title: z.string(), sku_code: z.string(), user_name: z.string(), tel_number: z.string(), order_id: z.number(), merchant_notes: z.string(), customer_notes: z.string(), tel_number_last4: z.string(), address_under_review: z.boolean(), present_order_id: z.string() }),
  /** 不传该参数：搜索全部订单；0：搜索没有正在售后的订单；1：搜索正在售后且售后单数量>=1的订单。除了以下几种售后单状态（AfterSaleStatus）外其它的 */
  on_aftersale_order_exist: z.number().optional(),
  /** 订单状态 (10-待付款, 12-礼物待收下, 13-凑单买凑团中, 20-待发货（包含部分发货）, 21-部分发货, 30-...) */
  status: z.number().optional(),
  /** 每页数量(不超过100) */
  page_size: z.number().max(100),
  /** 分页参数，上一页请求返回 */
  next_key: z.string(),
});
export type SearchorderRequest = z.infer<typeof SearchorderRequestSchema>;
export const SearchorderResponseSchema = z.object({
  /** 订单号列表 */
  order_id_list: z.array(z.string()).optional(),
  /** 分页参数，下一个页请求回传 */
  next_key: z.string().optional(),
  /** 是否还有下一页，true:有下一页；false:已经结束，没有下一页。 */
  has_more: z.boolean().optional(),
});
export type SearchorderResponse = z.infer<typeof SearchorderResponseSchema>;

/**
 * 解密订单中的详细收货信息
 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-order/api_decodesensitiveinfo.html
 */
export const DecodesensitiveinfoRequestSchema = z.object({
  /** 订单id */
  order_id: z.string(),
});
export type DecodesensitiveinfoRequest = z.infer<typeof DecodesensitiveinfoRequestSchema>;
export const DecodesensitiveinfoResponseSchema = z.object({
  /** 收货信息对象 */
  address_info: z.object({ user_name: z.string(), postal_code: z.string(), province_name: z.string(), city_name: z.string(), county_name: z.string(), detail_info: z.string(), national_code: z.string(), tel_number: z.string(), house_number: z.string(), virtual_order_tel_number: z.string() }).optional(),
  /** 虚拟号信息对象 */
  virtual_number_info: z.object({ virtual_number: z.string(), extension: z.string(), expiration: z.number() }).optional(),
});
export type DecodesensitiveinfoResponse = z.infer<typeof DecodesensitiveinfoResponseSchema>;

/**
 * 订单再次申请虚拟号
 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-order/api_applyvirtualnumberagain.html
 */
export const ApplyvirtualnumberagainRequestSchema = z.object({
  /** 订单号 */
  order_id: z.string(),
});
export type ApplyvirtualnumberagainRequest = z.infer<typeof ApplyvirtualnumberagainRequestSchema>;
export const ApplyvirtualnumberagainResponseSchema = z.object({
  /** 虚拟号 */
  virtual_number: z.string().optional(),
  /** 分机号 */
  extension: z.string().optional(),
  /** 剩余申请次数 */
  apply_quota: z.number().optional(),
});
export type ApplyvirtualnumberagainResponse = z.infer<typeof ApplyvirtualnumberagainResponseSchema>;

/**
 * 订单虚拟号延期
 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-order/api_delayvirtualnumber.html
 */
export const DelayvirtualnumberRequestSchema = z.object({
  /** 订单号 */
  order_id: z.string(),
  /** 当前已延期次数，可通过获取订单详情接口拿到，不填默认为0 */
  has_delay_times: z.number().min(0).default(0),
});
export type DelayvirtualnumberRequest = z.infer<typeof DelayvirtualnumberRequestSchema>;
export const DelayvirtualnumberResponseSchema = z.object({
  /** 过期时间 [timestamp] */
  expiration: z.number().optional(),
  /** 可延期次数 */
  available_extend_num: z.number().min(0).optional(),
});
export type DelayvirtualnumberResponse = z.infer<typeof DelayvirtualnumberResponseSchema>;

/**
 * 创建赠品活动
 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-product/giftactivity/api_addgiftactivity.html
 */
export const AddgiftactivityRequestSchema = z.object({
  /** 买赠活动标题 */
  title: z.string(),
  /** 买赠活动开始时间(秒级时间戳)，只能取大于等于当前时间的值，且距离当前时间不得超过30天 [timestamp] */
  start_time: z.number(),
  /** 买赠活动结束时间(秒级时间戳)，必须大于当前时间以及start_time，且活动持续时间(end_time-start_time)需大于等于10分钟，小于等于3 [timestamp] */
  end_time: z.number(),
  /** 买赠活动id，如果不填，则自动生成 */
  activity_id: z.number().optional(),
  /** 活动详情 */
  detail: z.object({ show_scene: z.number(), receive_limit: z.object({ is_limited: z.boolean(), limit_num: z.number() }), main_products: z.array(z.object({ product_id: z.number() })), gift_set: z.object({ gift_set_num: z.number(), gift_items: z.array(z.object({ gift_id: z.number(), give_num: z.number() })) }) }),
});
export type AddgiftactivityRequest = z.infer<typeof AddgiftactivityRequestSchema>;
export const AddgiftactivityResponseSchema = z.object({
  /** 买赠活动ID，创建成功后返回 */
  activity_id: z.string().optional(),
});
export type AddgiftactivityResponse = z.infer<typeof AddgiftactivityResponseSchema>;

/**
 * 删除赠品活动
 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-product/giftactivity/api_deletegiftactivity.html
 */
export const DeleteGiftActivityRequestSchema = z.object({
  /** 买赠活动ID */
  activity_id: z.number(),
});
export type DeleteGiftActivityRequest = z.infer<typeof DeleteGiftActivityRequestSchema>;

/**
 * 停止赠品活动
 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-product/giftactivity/api_stopgiftactivity.html
 */
export const StopgiftactivityRequestSchema = z.object({
  /** 买赠活动ID */
  activity_id: z.string(),
});
export type StopgiftactivityRequest = z.infer<typeof StopgiftactivityRequestSchema>;

/**
 * 添加商品
 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-product/shop/api_addproduct.html
 */
export const AddproductRequestSchema = z.object({
  /** 商家自定义商品ID，最多128字符 */
  out_product_id: z.string().max(128).optional(),
  /** 标题，应至少含5个有效字符数，最多60字符。不得仅为数字或英文，不得含非法字符 */
  title: z.string().max(60),
  /** 副标题，最多18字符。该字段已废弃 */
  sub_title: z.string().max(18).optional(),
  /** 商品短标题，最多20字符 */
  short_title: z.string().max(20).optional(),
  /** 主图，列表，最少3张（食品饮料和生鲜类目商品最少4张），最多9张。不得有重复图片 */
  head_imgs: z.array(z.string()),
  /** 发货方式：0-快递发货；1-无需快递，手机号发货；3-无需快递，可选发货账号类型。默认为0 (0-快递发货, 1-无需快递，手机号发货, 3-无需快递，可选发货账号类型) */
  deliver_method: z.number(),
  /** 发货账号：1-微信openid；2-QQ号；3-手机号；4-邮箱。可多选，只有deliver_method=3时有效 (1-微信openid, 2-QQ号, 3-手机号, 4-邮箱) */
  deliver_acct_type: z.array(z.number()),
  /** 商品详情 */
  desc_info: z.object({ imgs: z.array(z.string()), desc: z.string() }).optional(),
  /** 商品类目，大小恒等于3（一二三级类目），商品上架后不可修改一级类目 */
  cats: z.array(z.object({ cat_id: z.number() })),
  /** 商品类目，新类目树结构，大小恒等于N（一二三...N级类目），商品上架后不可修改一级类目 */
  cats_v2: z.array(z.object({ cat_id: z.number() })),
  /** 商品参数，部分类目有必填的参数 */
  attrs: z.array(z.object({ attr_key: z.string(), attr_value: z.string() })).optional(),
  /** 商家编码 */
  spu_code: z.string().optional(),
  /** 品牌id，无品牌为“2100000000” */
  brand_id: z.string().default('2100000000').optional(),
  /** 商品资质列表，取代qualifications字段 */
  product_qua_infos: z.array(z.object({ qua_id: z.number(), qua_url: z.array(z.string()) })).optional(),
  /** 运费信息 */
  express_info: z.object({ template_id: z.string(), weight: z.number() }).optional(),
  /** 售后说明 */
  aftersale_desc: z.string().optional(),
  /** 限购信息 */
  limited_info: z.object({ period_type: z.number(), limited_buy_num: z.number() }).optional(),
  /** 额外服务。若入参信息不符合平台规则，平台会将其优化至符合规则的参数值 */
  extra_service: z.object({ seven_day_return: z.number(), freight_insurance: z.number(), damage_guarantee: z.number(), fake_one_pay_three: z.number(), exchange_support: z.number() }),
  /** 商品SKU，长度最少为1，最大为500 */
  skus: z.array(z.object({ out_sku_id: z.string().max(128), thumb_img: z.string(), sale_price: z.number().max(1000000000), stock_num: z.number().min(1), sku_code: z.string().max(100), bar_code: z.string(), sku_attrs: z.array(z.object({ attr_key: z.string().max(40), attr_value: z.string() })), sku_deliver_info: z.object({ stock_type: z.number(), full_payment_presale_delivery_type: z.number(), presale_begin_time: z.number(), presale_end_time: z.number(), full_payment_presale_delivery_time: z.number().min(1).max(15), spot_after_presale_end: z.number() }) })),
  /** 添加完成后是否立即上架。1:是；0:否；默认0 (0-否, 1-是) */
  listing: z.number().optional(),
  /** 售后/退货地址 */
  after_sale_info: z.object({ after_sale_address_id: z.number() }).optional(),
  /** 尺码表 */
  size_chart: z.object({ enable: z.boolean(), specification_list: z.array(z.object({ name: z.string(), unit: z.string(), is_range: z.boolean(), value_list: z.array(z.object({ key: z.string(), value: z.string().max(5), left: z.string().max(5), right: z.string().max(5) })) })) }).optional(),
  /** 是否在店铺首页隐藏。0：不隐藏；1：隐藏 (0-不隐藏, 1-隐藏) */
  hide_in_window: z.number().optional(),
  /** 发布模式。0: 普通模式；1: 极简模式 (0-普通模式, 1-极简模式) */
  release_mode: z.number().optional(),
  /** 商品待开售信息 */
  timing_onsale_info: z.object({ status: z.number(), onsale_time: z.number().min(0).default(0), is_hide_price: z.number() }).optional(),
  /** spu维度配置全部sku预售规则 */
  spu_deliver_info: z.object({ sku_deliver_info: z.object({ stock_type: z.number(), full_payment_presale_delivery_type: z.number(), presale_begin_time: z.number(), presale_end_time: z.number(), full_payment_presale_delivery_time: z.number().min(1).max(15), spot_after_presale_end: z.number() }), is_spu_range: z.number() }).optional(),
});
export type AddproductRequest = z.infer<typeof AddproductRequestSchema>;
export const AddproductResponseSchema = z.object({
  /** data */
  data: z.object({ product_id: z.number().min(1), create_time: z.string() }).optional(),
});
export type AddproductResponse = z.infer<typeof AddproductResponseSchema>;

/**
 * 撤回商品审核
 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-product/shop/api_cancelauditproduct.html
 */
export const CancelauditproductRequestSchema = z.object({
  /** 商品ID（赠品ID） */
  product_id: z.string(),
});
export type CancelauditproductRequest = z.infer<typeof CancelauditproductRequestSchema>;

/**
 * 免审更新商品
 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-product/shop/api_updateproductauditfree.html
 */
export const UpdateproductauditfreeRequestSchema = z.object({
  /** 平台生成的id */
  product_id: z.number(),
  /** 商品编码 */
  spu_code: z.string().optional(),
  /** 需要进行更新的sku */
  skus: z.array(z.object({ sku_id: z.number(), sku_code: z.string(), stock_info: z.object({ diff_type: z.number(), num: z.number() }), sale_price: z.number().max(1000000000), sku_deliver_info: z.object({ stock_type: z.number(), full_payment_presale_delivery_type: z.number(), presale_begin_time: z.number(), presale_end_time: z.number(), full_payment_presale_delivery_time: z.number().min(1).max(15), spot_after_presale_end: z.number() }), is_delete: z.boolean(), status: z.number() })),
  /** 限购信息 */
  limited_info: z.object({ period_type: z.number().default(0), limited_buy_num: z.number() }).optional(),
  /** 运费信息 */
  express_info: z.object({ template_id: z.number(), weight: z.number() }).optional(),
  /** 售后服务配置 */
  extra_service: z.object({ seven_day_return: z.number(), freight_insurance: z.number(), damage_guarantee: z.number(), fake_one_pay_three: z.number(), exchange_support: z.number() }).optional(),
  /** 发货方式。0:快递发货（默认），1:无需快递 (0-快递发货, 1-无需快递) */
  deliver_method: z.number().optional(),
  /** 是否在店铺首页隐藏。0：不隐藏；1：隐藏 (0-不隐藏, 1-隐藏) */
  hide_in_window: z.number().optional(),
  /** 商品待开售信息 */
  timing_onsale_info: z.object({ status: z.number(), onsale_time: z.number().default(0), is_hide_price: z.number() }).optional(),
  /** spu维度配置全部sku预售规则 */
  spu_deliver_info: z.object({ sku_deliver_info: z.object({ stock_type: z.number(), full_payment_presale_delivery_type: z.number(), presale_begin_time: z.number(), presale_end_time: z.number(), full_payment_presale_delivery_time: z.number().min(1).max(15), spot_after_presale_end: z.number() }), is_spu_range: z.number() }).optional(),
  /** 售后/退货地址 */
  after_sale_info: z.object({ after_sale_address_id: z.number() }).optional(),
});
export type UpdateproductauditfreeRequest = z.infer<typeof UpdateproductauditfreeRequestSchema>;

export const GetproductauditstrategyResponseSchema = z.object({
  /** 上架策略对象 */
  audit_strategy: z.object({ hide_err_field_flag: z.number(), hit_duplicated_flag: z.number(), hit_low_risk_rule_flag: z.number() }).optional(),
});
export type GetproductauditstrategyResponse = z.infer<typeof GetproductauditstrategyResponseSchema>;

/**
 * 设置商品上架策略
 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-product/shop/api_setproductauditstrategy.html
 */
export const SetproductauditstrategyRequestSchema = z.object({
  /** 上架策略配置对象 */
  audit_strategy: z.object({ hide_err_field_flag: z.number(), hit_duplicated_flag: z.number(), hit_low_risk_rule_flag: z.number() }),
});
export type SetproductauditstrategyRequest = z.infer<typeof SetproductauditstrategyRequestSchema>;

/**
 * 商品立即开售
 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-product/shop/api_begintimingsale.html
 */
export const BegintimingsaleRequestSchema = z.object({
  /** 商品ID */
  product_id: z.number(),
  /** 定时开售任务ID, 商品里的字段 */
  task_id: z.number(),
});
export type BegintimingsaleRequest = z.infer<typeof BegintimingsaleRequestSchema>;

/**
 * 取消商品开售
 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-product/shop/api_canceltimingsale.html
 */
export const CanceltimingsaleRequestSchema = z.object({
  /** 商品ID */
  product_id: z.number(),
});
export type CanceltimingsaleRequest = z.infer<typeof CanceltimingsaleRequestSchema>;

/**
 * 类目推荐
 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-product/shop/api_product_classify.html
 */
export const ProductRequestSchema = z.object({
  /** 请求类型 (1-基于标题和主图推断商品类目, 2-基于商品内容判断是否类目错放) */
  req_type: z.number(),
  /** 商品标题 */
  title: z.string().optional(),
  /** 商品主图，至少传入一个有效的头图url，最多包含九个url */
  head_imgs: z.array(z.string()),
  /** 类目id，请求类型为2时必填 */
  cat_id: z.string().optional(),
});
export type ProductRequest = z.infer<typeof ProductRequestSchema>;
export const ProductResponseSchema = z.object({
  /** 推荐的多个多级类目信息，每个类目中包含商家是否有权限 */
  categories: z.array(z.object({ cats: z.array(z.object({ cat_info: z.object({ cat_id: z.string() }), has_permission: z.boolean() })) })).optional(),
  /** 是否类目错放，请求类型为2时才返回该字段 */
  wrong_cat: z.boolean().optional(),
});
export type ProductResponse = z.infer<typeof ProductResponseSchema>;

/**
 * 发品前校验
 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-product/shop/api_categoryprecheck.html
 */
export const CategoryprecheckRequestSchema = z.object({
  /** 叶子类目id */
  cat_id: z.number().optional(),
});
export type CategoryprecheckRequest = z.infer<typeof CategoryprecheckRequestSchema>;
export const CategoryprecheckResponseSchema = z.object({
  /** 检查类目是否可用。true表示类目正常，false表示类目不可用 (true-类目正常, false-类目不可用，请参考原因解决) */
  all_pass: z.boolean().optional(),
  /** 校验不通过的原因列表（可能为多个） */
  fail_reasons: z.array(z.any()).optional(),
});
export type CategoryprecheckResponse = z.infer<typeof CategoryprecheckResponseSchema>;

/**
 * 删除商品
 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-product/shop/api_deleteproduct.html
 */
export const DeleteproductRequestSchema = z.object({
  /** 商品ID（赠品ID） */
  product_id: z.string(),
});
export type DeleteproductRequest = z.infer<typeof DeleteproductRequestSchema>;

/**
 * 下架商品
 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-product/shop/api_delistingproduct.html
 */
export const DelistingproductRequestSchema = z.object({
  /** 商品ID（赠品ID） */
  product_id: z.string(),
});
export type DelistingproductRequest = z.infer<typeof DelistingproductRequestSchema>;

/**
 * 站内外商品属性映射
 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-product/shop/api_externalproductmapping.html
 */
export const ExternalproductmappingRequestSchema = z.object({
  /** 叶子类目id */
  cat_id: z.number(),
  /** 外部商品属性key */
  external_attribute_name: z.string(),
  /** 外部商品属性值 */
  external_attribute_value: z.string().optional(),
  /** 外部商品类目名称 */
  external_category_name: z.string().optional(),
});
export type ExternalproductmappingRequest = z.infer<typeof ExternalproductmappingRequestSchema>;
export const ExternalproductmappingResponseSchema = z.object({
  /** 外部商品属性key */
  external_attribute_name: z.string().optional(),
  /** 外部商品属性值 */
  external_attribute_value: z.string().optional(),
  /** 内部商品属性key */
  internal_attribute_name: z.string().optional(),
  /** 内部商品属性值，可能为多选 */
  internal_attribute_value: z.array(z.string()).optional(),
});
export type ExternalproductmappingResponse = z.infer<typeof ExternalproductmappingResponseSchema>;

/**
 * 商品属性映射及推荐
 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-product/shop/api_externalproductmappingnew.html
 */
export const ExternalproductmappingnewRequestSchema = z.object({
  /** 叶子类目id */
  cat_id: z.number(),
  /** 外部商品类目名称 */
  external_category_name: z.string().optional(),
  /** 主图，至少传一张 */
  head_imgs: z.array(z.string()),
  /** 详情图 */
  detail_imgs: z.array(z.string()).optional(),
  /** 商品标题 */
  title: z.string(),
  /** 属性列表 */
  external_attributes: z.array(z.object({ key: z.string(), value: z.string() })).optional(),
});
export type ExternalproductmappingnewRequest = z.infer<typeof ExternalproductmappingnewRequestSchema>;
export const ExternalproductmappingnewResponseSchema = z.object({
  /** 映射属性结果 */
  attributes: z.array(z.object({ key: z.string(), value: z.string() })).optional(),
});
export type ExternalproductmappingnewResponse = z.infer<typeof ExternalproductmappingnewResponseSchema>;

/**
 * 获取商品
 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-product/shop/api_getproduct.html
 */
export const GetproductRequestSchema = z.object({
  /** 商品ID */
  product_id: z.string(),
  /** 数据获取类型：1:获取线上数据 2:获取草稿数据 3:同时获取线上和草稿数据。默认取1 (1-获取线上数据, 2-获取草稿数据, 3-同时获取线上和草稿数据) */
  data_type: z.number().optional(),
});
export type GetproductRequest = z.infer<typeof GetproductRequestSchema>;
export const GetproductResponseSchema = z.object({
  /** 商品线上数据，入参data_type==2时不返回；入参data_type==3且商品从未上架过，不返回该字段 */
  product: z.object({ product_id: z.number(), out_product_id: z.string(), title: z.string(), sub_title: z.string(), head_imgs: z.array(z.string()), desc_info: z.object({ imgs: z.array(z.string()), desc: z.string() }), deliver_method: z.number(), deliver_acct_type: z.array(z.number()), express_info: z.object({ template_id: z.string(), weight: z.number() }), aftersale_desc: z.string(), limited_info: z.object({ period_type: z.number(), limited_buy_num: z.number() }), extra_service: z.object({ seven_day_return: z.number(), pay_after_use: z.number(), freight_insurance: z.number(), damage_guarantee: z.number(), fake_one_pay_three: z.number(), exchange_support: z.number() }), status: z.number(), edit_status: z.number(), min_price: z.number(), cats: z.array(z.object({ cat_id: z.number() })), cats_v2: z.array(z.object({ cat_id: z.number() })), attrs: z.array(z.object({ attr_key: z.string(), attr_value: z.string() })), spu_code: z.string(), brand_id: z.number().default(2100000000), skus: z.array(z.object({ sku_id: z.number(), out_sku_id: z.string(), thumb_img: z.string(), sale_price: z.number(), stock_num: z.number(), sku_code: z.string(), sku_attrs: z.array(z.object({ attr_key: z.string(), attr_value: z.string() })), status: z.number(), sku_deliver_info: z.object({ stock_type: z.number(), full_payment_presale_delivery_type: z.number(), presale_begin_time: z.number(), presale_end_time: z.number(), full_payment_presale_delivery_time: z.number(), spot_after_presale_end: z.number() }), bar_code: z.string() })), product_type: z.number(), edit_time: z.number(), after_sale_info: z.object({ after_sale_address_id: z.string() }), src_product_id: z.number().default(0), product_qua_infos: z.array(z.object({ qua_id: z.number(), qua_url: z.array(z.string()) })), size_chart: z.object({ enable: z.boolean(), specification_list: z.array(z.object({ name: z.string(), unit: z.string(), is_range: z.boolean(), value_list: z.array(z.object({ key: z.string(), value: z.string(), left: z.string(), right: z.string() })) })) }), hide_in_window: z.number(), timing_onsale_info: z.object({ status: z.number(), onsale_time: z.number().default(0), is_hide_price: z.number(), task_id: z.number() }), short_title: z.string(), total_sold_num: z.number(), release_mode: z.number(), spu_deliver_info: z.object({ stock_type: z.number(), full_payment_presale_delivery_type: z.number(), presale_begin_time: z.number(), presale_end_time: z.number(), full_payment_presale_delivery_time: z.number(), spot_after_presale_end: z.number() }) }).optional(),
  /** 商品草稿数据，入参data_type==1时不返回。结构与product相同 */
  edit_product: z.record(z.string(), z.any()).optional(),
  /** 当日售卖上限提醒，当店铺受到售卖管控时返回 */
  sale_limit_info: z.object({ is_limited: z.number(), title: z.string(), sub_title: z.string() }).optional(),
  /** 商品信息质量 */
  info_score: z.object({ score_level: z.number(), sub_score_list: z.array(z.record(z.string(), z.any())) }).optional(),
  /** 商品高价预警 */
  cmp_price_info: z.object({ status: z.number(), sku_result_list: z.array(z.record(z.string(), z.any())) }).optional(),
  /** 审核信息 */
  audit_info: z.object({ user_strategy_flag_list: z.array(z.number()) }).optional(),
});
export type GetproductResponse = z.infer<typeof GetproductResponseSchema>;

export const GetproductauditquotaResponseSchema = z.object({
  /** 审核限额对象 */
  audit_quota: z.object({ block_status: z.boolean(), avail_quota: z.number(), total_quota: z.number() }).optional(),
});
export type GetproductauditquotaResponse = z.infer<typeof GetproductauditquotaResponseSchema>;

/**
 * 添加非卖商品
 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-product/gift/api_addgiftproduct.html
 */
export const AddgiftproductRequestSchema = z.object({
  /** 外部平台自定义非卖商品ID，最多128字符 */
  out_product_id: z.string().max(128).optional(),
  /** 标题，应至少含5个有效字符数，最多60字符。不得仅为数字或英文，不得含非法字符 */
  title: z.string().min(5).max(60),
  /** 主图，多张列表。最少3张（食品饮料和生鲜类目最少4张），最多9张。不得有重复图片 */
  head_imgs: z.array(z.string()),
  /** 非卖商品详情信息 */
  desc_info: z.object({ imgs: z.array(z.string()), desc: z.string() }).optional(),
  /** 非卖商品类目，新类目树结构。数组下标为0的是一级类目，length-1的是N级叶子类目 */
  cats_v2: z.array(z.object({ cat_id: z.string() })),
  /** 非卖商品参数，部分类目有必填的参数 */
  attrs: z.array(z.object({ attr_key: z.string(), attr_value: z.string() })).optional(),
  /** 商家自定义的非卖商品编码 */
  spu_code: z.string().optional(),
  /** 品牌id，无品牌为2100000000 */
  brand_id: z.string().default('2100000000').optional(),
  /** 仅支持单sku，长度固定为1 */
  skus: z.array(z.object({ out_sku_id: z.string().max(128), sale_price: z.number().max(1000000000), stock_num: z.number(), sku_code: z.string().max(100) })),
  /** 添加完成后是否立即上架。1:是；0:否；默认0 (1-是, 0-否) */
  listing: z.number().optional(),
});
export type AddgiftproductRequest = z.infer<typeof AddgiftproductRequestSchema>;
export const AddgiftproductResponseSchema = z.object({
  /** 返回数据对象 */
  data: z.object({ product_id: z.string(), create_time: z.string() }).optional(),
});
export type AddgiftproductResponse = z.infer<typeof AddgiftproductResponseSchema>;

/**
 * 获取赠品
 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-product/gift/api_getgiftproduct.html
 */
export const GetgiftproductRequestSchema = z.object({
  /** 商品ID */
  product_id: z.string(),
  /** 1:获取线上数据 2:获取草稿数据 3:同时获取线上和草稿数据（注意：上架过的商品才有线上数据） (1-获取线上数据, 2-获取草稿数据, 3-同时获取线上和草稿数据) */
  data_type: z.number().optional(),
});
export type GetgiftproductRequest = z.infer<typeof GetgiftproductRequestSchema>;
export const GetgiftproductResponseSchema = z.object({
  /** 赠品线上数据，入参data_type==2时返回该字段；入参data_type==3时赠品从未上线过，不返回该字段 */
  product: z.object({ product_id: z.string(), out_product_id: z.string(), title: z.string(), head_imgs: z.array(z.string()), desc_info: z.object({ imgs: z.array(z.string()), desc: z.string() }), status: z.number(), edit_status: z.number(), cats_v2: z.array(z.object({ cat_id: z.string() })), attrs: z.array(z.object({ attr_key: z.string(), attr_value: z.string() })), spu_code: z.string(), brand_id: z.string(), skus: z.array(z.object({ sku_id: z.string(), out_sku_id: z.string(), sale_price: z.number(), stock_num: z.number(), sku_code: z.string(), status: z.number() })), product_type: z.number(), edit_time: z.number(), src_product_id: z.number() }).optional(),
  /** 赠品草稿数据，入参data_type==1时不返回该字段（参考product返回字段） */
  edit_product: z.object({ product_id: z.string(), out_product_id: z.string(), title: z.string(), head_imgs: z.array(z.string()), desc_info: z.object({ imgs: z.array(z.string()), desc: z.string() }), status: z.number(), edit_status: z.number(), cats_v2: z.array(z.object({ cat_id: z.string() })), attrs: z.array(z.object({ attr_key: z.string(), attr_value: z.string() })), spu_code: z.string(), brand_id: z.string(), skus: z.array(z.object({ sku_id: z.string(), out_sku_id: z.string(), sale_price: z.number(), stock_num: z.number(), sku_code: z.string(), status: z.number() })), product_type: z.number(), edit_time: z.number(), src_product_id: z.number() }).optional(),
});
export type GetgiftproductResponse = z.infer<typeof GetgiftproductResponseSchema>;

/**
 * 获取赠品列表
 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-product/gift/api_getgiftproductlist.html
 */
export const GetgiftproductlistRequestSchema = z.object({
  /** 商品状态，不填默认拉全部商品（不包含回收站） (0-初始值, 5-获取上架商品, 6-回收站, 11-获取所有下架商品) */
  status: z.number().optional(),
  /** 每页数量（默认10，不超过30） */
  page_size: z.number().max(30).default(10),
  /** 由上次请求返回，记录翻页的上下文。传入时会从上次返回的结果往后翻一页，不传默认获取第一页数据。 */
  next_key: z.string().optional(),
});
export type GetgiftproductlistRequest = z.infer<typeof GetgiftproductlistRequestSchema>;
export const GetgiftproductlistResponseSchema = z.object({
  /** 赠品id列表 */
  product_ids: z.array(z.string()).optional(),
  /** 本次翻页的上下文，用于请求下一页 */
  next_key: z.string().optional(),
  /** 赠品总数 */
  total_num: z.number().optional(),
});
export type GetgiftproductlistResponse = z.infer<typeof GetgiftproductlistResponseSchema>;

/**
 * 在售商品转赠品
 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-product/gift/api_setproductasgift.html
 */
export const SetproductasgiftRequestSchema = z.object({
  /** 设置为原始商品ID */
  product_id: z.string(),
  /** SKU列表，用于设置赠品库存 */
  skus: z.array(z.object({ sku_id: z.string(), stock_num: z.number().min(1) })),
});
export type SetproductasgiftRequest = z.infer<typeof SetproductasgiftRequestSchema>;
export const SetproductasgiftResponseSchema = z.object({
  /** 赠品设置结果详情 */
  data: z.object({ src_product_id: z.string(), gift_product_id: z.string(), sku_mappings: z.array(z.object({ src_sku_id: z.string(), gift_sku_id: z.string() })) }).optional(),
});
export type SetproductasgiftResponse = z.infer<typeof SetproductasgiftResponseSchema>;

/**
 * 更新赠品库存
 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-product/gift/api_updategiftstock.html
 */
export const UpdategiftstockRequestSchema = z.object({
  /** 内部赠品ID */
  product_id: z.string(),
  /** 内部skuID */
  sku_id: z.string(),
  /** 修改类型。1: 增加；2:减少；3:设置。建议使用1或2，不建议使用3，因为使用3在高并发场景可能会出现预期外表现 (1-增加, 2-减少, 3-设置) */
  diff_type: z.number(),
  /** 增加、减少或者设置的库存值 */
  num: z.number(),
});
export type UpdategiftstockRequest = z.infer<typeof UpdategiftstockRequestSchema>;

/**
 * 更新非卖商品
 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-product/gift/api_updategiftproduct.html
 */
export const UpdategiftproductRequestSchema = z.object({
  /** 商品ID */
  product_id: z.string(),
  /** 外部平台自定义非卖商品ID，最多128字符 */
  out_product_id: z.string().min(0).max(128).optional(),
  /** 标题，至少5个有效字符数，最多60字符 */
  title: z.string().min(5).max(60),
  /** 主图，列表，最少3张（食品饮料和生鲜类目最少4张），最多9张 */
  head_imgs: z.array(z.string()),
  /** 非卖商品详情信息 */
  desc_info: z.object({ imgs: z.array(z.string()), desc: z.string() }).optional(),
  /** 非卖商品参数 */
  attrs: z.array(z.object({ attr_key: z.string(), attr_value: z.string() })).optional(),
  /** 仅支持单sku，长度固定为1 */
  skus: z.array(z.object({ sku_id: z.string(), out_sku_id: z.string().min(0).max(128), sale_price: z.number().min(0).max(1000000000), stock_num: z.number(), stock_diff: z.object({ diff_type: z.number(), num: z.number() }), sku_code: z.string().min(0).max(100) })),
  /** 添加完成后是否立即上架。1:是；0:否；默认0 (0-否, 1-是) */
  listing: z.number().optional(),
  /** 非卖商品类目，新类目树结构 */
  cats_v2: z.array(z.object({ cat_id: z.string() })),
  /** 商家自定义的非卖商品编码 */
  spu_code: z.string().optional(),
  /** 品牌id，无品牌为2100000000 */
  brand_id: z.string().default('2100000000').optional(),
});
export type UpdategiftproductRequest = z.infer<typeof UpdategiftproductRequestSchema>;
export const UpdategiftproductResponseSchema = z.object({
  /** 小店内部非卖商品ID */
  product_id: z.number().optional(),
  /** 更新时间 [datetime] */
  update_time: z.string().optional(),
});
export type UpdategiftproductResponse = z.infer<typeof UpdategiftproductResponseSchema>;

/**
 * 获取商品H5短链
 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-product/shop/api_getproducth5url.html
 */
export const Getproducth5urlRequestSchema = z.object({
  /** 商品ID */
  product_id: z.string(),
  /** 小店通过关联账号绑定的企业微信id，获取方式见获取关联账号企微id */
  wecom_corp_id: z.string().optional(),
  /** 小店通过关联账号绑定的企业微信下的成员id，获取方式见获取关联账号企微id */
  wecom_user_id: z.string().optional(),
});
export type Getproducth5urlRequest = z.infer<typeof Getproducth5urlRequestSchema>;
export const Getproducth5urlResponseSchema = z.object({
  /** 商品H5短链 */
  product_h5url: z.string().optional(),
});
export type Getproducth5urlResponse = z.infer<typeof Getproducth5urlResponseSchema>;

/**
 * 添加限时抢购任务
 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-product/limiteddiscounttask/api_addlimiteddiscounttask.html
 */
export const AddlimiteddiscounttaskRequestSchema = z.object({
  /** 参与抢购的商品ID */
  product_id: z.string(),
  /** 限时抢购任务开始时间(秒级时间戳)，只能取大于等于当前时间的值，且距离当前时间不得超过一年（365天） [timestamp] */
  start_time: z.number(),
  /** 限时抢购任务结束时间(秒级时间戳)，必须大于当前时间以及start_time，且距离当前时间不得超过一年（365天） [timestamp] */
  end_time: z.number(),
  /** 限时抢购任务包含的SKU列表 */
  limited_discount_skus: z.array(z.object({ sku_id: z.string(), sale_price: z.number(), sale_stock: z.number() })),
});
export type AddlimiteddiscounttaskRequest = z.infer<typeof AddlimiteddiscounttaskRequestSchema>;
export const AddlimiteddiscounttaskResponseSchema = z.object({
  /** 限时抢购任务ID，创建成功后返回 */
  task_id: z.string().optional(),
});
export type AddlimiteddiscounttaskResponse = z.infer<typeof AddlimiteddiscounttaskResponseSchema>;

/**
 * 删除限时抢购任务
 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-product/limiteddiscounttask/api_deletelimiteddiscounttask.html
 */
export const DeletelimiteddiscounttaskRequestSchema = z.object({
  /** 限时抢购任务ID */
  task_id: z.string(),
});
export type DeletelimiteddiscounttaskRequest = z.infer<typeof DeletelimiteddiscounttaskRequestSchema>;

/**
 * 获取限时抢购任务列表
 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-product/limiteddiscounttask/api_getlimiteddiscounttasklist.html
 */
export const GetlimiteddiscounttasklistRequestSchema = z.object({
  /** 指定获取某个status状态下的限时抢购任务列表，如果不填，则获取所有状态下的限时抢购任务列表 (0-限时抢购任务创建完成，未开始, 1-限时抢购任务进行中, 2-限时抢购任务已结束) */
  status: z.number().optional(),
  /** 每页数量(默认10，不超过50) */
  page_size: z.number().min(1).max(50).default(10),
  /** 由上次请求返回，记录翻页的上下文，传入时会从上次返回的结果往后翻一页，不传默认获取第一页数据 */
  next_key: z.string().optional(),
});
export type GetlimiteddiscounttasklistRequest = z.infer<typeof GetlimiteddiscounttasklistRequestSchema>;
export const GetlimiteddiscounttasklistResponseSchema = z.object({
  /** 限时抢购信息列表 */
  limited_discount_tasks: z.array(z.object({ task_id: z.string(), product_id: z.string(), status: z.number(), create_time: z.number(), start_time: z.number(), end_time: z.number(), limited_discount_skus: z.array(z.object({ sku_id: z.string(), sale_price: z.number(), sale_stock: z.number() })) })).optional(),
  /** 本次翻页的上下文，用于请求下一页 */
  next_key: z.string().optional(),
  /** 商品总数 */
  total_num: z.number().optional(),
});
export type GetlimiteddiscounttasklistResponse = z.infer<typeof GetlimiteddiscounttasklistResponseSchema>;

/**
 * 停止限时抢购任务
 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-product/limiteddiscounttask/api_stoplimiteddiscounttask.html
 */
export const StoplimiteddiscounttaskRequestSchema = z.object({
  /** 限时抢购任务ID */
  task_id: z.string(),
});
export type StoplimiteddiscounttaskRequest = z.infer<typeof StoplimiteddiscounttaskRequestSchema>;

/**
 * 获取商品列表
 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-product/shop/api_getproductlist.html
 */
export const GetproductlistRequestSchema = z.object({
  /** 商品状态 (0-初始值, 5-上架, 6-回收站, 9-彻底删除，商品无法再进行任何操作, 11-自主下架, 13-违规下架/...) */
  status: z.number().optional(),
  /** 每页数量（默认10，不超过30） */
  page_size: z.number().min(1).max(30).default(10),
  /** 由上次请求返回，记录翻页的上下文。传入时会从上次返回的结果往后翻一页，不传默认获取第一页数据。 */
  next_key: z.string().optional(),
});
export type GetproductlistRequest = z.infer<typeof GetproductlistRequestSchema>;
export const GetproductlistResponseSchema = z.object({
  /** 商品id列表 */
  product_ids: z.array(z.string()).optional(),
  /** 本次翻页的上下文，用于请求下一页 */
  next_key: z.string().optional(),
  /** 商品总数 */
  total_num: z.number().optional(),
});
export type GetproductlistResponse = z.infer<typeof GetproductlistResponseSchema>;

/**
 * 上架商品
 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-product/shop/api_listingproduct.html
 */
export const ListingproductRequestSchema = z.object({
  /** 商品ID（赠品ID） */
  product_id: z.string(),
});
export type ListingproductRequest = z.infer<typeof ListingproductRequestSchema>;

/**
 * 商品品牌推荐
 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-product/shop/api_productbrandrecommend.html
 */
export const ProductbrandrecommendRequestSchema = z.object({
  /** 叶子类目id */
  cat_id: z.number(),
  /** 主图，至少传一张 */
  head_imgs: z.array(z.string()),
  /** 详情图 */
  detail_imgs: z.array(z.string()).optional(),
  /** 商品标题 */
  title: z.string(),
});
export type ProductbrandrecommendRequest = z.infer<typeof ProductbrandrecommendRequestSchema>;
export const ProductbrandrecommendResponseSchema = z.object({
  /** 品牌id */
  brand_id: z.number().optional(),
  /** 品牌中文名称 */
  brand_name_chinese: z.string().optional(),
  /** 品牌英文名称 */
  brand_name_english: z.string().optional(),
});
export type ProductbrandrecommendResponse = z.infer<typeof ProductbrandrecommendResponseSchema>;

/**
 * 获取商品二维码
 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-product/shop/api_getproductqrcode.html
 */
export const GetproductqrcodeRequestSchema = z.object({
  /** 商品ID */
  product_id: z.string(),
  /** 二维码类型，缺省值为1 (1-二维码, 2-标准物料, 3-送礼物物料) */
  qrcode_type: z.number().optional(),
  /** 小店通过关联账号绑定的企业微信id，获取方式见获取关联账号企微id */
  wecom_corp_id: z.string().optional(),
  /** 小店通过关联账号绑定的企业微信下的成员id，获取方式见获取关联账号企微id */
  wecom_user_id: z.string().optional(),
});
export type GetproductqrcodeRequest = z.infer<typeof GetproductqrcodeRequestSchema>;
export const GetproductqrcodeResponseSchema = z.object({
  /** 商品二维码链接 [url] */
  product_qrcode: z.string().optional(),
});
export type GetproductqrcodeResponse = z.infer<typeof GetproductqrcodeResponseSchema>;

/**
 * 获取商品的移动应用跳转scheme码
 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-product/shop/api_getproductscheme.html
 */
export const GetproductschemeRequestSchema = z.object({
  /** 商品ID */
  product_id: z.string(),
  /** 来源appid */
  from_appid: z.string(),
  /** 过期时间，单位秒 */
  expire: z.number(),
  /** 附加信息 */
  ext_info: z.string().optional(),
});
export type GetproductschemeRequest = z.infer<typeof GetproductschemeRequestSchema>;
export const GetproductschemeResponseSchema = z.object({
  /** 商品跳转scheme码 */
  openlink: z.string().optional(),
});
export type GetproductschemeResponse = z.infer<typeof GetproductschemeResponseSchema>;

/**
 * 批量获取库存信息
 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-product/stock/api_batchgetstock.html
 */
export const BatchgetstockRequestSchema = z.object({
  /** 商品ID列表，上限为50 */
  product_id: z.array(z.string()),
});
export type BatchgetstockRequest = z.infer<typeof BatchgetstockRequestSchema>;
export const BatchgetstockResponseSchema = z.object({
  /** 数据对象 */
  data: z.object({ spu_stock_list: z.array(z.object({ product_id: z.string(), sku_stock: z.array(z.object({ sku_id: z.string(), normal_stock_num: z.number(), limited_discount_stock_num: z.number(), warehouse_stocks: z.array(z.object({ out_warehouse_id: z.string(), num: z.number(), lock_stock: z.number() })), finder_total_num: z.number(), total_stock_num: z.number(), exclusive_num: z.number() })) })) }).optional(),
});
export type BatchgetstockResponse = z.infer<typeof BatchgetstockResponseSchema>;

/**
 * 获取库存
 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-product/stock/api_getstock.html
 */
export const GetstockRequestSchema = z.object({
  /** 内部商品ID */
  product_id: z.string(),
  /** 内部sku_id */
  sku_id: z.string(),
});
export type GetstockRequest = z.infer<typeof GetstockRequestSchema>;
export const GetstockResponseSchema = z.object({
  /** 库存数据对象 */
  data: z.object({ normal_stock_num: z.number(), limited_discount_stock_num: z.number(), warehouse_stocks: z.array(z.object({ out_warehouse_id: z.string(), num: z.number(), lock_stock: z.number() })), total_stock_num: z.number() }).optional(),
});
export type GetstockResponse = z.infer<typeof GetstockResponseSchema>;

/**
 * 获取库存流水
 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-product/stock/api_getstockflow.html
 */
export const GetstockflowRequestSchema = z.object({
  /** 内部商品ID */
  product_id: z.number(),
  /** 内部sku_id */
  sku_id: z.number(),
  /** 库存类型 (0-普通/通用库存, 1-达人专属计划营销库存, 2-B2C活动, 3-同城配送门店库存, 4-活动库存, 5-限...) */
  stock_type: z.number(),
  /** 达人的视频号finder_id，若StockType=1则必填 */
  finder_id: z.string().optional(),
  /** 时间范围开始时间戳，秒级 [timestamp] */
  begin_time: z.number(),
  /** 时间范围结束时间戳，秒级 [timestamp] */
  end_time: z.number(),
  /** 库存事件类型 (1-设置库存, 2-增加库存, 3-减少库存, 4-下单扣除库存, 5-取消订单释放库存, 6-分配库存, 7-归...) */
  op_type_list: z.string().optional(),
  /** 每页数量 */
  page_size: z.number(),
  /** 由上次请求返回，记录翻页的上下文。传入时会从上次返回的结果往后翻一页，不传默认获取第一页数据 */
  next_key: z.string().optional(),
});
export type GetstockflowRequest = z.infer<typeof GetstockflowRequestSchema>;
export const GetstockflowResponseSchema = z.object({
  /** 返回数据对象 */
  data: z.object({ stock_flow_info_list: z.array(z.object({ amount: z.number(), beginning_amount: z.number(), ending_amount: z.number(), stock_sub_type: z.number(), op_type: z.number(), update_time: z.number(), ext_info: z.object({ unmove_from_stock_sub_type: z.number(), move_to_stock_sub_type: z.number(), upload_source: z.number(), order_id: z.number(), out_warehouse_id: z.string(), limited_discount_id: z.number(), finder_id: z.string() }) })), next_key: z.string() }).optional(),
});
export type GetstockflowResponse = z.infer<typeof GetstockflowResponseSchema>;

/**
 * 快速更新库存
 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-product/stock/api_updatestock.html
 */
export const UpdatestockRequestSchema = z.object({
  /** 内部商品ID */
  product_id: z.string(),
  /** 内部sku_id */
  sku_id: z.string(),
  /** 修改类型。1: 增加；2:减少；3:设置。建议使用1或2，不建议使用3，因为使用3在高并发场景可能会出现预期外表现 (1-增加, 2-减少, 3-设置) */
  diff_type: z.number(),
  /** 增加、减少或者设置的库存值 */
  num: z.number(),
});
export type UpdatestockRequest = z.infer<typeof UpdatestockRequestSchema>;

/**
 * 获取商品口令
 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-product/shop/api_getproducttaglink.html
 */
export const GetproducttaglinkRequestSchema = z.object({
  /** 商品ID */
  product_id: z.string(),
  /** 小店通过关联账号绑定的企业微信id，获取方式见获取关联账号企微id */
  wecom_corp_id: z.string().optional(),
  /** 小店通过关联账号绑定的企业微信下的成员id，获取方式见获取关联账号企微id */
  wecom_user_id: z.string().optional(),
});
export type GetproducttaglinkRequest = z.infer<typeof GetproducttaglinkRequestSchema>;
export const GetproducttaglinkResponseSchema = z.object({
  /** 商品微信口令（只支持微信内打开） */
  product_taglink: z.string().optional(),
});
export type GetproducttaglinkResponse = z.infer<typeof GetproducttaglinkResponseSchema>;

/**
 * 更新商品
 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-product/shop/api_updateproduct.html
 */
export const UpdateproductRequestSchema = z.object({
  /** 小店内部商品ID */
  product_id: z.string().optional(),
  /** 标题，应至少含5个有效字符数，最多60字符。不得仅为数字或英文，不得含非法字符。 */
  title: z.string().min(5).max(60),
  /** 副标题，最多18字符。该字段已废弃 */
  sub_title: z.string().max(18).optional(),
  /** 商品短标题，最多20字符 */
  short_title: z.string().max(20).optional(),
  /** 主图，多张，列表。最少3张（食品饮料和生鲜类目商品最少4张），最多9张。不得有重复图片 */
  head_imgs: z.array(z.string()),
  /** 发货方式：0-快递发货；1-无需快递，手机号发货；3-无需快递，可选发货账号类型。默认为0 (0-快递发货, 1-无需快递，手机号发货, 3-无需快递，可选发货账号类型) */
  deliver_method: z.number(),
  /** 发货账号：1-微信openid；2-QQ号；3-手机号；4-邮箱。可多选。只有deliver_method=3时，本参数有意义 (1-微信openid, 2-QQ号, 3-手机号, 4-邮箱) */
  deliver_acct_type: z.array(z.any()),
  /** 商品详情 */
  desc_info: z.object({ imgs: z.array(z.string()), desc: z.string() }).optional(),
  /** 商品类目，大小恒等于3（一二三级类目）。商品上架后不可修改一级类目 */
  cats: z.array(z.object({ cat_id: z.number() })),
  /** 商品类目，新类目树结构。商品上架后不可修改一级类目 */
  cats_v2: z.array(z.object({ cat_id: z.string() })),
  /** 商品参数。部分类目有必填的参数 */
  attrs: z.array(z.object({ attr_key: z.string(), attr_value: z.string() })).optional(),
  /** 商家编码 */
  spu_code: z.string().optional(),
  /** 品牌id，无品牌为"2100000000" */
  brand_id: z.string().default('2100000000').optional(),
  /** 商品资质列表，取代qualifications字段。不同类目下必填的资质要求不同 */
  product_qua_infos: z.array(z.object({ qua_id: z.number(), qua_url: z.array(z.string()) })).optional(),
  /** 运费信息 */
  express_info: z.object({ template_id: z.string(), weight: z.number() }).optional(),
  /** 售后说明 */
  aftersale_desc: z.string().optional(),
  /** 限购信息 */
  limited_info: z.object({ period_type: z.number(), limited_buy_num: z.number() }).optional(),
  /** 额外服务 */
  extra_service: z.object({ seven_day_return: z.number(), freight_insurance: z.number(), damage_guarantee: z.number(), fake_one_pay_three: z.number(), exchange_support: z.number() }),
  /** 商品SKU。长度最少为1，最大为500 */
  skus: z.array(z.object({ sku_id: z.number(), out_sku_id: z.string().max(128), thumb_img: z.string(), sale_price: z.number().max(1000000000), stock_num: z.number(), sku_code: z.string().max(100), bar_code: z.string(), sku_attrs: z.array(z.object({ attr_key: z.string().max(40), attr_value: z.string() })), status: z.number(), sku_deliver_info: z.object({ stock_type: z.number(), full_payment_presale_delivery_type: z.number(), presale_begin_time: z.number(), presale_end_time: z.number(), full_payment_presale_delivery_time: z.number().min(1).max(15), spot_after_presale_end: z.number() }) })),
  /** 添加完成后是否立即上架。1:是；0:否；默认0 (0-否, 1-是) */
  listing: z.number().optional(),
  /** 售后/退货地址 */
  after_sale_info: z.object({ after_sale_address_id: z.number() }).optional(),
  /** 尺码表 */
  size_chart: z.object({ enable: z.boolean(), specification_list: z.array(z.object({ name: z.string(), unit: z.string(), is_range: z.boolean(), value_list: z.array(z.object({ key: z.string(), value: z.string().max(5), left: z.string().max(5), right: z.string().max(5) })) })) }).optional(),
  /** 是否在店铺首页隐藏。0：不隐藏；1：隐藏 (0-不隐藏, 1-隐藏) */
  hide_in_window: z.number().optional(),
  /** 商品待开售信息 */
  timing_onsale_info: z.object({ status: z.number(), onsale_time: z.number().default(0), is_hide_price: z.number() }).optional(),
  /** 发布模式。0: 普通模式；1: 极简模式 (0-普通模式, 1-极简模式) */
  release_mode: z.number().optional(),
  /** spu维度配置全部sku预售规则 */
  spu_deliver_info: z.object({ sku_deliver_info: z.record(z.string(), z.any()), is_spu_range: z.number() }).optional(),
});
export type UpdateproductRequest = z.infer<typeof UpdateproductRequestSchema>;
export const UpdateproductResponseSchema = z.object({
  /** 商品信息 */
  data: z.object({ product_id: z.number(), update_time: z.string() }).optional(),
});
export type UpdateproductResponse = z.infer<typeof UpdateproductResponseSchema>;

/**
 * 打印质检码
 * @see https://developers.weixin.qq.com/doc/store/shop/API/qic/api_printinspectcode.html
 */
export const PrintinspectcodeRequestSchema = z.object({
  /** 订单id */
  order_id: z.string(),
});
export type PrintinspectcodeRequest = z.infer<typeof PrintinspectcodeRequestSchema>;
export const PrintinspectcodeResponseSchema = z.object({
  /** 质检码详情 */
  data: z.object({ backupDeliveryId: z.string(), backupDeliveryName: z.string(), boxDTOList: z.array(z.object({ boxId: z.number(), boxName: z.string(), boxNum: z.number() })), channelAppId: z.string(), deliveryId: z.string(), deliveryName: z.string(), embedGoodsMaterial: z.string(), goodsDesc: z.string(), expressMerge: z.boolean(), goodsMainMaterial: z.string(), goodsName: z.string(), goodsNum: z.number(), goodsPartsMaterial: z.string(), inspectBaseId: z.string(), inspectBaseName: z.string(), inspectCode: z.string(), inspectOrgId: z.string(), inspectOrgName: z.string(), inspectOrgShortName: z.string(), merchantName: z.string(), orderId: z.string(), urgentOrder: z.boolean(), printInfo: z.string(), needLabel: z.boolean() }).optional(),
});
export type PrintinspectcodeResponse = z.infer<typeof PrintinspectcodeResponseSchema>;

export const GetinspectconfigResponseSchema = z.object({
  /** 质检仓配置信息 */
  inspect_config: z.object({ warehouse_id: z.string(), delivery_address: z.object({ contact_name: z.string(), contact_phone: z.string(), province: z.string(), city: z.string(), county: z.string(), detail: z.string() }), return_address: z.object({ contact_name: z.string(), contact_phone: z.string(), province: z.string(), city: z.string(), county: z.string(), detail: z.string() }), warehouse_name: z.string(), warehouse_addr: z.string() }).optional(),
});
export type GetinspectconfigResponse = z.infer<typeof GetinspectconfigResponseSchema>;

/**
 * 自寄快递送检
 * @see https://developers.weixin.qq.com/doc/store/shop/API/qic/api_registerlogistics.html
 */
export const RegisterlogisticsRequestSchema = z.object({
  /** 订单号列表 */
  order_id_list: z.array(z.string()),
  /** 快递物流信息 */
  logistics_info: z.object({ waybill_id: z.string(), delivery_id: z.string(), delivery_name: z.string(), delivery_type: z.number() }),
});
export type RegisterlogisticsRequest = z.infer<typeof RegisterlogisticsRequestSchema>;

/**
 * 绑定送检信息
 * @see https://developers.weixin.qq.com/doc/store/shop/API/qic/api_submitinspectinfo.html
 */
export const SubmitinspectinfoRequestSchema = z.object({
  /** 订单id */
  order_id: z.string(),
  /** 送检信息 */
  inspect_info: z.object({ delivery_id: z.string(), backup_delivery_id: z.string(), express_insure: z.boolean(), express_insure_amount: z.number(), express_merge: z.boolean(), inspect_org_id: z.string(), refund_intercept: z.number(), inspect_org_name: z.string(), warehouse_name: z.string(), warehouse_addr: z.string(), delivery_product_id: z.number(), delivery_insure_id: z.string(), backup_delivery_product_id: z.number(), backup_delivery_insure_id: z.string(), backup_express_insure: z.boolean(), backup_express_insure_amount: z.number(), remark: z.string().min(0).max(32), agarwood_inspect_org_id: z.string(), agarwood_inspect_org_name: z.string() }),
});
export type SubmitinspectinfoRequest = z.infer<typeof SubmitinspectinfoRequestSchema>;

/**
 * 查询送检配置模板信息
 * @see https://developers.weixin.qq.com/doc/store/shop/API/qic/api_getinspectsubmitconfig.html
 */
export const GetinspectsubmitconfigRequestSchema = z.object({
  /** 订单id */
  order_id: z.string().optional(),
});
export type GetinspectsubmitconfigRequest = z.infer<typeof GetinspectsubmitconfigRequestSchema>;
export const GetinspectsubmitconfigResponseSchema = z.object({
  /** 送检配置模板信息 */
  submit_config: z.object({ delivery_list: z.array(z.object({ id: z.string(), name: z.string(), delivery_products: z.array(z.object({ id: z.number(), name: z.string(), enable_insure: z.number(), insure_type_list: z.array(z.object({ id: z.string(), name: z.string(), upper_limit_type: z.number(), upper_limit_amount: z.number() })) })) })), inspect_org_list: z.array(z.object({ id: z.string(), name: z.string(), org_category: z.number() })), charge_url: z.string() }).optional(),
});
export type GetinspectsubmitconfigResponse = z.infer<typeof GetinspectsubmitconfigResponseSchema>;

export const GetclassificationtreeResponseSchema = z.object({
  /** 返回数据对象 */
  resp: z.object({ tree: z.object({ level_1: z.array(z.object({ id: z.number(), name: z.string(), level_2: z.array(z.object({ id: z.number(), name: z.string(), img_url: z.string() })), img_url: z.string(), create_time: z.number(), update_time: z.number(), tree_id: z.number() })), name: z.string(), create_time: z.number(), update_time: z.number(), tree_id: z.number() }), version: z.number() }).optional(),
});
export type GetclassificationtreeResponse = z.infer<typeof GetclassificationtreeResponseSchema>;

/**
 * 获取分类关联的商品ID列表
 * @see https://developers.weixin.qq.com/doc/store/shop/API/homepage/shoptype/api_getclassificationproductlist.html
 */
export const GetClassificationProductListRequestSchema = z.object({
  /** 请求体参数 */
  req: z.object({ level_1_id: z.number(), level_2_id: z.number(), page_size: z.number().max(500), page_context: z.string().default('') }),
});
export type GetClassificationProductListRequest = z.infer<typeof GetClassificationProductListRequestSchema>;
export const GetClassificationProductListResponseSchema = z.object({
  /** 分类关联的商品ID列表 */
  product_ids: z.array(z.number()).optional(),
  /** 拉取下一页用。如果该值为空，表示拉取到最后一页了 */
  page_context: z.string().optional(),
});
export type GetClassificationProductListResponse = z.infer<typeof GetClassificationProductListResponseSchema>;

/**
 * 隐藏小店主页商品
 * @see https://developers.weixin.qq.com/doc/store/shop/API/homepage/storewindow/api_hidestorewindowproduct.html
 */
export const HidestorewindowproductRequestSchema = z.object({
  /** 商品id */
  product_id: z.string(),
  /** 是否隐藏。1-隐藏，0-取消隐藏 (0-取消隐藏, 1-隐藏) */
  is_set_hide: z.number(),
});
export type HidestorewindowproductRequest = z.infer<typeof HidestorewindowproductRequestSchema>;

/**
 * 获取主页展示商品列表
 * @see https://developers.weixin.qq.com/doc/store/shop/API/homepage/storewindow/api_getstorewindowproductlist.html
 */
export const GetstorewindowproductlistRequestSchema = z.object({
  /** 每页数量（默认10，不超过30） */
  page_size: z.number().min(1).max(30).default(10),
  /** 由上次请求返回，记录翻页的上下文。传入时会从上次返回的结果往后翻一页，不传默认获取第一页数据。 */
  next_key: z.string().optional(),
});
export type GetstorewindowproductlistRequest = z.infer<typeof GetstorewindowproductlistRequestSchema>;
export const GetstorewindowproductlistResponseSchema = z.object({
  /** 商品信息 */
  products: z.array(z.object({ product_id: z.string(), is_set_hide: z.number(), is_set_top: z.number() })).optional(),
  /** 本次翻页的上下文，用于请求下一页 */
  next_key: z.string().optional(),
  /** 商品总数 */
  total_num: z.number().optional(),
});
export type GetstorewindowproductlistResponse = z.infer<typeof GetstorewindowproductlistResponseSchema>;

/**
 * 重新排序主页展示商品
 * @see https://developers.weixin.qq.com/doc/store/shop/API/homepage/storewindow/api_reorderstorewindowproduct.html
 */
export const ReorderstorewindowproductRequestSchema = z.object({
  /** 商品id */
  product_id: z.string(),
  /** 商品重新排序后的新序号，最大移动步长为500（即新序号与当前序号的距离小于500） */
  index_num: z.number(),
});
export type ReorderstorewindowproductRequest = z.infer<typeof ReorderstorewindowproductRequestSchema>;

/**
 * 置顶小店主页商品
 * @see https://developers.weixin.qq.com/doc/store/shop/API/homepage/storewindow/api_settopstorewindowproduct.html
 */
export const SettopstorewindowproductRequestSchema = z.object({
  /** 商品id */
  product_id: z.string(),
  /** 是否置顶。1-置顶，0-取消置顶。 (1-置顶, 0-取消置顶) */
  is_set_top: z.number(),
});
export type SettopstorewindowproductRequest = z.infer<typeof SettopstorewindowproductRequestSchema>;

/**
 * 获取国补订单开票信息
 * @see https://developers.weixin.qq.com/doc/store/shop/API/subsidy/invoicing/api_query_invoicing_info.html
 */
export const QueryRequestSchema = z.object({
  /** 使用了国补的订单id */
  order_id: z.string(),
});
export type QueryRequest = z.infer<typeof QueryRequestSchema>;
export const QueryResponseSchema = z.object({
  /** 回包信息 */
  data: z.object({ name: z.string(), tax_no: z.string(), payment_amount: z.number(), subsidy_amount: z.number(), invoice_total_amount: z.number(), bar_code: z.string(), sn_code: z.string(), imei1: z.string(), imei2: z.string(), transaction_id: z.string(), is_invoice_uploaded: z.boolean(), efficiency: z.string(), goods_model: z.string(), goods_name: z.string(), brand_name: z.string() }).optional(),
});
export type QueryResponse = z.infer<typeof QueryResponseSchema>;

/**
 * 上传国补订单发票文件
 * @see https://developers.weixin.qq.com/doc/store/shop/API/subsidy/invoicing/api_upload_invoice_file.html
 */
export const UploadRequestSchema = z.object({
  /** 文件链接，需保证公网可访问 */
  file_link: z.string(),
});
export type UploadRequest = z.infer<typeof UploadRequestSchema>;
export const UploadResponseSchema = z.object({
  /** 回包信息 */
  data: z.object({ media_id: z.string() }).optional(),
});
export type UploadResponse = z.infer<typeof UploadResponseSchema>;

/**
 * 上传国补订单发票信息
 * @see https://developers.weixin.qq.com/doc/store/shop/API/subsidy/invoicing/api_upload_invoice_info.html
 */
export const UploadUploadInvoiceInfoRequestSchema = z.object({
  /** 使用了国补的订单id */
  order_id: z.string(),
  /** 发票代码，发票类型为90可以选填 */
  invoice_code: z.string().optional(),
  /** 发票号码 */
  invoice_no: z.string(),
  /** 开票时间，秒级时间戳，要求小于当前时间 [timestamp] */
  invoice_date: z.number(),
  /** media_id，需要调用上传国补订单发票获得 */
  invoice_media_id: z.string(),
  /** 发票类型 (01-增值税专用发票, 04-纸质普通发票, 09-数电专票, 10-电子普通发票, 90-数电普票) */
  invoice_type: z.string(),
  /** 发票校验码; 发票类型为10或者04时，校验码必填; 发票类型01、09、90时，校验码选填 */
  invoice_check_code: z.string().optional(),
  /** 税价合计，单位(分) */
  invoice_total_amount: z.number(),
  /** 发票税额，单位(分) */
  invoice_tax_amount: z.number(),
  /** 销售企业名称 */
  sales_enterprise_name: z.string(),
  /** 销售方纳税人识别号 */
  tax_payer: z.string(),
  /** 数量 */
  num: z.number(),
  /** 货物或应税劳务服务名 */
  service_name: z.string(),
  /** 备注事项 */
  remark: z.string(),
  /** 规格型号 */
  invoice_goods_model: z.string(),
});
export type UploadUploadInvoiceInfoRequest = z.infer<typeof UploadUploadInvoiceInfoRequestSchema>;

export const GetGetDistributeResponseSchema = z.object({
  /** 分配类型 (1-手动分配, 2-全店自动分配, 3-按商品分配) */
  distribute_type: z.number().optional(),
  /** 全店订单自动分配的供货商appid */
  all_supplier_appid: z.string().optional(),
  /** 全店订单自动分配的供货商名称 */
  all_distribute_supplier_name: z.string().optional(),
});
export type GetGetDistributeResponse = z.infer<typeof GetGetDistributeResponseSchema>;

/**
 * 获取商品对应的自动分配供货商
 * @see https://developers.weixin.qq.com/doc/store/shop/API/supplier/auto/api_get_product_default_distribution.html
 */
export const GetGetProductDefaultDistributeRequestSchema = z.object({
  /** 商品id */
  product_id: z.number(),
});
export type GetGetProductDefaultDistributeRequest = z.infer<typeof GetGetProductDefaultDistributeRequestSchema>;
export const GetGetProductDefaultDistributeResponseSchema = z.object({
  /** 是否存在已设置自动分配的供货商 */
  exist_default_supplier: z.boolean().optional(),
  /** 设置自动分配的供货商appid，当且仅当exist_default_supplier = true时有意义 */
  supplier_appid: z.string().optional(),
});
export type GetGetProductDefaultDistributeResponse = z.infer<typeof GetGetProductDefaultDistributeResponseSchema>;

/**
 * 获取按商品自动分配的商品列表
 * @see https://developers.weixin.qq.com/doc/store/shop/API/supplier/auto/api_get_product_list.html
 */
export const GetGetProductListRequestSchema = z.object({
  /** 是否过滤distribute_status */
  is_filter_distribute_status: z.boolean().optional(),
  /** 分配状态，当且仅当is_filter_distribute_status = true时生效 (0-已分配, 1-未分配) */
  distribute_status: z.number().optional(),
  /** 是否过滤supplier_appid */
  is_filter_supplier_appid: z.boolean().optional(),
  /** 供货商appid，当且仅当is_filter_supplier_appid = true时有效 */
  supplier_appid: z.string().optional(),
  /** 单页数量 */
  limit: z.number().min(0).optional(),
  /** 偏移量，分页用。第一次请求时传空串，请求下一页时将上一次返回的page_context填充到本次请求 */
  page_context: z.string().min(0).default('').optional(),
});
export type GetGetProductListRequest = z.infer<typeof GetGetProductListRequestSchema>;
export const GetGetProductListResponseSchema = z.object({
  /** 偏移量，分页用 */
  page_context: z.string().min(0).default('').optional(),
  /** 总数 */
  total_count: z.number().min(0).optional(),
  /** 商品列表 */
  list: z.array(z.object({ product_id: z.number().min(0), distribute_status: z.number(), supplier_appid: z.string().default(''), supplier_name: z.string().default('') })).optional(),
});
export type GetGetProductListResponse = z.infer<typeof GetGetProductListResponseSchema>;

/**
 * 获取供货商列表
 * @see https://developers.weixin.qq.com/doc/store/shop/API/supplier/relation/api_get_supplier_list.html
 */
export const GetGetSupplierListRequestSchema = z.object({
  /** 偏移量 */
  offset: z.number().default(0).optional(),
  /** 单页数量 */
  limit: z.number().default(0).optional(),
});
export type GetGetSupplierListRequest = z.infer<typeof GetGetSupplierListRequestSchema>;
export const GetGetSupplierListResponseSchema = z.object({
  /** 供货商列表 */
  list: z.array(z.object({ name: z.string(), appid: z.string(), status: z.number(), bind_audit_status: z.number(), update_time: z.number() })).optional(),
  /** 列表总数 */
  total_count: z.number().optional(),
});
export type GetGetSupplierListResponse = z.infer<typeof GetGetSupplierListResponseSchema>;

/**
 * 申请关联供货商
 * @see https://developers.weixin.qq.com/doc/store/shop/API/supplier/relation/api_invite_supplier.html
 */
export const InviteRequestSchema = z.object({
  /** 申请关联的供货商的appid */
  supplier_appid: z.string(),
  /** 第三方服务商ServiceID。当第三方平台代商家调用时，该字段必填，且平台将校验该ServiceID与实际调用方的一致性。 */
  service_id: z.number().optional(),
  /** 第三方服务商备注信息，应清晰说明具体的调用场景。平台建议第三方服务商无特殊情况下均传入备注信息。 */
  remark: z.string().optional(),
});
export type InviteRequest = z.infer<typeof InviteRequestSchema>;

/**
 * 设置全店订单自动分配
 * @see https://developers.weixin.qq.com/doc/store/shop/API/supplier/auto/api_set_all_distribution.html
 */
export const SetSetAllDistributionRequestSchema = z.object({
  /** 全店订单自动分配给该供货商 */
  supplier_appid: z.string(),
});
export type SetSetAllDistributionRequest = z.infer<typeof SetSetAllDistributionRequestSchema>;

/**
 * 设置按商品自动分配
 * @see https://developers.weixin.qq.com/doc/store/shop/API/supplier/auto/api_set_product_distribution.html
 */
export const SetSetProductDistributeRequestSchema = z.object({
  /** 设置列表，数量不超过 200 */
  list: z.array(z.object({ supplier_appid: z.string(), product_id: z.number(), is_distribute: z.boolean(), apply_to_gift: z.boolean() })),
});
export type SetSetProductDistributeRequest = z.infer<typeof SetSetProductDistributeRequestSchema>;

/**
 * 获取用户信息
 * @see https://developers.weixin.qq.com/doc/store/shop/API/vip/api_getuserinfo.html
 */
export const GetuserinfoRequestSchema = z.object({
  /** 用户openid */
  openid: z.string(),
});
export type GetuserinfoRequest = z.infer<typeof GetuserinfoRequestSchema>;
export const GetuserinfoResponseSchema = z.object({
  /** 用户信息 */
  info: z.object({ openid: z.string(), user_grade_info: z.object({ grade: z.number(), experience_value: z.number() }), unionid: z.string() }).optional(),
});
export type GetuserinfoResponse = z.infer<typeof GetuserinfoResponseSchema>;

/**
 * 获取用户列表
 * @see https://developers.weixin.qq.com/doc/store/shop/API/vip/api_getuserlist.html
 */
export const GetuserlistRequestSchema = z.object({
  /** 当前页，从1开始 */
  page_num: z.number().min(1),
  /** 每页数量，最大200 */
  page_size: z.number().min(1).max(200),
});
export type GetuserlistRequest = z.infer<typeof GetuserlistRequestSchema>;
export const GetuserlistResponseSchema = z.object({
  /** 用户信息列表 */
  list: z.array(z.object({ openid: z.string(), user_grade_info: z.object({ grade: z.number(), experience_value: z.number() }), unionid: z.string() })).optional(),
  /** 总数 */
  total_num: z.number().optional(),
});
export type GetuserlistResponse = z.infer<typeof GetuserlistResponseSchema>;

/**
 * 获取用户积分流水
 * @see https://developers.weixin.qq.com/doc/store/shop/API/vip/api_getuserscoreflowrecord.html
 */
export const GetuserscoreflowrecordRequestSchema = z.object({
  /** 用户openid */
  openid: z.string(),
  /** 当前页，从1开始 */
  page_num: z.number().min(1),
  /** 每页数量 */
  page_size: z.number(),
});
export type GetuserscoreflowrecordRequest = z.infer<typeof GetuserscoreflowrecordRequestSchema>;
export const GetuserscoreflowrecordResponseSchema = z.object({
  /** 流水信息列表 */
  list: z.array(z.object({ score: z.number(), source: z.number(), remark: z.string() })).optional(),
  /** 总数 */
  total_num: z.number().optional(),
});
export type GetuserscoreflowrecordResponse = z.infer<typeof GetuserscoreflowrecordResponseSchema>;

/**
 * 获取用户积分
 * @see https://developers.weixin.qq.com/doc/store/shop/API/vip/api_getvipuserscore.html
 */
export const GetvipuserscoreRequestSchema = z.object({
  /** 用户openid */
  openid: z.string(),
});
export type GetvipuserscoreRequest = z.infer<typeof GetvipuserscoreRequestSchema>;
export const GetvipuserscoreResponseSchema = z.object({
  /** 用户信息 */
  info: z.object({ score: z.string() }).optional(),
});
export type GetvipuserscoreResponse = z.infer<typeof GetvipuserscoreResponseSchema>;

export const V3GetResponseSchema = z.object({
  /** 关联的小程序appid */
  wxa_appid: z.string().optional(),
  /** 关联小程序信息 */
  info: z.object({ paths: z.object({ register_path: z.string(), rights_path: z.string() }), whitelist_openids: z.array(z.string()), display_info: z.object({ order_page_display: z.number() }) }).optional(),
  /** 状态，1:上线，2:未上线，3:上线前测试状态。说明：状态为2、3时，只有白名单用户可以在小店看到会员入口。 (1-上线, 2-未上线, 3-上线前测试状态) */
  state: z.number().optional(),
});
export type V3GetResponse = z.infer<typeof V3GetResponseSchema>;

/**
 * 获取指定地址下区域仓库的优先级
 * @see https://developers.weixin.qq.com/doc/store/shop/API/warehouse/api_getaddressprioritysort.html
 */
export const GetaddressprioritysortRequestSchema = z.object({
  /** 省份地址编码 */
  address_id1: z.number(),
  /** 市地址编码 */
  address_id2: z.number().optional(),
  /** 区地址编码 */
  address_id3: z.number().optional(),
  /** 街道地址编码 */
  address_id4: z.number().optional(),
});
export type GetaddressprioritysortRequest = z.infer<typeof GetaddressprioritysortRequestSchema>;
export const GetaddressprioritysortResponseSchema = z.object({
  /** 数据信息 */
  data: z.object({ priority_sort: z.array(z.string()) }).optional(),
});
export type GetaddressprioritysortResponse = z.infer<typeof GetaddressprioritysortResponseSchema>;

/**
 * 设置指定地址下区域仓库的优先级
 * @see https://developers.weixin.qq.com/doc/store/shop/API/warehouse/api_setaddressprioritysort.html
 */
export const SetaddressprioritysortRequestSchema = z.object({
  /** 省份地址编码，可从获取区域仓库接口获得 */
  address_id1: z.number(),
  /** 市地址编码，可从获取区域仓库接口获得 */
  address_id2: z.number().optional(),
  /** 区地址编码，可从获取区域仓库接口获得 */
  address_id3: z.number().optional(),
  /** 街道地址编码，可从获取区域仓库接口获得 */
  address_id4: z.number().optional(),
  /** 按照out_warehouse_id排序优先级从高到低 */
  priority_sort: z.array(z.string()).optional(),
});
export type SetaddressprioritysortRequest = z.infer<typeof SetaddressprioritysortRequestSchema>;

/**
 * 批量增加覆盖区域
 * @see https://developers.weixin.qq.com/doc/store/shop/API/warehouse/api_addcoverlocations.html
 */
export const AddcoverlocationsRequestSchema = z.object({
  /** 外部仓库ID，参考查询区域仓库列表接口 */
  out_warehouse_id: z.string(),
  /** 覆盖区域，可从获取区域仓库接口获得 */
  cover_locations: z.array(z.object({ address_id1: z.number(), address_id2: z.number(), address_id3: z.number(), address_id4: z.number() })),
});
export type AddcoverlocationsRequest = z.infer<typeof AddcoverlocationsRequestSchema>;

/**
 * 批量删除覆盖区域
 * @see https://developers.weixin.qq.com/doc/store/shop/API/warehouse/api_delcoverlocations.html
 */
export const DelcoverlocationsRequestSchema = z.object({
  /** 外部仓库ID，参考查询区域仓库列表接口 */
  out_warehouse_id: z.string(),
  /** 覆盖区域，可从获取区域仓库接口获得 */
  cover_locations: z.array(z.object({ address_id1: z.number(), address_id2: z.number(), address_id3: z.number(), address_id4: z.number() })),
});
export type DelcoverlocationsRequest = z.infer<typeof DelcoverlocationsRequestSchema>;

/**
 * 创建区域仓库
 * @see https://developers.weixin.qq.com/doc/store/shop/API/warehouse/api_createwarehouse.html
 */
export const CreatewarehouseRequestSchema = z.object({
  /** 外部仓库ID，一个店铺下，同一个外部ID只能创建一个仓库，最大128字符 */
  out_warehouse_id: z.string().max(128),
  /** 仓库名称 */
  name: z.string(),
  /** 仓库介绍 */
  intro: z.string(),
  /** 覆盖区域，可以在创建后添加 */
  cover_locations: z.array(z.object({ address_id1: z.number(), address_id2: z.number(), address_id3: z.number(), address_id4: z.number() })).optional(),
});
export type CreatewarehouseRequest = z.infer<typeof CreatewarehouseRequestSchema>;

/**
 * 修改区域仓库详情
 * @see https://developers.weixin.qq.com/doc/store/shop/API/warehouse/api_updatewarehousedetail.html
 */
export const UpdatewarehousedetailRequestSchema = z.object({
  /** 外部仓库ID，参考查询区域仓库列表接口 */
  out_warehouse_id: z.string(),
  /** 仓库名称 */
  name: z.string(),
  /** 仓库介绍 */
  intro: z.string(),
});
export type UpdatewarehousedetailRequest = z.infer<typeof UpdatewarehousedetailRequestSchema>;

/**
 * 获取区域仓库
 * @see https://developers.weixin.qq.com/doc/store/shop/API/warehouse/api_getwarehouse.html
 */
export const GetwarehouseRequestSchema = z.object({
  /** 外部仓库ID，参考查询区域仓库列表接口 */
  out_warehouse_id: z.string(),
});
export type GetwarehouseRequest = z.infer<typeof GetwarehouseRequestSchema>;
export const GetwarehouseResponseSchema = z.object({
  /** 仓库数据对象 */
  data: z.object({ out_warehouse_id: z.string(), name: z.string(), intro: z.string(), cover_locations: z.array(z.object({ address_id1: z.number(), address_id2: z.number(), address_id3: z.number(), address_id4: z.number() })) }).optional(),
});
export type GetwarehouseResponse = z.infer<typeof GetwarehouseResponseSchema>;

/**
 * 查询区域仓库列表
 * @see https://developers.weixin.qq.com/doc/store/shop/API/warehouse/api_getwarehouselist.html
 */
export const GetwarehouselistRequestSchema = z.object({
  /** 每页数量 */
  page_size: z.number().max(10),
  /** 由上次请求返回，记录翻页的上下文。传入时会从上次返回的结果往后翻一页，不传默认获取第一页数据 */
  next_key: z.string().optional(),
});
export type GetwarehouselistRequest = z.infer<typeof GetwarehouselistRequestSchema>;
export const GetwarehouselistResponseSchema = z.object({
  /** 返回数据对象 */
  data: z.object({ out_warehouse_ids: z.array(z.string()), next_key: z.string() }).optional(),
});
export type GetwarehouselistResponse = z.infer<typeof GetwarehouselistResponseSchema>;

/**
 * 获取区域仓库存数量
 * @see https://developers.weixin.qq.com/doc/store/shop/API/warehouse/api_getwarehousestock.html
 */
export const GetwarehousestockRequestSchema = z.object({
  /** 商品ID */
  product_id: z.string(),
  /** skuID */
  sku_id: z.string(),
  /** 外部仓库ID */
  out_warehouse_id: z.string(),
});
export type GetwarehousestockRequest = z.infer<typeof GetwarehousestockRequestSchema>;
export const GetwarehousestockResponseSchema = z.object({
  /** 库存信息 */
  data: z.object({ num: z.number() }).optional(),
});
export type GetwarehousestockResponse = z.infer<typeof GetwarehousestockResponseSchema>;

/**
 * 更新区域仓库存数量
 * @see https://developers.weixin.qq.com/doc/store/shop/API/warehouse/api_updatewarehousestock.html
 */
export const UpdatewarehousestockRequestSchema = z.object({
  /** 商品ID */
  product_id: z.string(),
  /** skuID */
  sku_id: z.string(),
  /** 外部仓库ID */
  out_warehouse_id: z.string(),
  /** 修改类型。1: 增加；2:减少；3:设置 (1-增加, 2-减少, 3-设置) */
  diff_type: z.number(),
  /** 增加、减少或者设置的库存值 */
  num: z.number(),
});
export type UpdatewarehousestockRequest = z.infer<typeof UpdatewarehousestockRequestSchema>;

/**
 * 获取关联账号企微id
 * @see https://developers.weixin.qq.com/doc/store/shop/API/wecom/api_shop_get_wecom_openid.html
 */
export const ShopRequestSchema = z.object({
  /** 企业微信corp_id，需是店铺的关联账号 */
  corp_id: z.string(),
  /** 企业微信user_id，需要保证属于corp_id且在应用可见范围内 */
  user_id: z.string().optional(),
});
export type ShopRequest = z.infer<typeof ShopRequestSchema>;
export const ShopResponseSchema = z.object({
  /** 回包信息 */
  data: z.object({ wecom_corp_id: z.string(), wecom_user_id: z.string() }).optional(),
});
export type ShopResponse = z.infer<typeof ShopResponseSchema>;

/**
 * 上传图片
 * @see https://developers.weixin.qq.com/doc/store/shop/API/apimgnt/api_img_upload.html
 */
export const ImgRequestSchema = z.object({
  /** 传类型。0:二进制流；1:图片url（不支持301/302跳转） (0-二进制流, 1-图片url) */
  upload_type: z.number(),
  /** 返回数据类型。0:media_id和pay_media_id；1:图片链接 (0-media_id和pay_media_id, 1-图片链接) */
  resp_type: z.number(),
  /** upload_type=0时必填，图片的高，单位：像素 */
  height: z.number().optional(),
  /** upload_type=0时必填，图片的宽，单位：像素 */
  width: z.number().optional(),
  /** upload_type=1时必填，图片url */
  img_url: z.string().optional(),
  /** upload_type=0时必填，图片文件buffer (formdata) */
  media: z.string().optional(),
});
export type ImgRequest = z.infer<typeof ImgRequestSchema>;
export const ImgResponseSchema = z.object({
  /** 图片信息 */
  pic_file: z.object({ media_id: z.string(), pay_media_id: z.string(), img_url: z.string() }).optional(),
});
export type ImgResponse = z.infer<typeof ImgResponseSchema>;

/**
 * 上传资质图片
 * @see https://developers.weixin.qq.com/doc/store/shop/API/apimgnt/api_qualificationupload.html
 */
export const QualificationuploadRequestSchema = z.object({
  /** 资质图片文件file (multipart/form-data) */
  media: z.string(),
});
export type QualificationuploadRequest = z.infer<typeof QualificationuploadRequestSchema>;
export const QualificationuploadResponseSchema = z.object({
  /** 文件信息 */
  data: z.object({ file_id: z.string() }).optional(),
});
export type QualificationuploadResponse = z.infer<typeof QualificationuploadResponseSchema>;

/**
 * 新增品牌资质
 * @see https://developers.weixin.qq.com/doc/store/shop/API/brand/api_addbrandlogic.html
 */
export const AddbrandlogicRequestSchema = z.object({
  /** 品牌详情 */
  brand: z.object({ brand_id: z.number(), ch_name: z.string(), en_name: z.string(), classification_no: z.string(), trade_mark_symbol: z.number(), register_details: z.object({ registrant: z.string(), register_no: z.string(), start_time: z.number(), end_time: z.number(), is_permanent: z.boolean(), register_certifications: z.array(z.string()), renew_certifications: z.array(z.string()) }), application_details: z.object({ acceptance_time: z.number(), acceptance_certification: z.array(z.string()), acceptance_no: z.string() }), grant_type: z.number(), grant_details: z.object({ grant_certifications: z.array(z.string()), grant_level: z.number().min(1).max(3), start_time: z.number(), end_time: z.number(), is_permanent: z.boolean(), brand_owner_id_photos: z.array(z.string()), use_split_grant_info: z.number(), grant_info_lv1: z.object({ grant_certifications: z.array(z.string()), start_time: z.number(), end_time: z.number(), is_permanent: z.boolean() }), grant_info_lv2: z.object({ grant_certifications: z.array(z.string()), start_time: z.number(), end_time: z.number(), is_permanent: z.boolean() }), grant_info_lv3: z.object({ grant_certifications: z.array(z.string()), start_time: z.number(), end_time: z.number(), is_permanent: z.boolean() }), contact_info_list: z.array(z.object({ key: z.string(), value: z.string() })) }) }),
});
export type AddbrandlogicRequest = z.infer<typeof AddbrandlogicRequestSchema>;
export const AddbrandlogicResponseSchema = z.object({
  /** 审核单ID */
  audit_id: z.number().optional(),
});
export type AddbrandlogicResponse = z.infer<typeof AddbrandlogicResponseSchema>;

/**
 * 获取品牌库列表
 * @see https://developers.weixin.qq.com/doc/store/shop/API/brand/api_getallbrandslogic.html
 */
export const GetallbrandslogicRequestSchema = z.object({
  /** 每页数量(默认10, 不超过50) */
  page_size: z.number().min(1).max(50).default(10),
  /** 由上次请求返回，记录翻页的上下文，传入时会从上次返回的结果往后翻一页，不传则默认获取第一页数据 */
  next_key: z.string().optional(),
});
export type GetallbrandslogicRequest = z.infer<typeof GetallbrandslogicRequestSchema>;
export const GetallbrandslogicResponseSchema = z.object({
  /** 品牌库中的品牌信息 */
  brands: z.array(z.object({ brand_id: z.string(), ch_name: z.string(), en_name: z.string() })).optional(),
  /** 本次翻页的上下文，用于请求下一页 */
  next_key: z.string().optional(),
  /** 是否还有下一页内容 */
  continue_flag: z.boolean().optional(),
});
export type GetallbrandslogicResponse = z.infer<typeof GetallbrandslogicResponseSchema>;

/**
 * 撤回品牌资质审核
 * @see https://developers.weixin.qq.com/doc/store/shop/API/brand/api_cancelauditbrandlogic.html
 */
export const CancelauditbrandlogicRequestSchema = z.object({
  /** 品牌库中的品牌编号 */
  brand_id: z.string(),
  /** 要撤销的审核单ID, 提交审核成功后返回 */
  audit_id: z.string(),
});
export type CancelauditbrandlogicRequest = z.infer<typeof CancelauditbrandlogicRequestSchema>;

export const GetallcategoryResponseSchema = z.object({
  /** 旧类目信息 */
  cats: z.array(z.object({ cat_and_qua: z.array(z.object({ cat: z.object({ cat_id: z.number(), name: z.string(), f_cat_id: z.number(), level: z.number() }), qua: z.object({ qua_id: z.number(), need_to_apply: z.boolean(), tips: z.string(), mandatory: z.boolean(), cert_group_list: z.array(z.object({ license_group_id: z.number(), is_necessary: z.number(), busi_license_desc: z.string(), license_list: z.array(z.object({ id: z.number(), name: z.string(), is_necessary: z.number(), license_field_list: z.array(z.object({ field_key: z.string(), field_name: z.string(), info: z.string(), is_necessary: z.number() })) })) })) }), product_qua: z.object({ qua_id: z.number(), need_to_apply: z.boolean(), tips: z.string(), mandatory: z.boolean() }), brand_qua: z.object({ qua_id: z.number(), need_to_apply: z.boolean(), tips: z.string(), mandatory: z.boolean() }), product_qua_list: z.array(z.object({ qua_id: z.number(), need_to_apply: z.boolean(), tips: z.string(), mandatory: z.boolean(), name: z.string() })), is_confidence_require_bad_must_pay: z.boolean() })) })).optional(),
  /** 新类目信息 */
  cats_v2: z.array(z.object({ cat_and_qua: z.array(z.object({ cat: z.object({ cat_id: z.number(), name: z.string(), f_cat_id: z.number(), level: z.number(), leaf: z.boolean() }), qua: z.object({ qua_id: z.number(), need_to_apply: z.boolean(), tips: z.string(), mandatory: z.boolean() }), product_qua: z.object({ qua_id: z.number(), need_to_apply: z.boolean(), tips: z.string(), mandatory: z.boolean() }), brand_qua: z.object({ qua_id: z.number(), need_to_apply: z.boolean(), tips: z.string(), mandatory: z.boolean() }), product_qua_list: z.array(z.object({ qua_id: z.number(), need_to_apply: z.boolean(), tips: z.string(), mandatory: z.boolean(), name: z.string() })), is_confidence_require_bad_must_pay: z.boolean() })) })).optional(),
});
export type GetallcategoryResponse = z.infer<typeof GetallcategoryResponseSchema>;

/**
 * 撤销类目审核
 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-category/api_cancelauditcategory.html
 */
export const CancelauditcategoryRequestSchema = z.object({
  /** 提交审核时返回的id，申请类目接口获得 */
  audit_id: z.string(),
});
export type CancelauditcategoryRequest = z.infer<typeof CancelauditcategoryRequestSchema>;

/**
 * 获取类目信息
 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-category/api_getcategorydetail.html
 */
export const GetcategorydetailRequestSchema = z.object({
  /** 品类ID（叶子类目ID） */
  cat_id: z.number(),
});
export type GetcategorydetailRequest = z.infer<typeof GetcategorydetailRequestSchema>;
export const GetcategorydetailResponseSchema = z.object({
  /** 类目信息 */
  info: z.object({ cat_id: z.number(), name: z.string() }).optional(),
  /** 属性信息 */
  attr: z.object({ shop_no_shipment: z.boolean(), access_permit_required: z.boolean(), pre_sale: z.boolean(), seven_day_return: z.boolean(), brand_list: z.array(z.object({ brand_id: z.number() })), deposit: z.number(), product_attr_list: z.array(z.object({ name: z.string(), type: z.string(), value: z.string(), is_required: z.boolean(), hint: z.string(), append_allowed: z.boolean(), type_v2: z.string() })), sale_attr_list: z.array(z.object({ name: z.string(), type: z.string(), value: z.string(), is_required: z.boolean(), hint: z.string(), append_allowed: z.boolean(), type_v2: z.string() })), transactionfee_info: z.object({ basis_point: z.number(), original_basis_point: z.number(), incentive_type: z.number() }), coupon_rule: z.object({ discount_ratio_limit: z.number(), discount_limit: z.number() }), floor_price: z.number(), confirm_receipt_days: z.array(z.string()), is_limit_brand: z.boolean(), product_requirement: z.object({ product_title_requirement: z.string(), product_img_requirement: z.string(), product_desc_requirement: z.string() }), size_chart: z.object({ is_support: z.boolean(), item_list: z.array(z.object({ name: z.string(), unit: z.string(), type: z.number(), format: z.number(), limit: z.string(), is_required: z.boolean() })) }), is_confidence_require_bad_must_pay: z.boolean() }).optional(),
  /** 资质信息 */
  product_qua_list: z.array(z.object({ qua_id: z.number(), need_to_apply: z.boolean(), tips: z.string(), mandatory: z.boolean(), name: z.string() })).optional(),
});
export type GetcategorydetailResponse = z.infer<typeof GetcategorydetailResponseSchema>;

/**
 * 获取店铺的类目权限详情
 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-category/api_getcategoryrelationdetail.html
 */
export const GetcategoryrelationdetailRequestSchema = z.object({
  /** 类目id */
  category_id: z.number(),
});
export type GetcategoryrelationdetailRequest = z.infer<typeof GetcategoryrelationdetailRequestSchema>;
export const GetcategoryrelationdetailResponseSchema = z.object({
  /** 类目id */
  category_id: z.number().optional(),
  /** 类目状态，1生效中，2已失效 (1-生效中, 2-已失效) */
  status: z.number().optional(),
  /** 失效原因 */
  uneffective_reason: z.string().optional(),
  /** 审核材料 */
  audit_info: z.object({ level3: z.number(), certificate: z.array(z.string()), brand_list: z.array(z.object({ brand_id: z.number() })), baobeihan: z.array(z.string()), jingyingzhengming: z.array(z.string()), jingyingpingtai: z.string(), zhanghaomingcheng: z.string(), ruzhuzhizhi: z.array(z.string()), daihuokoubei: z.array(z.string()), jingyingliushui: z.array(z.string()), buchongcailiao: z.array(z.string()), license_group_list: z.array(z.object({ license_group_id: z.number(), license: z.object({ license_id: z.number(), file_id_list: z.array(z.string()), license_field_list: z.array(z.object({ key: z.string(), value: z.string() })) }) })), commitment_letter_list: z.array(z.string()), account_link: z.string(), is_new_apply_cat: z.boolean() }).optional(),
  /** 生效时间 [timestamp] */
  effective_time: z.number().optional(),
  /** 失效时间 [timestamp] */
  uneffective_time: z.number().optional(),
  /** 类目资质 */
  qua_id: z.number().optional(),
});
export type GetcategoryrelationdetailResponse = z.infer<typeof GetcategoryrelationdetailResponseSchema>;

/**
 * 获取店铺的类目权限列表
 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-category/api_getcategoryrelationlist.html
 */
export const GetcategoryrelationlistRequestSchema = z.object({
  /** 是否过滤状态 */
  is_filter_status: z.boolean(),
  /** 当is_filter_status = true时，过滤的状态 */
  status: z.number().optional(),
});
export type GetcategoryrelationlistRequest = z.infer<typeof GetcategoryrelationlistRequestSchema>;
export const GetcategoryrelationlistResponseSchema = z.object({
  /** 店铺类目权限列表 */
  list: z.array(z.object({ id: z.number(), status: z.number(), uneffective_reason: z.string(), effective_time: z.number(), uneffective_time: z.number(), qua_id: z.number() })).optional(),
});
export type GetcategoryrelationlistResponse = z.infer<typeof GetcategoryrelationlistResponseSchema>;

/**
 * 获取店铺的类目审核单详情
 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-category/api_getbizcatflowdetail.html
 */
export const GetbizcatflowdetailRequestSchema = z.object({
  /** 审核单id */
  audit_id: z.number(),
});
export type GetbizcatflowdetailRequest = z.infer<typeof GetbizcatflowdetailRequestSchema>;
export const GetbizcatflowdetailResponseSchema = z.object({
  /** 类目审核单详情 */
  info: z.object({ cat_id: z.number(), status: z.number(), audit_id: z.number(), qua_id: z.number(), create_time: z.number(), update_time: z.number(), audit_info: z.object({ certificate: z.array(z.string()), brand_list: z.array(z.object({ brand_id: z.number() })), baobeihan: z.array(z.string()), jingyingzhengming: z.array(z.string()), jingyingpingtai: z.string(), zhanghaomingcheng: z.string(), ruzhuzhizhi: z.array(z.string()), daihuokoubei: z.array(z.string()), jingyingliushui: z.array(z.string()), buchongcailiao: z.array(z.string()), license_group_list: z.array(z.object({ license_group_id: z.number(), license: z.object({ license_id: z.number(), file_id_list: z.array(z.string()), license_field_list: z.array(z.object({ key: z.string(), value: z.string() })) }) })), commitment_letter_list: z.array(z.string()), account_link: z.string(), is_new_apply_cat: z.boolean() }), audit_time: z.number(), audit_reason: z.string() }).optional(),
});
export type GetbizcatflowdetailResponse = z.infer<typeof GetbizcatflowdetailResponseSchema>;

/**
 * 获取店铺的类目审核单列表
 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-category/api_getbizcatflowlist.html
 */
export const GetbizcatflowlistRequestSchema = z.object({
  /** 是否过滤状态 */
  is_filter_status: z.boolean(),
  /** 当is_filter_status = true时，过滤的状态 */
  status: z.number().optional(),
  /** 分页偏移量 */
  offset: z.number(),
  /** 分页数量限制 */
  limit: z.number(),
});
export type GetbizcatflowlistRequest = z.infer<typeof GetbizcatflowlistRequestSchema>;
export const GetbizcatflowlistResponseSchema = z.object({
  /** 审核单列表 */
  list: z.array(z.object({ cat_id: z.number(), status: z.number(), audit_id: z.number(), qua_id: z.number(), create_time: z.number(), update_time: z.number(), audit_info: z.object({ level3: z.number(), certificate: z.array(z.string()), brand_list: z.array(z.object({ brand_id: z.number() })), baobeihan: z.array(z.string()), jingyingzhengming: z.array(z.string()), jingyingpingtai: z.string(), zhanghaomingcheng: z.string(), ruzhuzhizhi: z.array(z.string()), daihuokoubei: z.array(z.string()), jingyingliushui: z.array(z.string()), buchongcailiao: z.array(z.string()), license_group_list: z.array(z.object({ license_group_id: z.number(), license: z.object({ license_id: z.number(), file_id_list: z.array(z.string()), license_field_list: z.array(z.object({ key: z.string(), value: z.string() })) }) })), commitment_letter_list: z.array(z.string()), account_link: z.string(), is_new_apply_cat: z.boolean() }), audit_time: z.number(), audit_reason: z.string() })).optional(),
});
export type GetbizcatflowlistResponse = z.infer<typeof GetbizcatflowlistResponseSchema>;

/**
 * 获取类目下商品发布规则
 * @see https://developers.weixin.qq.com/doc/store/shop/API/category-rule/api_getcategoryproductrule.html
 */
export const GetcategoryproductruleRequestSchema = z.object({
  /** 类目ID */
  cat_id: z.number(),
  /** 发布模式。0: 普通模式；1: 极简模式 (0-普通模式, 1-极简模式) */
  release_mode: z.number(),
});
export type GetcategoryproductruleRequest = z.infer<typeof GetcategoryproductruleRequestSchema>;
export const GetcategoryproductruleResponseSchema = z.object({
  /** 类目信息 */
  info: z.object({ cat_id: z.number(), name: z.string() }).optional(),
  /** 产品属性列表 */
  product_attr_list: z.array(z.object({ name: z.string(), value: z.string(), hint: z.string(), append_allowed: z.boolean(), type_v2: z.string(), required_rule: z.object({ rule_type: z.number(), or_combinators: z.array(z.object({ and_combinators: z.array(z.object({ combine_type: z.number(), text_conditions: z.array(z.object({ check_field: z.number(), oper_type: z.number(), keywords: z.array(z.string()) })) })) })) }) })).optional(),
  /** 销售属性列表 */
  sale_attr_list: z.array(z.object({ name: z.string(), value: z.string(), hint: z.string(), append_allowed: z.boolean(), type_v2: z.string(), required_rule: z.object({ rule_type: z.number(), or_combinators: z.array(z.object({ and_combinators: z.array(z.object({ combine_type: z.number(), text_conditions: z.array(z.object({ check_field: z.number(), oper_type: z.number(), keywords: z.array(z.string()) })) })) })) }) })).optional(),
  /** 资质信息列表 */
  product_qua_list: z.array(z.object({ id: z.number(), tips: z.string(), name: z.string(), required_rule: z.object({ rule_type: z.number(), or_combinators: z.array(z.object({ and_combinators: z.array(z.object({ combine_type: z.number(), text_conditions: z.array(z.object({ check_field: z.number(), oper_type: z.number(), keywords: z.array(z.string()) })) })) })) }) })).optional(),
  /** 价格下限，单位分，商品售价不可低于此价格 */
  floor_price: z.number().optional(),
  /** 尺码表 */
  size_chart: z.object({ is_support: z.boolean(), item_list: z.array(z.object({ name: z.string(), unit: z.string(), type: z.number(), is_required: z.boolean(), format: z.number(), limit: z.string() })) }).optional(),
  /** 商品编辑要求 */
  product_requirement: z.object({ product_title_requirement: z.string(), product_img_requirement: z.string(), product_desc_requirement: z.string() }).optional(),
  /** 额外服务列表 */
  extra_service_list: z.array(z.object({ extra_service_name: z.string(), extra_service_type: z.string(), extra_service_value: z.string() })).optional(),
  /** 是否必填sku条形码 */
  is_need_bar_code: z.boolean().optional(),
  /** 预售规则 */
  presale_rule: z.object({ presale_switch: z.boolean(), delivery_after_presale: z.object({ presale_cycle_span: z.number(), min_delay_day: z.number(), max_delay_day: z.number() }), delivery_after_pay: z.object({ min_delay_day: z.number(), max_delay_day: z.number() }), product_price_threshold: z.string() }).optional(),
});
export type GetcategoryproductruleResponse = z.infer<typeof GetcategoryproductruleResponseSchema>;

/**
 * 获取保证金类目规则
 * @see https://developers.weixin.qq.com/doc/store/shop/API/category-rule/api_get_category_rule.html
 */
export const GetRequestSchema = z.object({
  /** 规则id，保证金填1 */
  rule_id: z.number(),
  /** 类目id */
  category_id: z.number(),
});
export type GetRequest = z.infer<typeof GetRequestSchema>;
export const GetResponseSchema = z.object({
  /** 保证金，单位：分 */
  deposit: z.number().optional(),
});
export type GetResponse = z.infer<typeof GetResponseSchema>;

/**
 * 根据卡号查银行信息
 * @see https://developers.weixin.qq.com/doc/store/shop/API/funds/bank/api_ecgetbankbynum.html
 */
export const EcgetbankbynumRequestSchema = z.object({
  /** 银行卡号 */
  account_number: z.string(),
});
export type EcgetbankbynumRequest = z.infer<typeof EcgetbankbynumRequestSchema>;
export const EcgetbankbynumResponseSchema = z.object({
  /** 银行信息 */
  data: z.array(z.object({ bank_code: z.string(), bank_id: z.number(), bank_name: z.string(), need_branch: z.boolean(), account_bank: z.string() })).optional(),
  /** 总数 */
  total_count: z.number().optional(),
});
export type EcgetbankbynumResponse = z.infer<typeof EcgetbankbynumResponseSchema>;

/**
 * 搜索银行列表
 * @see https://developers.weixin.qq.com/doc/store/shop/API/funds/bank/api_ecgetbanklist.html
 */
export const EcgetbanklistRequestSchema = z.object({
  /** 偏移量 */
  offset: z.number().default(0).optional(),
  /** 每页数据大小 */
  limit: z.number().optional(),
  /** 银行关键字 */
  key_words: z.string().optional(),
  /** 银行类型(1:对私银行,2:对公银行; 默认对公) (1-对私银行, 2-对公银行) */
  bank_type: z.number().optional(),
});
export type EcgetbanklistRequest = z.infer<typeof EcgetbanklistRequestSchema>;
export const EcgetbanklistResponseSchema = z.object({
  /** 银行账号数据 */
  data: z.array(z.object({ bank_code: z.string(), bank_id: z.number(), bank_name: z.string(), need_branch: z.boolean(), bank_type: z.number(), account_bank: z.string() })).optional(),
});
export type EcgetbanklistResponse = z.infer<typeof EcgetbanklistResponseSchema>;

/**
 * 查询城市列表
 * @see https://developers.weixin.qq.com/doc/store/shop/API/funds/bank/api_ecgetcity.html
 */
export const EcgetcityRequestSchema = z.object({
  /** 省份编码 */
  province_code: z.number(),
});
export type EcgetcityRequest = z.infer<typeof EcgetcityRequestSchema>;
export const EcgetcityResponseSchema = z.object({
  /** 城市信息列表 */
  data: z.array(z.object({ city_name: z.string(), city_code: z.number(), bank_address_code: z.string() })).optional(),
  /** 总数 */
  total_count: z.number().optional(),
});
export type EcgetcityResponse = z.infer<typeof EcgetcityResponseSchema>;

export const EcgetprovinceResponseSchema = z.object({
  /** 省份信息数组 */
  data: z.array(z.object({ province_name: z.string(), province_code: z.number() })).optional(),
  /** 总数 */
  total_count: z.number().optional(),
});
export type EcgetprovinceResponse = z.infer<typeof EcgetprovinceResponseSchema>;

/**
 * 查询支行列表
 * @see https://developers.weixin.qq.com/doc/store/shop/API/funds/bank/api_ecgetsubbranch.html
 */
export const EcgetsubbranchRequestSchema = z.object({
  /** 银行编码，通过查询银行信息或者搜索银行信息获取 */
  bank_code: z.string(),
  /** 城市编号，通过查询城市列表获取 */
  city_code: z.number(),
  /** 偏移量 */
  offset: z.number().optional(),
  /** 限制个数 */
  limit: z.number().optional(),
});
export type EcgetsubbranchRequest = z.infer<typeof EcgetsubbranchRequestSchema>;
export const EcgetsubbranchResponseSchema = z.object({
  /** 其他银行信息 */
  data: z.array(z.object({ branch_id: z.number(), branch_name: z.string() })).optional(),
  /** 总数 */
  total_count: z.number().optional(),
  /** 当前分页数量 */
  count: z.number().optional(),
  /** 银行编码 */
  account_bank_code: z.number().optional(),
  /** 银行别名 */
  bank_alias: z.string().optional(),
  /** 银行别名编码 */
  bank_alias_code: z.string().optional(),
  /** 银行名称 */
  account_bank: z.string().optional(),
});
export type EcgetsubbranchResponse = z.infer<typeof EcgetsubbranchResponseSchema>;

/**
 * 查询扫码状态
 * @see https://developers.weixin.qq.com/doc/store/shop/API/funds/qrcode/api_eccheckqrcode.html
 */
export const EccheckqrcodeRequestSchema = z.object({
  /** 二维码ticket，可从商户提现接口获取 */
  qrcode_ticket: z.string(),
});
export type EccheckqrcodeRequest = z.infer<typeof EccheckqrcodeRequestSchema>;
export const EccheckqrcodeResponseSchema = z.object({
  /** 扫码状态 (0-未扫码, 1-已确认, 2-已取消, 3-已失效, 4-已扫码) */
  status: z.number().optional(),
  /** 业务返回错误码 */
  self_check_err_code: z.number().optional(),
  /** 业务返回错误信息 */
  self_check_err_msg: z.string().optional(),
  /** 扫码者身份 (0-非管理员, 1-管理员, 2-次管理员) */
  scan_user_type: z.number().optional(),
});
export type EccheckqrcodeResponse = z.infer<typeof EccheckqrcodeResponseSchema>;

/**
 * 获取二维码
 * @see https://developers.weixin.qq.com/doc/store/shop/API/funds/qrcode/api_ecgetqrcode.html
 */
export const EcgetqrcodeRequestSchema = z.object({
  /** 二维码ticket，可通过生成二维码接口获取 */
  qrcode_ticket: z.string(),
});
export type EcgetqrcodeRequest = z.infer<typeof EcgetqrcodeRequestSchema>;
export const EcgetqrcodeResponseSchema = z.object({
  /** 二维码(base64编码二进制，需要base64解码) [base64] */
  qrcode_buf: z.string().optional(),
});
export type EcgetqrcodeResponse = z.infer<typeof EcgetqrcodeResponseSchema>;

/**
 * 新增小程序会员信息
 * @see https://developers.weixin.qq.com/doc/store/shop/API/wxamember/wxa/api_v3_wxa_adduserinfo.html
 */
export const V3AddRequestSchema = z.object({
  /** 用户操作的会话id，由小店传递给小程序，有效期 10 分钟 */
  session_id: z.string(),
  /** 小程序用户openid */
  wxa_openid: z.string(),
  /** 小程序会员信息 */
  info: z.object({ identity: z.string(), outer_userid: z.string() }),
});
export type V3AddRequest = z.infer<typeof V3AddRequestSchema>;

/**
 * 删除小程序会员信息
 * @see https://developers.weixin.qq.com/doc/store/shop/API/wxamember/wxa/api_v3_wxa_deluserinfo.html
 */
export const V3DeleteRequestSchema = z.object({
  /** 小程序用户openid */
  wxa_openid: z.string(),
});
export type V3DeleteRequest = z.infer<typeof V3DeleteRequestSchema>;

/**
 * 获取小程序会员信息
 * @see https://developers.weixin.qq.com/doc/store/shop/API/wxamember/wxa/api_v3_wxa_getuserinfo.html
 */
export const V3RequestSchema = z.object({
  /** 小程序用户openid */
  wxa_openid: z.string(),
});
export type V3Request = z.infer<typeof V3RequestSchema>;
export const V3ResponseSchema = z.object({
  /** 小程序会员信息 */
  info: z.object({ identity: z.string(), outer_userid: z.string(), related_shop_appid: z.array(z.string()) }).optional(),
});
export type V3Response = z.infer<typeof V3ResponseSchema>;

/**
 * 更新小程序会员信息
 * @see https://developers.weixin.qq.com/doc/store/shop/API/wxamember/wxa/api_v3_wxa_updateuserinfo.html
 */
export const V3UpdateRequestSchema = z.object({
  /** 小程序用户openid */
  wxa_openid: z.string(),
  /** 小程序会员信息 */
  info: z.object({ identity: z.string(), outer_userid: z.string() }),
});
export type V3UpdateRequest = z.infer<typeof V3UpdateRequestSchema>;

/**
 * 获取小程序会员列表
 * @see https://developers.weixin.qq.com/doc/store/shop/API/wxamember/wxa/api_v3_wxa_getuserlist.html
 */
export const V3GetRequestSchema = z.object({
  /** 偏移量 */
  offset: z.number(),
  /** 本次读取数量 */
  limit: z.number(),
});
export type V3GetRequest = z.infer<typeof V3GetRequestSchema>;
export const V3GetResponseSchema = z.object({
  /** 小程序会员列表 */
  list: z.array(z.object({ identity: z.string(), outer_userid: z.string(), wxa_openid: z.string(), related_shop_appid: z.array(z.string()) })).optional(),
});
export type V3GetResponse = z.infer<typeof V3GetResponseSchema>;

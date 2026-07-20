// Code generated from WeChat Work API documentation. DO NOT EDIT.
import { z } from 'zod';

/**
 * 查询电子发票
 * @see https://developer.work.weixin.qq.com/document/path/90103
 */
export const GetInvoiceInfoRequestSchema = z.object({
  /** 发票id */
  card_id: z.string(),
  /** 加密code */
  encrypt_code: z.string(),
});
export type GetInvoiceInfoRequest = z.infer<typeof GetInvoiceInfoRequestSchema>;
export const GetInvoiceInfoResponseSchema = z.object({
  /** 发票id */
  card_id: z.string().optional(),
  /** 发票的有效期起始时间 [timestamp] */
  begin_time: z.number().optional(),
  /** 发票的有效期截止时间 [timestamp] */
  end_time: z.number().optional(),
  /** 用户标识 */
  openid: z.string().optional(),
  /** 发票类型，如广东增值税普通发票 */
  type: z.string().optional(),
  /** 发票的收款方 */
  payee: z.string().optional(),
  /** 发票详情 */
  detail: z.string().optional(),
  /** 发票的用户信息 */
  user_info: z.object({ fee: z.number(), title: z.string(), billing_time: z.number(), billing_no: z.string(), billing_code: z.string(), tax: z.number(), fee_without_tax: z.number(), pdf_url: z.string(), trip_pdf_url: z.string(), check_code: z.string(), buyer_number: z.string(), buyer_address_and_phone: z.string(), buyer_bank_account: z.string(), seller_number: z.string(), seller_address_and_phone: z.string(), seller_bank_account: z.string(), remarks: z.string(), cashier: z.string(), maker: z.string(), reimburse_status: z.string(), info: z.array(z.object({ name: z.string(), num: z.number(), unit: z.string(), price: z.number() })) }).optional(),
});
export type GetInvoiceInfoResponse = z.infer<typeof GetInvoiceInfoResponseSchema>;

/**
 * 批量查询电子发票
 * @see https://developer.work.weixin.qq.com/document/path/90106
 */
export const BatchGetInvoiceInfoRequestSchema = z.object({
  /** 发票列表 */
  item_list: z.array(z.object({ card_id: z.string(), encrypt_code: z.string() })),
});
export type BatchGetInvoiceInfoRequest = z.infer<typeof BatchGetInvoiceInfoRequestSchema>;
export const BatchGetInvoiceInfoResponseSchema = z.object({
  /** 发票信息列表 */
  item_list: z.array(z.object({ card_id: z.string(), begin_time: z.number(), end_time: z.number(), openid: z.string(), type: z.string(), payee: z.string(), detail: z.string(), user_info: z.object({ fee: z.number(), title: z.string(), billing_time: z.number(), billing_no: z.string(), billing_code: z.string(), tax: z.number(), fee_without_tax: z.number(), pdf_url: z.string(), trip_pdf_url: z.string(), check_code: z.string(), buyer_number: z.string(), buyer_address_and_phone: z.string(), buyer_bank_account: z.string(), seller_number: z.string(), seller_address_and_phone: z.string(), seller_bank_account: z.string(), remarks: z.string(), cashier: z.string(), maker: z.string(), reimburse_status: z.string(), info: z.array(z.object({ name: z.string(), num: z.number(), unit: z.string(), price: z.number() })) }) })).optional(),
});
export type BatchGetInvoiceInfoResponse = z.infer<typeof BatchGetInvoiceInfoResponseSchema>;

/**
 * 更新发票状态
 * @see https://developer.work.weixin.qq.com/document/path/90104
 */
export const UpdateInvoiceStatusRequestSchema = z.object({
  /** 发票id */
  card_id: z.string(),
  /** 加密code */
  encrypt_code: z.string(),
  /** 发报销状态 (INVOICE_REIMBURSE_INIT-发票初始状态，未锁定, INVOICE_REIMBURSE_LOCK...) */
  reimburse_status: z.string(),
});
export type UpdateInvoiceStatusRequest = z.infer<typeof UpdateInvoiceStatusRequestSchema>;

/**
 * 批量更新发票状态
 * @see https://developer.work.weixin.qq.com/document/path/90105
 */
export const BatchUpdateInvoiceStatusRequestSchema = z.object({
  /** 用户openid，可用userid与openid互换接口获取 */
  openid: z.string(),
  /** 发票报销状态 (INVOICE_REIMBURSE_INIT-发票初始状态，未锁定, INVOICE_REIMBURSE_LOCK...) */
  reimburse_status: z.string(),
  /** 发票列表，必须全部属于同一个openid */
  invoice_list: z.array(z.object({ card_id: z.string(), encrypt_code: z.string() })),
});
export type BatchUpdateInvoiceStatusRequest = z.infer<typeof BatchUpdateInvoiceStatusRequestSchema>;


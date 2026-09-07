import { Errors, type FetchLike } from '@wener/utils';
import {
	createExpireValueHolder,
	type ExpireValueHolderInit,
	type ExpiryValue,
	type ExpiryValueHolder,
} from '../../ExpiryValue';
import { getAccessToken, getStableAccessToken } from './getAccessToken';
import { type RequestOptions, request } from './request';
import type * as S from './schema';
import type { GeneralResponse } from './schema';
import type { GetDomainInfoResponse, GetOpenAPIQuotaResponse, GetPhoneNumberResponse } from './types';

export interface WechatServerClientInit {
	fetch?: FetchLike;
	appId?: string;
	appSecret?: string;
	accessToken?: ExpireValueHolderInit;
	stableAccessToken?: ExpireValueHolderInit;
	onAccessToken?: (data: ExpiryValue) => void;
	debug?: boolean;
	onStableAccessToken?: (data: ExpiryValue) => void;
}

export interface WechatServerClientOptions {
	appId?: string;
	appSecret?: string;
	accessToken: ExpiryValueHolder;
	stableAccessToken: ExpiryValueHolder;
	debug: boolean;
}

export class WechatServerClient {
	static create({
		appSecret,
		appId,
		accessToken,
		stableAccessToken,
		onAccessToken,
		onStableAccessToken,
		...init
	}: WechatServerClientInit) {
		return new WechatServerClient({
			debug: false,
			fetch: globalThis.fetch,
			accessToken: createExpireValueHolder({
				value: accessToken,
				onLoad: onAccessToken,
				loader: () => {
					if (!appId || !appSecret) {
						throw new Error('appId and appSecret is required');
					}
					return getAccessToken({ appid: appId, secret: appSecret }).then(({ access_token, expires_in }) => {
						return { value: access_token, expiresAt: new Date(Date.now() + expires_in * 1000) };
					});
				},
			}),

			stableAccessToken: createExpireValueHolder({
				value: stableAccessToken,
				onLoad: onStableAccessToken,
				loader: () => {
					if (!appId || !appSecret) {
						throw new Error('appId and appSecret is required');
					}
					return getStableAccessToken({ appid: appId, secret: appSecret }).then(({ access_token, expires_in }) => {
						return { value: access_token, expiresAt: new Date(Date.now() + expires_in * 1000) };
					});
				},
			}),
			appId,
			appSecret,
			...init,
		});
	}

	constructor(readonly options: WechatServerClientOptions) {}

	with(o: Partial<WechatServerClientOptions>) {
		return new WechatServerClient({ ...this.options, ...o });
	}

	async getAccessToken() {
		return this.options.accessToken.get();
	}

	async getStableAccessToken() {
		return this.options.stableAccessToken.get();
	}

	async getOpenAPIQuota(params: {
		cgi_path: string; // 例如 /cgi-bin/message/custom/send
	}) {
		return this.request<GetOpenAPIQuotaResponse>({
			url: 'openapi/quota/get',
			method: 'POST',
			params: { access_token: true },
			body: params,
		});
	}

	/**
	 * @see https://developers.weixin.qq.com/miniprogram/dev/OpenApiDoc/operation/getDomainInfo.html
	 */
	async getDomainInfo() {
		return this.request<GetDomainInfoResponse>({
			url: 'https://api.weixin.qq.com/wxa/getwxadevinfo',
			params: { access_token: true },
		});
	}

	async ping() {
		await this.getApiDomainIps();
	}

	/**
	 *
	 * @see https://developers.weixin.qq.com/miniprogram/dev/OpenApiDoc/user-login/code2Session.html
	 */
	async code2Session(params: { appid?: string; secret?: string; js_code: string; grant_type?: string }) {
		return this.request<{
			openid: string;
			session_key: string;
			unionid?: string; // 若当前小程序已绑定到微信开放平台账号下会返回
		}>({
			url: 'https://api.weixin.qq.com/sns/jscode2session',
			params: { appid: true, secret: true, grant_type: 'authorization_code', ...params },
		});
	}

	/**
	 *
	 * @see https://developers.weixin.qq.com/miniprogram/dev/OpenApiDoc/user-login/checkSessionKey.html
	 */
	async checkSessionKey(params: { openid: string; sig_method: 'hmac_sha256'; signature: string }) {
		return this.request<{ errcode: number; errmsg: string }>({
			url: 'https://api.weixin.qq.com/wxa/checksession',
			params: { ...params, access_token: true },
		});
	}

	async resetSessionKey(params: { openid: string; sig_method: 'hmac_sha256'; signature: string }) {
		return this.request<{ openid: string; session_key: string }>({
			url: 'https://api.weixin.qq.com/wxa/resetusersessionkey',
			params: { ...params, access_token: true },
		});
	}

	/**
	 * 检测后台配置的回调地址
	 *
	 * @see https://developers.weixin.qq.com/doc/offiaccount/Basic_Information/Network_Detection.html
	 */
	async checkCallback(
		params: {
			action?: 'all' | 'dns' | 'ping';
			check_operator?: 'DEFAULT' | 'CHINANET' | 'UNICOM' | 'CAP'; // CAP 为腾讯自建
		} = {},
	) {
		return this.request<{
			dns: Array<{ ip: string; real_operator: string }>;
			ping: Array<{ ip: string; from_operator: string; package_loss: number; time: string }>;
		}>({
			url: 'https://api.weixin.qq.com/cgi-bin/callback/check',
			params: { access_token: true },
			body: { action: 'all', check_operator: 'DEFAULT', ...params },
		});
	}

	async getCallbackIps() {
		return this.request<{ ip_list: string[] }>({
			url: 'https://api.weixin.qq.com/cgi-bin/getcallbackip',
			params: { access_token: true },
		});
	}

	async getApiDomainIps() {
		return this.request<{ ip_list: string[] }>({
			url: 'https://api.weixin.qq.com/cgi-bin/get_api_domain_ip',
			params: { access_token: true },
		});
	}

	/**
	 * @see https://developers.weixin.qq.com/miniprogram/dev/OpenApiDoc/user-info/phone-number/getPhoneNumber.html
	 */
	async getPhoneNumber(params: { code: string; openid?: string }) {
		return this.request<GetPhoneNumberResponse>({
			url: 'https://api.weixin.qq.com/wxa/business/getuserphonenumber',
			params: { access_token: true },
			body: params,
		});
	}

	// region generated-apis
	// Code generated from WeChat API documentation. DO NOT EDIT.
	// prettier-ignore-start
	/**
	 * 查询Code接口
	 * @see https://developers.weixin.qq.com/doc/service/guide/product/card/Managing_Coupons_Vouchers_and_Cards.html
	 */
	async getCardCode(body: S.GetCardCodeRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetCardCodeResponse>({
			method: 'POST',
			url: 'card/code/get',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 创建卡券接口
	 * @see https://developers.weixin.qq.com/doc/subscription/guide/product/card/Create_a_Coupon_Voucher_or_Card.html
	 */
	async createCardMember(body: S.CreateCardMemberRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.CreateCardMemberResponse>({
			method: 'POST',
			url: 'card/create',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 拉取会员信息（积分查询）接口
	 * @see https://developers.weixin.qq.com/doc/service/guide/product/card/Membership_Cards/Manage_Member_Card.html
	 */
	async getMemberCardUserInfo(body: S.GetMemberCardUserInfoRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetMemberCardUserInfoResponse>({
			method: 'POST',
			url: 'card/membercard/userinfo/get',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 创建二维码接口
	 * @see https://developers.weixin.qq.com/doc/subscription/guide/product/card/Distributing_Coupons_Vouchers_and_Cards.html
	 */
	async createCardQrCode(body: S.CreateCardQrCodeRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.CreateCardQrCodeResponse>({
			method: 'POST',
			url: 'card/qrcode/create',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 第三方代制模式 - 创建子商户接口
	 * @see https://developers.weixin.qq.com/doc/subscription/guide/product/card/Third-party_developer_mode.html
	 */
	async cardSubMerchantSubmit(body: S.CardSubMerchantSubmitRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.CardSubMerchantSubmitResponse>({
			method: 'POST',
			url: 'card/submerchant/submit',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 重置API调用次数
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/apimgnt/api_clearquota.html
	 */
	async clearQuota(body: S.ClearQuotaRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: 'clear_quota',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 使用AppSecret重置API调用次数
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/apimgnt/api_clearquotabyappsecret.html
	 */
	async clearQuotaByAppSecret(body: S.ClearQuotaByAppSecretRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: 'clear_quota/v2',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 发送聊天工具消息
	 * @see https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/chatToolOpenMode.html
	 */
	async sendChatToolMsg(body: S.SendChatToolMsgRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: 'message/wxopen/chattoolmsg/send',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 重置指定API调用次数
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/apimgnt/api_clearapiquota.html
	 */
	async clearApiQuota(body: S.ClearApiQuotaRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: 'openapi/quota/clear',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 查询API调用额度
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/apimgnt/api_getapiquota.html
	 */
	async getApiQuota(body: S.GetApiQuotaRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetApiQuotaResponse>({
			method: 'POST',
			url: 'openapi/quota/get',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 查询rid信息
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/apimgnt/api_getridinfo.html
	 */
	async getRidInfo(body: S.GetRidInfoRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetRidInfoResponse>({
			method: 'POST',
			url: 'openapi/rid/get',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 微信网页授权接口
	 * @see https://developers.weixin.qq.com/doc/service/guide/h5/auth.html
	 */
	async getOauth2AccessToken(params: S.GetOauth2AccessTokenRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetOauth2AccessTokenResponse>({
			url: 'sns/oauth2/access_token',
			params: { access_token: true, ...params },
			...opts,
		});
	}
	/**
	 * 生物认证接口
	 * @see https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/bio-auth.html
	 */
	async verifySoterSignature(body: S.VerifySoterSignatureRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.VerifySoterSignatureResponse>({
			method: 'POST',
			url: 'soter/verify_signature',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 获取api_ticket
	 * @see https://developers.weixin.qq.com/doc/service/guide/h5/jssdk.html
	 */
	async getApiTicket(params: S.GetApiTicketRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetApiTicketResponse>({
			url: 'ticket/getticket',
			params: { access_token: true, ...params },
			...opts,
		});
	}
	/**
	 * 同意售后
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-aftersale/api_acceptapply.html
	 */
	async acceptapply(body: S.AcceptapplyRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/aftersale/acceptapply',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 换货发货
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-aftersale/api_acceptexchangereship.html
	 */
	async acceptexchangereship(body: S.AcceptexchangereshipRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/aftersale/acceptexchangereship',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 商家补充纠纷单留言
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/complaint/api_addcomplaintmaterial.html
	 */
	async addcomplaintmaterial(body: S.AddcomplaintmaterialRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/aftersale/addcomplaintmaterial',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 商家举证
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/complaint/api_addcomplaintproof.html
	 */
	async addcomplaintproof(body: S.AddcomplaintproofRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/aftersale/addcomplaintproof',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 售后单兑换虚拟号
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-aftersale/api_applyvirtualtelnum.html
	 */
	async applyvirtualtelnum(body: S.ApplyvirtualtelnumRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.ApplyvirtualtelnumResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/aftersale/applyvirtualtelnum',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 代用户发起售后
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-aftersale/api_genaftersaleorder.html
	 */
	async genaftersaleorder(body: S.GenaftersaleorderRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GenaftersaleorderResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/aftersale/genaftersaleorder',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 获取售后单列表
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-aftersale/api_getaftersalelist.html
	 */
	async getaftersalelist(body: S.GetaftersalelistRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetaftersalelistResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/aftersale/getaftersalelist',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 获取售后单
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-aftersale/api_getaftersaleorder.html
	 */
	async getaftersaleorder(body: S.GetaftersaleorderRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetaftersaleorderResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/aftersale/getaftersaleorder',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 获取纠纷单
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/complaint/api_getcomplaintorder.html
	 */
	async getcomplaintorder(body: S.GetcomplaintorderRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetcomplaintorderResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/aftersale/getcomplaintorder',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 获取保障单详情
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-aftersale/api_getguaranteeorder.html
	 */
	async getguaranteeorder(body: S.GetguaranteeorderRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetguaranteeorderResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/aftersale/getguaranteeorder',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 商家处理极速换货用户退货
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-aftersale/api_handlefastexchangereceipt.html
	 */
	async handlefastexchangereceipt(body: S.HandlefastexchangereceiptRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/aftersale/handlefastexchangereceipt',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 商家同意保障单申请
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-aftersale/api_merchantacceptguarantee.html
	 */
	async merchantacceptguarantee(body: S.MerchantacceptguaranteeRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/aftersale/merchantacceptguarantee',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 商家协商保障单
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-aftersale/api_merchantmodifyguarantee.html
	 */
	async merchantmodifyguarantee(body: S.MerchantmodifyguaranteeRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/aftersale/merchantmodifyguarantee',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 商家举证保障单
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-aftersale/api_merchantproofguarantee.html
	 */
	async merchantproofguarantee(body: S.MerchantproofguaranteeRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/aftersale/merchantproofguarantee',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 商家拒绝保障单申请
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-aftersale/api_merchantrefuseguarantee.html
	 */
	async merchantrefuseguarantee(body: S.MerchantrefuseguaranteeRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/aftersale/merchantrefuseguarantee',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 商家协商
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-aftersale/api_merchantupdateaftersale.html
	 */
	async merchantupdateaftersale(body: S.MerchantupdateaftersaleRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/aftersale/merchantupdateaftersale',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 获取全量售后原因
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-aftersale/api_getaftersalereason.html
	 */
	async getaftersalereason(body?: Record<string, any>, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetaftersalereasonResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/aftersale/reason/get',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 代用户发起退差价
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-aftersale/api_refundpricediff.html
	 */
	async refundpricediff(body: S.RefundpricediffRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.RefundpricediffResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/aftersale/refundpricediff',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 拒绝售后
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-aftersale/api_rejectapply.html
	 */
	async rejectapply(body: S.RejectapplyRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/aftersale/rejectapply',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 换货拒绝发货
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-aftersale/api_rejectexchangereship.html
	 */
	async rejectexchangereship(body: S.RejectexchangereshipRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/aftersale/rejectexchangereship',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 获取拒绝售后原因
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-aftersale/api_getaftersalerejectreason.html
	 */
	async getaftersalerejectreason(body?: Record<string, any>, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetaftersalerejectreasonResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/aftersale/rejectreason/get',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 商家获取保障单列表
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-aftersale/api_searchguaranteeorder.html
	 */
	async searchguaranteeorder(body: S.SearchguaranteeorderRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.SearchguaranteeorderResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/aftersale/searchguaranteeorder',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 上传退款凭证
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-aftersale/api_uploadrefundcertificate.html
	 */
	async uploadrefundcertificate(body: S.UploadrefundcertificateRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/aftersale/uploadrefundcertificate',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 查询礼物活动详情
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/miniandstore/cooperation_gift/api_get_activity.html
	 */
	async getGet(body: S.GetGetRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetGetResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/b2c/activity/info/promoter/get',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 查询小店礼物活动列表
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/miniandstore/cooperation_gift/api_list_present_activity.html
	 */
	async list(body: S.ListRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.ListResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/b2c/activity/list/promoter/get',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 获取地址行政编码
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/warehouse/api_getaddresscode.html
	 */
	async getaddresscode(body: S.GetaddresscodeRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetaddresscodeResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/basics/addresscode/get',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 撤销主页背景图申请
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/homepage/background/api_cancelbackgroundapply.html
	 */
	async cancelbackgroundapply(body: S.CancelbackgroundapplyRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/basics/homepage/background/apply/cancel',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 提交背景图申请
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/homepage/background/api_submitbackgroundapply.html
	 */
	async submitbackgroundapply(body: S.SubmitbackgroundapplyRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.SubmitbackgroundapplyResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/basics/homepage/background/apply/submit',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 查询背景图
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/homepage/background/api_getbackground.html
	 */
	async getbackground(body?: Record<string, any>, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetbackgroundResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/basics/homepage/background/get',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 清空主页背景图并撤销流程中的申请
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/homepage/background/api_removebackground.html
	 */
	async removebackground(body?: Record<string, any>, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/basics/homepage/background/remove',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 撤销精选展示位申请
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/homepage/banner/api_cancelbannerapply.html
	 */
	async cancelbannerapply(body: S.CancelbannerapplyRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/basics/homepage/banner/apply/cancel',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 提交精选展示位申请
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/homepage/banner/api_submitbannerapply.html
	 */
	async submitbannerapply(body: S.SubmitbannerapplyRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.SubmitbannerapplyResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/basics/homepage/banner/apply/submit',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 查询精选展示位
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/homepage/banner/api_getbanner.html
	 */
	async getbanner(body?: Record<string, any>, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetbannerResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/basics/homepage/banner/get',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 清空精选展示位并撤销流程中的申请
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/homepage/banner/api_removebanner.html
	 */
	async removebanner(body?: Record<string, any>, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/basics/homepage/banner/remove',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 获取店铺基本信息
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/storemanage/api_mmecapi_basicinfo.html
	 */
	async mmecapi(opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.MmecapiResponse>({
			url: 'https://api.weixin.qq.com/channels/ec/basics/info/get',
			params: { access_token: true },
			...opts,
		});
	}
	/**
	 * 通过mediaid获取数据
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/apimgnt/api_getdatabymediaid.html
	 */
	async getdatabymediaid(params: S.GetdatabymediaidRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			url: 'https://api.weixin.qq.com/channels/ec/basics/media/get',
			params: { access_token: true, ...params },
			...opts,
		});
	}
	/**
	 * 获取店铺H5链接
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/storemanage/api_getshoph5url.html
	 */
	async getshoph5url(body: S.Getshoph5urlRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.Getshoph5urlResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/basics/shop/h5url/get',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 获取店铺二维码
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/storemanage/api_getshopqrcode.html
	 */
	async getshopqrcode(body: S.GetshopqrcodeRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetshopqrcodeResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/basics/shop/qrcode/get',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 获取店铺口令
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/storemanage/api_getshoptaglink.html
	 */
	async getshoptaglink(body: S.GetshoptaglinkRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetshoptaglinkResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/basics/shop/taglink/get',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 删除品牌资质
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/brand/api_deletebrandlogic.html
	 */
	async deletebrandlogic(body: S.DeletebrandlogicRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/brand/delete',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 获取品牌资质申请详情
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/brand/api_getbrandlogic.html
	 */
	async getbrandlogic(body: S.GetbrandlogicRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetbrandlogicResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/brand/get',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 获取品牌资质申请列表
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/brand/api_getbrandlistlogic.html
	 */
	async getbrandlistlogic(body: S.GetbrandlistlogicRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetbrandlistlogicResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/brand/list/get',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 更新品牌资质
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/brand/api_updatebrandlogic.html
	 */
	async updatebrandlogic(body: S.UpdatebrandlogicRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.UpdatebrandlogicResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/brand/update',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 获取生效中的品牌资质列表
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/brand/api_getvalidbrandlistlogic.html
	 */
	async getvalidbrandlistlogic(body: S.GetvalidbrandlistlogicRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetvalidbrandlistlogicResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/brand/valid/list/get',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 申请类目
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-category/api_addcategory.html
	 */
	async addcategory(body: S.AddcategoryRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.AddcategoryResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/category/add',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 上传多媒体资源
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/kf/api_cosupload.html
	 */
	async cosupload(body: S.CosuploadRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.CosuploadResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/commkf/cosupload',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 发送消息
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/kf/api_sendmsg.html
	 */
	async sendmsg(body: S.SendmsgRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.SendmsgResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/commkf/sendmsg',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 获取授权视频号列表
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/compass/api_getshopfinderauthorizationlist.html
	 */
	async getshopfinderauthorizationlist(body?: Record<string, any>, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetshopfinderauthorizationlistResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/compass/shop/finder/authorization/list/get',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 获取带货达人列表
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/compass/api_getshopfinderlist.html
	 */
	async getshopfinderlist(body: S.GetshopfinderlistRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetshopfinderlistResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/compass/shop/finder/list/get',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 获取带货数据概览
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/compass/api_getshopfinderoverall.html
	 */
	async getshopfinderoverall(body: S.GetshopfinderoverallRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetshopfinderoverallResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/compass/shop/finder/overall/get',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 获取带货达人商品列表
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/compass/api_getshopfinderproductlist.html
	 */
	async getshopfinderproductlist(body: S.GetshopfinderproductlistRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetshopfinderproductlistResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/compass/shop/finder/product/list/get',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 获取带货达人详情
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/compass/api_getshopfinderproductoverall.html
	 */
	async getshopfinderproductoverall(body: S.GetshopfinderproductoverallRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetshopfinderproductoverallResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/compass/shop/finder/product/overall/get',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 获取店铺开播列表
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/compass/api_getshoplivelist.html
	 */
	async getshoplivelist(body: S.GetshoplivelistRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetshoplivelistResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/compass/shop/live/list/get',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 获取电商数据概览
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/compass/api_getshopoverall.html
	 */
	async getshopoverall(body: S.GetshopoverallRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetshopoverallResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/compass/shop/overall/get',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 获取商品详细信息
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/compass/api_getshopproductdata.html
	 */
	async getshopproductdata(body: S.GetshopproductdataRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetshopproductdataResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/compass/shop/product/data/get',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 获取商品列表
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/compass/api_getshopproductlist.html
	 */
	async getshopproductlist(body: S.GetshopproductlistRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetshopproductlistResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/compass/shop/product/list/get',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 获取店铺人群数据
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/compass/api_getshopsaleprofiledata.html
	 */
	async getshopsaleprofiledata(body: S.GetshopsaleprofiledataRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetshopsaleprofiledataResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/compass/shop/sale/profile/data/get',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 创建优惠券
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/coupon/api_createcoupon.html
	 */
	async createcoupon(body: S.CreatecouponRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.CreatecouponResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/coupon/create',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 获取优惠券详情
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/coupon/api_getcoupon.html
	 */
	async getcoupon(body: S.GetcouponRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetcouponResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/coupon/get',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 获取优惠券ID列表
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/coupon/api_getcouponlist.html
	 */
	async getcouponlist(body: S.GetcouponlistRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetcouponlistResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/coupon/get_list',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 获取用户优惠券详情
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/coupon/api_getusercoupon.html
	 */
	async getusercoupon(body: S.GetusercouponRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetusercouponResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/coupon/get_user_coupon',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 获取用户优惠券ID列表
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/coupon/api_getusercouponlist.html
	 */
	async getusercouponlist(body: S.GetusercouponlistRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetusercouponlistResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/coupon/get_user_coupon_list',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 更新优惠券内容
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/coupon/api_updatecoupon.html
	 */
	async updatecoupon(body: S.UpdatecouponRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.UpdatecouponResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/coupon/update',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 更新优惠券状态
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/coupon/api_updatecouponstatus.html
	 */
	async updatecouponstatus(body: S.UpdatecouponstatusRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/coupon/update_status',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 获取店铺收藏的人数
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/favorite/shopfavorite/api_getfavoritescount.html
	 */
	async getFavoritesCount(body?: Record<string, any>, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetFavoritesCountResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/favorites/count/get',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 获取账户余额
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/funds/funds/api_getbalance.html
	 */
	async getbalance(body?: Record<string, any>, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetbalanceResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/funds/getbalance',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 获取结算账户
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/funds/funds/api_getbankacct.html
	 */
	async getbankacct(body?: Record<string, any>, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetbankacctResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/funds/getbankacct',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 获取资金流水详情
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/funds/funds/api_getfundsflowdetail.html
	 */
	async getfundsflowdetail(body: S.GetfundsflowdetailRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetfundsflowdetailResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/funds/getfundsflowdetail',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 获取资金流水列表
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/funds/funds/api_getfundsflowlist.html
	 */
	async getfundsflowlist(body: S.GetfundsflowlistRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetfundsflowlistResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/funds/getfundsflowlist',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 获取提现记录
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/funds/funds/api_getwithdrawdetail.html
	 */
	async getwithdrawdetail(body: S.GetwithdrawdetailRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetwithdrawdetailResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/funds/getwithdrawdetail',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 获取提现记录列表
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/funds/funds/api_getwithdrawlist.html
	 */
	async getwithdrawlist(body: S.GetwithdrawlistRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetwithdrawlistResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/funds/getwithdrawlist',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 查询订单流水列表
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/funds/funds/api_listorderflow.html
	 */
	async listorderflow(body: S.ListorderflowRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.ListorderflowResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/funds/listorderflow',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 修改结算账户
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/funds/funds/api_setbankacct.html
	 */
	async setbankacct(body: S.SetbankacctRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/funds/setbankacct',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 商户提现
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/funds/funds/api_submitwithdraw.html
	 */
	async submitwithdraw(body: S.SubmitwithdrawRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.SubmitwithdrawResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/funds/submitwithdraw',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 批量新增联盟商品
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/league/item/api_batchadditem.html
	 */
	async batchadditem(body: S.BatchadditemRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.BatchadditemResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/league/item/batchadd',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 删除联盟商品
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/league/item/api_deleteitem.html
	 */
	async deleteitem(body: S.DeleteitemRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/league/item/delete',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 获取联盟商品详情
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/league/item/api_getitem.html
	 */
	async getitem(body: S.GetitemRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetitemResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/league/item/get',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 批量新增联盟机构推广
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/league/item/api_batchaddheadsupplieritem.html
	 */
	async batchaddheadsupplieritem(body: S.BatchaddheadsupplieritemRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.BatchaddheadsupplieritemResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/league/item/headsupplier/batchadd',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 获取联盟商品推广列表
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/league/item/api_getitemlist.html
	 */
	async getitemlist(body: S.GetitemlistRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetitemlistResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/league/item/list/get',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 更新联盟商品信息
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/league/item/api_upditem.html
	 */
	async upditem(body: S.UpditemRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.UpditemResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/league/item/upd',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 新增达人
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/league/promoter/api_addpromoter.html
	 */
	async addpromoter(body: S.AddpromoterRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/league/promoter/add',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 删除达人
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/league/promoter/api_deletepromoter.html
	 */
	async deletepromoter(body: S.DeletepromoterRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/league/promoter/delete',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 获取达人详情信息
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/league/promoter/api_getpromoter.html
	 */
	async getpromoter(body: S.GetpromoterRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetpromoterResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/league/promoter/get',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 获取商店达人列表
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/league/promoter/api_getpromoterlist.html
	 */
	async getpromoterlist(body: S.GetpromoterlistRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetpromoterlistResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/league/promoter/list/get',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 编辑达人
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/league/promoter/api_updpromoter.html
	 */
	async updpromoter(body: S.UpdpromoterRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/league/promoter/upd',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 查询开通的电子面单网点/账号信息
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-delivery/ewaybill/api_ewaybill_getacct.html
	 */
	async ewaybillGet(body: S.EwaybillGetRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.EwaybillGetResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/logistics/ewaybill/biz/account/get',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 电子面单子件追加
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-delivery/ewaybill/api_ewaybill_addsuborder.html
	 */
	async ewaybillAddsuborder(body: S.EwaybillAddsuborderRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.EwaybillAddsuborderResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/logistics/ewaybill/biz/order/addsuborder',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 批量打印通知
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-delivery/ewaybill/api_ewaybill_batchprintorder.html
	 */
	async ewaybillBatchprint(body: S.EwaybillBatchprintRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.EwaybillBatchprintResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/logistics/ewaybill/biz/order/batchprint',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 电子面单取消下单
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-delivery/ewaybill/api_ewaybill_cancelorder.html
	 */
	async ewaybillCancel(body: S.EwaybillCancelRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.EwaybillCancelResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/logistics/ewaybill/biz/order/cancel',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 电子面单取号
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-delivery/ewaybill/api_ewaybill_createorder.html
	 */
	async ewaybillCreate(body: S.EwaybillCreateRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.EwaybillCreateResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/logistics/ewaybill/biz/order/create',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 电子面单预取号
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-delivery/ewaybill/api_ewaybill_precreateorder.html
	 */
	async ewaybillPrecreate(body: S.EwaybillPrecreateRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.EwaybillPrecreateResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/logistics/ewaybill/biz/order/precreate',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 打印成功通知
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-delivery/ewaybill/api_ewaybill_printorder.html
	 */
	async ewaybill(body: S.EwaybillRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/logistics/ewaybill/biz/order/print',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 获取面单标准模板
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-delivery/ewaybill/api_ewaybill_get_template_config.html
	 */
	async ewaybillConfig(body?: Record<string, any>, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.EwaybillConfigResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/logistics/ewaybill/biz/template/config',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 删除面单模版
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-delivery/ewaybill/api_ewaybill_deltemplate.html
	 */
	async ewaybillDelete(body: S.EwaybillDeleteRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/logistics/ewaybill/biz/template/delete',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 根据模板ID获取面单模板信息
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-delivery/ewaybill/api_ewaybill_gettemplatebyid.html
	 */
	async ewaybillGetbyid(body: S.EwaybillGetbyidRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.EwaybillGetbyidResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/logistics/ewaybill/biz/template/getbyid',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 更新面单模版
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-delivery/ewaybill/api_ewaybill_updatetemplate.html
	 */
	async ewaybillUpdate(body: S.EwaybillUpdateRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/logistics/ewaybill/biz/template/update',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 根据运单号获取真实手机号
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-delivery/phonenumber/api_getrealnumber.html
	 */
	async getrealnumber(body: S.GetrealnumberRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetrealnumberResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/logistics/phonenumber/get',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 获取虚拟号码池
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-delivery/phonenumber/api_getprivatenumberpool.html
	 */
	async getprivatenumberpool(body: S.GetprivatenumberpoolRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetprivatenumberpoolResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/logistics/phonenumberpool/get',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 根据运单号获取虚拟手机号
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-delivery/phonenumber/api_getvirtualnumber.html
	 */
	async getvirtualnumber(body: S.GetvirtualnumberRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetvirtualnumberResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/logistics/virtualnumber/get',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 增加运费模版
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-delivery/merchant/api_addfreighttemplate.html
	 */
	async addfreighttemplate(body: S.AddfreighttemplateRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.AddfreighttemplateResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/merchant/addfreighttemplate',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 添加地址
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-delivery/address/api_addaddress.html
	 */
	async addaddress(body: S.AddaddressRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.AddaddressResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/merchant/address/add',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 删除地址
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-delivery/address/api_deleteaddress.html
	 */
	async deleteaddress(body: S.DeleteaddressRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/merchant/address/delete',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 获取地址详情
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-delivery/address/api_getaddress.html
	 */
	async getaddress(body: S.GetaddressRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetaddressResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/merchant/address/get',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 获取地址列表
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-delivery/address/api_getaddresslist.html
	 */
	async getaddresslist(body: S.GetaddresslistRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetaddresslistResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/merchant/address/list',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 更新地址
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-delivery/address/api_updateaddress.html
	 */
	async updateaddress(body: S.UpdateaddressRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/merchant/address/update',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 查询运费模版
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-delivery/merchant/api_getfreighttemplatedetail.html
	 */
	async getfreighttemplatedetail(body: S.GetfreighttemplatedetailRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetfreighttemplatedetailResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/merchant/getfreighttemplatedetail',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 获取运费模板列表
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-delivery/merchant/api_getfreighttemplatelist.html
	 */
	async getfreighttemplatelist(body: S.GetfreighttemplatelistRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetfreighttemplatelistResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/merchant/getfreighttemplatelist',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 添加待认证的手机号
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-order/api_privatenumberaddphone.html
	 */
	async privatenumberAddPhone(body: S.PrivatenumberAddPhoneRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.PrivatenumberAddPhoneResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/merchant/privatenumber/addphone',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 获取小店手机号认证状态
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-order/api_privatenumbergetshopphone.html
	 */
	async privateNumberGetShopPhone(body: S.PrivateNumberGetShopPhoneRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.PrivateNumberGetShopPhoneResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/merchant/privatenumber/getphone',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 获取短信验证码
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-order/api_privatenumbersendverifycode.html
	 */
	async privateNumberSendVerifyCode(body: S.PrivateNumberSendVerifyCodeRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/merchant/privatenumber/sendverifycode',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 更新运费模版
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-delivery/merchant/api_updatefreighttemplate.html
	 */
	async updatefreighttemplate(body: S.UpdatefreighttemplateRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.UpdatefreighttemplateResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/merchant/updatefreighttemplate',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 获取文件下载链接
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/miniandstore/basic/api_getdownloadurl.html
	 */
	async getdownloadurl(body: S.GetdownloadurlRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetdownloadurlResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/open/get_download_url',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 上传资料
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/miniandstore/basic/api_uploadec.html
	 */
	async uploadec(body: S.UploadecRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.UploadecResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/open/upload',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 修改订单地址
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-order/api_changeorderaddress.html
	 */
	async changeorderaddress(body: S.ChangeorderaddressRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/order/address/update',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 同意用户修改收货地址申请
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-order/api_acceptorderaddressmodifyapply.html
	 */
	async acceptorderaddressmodifyapply(
		body: S.AcceptorderaddressmodifyapplyRequest,
		opts?: Partial<RequestOptions<any>>,
	) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/order/addressmodify/accept',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 拒绝用户修改收货地址申请
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-order/api_rejectorderaddressmodifyapply.html
	 */
	async rejectorderaddressmodifyapply(
		body: S.RejectorderaddressmodifyapplyRequest,
		opts?: Partial<RequestOptions<any>>,
	) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/order/addressmodify/reject',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 订单补发货
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-delivery/delivery/api_delivery_compensation.html
	 */
	async delivery(body: S.DeliveryRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/order/delivery/compensation',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 订单发货
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-delivery/delivery/api_senddelivery.html
	 */
	async senddelivery(body: S.SenddeliveryRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/order/delivery/send',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 获取快递公司列表-旧
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-delivery/delivery/api_getdeliverycompanylist.html
	 */
	async getdeliverycompanylist(body?: Record<string, any>, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetdeliverycompanylistResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/order/deliverycompanylist/get',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 获取快递公司列表
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-delivery/delivery/api_getdeliverycompanylistnew.html
	 */
	async getdeliverycompanylistnew(body: S.GetdeliverycompanylistnewRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetdeliverycompanylistnewResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/order/deliverycompanylist/new/get',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 修改物流信息
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-order/api_changedeliveryinfo.html
	 */
	async changedeliveryinfo(body: S.ChangedeliveryinfoRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/order/deliveryinfo/update',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 分配订单代发
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/supplier/order/api_dropship_assign.html
	 */
	async dropshipAssign(body: S.DropshipAssignRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/order/dropship/assign',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 取消分配代发单
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/supplier/order/api_dropship_cancel.html
	 */
	async dropshipCancel(body: S.DropshipCancelRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/order/dropship/cancel',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 查询代发单详情
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/supplier/order/api_dropship_get.html
	 */
	async dropship(body: S.DropshipRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.DropshipResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/order/dropship/get',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 拉取代发单列表
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/supplier/order/api_dropship_list.html
	 */
	async dropshipList(body: S.DropshipListRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.DropshipListResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/order/dropship/list',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 搜索代发单
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/supplier/order/api_dropship_search.html
	 */
	async dropshipSearch(body: S.DropshipSearchRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.DropshipSearchResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/order/dropship/search',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 上传生鲜质检信息
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-order/api_submitfreshinspectinfo.html
	 */
	async submitfreshinspectinfo(body: S.SubmitfreshinspectinfoRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/order/freshinspect/submit',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 获取订单详情
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-order/api_getorder.html
	 */
	async getorder(body: S.GetorderRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetorderResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/order/get',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 获取订单列表
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-order/api_getorderlist.html
	 */
	async getorderlist(body: S.GetorderlistRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetorderlistResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/order/list/get',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 修改订单备注
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-order/api_changemerchantnotes.html
	 */
	async changemerchantnotes(body: S.ChangemerchantnotesRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/order/merchantnotes/update',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 礼物订单新增备注信息
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-order/api_presentnote.html
	 */
	async presentnote(body: S.PresentnoteRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/order/presentnote/add',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 创建并发送礼物
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/miniandstore/cooperation_gift/api_create_present_order.html
	 */
	async create(body: S.CreateRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.CreateResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/order/presentorder/create',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 指定礼物收礼者
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/miniandstore/cooperation_gift/api_set_present_receiver.html
	 */
	async setSet(body: S.SetSetRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/order/presentorder/receiver/set',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 查询礼物订单列表-旧
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/miniandstore/cooperation_gift/api_list_present_order.html
	 */
	async listGet(body: S.ListGetRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.ListGetResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/order/presentorderlist/get',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 获取礼物单的子单列表
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-order/api_getpresentsuborder.html
	 */
	async getpresentsuborder(body: S.GetpresentsuborderRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetpresentsuborderResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/order/presentsuborder/get',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 同意待发货前更换sku请求
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-order/api_approvepreshipmentchangesku.html
	 */
	async approvepreshipmentchangesku(body: S.ApprovepreshipmentchangeskuRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/order/preshipmentchangesku/approve',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 获取所有待发货前更换sku待处理请求
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-order/api_getpreshipmentchangeskuwaithandlelist.html
	 */
	async getpreshipmentchangeskuwaithandlelist(
		body: S.GetpreshipmentchangeskuwaithandlelistRequest,
		opts?: Partial<RequestOptions<any>>,
	) {
		return this.request<GeneralResponse & S.GetpreshipmentchangeskuwaithandlelistResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/order/preshipmentchangesku/get',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 拒绝待发货前更换sku请求
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-order/api_rejectpreshipmentchangesku.html
	 */
	async rejectpreshipmentchangesku(body: S.RejectpreshipmentchangeskuRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/order/preshipmentchangesku/reject',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 修改订单价格
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-order/api_changeorderprice.html
	 */
	async changeorderprice(body: S.ChangeorderpriceRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/order/price/update',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 申请查看订单真实号码
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-order/api_applyrealnumber.html
	 */
	async applyrealnumber(body: S.ApplyrealnumberRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/order/realnumber/apply',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 查看订单真实号审核状态
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-order/api_getrealnumberviewaudit.html
	 */
	async getrealnumberviewaudit(body: S.GetrealnumberviewauditRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetrealnumberviewauditResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/order/realnumberviewaudit/get',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 订单搜索
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-order/api_searchorder.html
	 */
	async searchorder(body: S.SearchorderRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.SearchorderResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/order/search',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 解密订单中的详细收货信息
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-order/api_decodesensitiveinfo.html
	 */
	async decodesensitiveinfo(body: S.DecodesensitiveinfoRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.DecodesensitiveinfoResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/order/sensitiveinfo/decode',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 订单再次申请虚拟号
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-order/api_applyvirtualnumberagain.html
	 */
	async applyvirtualnumberagain(body: S.ApplyvirtualnumberagainRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.ApplyvirtualnumberagainResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/order/virtualnumber/applyagain',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 订单虚拟号延期
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-order/api_delayvirtualnumber.html
	 */
	async delayvirtualnumber(body: S.DelayvirtualnumberRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.DelayvirtualnumberResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/order/virtualnumber/delay',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 创建赠品活动
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-product/giftactivity/api_addgiftactivity.html
	 */
	async addgiftactivity(body: S.AddgiftactivityRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.AddgiftactivityResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/product/activity/add',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 删除赠品活动
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-product/giftactivity/api_deletegiftactivity.html
	 */
	async deleteGiftActivity(body: S.DeleteGiftActivityRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/product/activity/del',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 停止赠品活动
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-product/giftactivity/api_stopgiftactivity.html
	 */
	async stopgiftactivity(body: S.StopgiftactivityRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/product/activity/stop',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 添加商品
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-product/shop/api_addproduct.html
	 */
	async addproduct(body: S.AddproductRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.AddproductResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/product/add',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 撤回商品审核
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-product/shop/api_cancelauditproduct.html
	 */
	async cancelauditproduct(body: S.CancelauditproductRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/product/audit/cancel',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 免审更新商品
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-product/shop/api_updateproductauditfree.html
	 */
	async updateproductauditfree(body: S.UpdateproductauditfreeRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/product/auditfree',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 获取商品上架策略
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-product/shop/api_getproductauditstrategy.html
	 */
	async getproductauditstrategy(body?: Record<string, any>, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetproductauditstrategyResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/product/auditstrategy/get',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 设置商品上架策略
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-product/shop/api_setproductauditstrategy.html
	 */
	async setproductauditstrategy(body: S.SetproductauditstrategyRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/product/auditstrategy/set',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 商品立即开售
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-product/shop/api_begintimingsale.html
	 */
	async begintimingsale(body: S.BegintimingsaleRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/product/begintimingsale',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 取消商品开售
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-product/shop/api_canceltimingsale.html
	 */
	async canceltimingsale(body: S.CanceltimingsaleRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/product/canceltimingsale',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 类目推荐
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-product/shop/api_product_classify.html
	 */
	async product(body: S.ProductRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.ProductResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/product/category/classify',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 发品前校验
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-product/shop/api_categoryprecheck.html
	 */
	async categoryprecheck(body: S.CategoryprecheckRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.CategoryprecheckResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/product/categoryprecheck',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 删除商品
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-product/shop/api_deleteproduct.html
	 */
	async deleteproduct(body: S.DeleteproductRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/product/delete',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 下架商品
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-product/shop/api_delistingproduct.html
	 */
	async delistingproduct(body: S.DelistingproductRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/product/delisting',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 站内外商品属性映射
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-product/shop/api_externalproductmapping.html
	 */
	async externalproductmapping(body: S.ExternalproductmappingRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.ExternalproductmappingResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/product/externalproductmapping',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 商品属性映射及推荐
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-product/shop/api_externalproductmappingnew.html
	 */
	async externalproductmappingnew(body: S.ExternalproductmappingnewRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.ExternalproductmappingnewResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/product/externalproductmappingnew',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 获取商品
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-product/shop/api_getproduct.html
	 */
	async getproduct(body: S.GetproductRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetproductResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/product/get',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 获取商品提审限额
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-product/shop/api_getproductauditquota.html
	 */
	async getproductauditquota(body?: Record<string, any>, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetproductauditquotaResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/product/getauditquota',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 添加非卖商品
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-product/gift/api_addgiftproduct.html
	 */
	async addgiftproduct(body: S.AddgiftproductRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.AddgiftproductResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/product/gift/add',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 获取赠品
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-product/gift/api_getgiftproduct.html
	 */
	async getgiftproduct(body: S.GetgiftproductRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetgiftproductResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/product/gift/get',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 获取赠品列表
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-product/gift/api_getgiftproductlist.html
	 */
	async getgiftproductlist(body: S.GetgiftproductlistRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetgiftproductlistResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/product/gift/list/get',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 在售商品转赠品
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-product/gift/api_setproductasgift.html
	 */
	async setproductasgift(body: S.SetproductasgiftRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.SetproductasgiftResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/product/gift/onsale/set',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 更新赠品库存
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-product/gift/api_updategiftstock.html
	 */
	async updategiftstock(body: S.UpdategiftstockRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/product/gift/stock/update',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 更新非卖商品
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-product/gift/api_updategiftproduct.html
	 */
	async updategiftproduct(body: S.UpdategiftproductRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.UpdategiftproductResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/product/gift/update',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 获取商品H5短链
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-product/shop/api_getproducth5url.html
	 */
	async getproducth5url(body: S.Getproducth5urlRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.Getproducth5urlResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/product/h5url/get',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 添加限时抢购任务
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-product/limiteddiscounttask/api_addlimiteddiscounttask.html
	 */
	async addlimiteddiscounttask(body: S.AddlimiteddiscounttaskRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.AddlimiteddiscounttaskResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/product/limiteddiscounttask/add',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 删除限时抢购任务
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-product/limiteddiscounttask/api_deletelimiteddiscounttask.html
	 */
	async deletelimiteddiscounttask(body: S.DeletelimiteddiscounttaskRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/product/limiteddiscounttask/delete',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 获取限时抢购任务列表
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-product/limiteddiscounttask/api_getlimiteddiscounttasklist.html
	 */
	async getlimiteddiscounttasklist(body: S.GetlimiteddiscounttasklistRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetlimiteddiscounttasklistResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/product/limiteddiscounttask/list/get',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 停止限时抢购任务
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-product/limiteddiscounttask/api_stoplimiteddiscounttask.html
	 */
	async stoplimiteddiscounttask(body: S.StoplimiteddiscounttaskRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/product/limiteddiscounttask/stop',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 获取商品列表
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-product/shop/api_getproductlist.html
	 */
	async getproductlist(body: S.GetproductlistRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetproductlistResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/product/list/get',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 上架商品
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-product/shop/api_listingproduct.html
	 */
	async listingproduct(body: S.ListingproductRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/product/listing',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 商品品牌推荐
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-product/shop/api_productbrandrecommend.html
	 */
	async productbrandrecommend(body: S.ProductbrandrecommendRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.ProductbrandrecommendResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/product/productbrandrecommend',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 获取商品二维码
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-product/shop/api_getproductqrcode.html
	 */
	async getproductqrcode(body: S.GetproductqrcodeRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetproductqrcodeResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/product/qrcode/get',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 获取商品的移动应用跳转scheme码
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-product/shop/api_getproductscheme.html
	 */
	async getproductscheme(body: S.GetproductschemeRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetproductschemeResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/product/scheme/get',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 批量获取库存信息
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-product/stock/api_batchgetstock.html
	 */
	async batchgetstock(body: S.BatchgetstockRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.BatchgetstockResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/product/stock/batchget',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 获取库存
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-product/stock/api_getstock.html
	 */
	async getstock(body: S.GetstockRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetstockResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/product/stock/get',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 获取库存流水
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-product/stock/api_getstockflow.html
	 */
	async getstockflow(body: S.GetstockflowRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetstockflowResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/product/stock/getflow',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 快速更新库存
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-product/stock/api_updatestock.html
	 */
	async updatestock(body: S.UpdatestockRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/product/stock/update',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 获取商品口令
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-product/shop/api_getproducttaglink.html
	 */
	async getproducttaglink(body: S.GetproducttaglinkRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetproducttaglinkResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/product/taglink/get',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 更新商品
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-product/shop/api_updateproduct.html
	 */
	async updateproduct(body: S.UpdateproductRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.UpdateproductResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/product/update',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 打印质检码
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/qic/api_printinspectcode.html
	 */
	async printinspectcode(body: S.PrintinspectcodeRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.PrintinspectcodeResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/qic/inspect/code/print',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 查询质检仓配置
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/qic/api_getinspectconfig.html
	 */
	async getinspectconfig(opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetinspectconfigResponse>({
			url: 'https://api.weixin.qq.com/channels/ec/qic/inspect/config/get',
			params: { access_token: true },
			...opts,
		});
	}
	/**
	 * 自寄快递送检
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/qic/api_registerlogistics.html
	 */
	async registerlogistics(body: S.RegisterlogisticsRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/qic/inspect/register_logistics',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 绑定送检信息
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/qic/api_submitinspectinfo.html
	 */
	async submitinspectinfo(body: S.SubmitinspectinfoRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/qic/inspect/submit',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 查询送检配置模板信息
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/qic/api_getinspectsubmitconfig.html
	 */
	async getinspectsubmitconfig(params: S.GetinspectsubmitconfigRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetinspectsubmitconfigResponse>({
			url: 'https://api.weixin.qq.com/channels/ec/qic/inspect/submitconfig/get',
			params: { access_token: true, ...params },
			...opts,
		});
	}
	/**
	 * 获取在店铺主页展示的商品分类
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/homepage/shoptype/api_getclassificationtree.html
	 */
	async getclassificationtree(body?: Record<string, any>, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetclassificationtreeResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/store/classification/tree/get',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 获取分类关联的商品ID列表
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/homepage/shoptype/api_getclassificationproductlist.html
	 */
	async getClassificationProductList(body: S.GetClassificationProductListRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetClassificationProductListResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/store/classification/tree/product/get',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 隐藏小店主页商品
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/homepage/storewindow/api_hidestorewindowproduct.html
	 */
	async hidestorewindowproduct(body: S.HidestorewindowproductRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/store/window/product/hide',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 获取主页展示商品列表
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/homepage/storewindow/api_getstorewindowproductlist.html
	 */
	async getstorewindowproductlist(body: S.GetstorewindowproductlistRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetstorewindowproductlistResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/store/window/product/list/get',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 重新排序主页展示商品
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/homepage/storewindow/api_reorderstorewindowproduct.html
	 */
	async reorderstorewindowproduct(body: S.ReorderstorewindowproductRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/store/window/product/reorder',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 置顶小店主页商品
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/homepage/storewindow/api_settopstorewindowproduct.html
	 */
	async settopstorewindowproduct(body: S.SettopstorewindowproductRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/store/window/product/settop',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 获取国补订单开票信息
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/subsidy/invoicing/api_query_invoicing_info.html
	 */
	async query(body: S.QueryRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.QueryResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/subsidy/query_invoicing_info',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 上传国补订单发票文件
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/subsidy/invoicing/api_upload_invoice_file.html
	 */
	async upload(body: S.UploadRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.UploadResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/subsidy/upload_invoice_file',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 上传国补订单发票信息
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/subsidy/invoicing/api_upload_invoice_info.html
	 */
	async uploadUploadInvoiceInfo(body: S.UploadUploadInvoiceInfoRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/subsidy/upload_invoice_info',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 获取分配方式
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/supplier/auto/api_get_distribution.html
	 */
	async getGetDistribute(body?: Record<string, any>, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetGetDistributeResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/supplier/relation/get_distribute',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 获取商品对应的自动分配供货商
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/supplier/auto/api_get_product_default_distribution.html
	 */
	async getGetProductDefaultDistribute(
		body: S.GetGetProductDefaultDistributeRequest,
		opts?: Partial<RequestOptions<any>>,
	) {
		return this.request<GeneralResponse & S.GetGetProductDefaultDistributeResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/supplier/relation/get_product_default_distribute',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 获取按商品自动分配的商品列表
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/supplier/auto/api_get_product_list.html
	 */
	async getGetProductList(body: S.GetGetProductListRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetGetProductListResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/supplier/relation/get_product_list',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 获取供货商列表
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/supplier/relation/api_get_supplier_list.html
	 */
	async getGetSupplierList(body: S.GetGetSupplierListRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetGetSupplierListResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/supplier/relation/get_supplier_list',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 申请关联供货商
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/supplier/relation/api_invite_supplier.html
	 */
	async invite(body: S.InviteRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/supplier/relation/invite_supplier',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 设置全店订单自动分配
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/supplier/auto/api_set_all_distribution.html
	 */
	async setSetAllDistribution(body: S.SetSetAllDistributionRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/supplier/relation/set_all_distribution',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 设置全店订单手动分配
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/supplier/auto/api_set_manually_distribution.html
	 */
	async set(body?: Record<string, any>, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/supplier/relation/set_manually_distribute',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 设置按商品自动分配
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/supplier/auto/api_set_product_distribution.html
	 */
	async setSetProductDistribute(body: S.SetSetProductDistributeRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/supplier/relation/set_product_distribute',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 获取用户信息
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/vip/api_getuserinfo.html
	 */
	async getuserinfo(body: S.GetuserinfoRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetuserinfoResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/vip/user/info/get',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 获取用户列表
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/vip/api_getuserlist.html
	 */
	async getuserlist(body: S.GetuserlistRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetuserlistResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/vip/user/list/get',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 获取用户积分流水
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/vip/api_getuserscoreflowrecord.html
	 */
	async getuserscoreflowrecord(body: S.GetuserscoreflowrecordRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetuserscoreflowrecordResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/vip/user/score/flowrecord/get',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 获取用户积分
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/vip/api_getvipuserscore.html
	 */
	async getvipuserscore(body: S.GetvipuserscoreRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetvipuserscoreResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/vip/user/score/get',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 小店获取关联小程序信息
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/wxamember/shop/api_v3_getwxainfo.html
	 */
	async v3Get(body?: Record<string, any>, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.V3GetResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/vip/v3/wxa/info/get',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 获取指定地址下区域仓库的优先级
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/warehouse/api_getaddressprioritysort.html
	 */
	async getaddressprioritysort(body: S.GetaddressprioritysortRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetaddressprioritysortResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/warehouse/address/prioritysort/get',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 设置指定地址下区域仓库的优先级
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/warehouse/api_setaddressprioritysort.html
	 */
	async setaddressprioritysort(body: S.SetaddressprioritysortRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/warehouse/address/prioritysort/set',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 批量增加覆盖区域
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/warehouse/api_addcoverlocations.html
	 */
	async addcoverlocations(body: S.AddcoverlocationsRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/warehouse/coverlocations/add',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 批量删除覆盖区域
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/warehouse/api_delcoverlocations.html
	 */
	async delcoverlocations(body: S.DelcoverlocationsRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/warehouse/coverlocations/del',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 创建区域仓库
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/warehouse/api_createwarehouse.html
	 */
	async createwarehouse(body: S.CreatewarehouseRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/warehouse/create',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 修改区域仓库详情
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/warehouse/api_updatewarehousedetail.html
	 */
	async updatewarehousedetail(body: S.UpdatewarehousedetailRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/warehouse/detail/update',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 获取区域仓库
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/warehouse/api_getwarehouse.html
	 */
	async getwarehouse(body: S.GetwarehouseRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetwarehouseResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/warehouse/get',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 查询区域仓库列表
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/warehouse/api_getwarehouselist.html
	 */
	async getwarehouselist(body: S.GetwarehouselistRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetwarehouselistResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/warehouse/list/get',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 获取区域仓库存数量
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/warehouse/api_getwarehousestock.html
	 */
	async getwarehousestock(body: S.GetwarehousestockRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetwarehousestockResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/warehouse/stock/get',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 更新区域仓库存数量
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/warehouse/api_updatewarehousestock.html
	 */
	async updatewarehousestock(body: S.UpdatewarehousestockRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/warehouse/stock/update',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 获取关联账号企微id
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/wecom/api_shop_get_wecom_openid.html
	 */
	async shop(body: S.ShopRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.ShopResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/channels/ec/wecom/get_wecom_id',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 上传图片
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/apimgnt/api_img_upload.html
	 */
	async img(body: S.ImgRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.ImgResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/shop/ec/basics/img/upload',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 上传资质图片
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/apimgnt/api_qualificationupload.html
	 */
	async qualificationupload(body: S.QualificationuploadRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.QualificationuploadResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/shop/ec/basics/qualification/upload',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 新增品牌资质
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/brand/api_addbrandlogic.html
	 */
	async addbrandlogic(body: S.AddbrandlogicRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.AddbrandlogicResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/shop/ec/brand/add',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 获取品牌库列表
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/brand/api_getallbrandslogic.html
	 */
	async getallbrandslogic(body: S.GetallbrandslogicRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetallbrandslogicResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/shop/ec/brand/all',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 撤回品牌资质审核
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/brand/api_cancelauditbrandlogic.html
	 */
	async cancelauditbrandlogic(body: S.CancelauditbrandlogicRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/shop/ec/brand/audit/cancel',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 获取所有类目
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-category/api_getallcategory.html
	 */
	async getallcategory(opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetallcategoryResponse>({
			url: 'https://api.weixin.qq.com/shop/ec/category/all',
			params: { access_token: true },
			...opts,
		});
	}
	/**
	 * 撤销类目审核
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-category/api_cancelauditcategory.html
	 */
	async cancelauditcategory(body: S.CancelauditcategoryRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/shop/ec/category/audit/cancel',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 获取类目信息
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-category/api_getcategorydetail.html
	 */
	async getcategorydetail(body: S.GetcategorydetailRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetcategorydetailResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/shop/ec/category/detail',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 获取店铺的类目权限详情
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-category/api_getcategoryrelationdetail.html
	 */
	async getcategoryrelationdetail(body: S.GetcategoryrelationdetailRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetcategoryrelationdetailResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/shop/ec/category/get_category_relation_detail',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 获取店铺的类目权限列表
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-category/api_getcategoryrelationlist.html
	 */
	async getcategoryrelationlist(body: S.GetcategoryrelationlistRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetcategoryrelationlistResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/shop/ec/category/get_category_relation_list',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 获取店铺的类目审核单详情
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-category/api_getbizcatflowdetail.html
	 */
	async getbizcatflowdetail(body: S.GetbizcatflowdetailRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetbizcatflowdetailResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/shop/ec/category/getbizcatflowdetail',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 获取店铺的类目审核单列表
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/channels-shop-category/api_getbizcatflowlist.html
	 */
	async getbizcatflowlist(body: S.GetbizcatflowlistRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetbizcatflowlistResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/shop/ec/category/getbizcatflowlist',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 获取类目下商品发布规则
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/category-rule/api_getcategoryproductrule.html
	 */
	async getcategoryproductrule(body: S.GetcategoryproductruleRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetcategoryproductruleResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/shop/ec/category/getcategoryproductrule',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 获取保证金类目规则
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/category-rule/api_get_category_rule.html
	 */
	async get(body: S.GetRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/shop/ec/category/getcategoryrule',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 根据卡号查银行信息
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/funds/bank/api_ecgetbankbynum.html
	 */
	async ecgetbankbynum(body: S.EcgetbankbynumRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.EcgetbankbynumResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/shop/funds/getbankbynum',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 搜索银行列表
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/funds/bank/api_ecgetbanklist.html
	 */
	async ecgetbanklist(body: S.EcgetbanklistRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.EcgetbanklistResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/shop/funds/getbanklist',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 查询城市列表
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/funds/bank/api_ecgetcity.html
	 */
	async ecgetcity(body: S.EcgetcityRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.EcgetcityResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/shop/funds/getcity',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 查询大陆银行省份列表
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/funds/bank/api_ecgetprovince.html
	 */
	async ecgetprovince(body?: Record<string, any>, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.EcgetprovinceResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/shop/funds/getprovince',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 查询支行列表
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/funds/bank/api_ecgetsubbranch.html
	 */
	async ecgetsubbranch(body: S.EcgetsubbranchRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.EcgetsubbranchResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/shop/funds/getsubbranch',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 查询扫码状态
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/funds/qrcode/api_eccheckqrcode.html
	 */
	async eccheckqrcode(body: S.EccheckqrcodeRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.EccheckqrcodeResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/shop/funds/qrcode/check',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 获取二维码
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/funds/qrcode/api_ecgetqrcode.html
	 */
	async ecgetqrcode(body: S.EcgetqrcodeRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.EcgetqrcodeResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/shop/funds/qrcode/get',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 查询校园场景支付刷脸模式联系人列表
	 * @see https://developers.weixin.qq.com/miniprogram/dev/framework/device/voip-plugin/wxpay.html
	 */
	async getVoipContactList(body: S.GetVoipContactListRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.GetVoipContactListResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/wxa/business/getvoipcontactlist',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 新增小程序会员信息
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/wxamember/wxa/api_v3_wxa_adduserinfo.html
	 */
	async v3Add(body: S.V3AddRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/wxa/vip/user/info/add',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 删除小程序会员信息
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/wxamember/wxa/api_v3_wxa_deluserinfo.html
	 */
	async v3Delete(body: S.V3DeleteRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/wxa/vip/user/info/delete',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 获取小程序会员信息
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/wxamember/wxa/api_v3_wxa_getuserinfo.html
	 */
	async v3(body: S.V3Request, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse & S.V3Response>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/wxa/vip/user/info/get',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	/**
	 * 更新小程序会员信息
	 * @see https://developers.weixin.qq.com/doc/store/shop/API/wxamember/wxa/api_v3_wxa_updateuserinfo.html
	 */
	async v3Update(body: S.V3UpdateRequest, opts?: Partial<RequestOptions<any>>) {
		return this.request<GeneralResponse>({
			method: 'POST',
			url: 'https://api.weixin.qq.com/wxa/vip/user/info/update',
			params: { access_token: true },
			body,
			...opts,
		});
	}
	// prettier-ignore-end
	// endregion generated-apis

	async request<T>(o: RequestOptions): Promise<T> {
		const { params } = o;
		if (params) {
			if (params.appid === true) {
				params.appid = Errors.BadRequest.require(this.options.appId, 'client config without appId');
			}
			if (params.secret === true) {
				params.secret = Errors.BadRequest.require(this.options.appSecret, 'client config without appSecret');
			}
			if (params.access_token === true) {
				params.access_token = await this.getAccessToken();
			}
		}
		o.debug ??= this.options.debug;
		return request(o);
	}
}

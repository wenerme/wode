export interface JsSdkSignature {
  url: string;
  nonce: string;
  timestamp: string;
  signType: string;
  signature: string;
}

export interface SnsOAuth2TokenResponse {
  access_token: string;
  expires_in: number; // 7200
  refresh_token: string; // 30天
  openid: string;
  scope: string;
  is_snapshotuser: number;
}

export interface ErrorResponse {
  errcode: number;
  errmsg: string;
}

export interface UserInfoResponse {
  subscribe: number; // 用户是否订阅该公众号标识，值为0时，代表此用户没有关注该公众号，拉取不到其余信息。
  openid: string; // 用户的标识，对当前公众号唯一
  nickname: string;
  sex: number;
  language: string; // 用户的语言，简体中文为zh_CN
  city: string;
  province: string;
  country: string;
  headimgurl: string;
  subscribe_time: number; // 用户关注时间，为时间戳。如果用户曾多次关注，则取最后关注时间
  unionid: string; // 只有在用户将公众号绑定到微信开放平台帐号后，才会出现该字段。
  remark: string; // 公众号运营者对粉丝的备注，公众号运营者可在微信公众平台用户管理界面对粉丝添加备注
  groupid: number; // 用户所在的分组ID（兼容旧的用户分组接口）
  tagid_list?: string[];
  subscribe_scene: string; // 关注的渠道来源
  qr_scene: number; // 二维码扫码场景（开发者自定义）
  qr_scene_str: string; // 二维码扫码场景描述（开发者自定义）
}

export interface QrcodeCreateResponse {
  ticket: string;
  expire_seconds: number;
  url: string;
}

export interface SnsUserInfoResponse {
  openid: string;
  nickname: string;
  sex: number; // 值为1时是男性，值为2时是女性，值为0时是未知
  province: string;
  city: string;
  country: string;
  headimgurl: string;
  privilege: string[];
  unionid: string;
}

export interface GetOpenAPIQuotaResponse {
  quota: OpenAPIQuotaResponseQuota;
  rate_limit: OpenAPIQuotaResponseRateLimit;
  component_rate_limit: OpenAPIQuotaResponseComponentRateLimit;
}

export interface OpenAPIQuotaResponseQuota {
  daily_limit: number;
  used: number;
  remain: number;
}

export interface OpenAPIQuotaResponseRateLimit {
  call_count: number;
  refresh_second: number;
}

export interface OpenAPIQuotaResponseComponentRateLimit {
  call_count: number;
  refresh_second: number;
}

export interface GetDomainInfoResponse {
  requestdomain: string[];
  wsrequestdomain: string[];
  uploaddomain: any[];
  downloaddomain: string[];
  udpdomain: string[];
}

export interface GetPhoneNumberResponse {
  phone_info: GetPhoneNumberResponsePhoneInfo;
}

export interface GetPhoneNumberResponsePhoneInfo {
  phoneNumber: string;
  purePhoneNumber: string;
  countryCode: number;
  watermark: GetPhoneNumberResponsePhoneInfoWatermark;
}

export interface GetPhoneNumberResponsePhoneInfoWatermark {
  timestamp: number;
  appid: string;
}

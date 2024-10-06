export const WechatErrors = {
  '-1': '系统繁忙，此时请开发者稍候再试',
  0: '请求成功',
  40001: 'AppSecret错误或者 AppSecret 不属于这个公众号，请开发者确认 AppSecret 的正确性',
  40002: '请确保grant_type字段值为client_credential',
  40013: '不合法的 AppID，请开发者检查 AppID 的正确性，避免异常字符，注意大小写',
  40125: '不合法的 secret，请检查 secret 的正确性，避免异常字符，注意大小写',
  40164: '调用接口的 IP 地址不在白名单中，请在接口 IP 白名单中进行设置。',
  40243: 'AppSecret已被冻结，请登录MP解冻后再次调用。',
  41004: '缺少 secret 参数',
  50004: '禁止使用 token 接口',
  50007: '账号已冻结',
  61024: '第三方平台 API 需要使用第三方平台专用 token',
  76021: 'cgi_path填错了',
  89501: '此 IP 正在等待管理员确认,请联系管理员',
  89503: '此 IP 调用需要管理员确认,请联系管理员',
  89506: '24小时内该 IP 被管理员拒绝调用两次，24小时内不可再使用该 IP 调用',
  89507: '1小时内该 IP 被管理员拒绝调用一次，1小时内不可再使用该 IP 调用',
  /*
76021	cgi_path not found, please check	cgi_path填错了
76022	could not use this cgi_path，no permission	当前调用接口使用的token与api所属账号不符，详情可看注意事项的说明
   */
};

// https://developers.weixin.qq.com/miniprogram/dev/OpenApiDoc/mp-access-token/getAccessToken.html#%E9%94%99%E8%AF%AF%E7%A0%81
// https://developers.weixin.qq.com/doc/offiaccount/Basic_Information/Get_access_token.html
// https://developers.weixin.qq.com/miniprogram/dev/OpenApiDoc/openApi-mgnt/getApiQuota.html#%E9%94%99%E8%AF%AF%E7%A0%81

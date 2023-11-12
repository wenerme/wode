import { AliCloudClientOptions } from './AliCloudClient';

export interface DytnsV20200217Api {
  $product: 'Dytnsapi';
  $version: '2020-02-17';

  /**
   * 该API仅提供三网运营商获取UAID能力中，获取授权Token环节的签名功能。
   *
   * @remarks
   *
   * 获取UAID授权Token的签名值
   * > 该API仅提供三网运营商获取UAID能力中，**获取授权Token环节的签名功能**。
   * > - 获取授权Token的其他必要参数，请参考对应运营商文档自行生成
   * > - 获取授权Token的请求，请参考对应运营商文档，注意需要从用户移动终端的蜂窝移动网络环境下请求
   * > - **获取授权Token请求后，请参考UAIDVerification API接口进行最终的UAID获取**
   *
   * ### 如何通过客户端/H5方式请求授权Token
   *
   * <notice>发起请求授权Token时，客户端或H5页面必须切换到蜂窝移动网络。</notice>
   *
   * #### 移动（CM）
   * 通信协议：HTTPS + application/Json
   * 方法：POST
   * 地址：https://msg.cmpassport.com/h5/getMobile
   *
   * ##### 请求参数
   * 参数示例：
   *
   * `{
   *   "traceId": "mfawsxtcmyplwzpayzzvdvbsowxmkynr",
   *   "appId": "300011580392",
   *   "sign": "2c61b3c58ffbeed97461e31be4fd931a",
   *   "msgId": "redbyxsdetddwaaffajcwwapspykftzx",
   *   "expandParams": "",
   *   "businessType": "3",
   *   "version": "1.0",
   *   "timestamp": "20201125101540980"
   * }`
   *
   * 参数描述：
   * - version：使用`1.0`
   * - timestamp：请求消息发送的系统时间，精确到毫秒，对应该API下方入参`Time`的内容及其格式，两者需要保持一致
   * - appId：使用`300012406312`
   * - businessType：使用`3`
   * - traceId：外部流水号，对应该API下方入参`OutId`的内容，两者需要保持一致
   * - sign：调用该API获取
   * - msgId：外部流水号，对应该API下方入参`OutId`的内容，两者需要保持一致
   *
   * ##### 响应参数
   * 响应示例：
   * `{
   *   "header": {
   *     "appId": "300011580392",
   *     "msgId": "redbyxsdetddwaaffajcwwapspykftzx",
   *     "timestamp": "20201125101607932"
   *   },
   *   "body": {
   *     "resultCode": "103000",
   *     "expandParams": "",
   *     "resultDesc": "成功",
   *     "token": "H5HTTPS4187AE9743AFCB14F8D99B9D65ED9E01"
   *   }
   * }`
   *
   * 直接获取`body`中的`token`即可。
   *
   * #### 电信（CT）
   * 通信协议：HTTPS + application/x-www-form-urlencoded;charset=UTF
   * 方法：GET
   * 地址：https://id6.me/gw/preuniq.do
   *
   * ##### 请求参数
   * 参数示例：
   * `?clientType=30100&appId=9390188202&format=json&sign=D63C166FA19E1996EF********09C6A5397C10B4&paramKey=1D7C25EB8B0B8B4CB3CF8DC60628F6549********786B0AF1FEF93FA1335057A35BF5F0B39A3867EAA9BE14B3898********8B01DE34965060445B6E1F66401D714650E4AB161CD6DCF4A72********3B856F22A192B8B0C39D7A55B961062E68C89C928894F119B25********7C548355FE9DB82852EB93C939F2200B48CD17&paramStr=140********95AF8E138B94754CB4CF83BA6FB********52B258BFDFD38BF233&version=1.1`
   *
   * 参数描述：
   * - appId：使用`9390188202`
   * - clientType：客户端类型，对应该API下方入参`ClientType`的内容，两者需要保持一致
   * - format：使用`json`
   * - version：使用`1.1`
   * - sign：调用该API获取
   * - paramKey：密钥A的密文；密钥A为接入端随机生成字符串，长度为16位；`paramKey = RSA1024("${密钥A}", "${天翼账号平台公钥}")`；填充模式为`RSA/ECB/PKCS1Padding`；下载[电信RSA公钥](https://id.189.cn/source/files/API.pem)
   * - paramStr：不公开请求参数密文；timeStamp为时间戳，精确到毫秒，对应该API下方入参`Time`的值，但格式不同（参考值`1697791988302`）；`paramStr = AES("timeStamp=${timeStamp}", "${密钥A}")`；填充模式为`AES/CBC/PKCS5Padding`，初始向量为`0000000000000000`
   *
   * ##### 响应参数
   * 响应示例：
   * `callback?result=10000&msg=success&data=a35336711c70456cb883f4f224e9a259`
   *
   * `data`为加密的业务结果数据，`data = AES(业务结果, 密钥A)`，使用密钥A进行AES解密（AES/CBC/PKCS5Padding）。
   *
   * 解密后业务结果示例：
   * `{"accessCode": "H5HTTPS4187AE9743AFCB14F8D99B9D65ED9E01"}`
   *
   * 此时获取`accessCode`即可。
   *
   * @readonly
   *
   * @acs-operation-type read
   */
  GetUAIDApplyTokenSign(
    req: GetUAIDApplyTokenSignRequest,
    opts?: AliCloudClientOptions,
  ): Promise<GetUAIDApplyTokenSignResponse>;
  /**
   * 根据运营商授权Token获取UAID。
   * 获取授权Token及其签名值请参考GetUAIDApplyTokenSign API文档。
   *
   * UAID为64个长度，前32个长度描述设备信息，后32个长度描述号码信息。
   *
   * @remarks
   *
   * 根据运营商授权Token获取UAID
   * 请确保在使用该接口前，已充分了解号码百科产品的收费方式和[价格](https://www.aliyun.com/price/product#/dytns/detail/dytns_penqbag_public_cn)。
   *
   * 根据运营商授权Token获取UAID。
   * 获取授权Token及其签名值请参考GetUAIDApplyTokenSign API文档。
   *
   * @readonly
   *
   * @acs-operation-type read
   */
  UAIDVerification(req: UAIDVerificationRequest, opts?: AliCloudClientOptions): Promise<UAIDVerificationResponse>;
  /**
   * 用于核验企业名称和企业证件号，名称和证件必须全部一致且企业经营状态为在营才会判定核验通过。
   *
   * @remarks
   *
   * 企业二要素核验
   * - 请确保在使用该接口前，已充分了企业二要素核验产品的收费方式和价格，计费详情请参见[产品计费](https://help.aliyun.com/document_detail/154751.html?spm=a2c4g.154007.0.0.3edd7eb6E90YT4)。
   * - 当返回结果中：当VerifyResult返回true/false，且ReasonCode=0/1时计费，其余情况均不计费。
   * - 使用本接口前，请登录[号码百科控制台](https://account.aliyun.com/login/login.htm?oauth_callback=https%3A%2F%2Fdytns.console.aliyun.com%2Foverview%3Fspm%3Da2c4g.608385.0.0.79847f8b3awqUC&lang=zh)，在[标签广场](https://dytns.console.aliyun.com/analysis/square)页面，找到对应的标签，单击**申请开通**，填写申请资料，审批通过后即可使用。
   *
   * @readonly
   *
   * @acs-operation-type read
   */
  CompanyTwoElementsVerification(
    req: CompanyTwoElementsVerificationRequest,
    opts?: AliCloudClientOptions,
  ): Promise<CompanyTwoElementsVerificationResponse>;
  /**
   * 用于核验企业名称、企业证件号和企业法人姓名，必须全部一致且企业经营状态为在营才会判定核验通过。
   *
   * @remarks
   *
   * 企业三要素核验
   * - 请确保在使用该接口前，已充分了企业三要素核验产品的收费方式和价格，计费详情请参见[产品计费](https://help.aliyun.com/document_detail/154751.html?spm=a2c4g.154007.0.0.3edd7eb6E90YT4)。
   * - 当返回结果中：当VerifyResult返回true/false，且ReasonCode=0/1/2时计费，其余情况均不计费。
   * - 使用本接口前，请登录[号码百科控制台](https://account.aliyun.com/login/login.htm?oauth_callback=https%3A%2F%2Fdytns.console.aliyun.com%2Foverview%3Fspm%3Da2c4g.608385.0.0.79847f8b3awqUC&lang=zh)，在[标签广场](https://dytns.console.aliyun.com/analysis/square)页面，找到对应的标签，单击**申请开通**，填写申请资料，审批通过后即可使用。
   *
   * @readonly
   *
   * @acs-operation-type read
   */
  CompanyThreeElementsVerification(
    req: CompanyThreeElementsVerificationRequest,
    opts?: AliCloudClientOptions,
  ): Promise<CompanyThreeElementsVerificationResponse>;
  /**
   * 用于核验企业名称、企业证件号、企业法人姓名和企业法人身份证号，必须全部一致且企业经营状态为在营才会判定核验通过。
   *
   * @remarks
   *
   * 企业四要素核验
   * - 请确保在使用该接口前，已充分了企业四要素核验产品的收费方式和价格，计费详情请参见[产品计费](https://help.aliyun.com/document_detail/154751.html?spm=a2c4g.154007.0.0.3edd7eb6E90YT4)。
   * - 当返回结果中：当VerifyResult返回true/false，且ReasonCode=0/1/2时计费，其余情况均不计费。
   * - 使用本接口前，请登录[号码百科控制台](https://account.aliyun.com/login/login.htm?oauth_callback=https%3A%2F%2Fdytns.console.aliyun.com%2Foverview%3Fspm%3Da2c4g.608385.0.0.79847f8b3awqUC&lang=zh)，在[标签广场](https://dytns.console.aliyun.com/analysis/square)页面，找到对应的标签，单击**申请开通**，填写申请资料，审批通过后即可使用。
   *
   * @readonly
   *
   * @acs-operation-type read
   */
  CompanyFourElementsVerification(
    req: CompanyFourElementsVerificationRequest,
    opts?: AliCloudClientOptions,
  ): Promise<CompanyFourElementsVerificationResponse>;
  /**
   * 查询手机号码的归属信息，包括：所属省份、所属城市、所属基础运营商（中国移动、中国联通、中国电信、中国广电）、移动转售企业（阿里通信等）、是否携号转网、归属号码段等。
   *
   * @remarks
   *
   * 号码归属查询（加密版）
   * - 请确保在使用本接口前，您已充分了解号码百科[产品计费](~~154008~~)。
   * - 默认仅阿里云账号使用本接口，RAM用户只有在被授予相关API操作权限后才可使用。相关操作，请参见[为RAM用户授权](~~154006~~)。
   * - 本接口用于获取号码当前服务运营商、归属地和携号转网信息，支持**明文**、**MD5**、**SHA256**加密手机号码的查询。
   *
   * - 使用本接口前，请登录号码百科控制台，在[标签广场](https://dytns.console.aliyun.com/analysis/square)页面，找到对应的标签，单击**申请开通**，填写申请资料，审批通过后即可使用。
   *
   *
   * @acs-operation-type readAndWrite
   */
  DescribePhoneNumberOperatorAttribute(
    req: DescribePhoneNumberOperatorAttributeRequest,
    opts?: AliCloudClientOptions,
  ): Promise<DescribePhoneNumberOperatorAttributeResponse>;
  /**
   * 获取手机号码实时在网状态，例如正常、停机、空号等状态。支持明文、MD5/SHA256加密方式的号码查询。
   *
   * @remarks
   *
   * 号码状态查询（通用场景）
   * - 请确保在使用本接口前，您已充分了解号码百科[产品定价](~~154751~~)。
   * - 默认仅阿里云账号使用本接口，RAM用户只有在被授予相关API操作权限后才可使用。相关操作，请参见[为RAM用户授权](~~154006~~)。
   * - 使用本接口前，请登录号码百科控制台，在[标签广场](https://dytns.console.aliyun.com/analysis/square)页面，找到对应的标签，单击**申请开通**，填写申请资料，审批通过后即可使用。
   * ### QPS限制
   * 本接口的单用户QPS限制为300次/秒。超过限制，API调用会被限流，这可能会影响您的业务，请合理调用。
   *
   * @readonly
   *
   * @acs-operation-type read
   */
  PhoneNumberStatusForPublic(
    req: PhoneNumberStatusForPublicRequest,
    opts?: AliCloudClientOptions,
  ): Promise<PhoneNumberStatusForPublicResponse>;
  /**
   * 获取手机号码实时在网状态，例如正常、停机、空号等状态。支持明文、MD5/SHA256加密方式的号码查询。
   *
   * @remarks
   *
   * 号码状态查询（账号验证场景）
   * - 请确保在使用本接口前，您已充分了解号码百科[产品定价](~~154751~~)。
   * - 默认仅阿里云账号使用本接口，RAM用户只有在被授予相关API操作权限后才可使用。相关操作，请参见[为RAM用户授权](~~154006~~)。
   * - 使用本接口前，请登录号码百科控制台，在[标签广场](https://dytns.console.aliyun.com/analysis/square)页面，找到对应的标签，单击**申请开通**，填写申请资料，审批通过后即可使用。
   * ### QPS限制
   * 本接口的单用户QPS限制为300次/秒。超过限制，API调用会被限流，这可能会影响您的业务，请合理调用。
   *
   *
   * @acs-operation-type readAndWrite
   */
  PhoneNumberStatusForAccount(
    req: PhoneNumberStatusForAccountRequest,
    opts?: AliCloudClientOptions,
  ): Promise<PhoneNumberStatusForAccountResponse>;
  /**
   * 获取手机号码实时在网状态，例如正常、停机、空号等状态。支持明文、MD5/SHA256加密方式的号码查询。
   *
   * @remarks
   *
   * 号码状态查询（风控检测场景）
   * - 请确保在使用本接口前，您已充分了解号码百科[产品定价](~~154751~~)。
   * - 默认仅阿里云账号使用本接口，RAM用户只有在被授予相关API操作权限后才可使用。相关操作，请参见[为RAM用户授权](~~154006~~)。
   * - 使用本接口前，请登录号码百科控制台，在[标签广场](https://dytns.console.aliyun.com/analysis/square)页面，找到对应的标签，单击**申请开通**，填写申请资料，审批通过后即可使用。
   * ### QPS限制
   * 本接口的单用户QPS限制为300次/秒。超过限制，API调用会被限流，这可能会影响您的业务，请合理调用。
   *
   *
   * @acs-operation-type readAndWrite
   */
  PhoneNumberStatusForReal(
    req: PhoneNumberStatusForRealRequest,
    opts?: AliCloudClientOptions,
  ): Promise<PhoneNumberStatusForRealResponse>;
  /**
   * 获取手机号码实时在网状态，例如正常、停机、空号等状态。支持明文、MD5/SHA256加密方式的号码查询。
   *
   * @remarks
   *
   * 号码状态查询（短信业务场景）
   * - 请确保在使用本接口前，您已充分了解号码百科[产品定价](~~154751~~)。
   * - 默认仅阿里云账号使用本接口，RAM用户只有在被授予相关API操作权限后才可使用。相关操作，请参见[为RAM用户授权](~~154006~~)。
   * - 使用本接口前，请登录号码百科控制台，在[标签广场](https://dytns.console.aliyun.com/analysis/square)页面，找到对应的标签，单击**申请开通**，填写申请资料，审批通过后即可使用。
   * ### QPS限制
   * 本接口的单用户QPS限制为300次/秒。超过限制，API调用会被限流，这可能会影响您的业务，请合理调用。
   *
   *
   * @acs-operation-type readAndWrite
   */
  PhoneNumberStatusForSms(
    req: PhoneNumberStatusForSmsRequest,
    opts?: AliCloudClientOptions,
  ): Promise<PhoneNumberStatusForSmsResponse>;
  /**
   * 获取手机号码实时在网状态，例如正常、停机、空号等状态。支持明文、MD5/SHA256加密方式的号码查询。
   *
   * @remarks
   *
   * 号码状态查询（语音业务场景）
   * - 请确保在使用本接口前，您已充分了解号码百科[产品定价](~~154751~~)。
   * - 默认仅阿里云账号使用本接口，RAM用户只有在被授予相关API操作权限后才可使用。相关操作，请参见[为RAM用户授权](~~154006~~)。
   * - 使用本接口前，请登录号码百科控制台，在[标签广场](https://dytns.console.aliyun.com/analysis/square)页面，找到对应的标签，单击**申请开通**，填写申请资料，审批通过后即可使用。
   * ### QPS限制
   * 本接口的单用户QPS限制为300次/秒。超过限制，API调用会被限流，这可能会影响您的业务，请合理调用。
   *
   *
   * @acs-operation-type readAndWrite
   */
  PhoneNumberStatusForVoice(
    req: PhoneNumberStatusForVoiceRequest,
    opts?: AliCloudClientOptions,
  ): Promise<PhoneNumberStatusForVoiceResponse>;
  /**
   * 获取手机号码虚拟号码（俗称小号）状态。支持明文、MD5/SHA256加密方式的号码查询。
   *
   * @remarks
   *
   * 号码状态查询（虚拟号场景）
   * - 请确保在使用本接口前，您已充分了解号码百科[产品定价](~~154751~~)。
   * - 调用该接口当返回结果中：Code="OK" 且IsPrivacyNumber = true or false时计费，其他情况不计费。
   * - 默认仅阿里云账号使用本接口，RAM用户只有在被授予相关API操作权限后才可使用。相关操作，请参见[为RAM用户授权](~~154006~~)。
   * - 使用本接口前，请登录号码百科控制台，在[标签广场](https://dytns.console.aliyun.com/analysis/square)页面，找到对应的标签，单击**申请开通**，填写申请资料，审批通过后即可使用。
   * ### QPS限制
   * 本接口的单用户QPS限制为300次/秒。超过限制，API调用会被限流，这可能会影响您的业务，请合理调用。
   *
   *
   * @acs-operation-type readAndWrite
   */
  PhoneNumberStatusForVirtual(
    req: PhoneNumberStatusForVirtualRequest,
    opts?: AliCloudClientOptions,
  ): Promise<PhoneNumberStatusForVirtualResponse>;
  /**
   * 验证手机号是否为运营商二次放号的号码，支持在一次请求中快速检验号码是否为二次放号。
   *
   * @remarks
   *
   * 验证手机号是否为运营商二次放号的号码
   * - 请确保在使用本接口前，您已充分了解号码百科[产品定价](~~154751~~)。
   * - 当返回结果中：Code="OK" 且 VerifyResult != 0 时计费，其他情况不计费。
   * - 使用本接口前，请登录号码百科控制台，在[标签广场](https://dytns.console.aliyun.com/analysis/square)页面，找到对应的标签，单击**申请开通**，填写申请资料，审批通过后即可使用。
   *
   * ## QPS限制
   * 本接口的单用户QPS限制为100次/秒。超过限制，API调用会被限流，这可能会影响您的业务，请合理调用。
   *
   * ## 授权信息
   * 默认仅限阿里云账号使用本接口，RAM用户只有在被授予了相关API操作权限后方可使用。具体请参见[为RAM用户授权](~~154006~~)。
   *
   *
   * @acs-operation-type readAndWrite
   */
  DescribePhoneTwiceTelVerify(
    req: DescribePhoneTwiceTelVerifyRequest,
    opts?: AliCloudClientOptions,
  ): Promise<DescribePhoneTwiceTelVerifyResponse>;
  /**
   * 查询手机用户在运营商侧的在网时长。
   *
   * @remarks
   *
   * 在网时长查询
   * - 使用本接口前，请登录号码百科控制台，在[标签广场](https://dytns.console.aliyun.com/analysis/square)页面，找到对应的标签，单击**申请开通**，填写申请资料，审批通过后即可使用。
   * - 请确保在使用本接口前，您已充分了解号码百科[产品定价](~~154751~~)。
   * ### QPS限制
   * 本接口的单用户QPS限制为200次/秒。超过限制，API调用会被限流，这可能会影响您的业务，请合理调用。
   *
   *
   * @acs-operation-type readAndWrite
   */
  DescribePhoneNumberOnlineTime(
    req: DescribePhoneNumberOnlineTimeRequest,
    opts?: AliCloudClientOptions,
  ): Promise<DescribePhoneNumberOnlineTimeResponse>;
  /**
   * 获取号码分析返回结果。
   *
   * @remarks
   *
   * 号码AI分析服务
   * 使用本接口前，请登录号码百科控制台，在标签广场页面，找到对应的标签，单击申请开通，填写申请资料，审批通过后即可使用。
   * 请确保在使用本接口前，您已充分了解号码百科产品计费。
   *
   *
   * @acs-operation-type readAndWrite
   */
  DescribePhoneNumberAnalysisAI(
    req: DescribePhoneNumberAnalysisAIRequest,
    opts?: AliCloudClientOptions,
  ): Promise<DescribePhoneNumberAnalysisAIResponse>;
  /**
   * 获取号码分析返回结果。
   *
   * @remarks
   *
   * 查询号码分析结果
   * - 使用本接口前，请登录号码百科控制台，在[标签广场](https://dytns.console.aliyun.com/analysis/square)页面，找到对应的标签，单击**申请开通**，填写申请资料，审批通过后即可使用。
   * - 请确保在使用本接口前，您已充分了解号码百科[产品计费](~~154008~~)。
   *
   * ### QPS限制
   * 本接口的单用户QPS限制为1000次/秒。超过限制，API调用会被限流，这可能会影响您的业务，请合理调用。
   *
   * ### 授权信息
   * 默认仅限阿里云账号使用本接口，RAM用户只有在被授予了相关API操作权限后方可使用。具体请参见[为RAM用户授权](~~154006~~)。
   *
   *
   * @acs-operation-type readAndWrite
   */
  DescribePhoneNumberAnalysis(
    req: DescribePhoneNumberAnalysisRequest,
    opts?: AliCloudClientOptions,
  ): Promise<DescribePhoneNumberAnalysisResponse>;
  /**
   * 通过AI算法，预测手机号是否为空号。
   *
   * @remarks
   *
   * 手机号空号检测
   * - 本接口用于验证号码是否为空号。发起调用该接口验证号码请求时，系统会根据验证次数计费，标准价为0.01元/次。**请确保在使用该接口前，已充分了解本产品的收费方式和价格。**
   * - 当返回结果中：Code="OK" 且 Status != UNKNOWN 时计费，其他情况不计费。
   * - 由于本产品通过AI算法预测手机号的空号概率，所以无法做到100%准确。当前评估的准确率和召回率约为95%左右。**调用时请注意差别**。
   * - 使用本接口前，请登录号码百科控制台，在[标签广场](https://dytns.console.aliyun.com/analysis/square)页面，找到对应的标签，单击**申请开通**，填写申请资料，审批通过后即可使用。
   *
   * ### QPS限制
   * 本接口的单用户QPS限制为100次/秒。超过限制，API调用会被限流，这可能会影响您的业务，请合理调用。
   *
   * ### 授权信息
   * 默认仅限阿里云账号使用本接口，RAM用户只有在被授予了相关API操作权限后方可使用。具体请参见[为RAM用户授权](~~154006~~)。
   *
   *
   * @acs-operation-type readAndWrite
   */
  DescribeEmptyNumber(
    req: DescribeEmptyNumberRequest,
    opts?: AliCloudClientOptions,
  ): Promise<DescribeEmptyNumberResponse>;
  /**
   * 二要素（姓名和手机号）核验。用于比对用户填写的姓名、手机号两项信息是否属于同一用户。
   *
   * @remarks
   *
   * 运营商二要素核验
   * - 请确保在使用本接口前，您已充分了解号码百科[产品定价](~~154751~~)。
   * - 使用本接口前，请登录号码百科控制台，在[标签广场](https://dytns.console.aliyun.com/analysis/square)页面，找到对应的标签，单击**申请开通**，填写申请资料，审批通过后即可使用。
   * - 当接口值返回值：Code="OK"且IsConsistent != 2时计费，其他返回结果不计费。
   *
   * ### QPS限制
   * 本接口的单用户QPS限制为200次/秒。超过限制，API调用会被限流，这可能会影响您的业务，请合理调用。
   *
   *
   * @acs-operation-type readAndWrite
   */
  TwoElementsVerification(
    req: TwoElementsVerificationRequest,
    opts?: AliCloudClientOptions,
  ): Promise<TwoElementsVerificationResponse>;
  /**
   * 三要素（姓名、手机号和身份证号）核验。用于比对用户填写的姓名、手机号、身份证号三个信息是否属于同一用户。
   *
   * @remarks
   *
   * 运营商三要素核验
   * - 请确保在使用本接口前，您已充分了解号码百科[产品定价](~~154751~~)。
   * - 使用本接口前，请登录号码百科控制台，在[标签广场](https://dytns.console.aliyun.com/analysis/square)页面，找到对应的标签，单击**申请开通**，填写申请资料，审批通过后即可使用。
   * - 当接口值返回值：Code='OK' 且 IsConsistent != 2时计费，其他返回结果不计费。
   *
   * ### QPS限制
   * 本接口的单用户QPS限制为200次/秒。超过限制，API调用会被限流，这可能会影响您的业务，请合理调用。
   *
   *
   * @acs-operation-type readAndWrite
   */
  ThreeElementsVerification(
    req: ThreeElementsVerificationRequest,
    opts?: AliCloudClientOptions,
  ): Promise<ThreeElementsVerificationResponse>;
  /**
   * 将原始号码加密为一个140开头的虚拟号码。通过结合阿里云的通信服务，可以使用加密后的140号码发起语音呼叫。实现虚拟号码呼叫的效果。
   *
   * @remarks
   *
   * 加密号码
   * 使用本接口前，请登录号码百科控制台，在[标签广场](https://dytns.console.aliyun.com/analysis/square)页面，找到对应的标签，单击**申请开通**，填写申请资料，审批通过后即可使用。
   *
   * ### QPS限制
   * 本接口的单用户QPS限制为1000次/秒。超过限制，API调用会被限流，这可能会影响您的业务，请合理调用。
   *
   * @readonly
   *
   * @acs-operation-type read
   */
  PhoneNumberEncrypt(req: PhoneNumberEncryptRequest, opts?: AliCloudClientOptions): Promise<PhoneNumberEncryptResponse>;
  /**
   * 进行无效号码过滤操作。
   *
   * @remarks
   *
   * 过滤无效号码
   * 使用本接口前，请登录号码百科控制台，在[标签广场](https://dytns.console.aliyun.com/analysis/square)页面，找到对应的标签，单击**申请开通**，填写申请资料，审批通过后即可使用。
   *
   * ### QPS限制
   * 本接口的单用户QPS限制为1000次/秒。超过限制，API调用会被限流，这可能会影响您的业务，请合理调用。
   *
   *
   * @acs-operation-type readAndWrite
   */
  InvalidPhoneNumberFilter(
    req: InvalidPhoneNumberFilterRequest,
    opts?: AliCloudClientOptions,
  ): Promise<InvalidPhoneNumberFilterResponse>;
  /**
   * 分页查询标签列表。
   *
   *
   * @readonly
   *
   * @acs-operation-type read
   */
  QueryTagListPage(req: QueryTagListPageRequest, opts?: AliCloudClientOptions): Promise<QueryTagListPageResponse>;
  /**
   * 查询标签信息。
   *
   *
   * @readonly
   *
   * @acs-operation-type read
   */
  QueryTagInfoBySelection(
    req: QueryTagInfoBySelectionRequest,
    opts?: AliCloudClientOptions,
  ): Promise<QueryTagInfoBySelectionResponse>;
  /**
   * 根据标签ID查询用量统计。
   *
   *
   * @readonly
   *
   * @acs-operation-type read
   */
  QueryUsageStatisticsByTagId(
    req: QueryUsageStatisticsByTagIdRequest,
    opts?: AliCloudClientOptions,
  ): Promise<QueryUsageStatisticsByTagIdResponse>;
  /**
   * 查询标签申请规则。
   *
   *
   * @readonly
   *
   * @acs-operation-type read
   */
  QueryTagApplyRule(req: QueryTagApplyRuleRequest, opts?: AliCloudClientOptions): Promise<QueryTagApplyRuleResponse>;
  /**
   * 查询可用的授权码。
   *
   *
   * @readonly
   *
   * @acs-operation-type read
   */
  QueryAvailableAuthCode(
    req: QueryAvailableAuthCodeRequest,
    opts?: AliCloudClientOptions,
  ): Promise<QueryAvailableAuthCodeResponse>;
}
export interface GetUAIDApplyTokenSignRequest {
  /**
   * 授权码。
   *
   * > 在**号码分析服务**->[**标签广场**](https://dytns.console.aliyun.com/analysis/square)选择标签，提交使用申请，申请通过后，会获得该授权码。
   * @acs-in query
   */
  AuthCode: string;
  /**
   * 外部流水号。
   * > 对应移动（CM）运营商中的traceId、msgId，三者保持一致即可
   * @acs-in query
   */
  OutId: string;
  /**
   * 客户端类型。
   * - Android：30100
   * - IOS：30300
   * - H5：20200
   * - WEB：10010
   * @acs-in query
   */
  ClientType: string;
  /**
   * 运营商为电信（CT）时必传，具体参考电信运营商文档。
   * @acs-in query
   */
  ParamKey?: string;
  /**
   * 运营商为电信（CT）时必传，具体参考电信运营商文档。
   * @acs-in query
   */
  ParamStr?: string;
  /**
   * 事件发生的时间戳，精确到毫秒。
   * 格式：yyyyMMddHHmmssSSS。
   * @acs-in query
   */
  Time: string;
  /**
   * 用户所处的运营商。取值：
   * - **CM**：中国移动。
   * - **CU**：中国联通。
   * - **CT**：中国电信。
   * @acs-in query
   */
  Carrier: string;
}
export interface GetUAIDApplyTokenSignResponse {
  /**
   * 访问被拒绝详细信息。
   */
  AccessDeniedDetail?: string;
  /**
   * 请求ID。
   */
  RequestId?: string;
  /**
   * 返回状态码描述。
   */
  Message?: string;
  /**
   * 返回结果。
   */
  Data?: object;
  /**
   * 请求状态码。取值：
   * - **OK**：请求成功。
   */
  Code?: string;
}
export interface UAIDVerificationRequest {
  /**
   * 外部流水号。
   * @acs-in query
   */
  OutId?: string;
  /**
   * 用户所处的运营商。取值：
   * - **CM**：中国移动。
   * - **CU**：中国联通。
   * - **CT**：中国电信。
   * @acs-in query
   */
  Carrier: string;
  /**
   * 运营商授权Token。
   * > 获取授权Token及其签名值请参考GetUAIDApplyTokenSign API文档。
   * @acs-in query
   */
  Token: string;
  /**
   * 用户授权码，代表用户已授权。值为不大于128位的唯一随机数即可。
   *
   * <warning>集成时，建议在产品的隐私政策中加入UAID的隐私政策相关内容。</warning>
   * @acs-in query
   */
  UserGrantId?: string;
  /**
   * 授权码。
   *
   * > 在**号码分析服务**->[**标签广场**](https://dytns.console.aliyun.com/analysis/square)选择标签，提交使用申请，申请通过后，会获得该授权码。
   * @acs-in query
   */
  AuthCode: string;
}
export interface UAIDVerificationResponse {
  /**
   * 访问被拒绝详细信息。
   */
  AccessDeniedDetail?: string;
  /**
   * 状态码的描述。
   */
  Message?: string;
  /**
   * 请求ID。
   */
  RequestId?: string;
  /**
   * 返回结果。
   */
  Data?: object;
  /**
   * 请求状态码。取值：
   *
   * - **OK**：成功。
   */
  Code?: string;
}
export interface CompanyTwoElementsVerificationRequest {
  /**
   * 企业证件号。
   * @acs-in query
   */
  EpCertNo: string;
  /**
   * 企业名称。
   * @acs-in query
   */
  EpCertName: string;
  /**
   * 授权码。
   *
   * >登录[号码百科控制台](https://dytns.console.aliyun.com/overview?spm=a2c4g.608385.0.0.79847f8b3awqUC)，在[我的申请](https://dytns.console.aliyun.com/analysis/apply)页面，获取授权ID即授权码。
   * @acs-in query
   */
  AuthCode: string;
}
export interface CompanyTwoElementsVerificationResponse {
  /**
   * 访问被拒绝详细信息。
   */
  AccessDeniedDetail?: string;
  /**
   * 公共参数，每个请求返回的ID都是唯一的，可用于排查和定位问题。
   */
  RequestId?: string;
  /**
   * 返回状态码描述。
   */
  Message?: string;
  /**
   * 结构体。
   */
  Data?: object;
  /**
   * 请求状态码。
   */
  Code?: string;
}
export interface CompanyThreeElementsVerificationRequest {
  /**
   * 企业证件号。
   * @acs-in query
   */
  EpCertNo: string;
  /**
   * 企业名称。
   * @acs-in query
   */
  EpCertName: string;
  /**
   * 企业法人姓名。
   * >如果企业有多个法人，法人之间需用中文顿号（”、”）隔开。
   * @acs-in query
   */
  LegalPersonCertName: string;
  /**
   * 授权码。
   *
   * >登录[号码百科控制台](https://dytns.console.aliyun.com/overview?spm=a2c4g.608385.0.0.79847f8b3awqUC)，在[我的申请](https://dytns.console.aliyun.com/analysis/apply)页面，获取授权ID即授权码。
   * @acs-in query
   */
  AuthCode: string;
}
export interface CompanyThreeElementsVerificationResponse {
  /**
   * 访问被拒绝详细信息。
   */
  AccessDeniedDetail?: string;
  /**
   * 公共参数，每个请求返回的ID都是唯一的，可用于排查和定位问题。
   */
  RequestId?: string;
  /**
   * 返回状态码描述。
   */
  Message?: string;
  /**
   * 结构体。
   */
  Data?: object;
  /**
   * 请求状态码。
   */
  Code?: string;
}
export interface CompanyFourElementsVerificationRequest {
  /**
   * 企业证件号。
   * @acs-in query
   */
  EpCertNo: string;
  /**
   * 企业名称。
   * @acs-in query
   */
  EpCertName?: string;
  /**
   * 企业法人姓名。
   * > 如果企业有多个法人，法人之间需用中文顿号（”、”）隔开
   * @acs-in query
   */
  LegalPersonCertName: string;
  /**
   * 企业法人身份证号码。
   * > 如果企业有多个身份证号，身份证号之间需用中文顿号（”、”）隔开
   * @acs-in query
   */
  LegalPersonCertNo: string;
  /**
   * 授权码。
   * >登录[号码百科控制台](https://dytns.console.aliyun.com/overview?spm=a2c4g.608385.0.0.79847f8b3awqUC)，在[我的申请](https://dytns.console.aliyun.com/analysis/apply)页面，获取授权ID即授权码。
   * @acs-in query
   */
  AuthCode: string;
}
export interface CompanyFourElementsVerificationResponse {
  /**
   * 访问被拒绝详细信息。
   */
  AccessDeniedDetail?: string;
  /**
   * 公共参数，每个请求返回的ID都是唯一的，可用于排查和定位问题。
   */
  RequestId?: string;
  /**
   * 返回状态码描述。
   */
  Message?: string;
  /**
   * 结构体。
   */
  Data?: object;
  /**
   * 请求状态码。
   */
  Code?: string;
}
export interface DescribePhoneNumberOperatorAttributeRequest {
  /**
   * 授权码。
   *
   * > 在[号码百科控制台](https://dytns.console.aliyun.com/analysis/apply)**我的申请**页面，获取授权ID即授权码。
   * @acs-in query
   */
  AuthCode: string;
  /**
   * 待查询的号码。
   *
   * - 若Mask取值为NORMAL，该字段为11位手机号码。
   * - 若Mask取值为MD5，该字段为32位加密字符串。
   * - 若Mask取值为SHA256，该字段为64位加密字符串。
   *
   * ><notice>加密字符串中字母不区分大小写。</notice>
   * @acs-in query
   */
  InputNumber: string;
  /**
   * 号码的加密方式。取值：
   *
   * - **NORMAL**：不加密
   * - **MD5**：MD5加密
   * - **SHA256**：SHA256加密
   *
   * ><notice>字符串中所有字母必须大写。</notice>
   * @acs-in query
   */
  Mask: string;
}
export interface DescribePhoneNumberOperatorAttributeResponse {
  /**
   * 请求状态码。取值：
   *
   * - **OK**：成功。
   * - **InvalidParameter**：传入的手机号错误或参数格式错误。
   * - **PhoneNumberNotfound**：传入的手机号查不到归属结果。
   * - **isp.UNKNOWN**：未知异常。
   * - **RequestFrequencyLimit**：因运营商限制，禁止在短时间内高频对同一个号码进行反复查询，如返回此错误码，请您稍后再试。
   */
  Code?: string;
  /**
   * 状态码的描述。
   */
  Message?: string;
  /**
   * 请求ID。
   */
  RequestId?: string;
  /**
   * 结构体。
   */
  Data?: object;
}
export interface PhoneNumberStatusForPublicRequest {
  /**
   * 授权码。
   *
   * > 在[号码百科控制台](https://dytns.console.aliyun.com/analysis/apply)**我的申请**页面，获取授权ID即授权码。
   * @acs-in query
   */
  AuthCode: string;
  /**
   * 待查询的号码。
   *
   * - 若Mask取值为NORMAL，该字段为11位手机号码。
   * - 若Mask取值为MD5，该字段为32位加密字符串。
   * - 若Mask取值为SHA256，该字段为64位加密字符串。
   *
   * > 加密字符串中字母不区分大小写。
   * @acs-in query
   */
  InputNumber?: string;
  /**
   * 加密方式。取值：
   *
   * - **NORMAL**：不加密
   *
   * - **MD5**
   *
   * - **SHA256**
   * @acs-in query
   */
  Mask: string;
}
export interface PhoneNumberStatusForPublicResponse {
  /**
   * 公共参数，每个请求返回的ID都是唯一的，可用于排查和定位问题。
   */
  RequestId?: string;
  /**
   * 返回状态码描述。
   */
  Message?: string;
  /**
   * 结构体
   */
  Data?: object;
  /**
   * 请求状态码。取值：
   *
   * - **OK**：成功。
   * - **OperatorLimit**：运营商禁止查询的手机号。
   * - **RequestFrequencyLimit**：因运营商限制，禁止在短时间内高频对同一个号码进行反复查询，如返回此错误码，请您稍后再试。
   *
   * > 请访问[错误码中心](https://next.api.aliyun.com/document/Dytnsapi/2020-02-17/errorCode)查看更多错误码。
   */
  Code?: string;
}
export interface PhoneNumberStatusForAccountRequest {
  /**
   * 授权码。
   *
   * > 在[号码百科控制台](https://dytns.console.aliyun.com/analysis/apply)**我的申请**页面，获取授权ID即授权码。
   * @acs-in query
   */
  AuthCode: string;
  /**
   * 待查询的号码。
   *
   * - 若Mask取值为NORMAL，该字段为11位手机号码。
   * - 若Mask取值为MD5，该字段为32位加密字符串。
   * - 若Mask取值为SHA256，该字段为64位加密字符串。
   *
   *
   * ><notice>加密字符串中字母不区分大小写。 ></notice>
   * @acs-in query
   */
  InputNumber: string;
  /**
   * 加密方式。取值：
   *
   * - **NORMAL**：不加密
   * - **MD5**
   * - **SHA256**
   * @acs-in query
   */
  Mask: string;
}
export interface PhoneNumberStatusForAccountResponse {
  /**
   * 请求状态码。取值：
   *
   * - **OK**：成功。
   * - **OperatorLimit**：运营商禁止查询的手机号。
   * - **RequestFrequencyLimit**：因运营商限制，禁止在短时间内高频对同一个号码进行反复查询，如返回此错误码，请您稍后再试。
   */
  Code?: string;
  /**
   * 返回状态码描述。
   */
  Message?: string;
  /**
   * 公共参数，每个请求返回的ID都是唯一的，可用于排查和定位问题。
   */
  RequestId?: string;
  /**
   * 结构体。
   */
  Data?: object;
}
export interface PhoneNumberStatusForRealRequest {
  /**
   * 授权码。
   *
   * > 在[号码百科控制台](https://dytns.console.aliyun.com/analysis/apply)**我的申请**页面，获取授权ID即授权码。
   * @acs-in query
   */
  AuthCode: string;
  /**
   * 待查询的号码。
   *
   * - 若Mask取值为NORMAL，该字段为11位手机号码。
   * - 若Mask取值为MD5，该字段为32位加密字符串。
   * - 若Mask取值为SHA256，该字段为64位加密字符串。
   *
   * ><notice>加密字符串中字母不区分大小写。></notice>
   * @acs-in query
   */
  InputNumber: string;
  /**
   * 号码的加密方式。取值：
   *
   * - **NORMAL**：不加密
   *
   * - **MD5**
   *
   * - **SHA256**
   * @acs-in query
   */
  Mask: string;
}
export interface PhoneNumberStatusForRealResponse {
  /**
   * 请求状态码。取值：
   *
   * - **OK**：成功。
   * - **OperatorLimit**：运营商禁止查询的手机号。
   * - **RequestFrequencyLimit**：因运营商限制，禁止在短时间内高频对同一个号码进行反复查询，如返回此错误码，请您稍后再试。
   */
  Code?: string;
  /**
   * 状态码的描述。
   */
  Message?: string;
  /**
   * 公共参数，每个请求返回的ID都是唯一的，可用于排查和定位问题。
   */
  RequestId?: string;
  /**
   * 结构体。
   */
  Data?: object;
}
export interface PhoneNumberStatusForSmsRequest {
  /**
   * 授权码。
   *
   * > 在[号码百科控制台](https://dytns.console.aliyun.com/analysis/apply)**我的申请**页面，获取授权ID即授权码。
   * @acs-in query
   */
  AuthCode: string;
  /**
   * 待查询的号码。
   *
   * - 若Mask取值为NORMAL，该字段为11位手机号码。
   * - 若Mask取值为MD5，该字段为32位加密字符串。
   * - 若Mask取值为SHA256，该字段为64位加密字符串。
   *
   * ><notice>加密字符串中字母不区分大小写。></notice>
   * @acs-in query
   */
  InputNumber: string;
  /**
   * 号码的加密方式。取值：
   *
   * - **NORMAL**：不加密
   *
   * - **MD5**
   *
   * - **SHA256**
   * @acs-in query
   */
  Mask: string;
}
export interface PhoneNumberStatusForSmsResponse {
  /**
   * 请求状态码。取值：
   *
   * - **OK**：请求成功。
   * - **OperatorLimit**：运营商禁止查询的手机号。
   * - **RequestFrequencyLimit**：因运营商限制，禁止在短时间内高频对同一个号码进行反复查询，如返回此错误码，请您稍后再试。
   */
  Code?: string;
  /**
   * 状态码的描述。
   */
  Message?: string;
  /**
   * 公共参数，每个请求返回的ID都是唯一的，可用于排查和定位问题。
   */
  RequestId?: string;
  /**
   * 结构体
   */
  Data?: object;
}
export interface PhoneNumberStatusForVoiceRequest {
  /**
   * 授权码。
   *
   * > 在[号码百科控制台](https://dytns.console.aliyun.com/analysis/apply)**我的申请**页面，获取授权ID即授权码。
   * @acs-in query
   */
  AuthCode: string;
  /**
   * 待查询的号码。
   *
   * - 若Mask取值为NORMAL，该字段为11位手机号码。
   * - 若Mask取值为MD5，该字段为32位加密字符串。
   * - 若Mask取值为SHA256，该字段为64位加密字符串。
   *
   * ><notice>加密字符串中字母不区分大小写。></notice>
   * @acs-in query
   */
  InputNumber: string;
  /**
   * 加密方式。取值：
   *
   * - **NORMAL**：不加密
   *
   * - **MD5**
   *
   * - **SHA256**
   * @acs-in query
   */
  Mask: string;
}
export interface PhoneNumberStatusForVoiceResponse {
  /**
   * 请求状态码。取值：
   *
   * - **OK**：成功。
   * - **OperatorLimit**：运营商禁止查询的手机号。
   * - **RequestFrequencyLimit**：因运营商限制，禁止在短时间内高频对同一个号码进行反复查询，如返回此错误码，请您稍后再试。
   */
  Code?: string;
  /**
   * 返回状态码描述。
   */
  Message?: string;
  /**
   * 公共参数，每个请求返回的ID都是唯一的，可用于排查和定位问题。
   */
  RequestId?: string;
  /**
   * 结构体。
   */
  Data?: object;
}
export interface PhoneNumberStatusForVirtualRequest {
  /**
   * 授权码。
   *
   * > 在[号码百科控制台](https://dytns.console.aliyun.com/analysis/apply)**我的申请**页面，获取授权ID即授权码。
   * @acs-in query
   */
  AuthCode: string;
  /**
   * 待查询的号码。
   *
   * - 若Mask取值为NORMAL，该字段为11位手机号码。
   * - 若Mask取值为MD5，该字段为32位加密字符串。
   * - 若Mask取值为SHA256，该字段为64位加密字符串。
   *
   * ><notice>加密字符串中字母不区分大小写。></notice>
   * @acs-in query
   */
  InputNumber: string;
  /**
   * 号码的加密方式。取值：
   *
   * - **NORMAL**：不加密
   *
   * - **MD5**
   *
   * - **SHA256**
   * @acs-in query
   */
  Mask: string;
}
export interface PhoneNumberStatusForVirtualResponse {
  /**
   * 请求状态码。取值：
   *
   * - **OK**：成功。
   * - **OperatorLimit**：运营商禁止查询的手机号。
   * - **RequestFrequencyLimit**：因运营商限制，禁止在短时间内高频对同一个号码进行反复查询，如返回此错误码，请您稍后再试。
   */
  Code?: string;
  /**
   * 返回状态码描述。
   */
  Message?: string;
  /**
   * 请求ID。
   */
  RequestId?: string;
  /**
   * 结构体
   */
  Data?: object;
}
export interface DescribePhoneTwiceTelVerifyRequest {
  /**
   * 授权码。
   *
   * > 在[号码百科控制台](https://dytns.console.aliyun.com/analysis/apply)**我的申请**页面，获取授权ID即授权码。
   * @acs-in query
   */
  AuthCode: string;
  /**
   * 待查询的号码。
   *
   * - 若Mask取值为NORMAL，该字段为11位手机号码。
   * - 若Mask取值为MD5，该字段为32位加密字符串。
   * - 若Mask取值为SHA256，该字段为64位加密字符串。
   *
   * ><notice>加密字符串中字母不区分大小写。></notice>
   * @acs-in query
   */
  InputNumber: string;
  /**
   * 号码的加密方式。取值：
   *
   * - **NORMAL**：不加密
   * - **MD5**
   * - **SHA256**
   * @acs-in query
   */
  Mask: string;
  /**
   * 时间，格式必须为yyyy-MM-dd HH:mm:ss。该时间为手机用户在业务侧的注册时间。如果注册时间在运营商放号时间之后，则表示该号码不是二次号，否则返回结果是二次号。
   *
   * > - 若单个号码在运营商侧存在多次放号的情况，系统将以最后一次在运营商侧的放号时间作为判断依据。
   * > - 注册时间必须为1970-01-01 00:00:00之后的时间。
   * @acs-in query
   */
  StartTime: string;
}
export interface DescribePhoneTwiceTelVerifyResponse {
  /**
   * 公共参数，每个请求返回的ID都是唯一的，可用于排查和定位问题。
   */
  RequestId?: string;
  /**
   * 请求状态码。取值：
   *
   * - **OK**：请求成功。
   *
   * - **PortabilityNumberNotSupported**：不支持的携号转网号码。
   * - **RequestNumberNotSupported**：不支持中国广电号码（192开头）和虚拟运营商号码的查询。
   *
   * - **RequestFrequencyLimit**：因运营商限制，禁止在短时间内高频对同一个号码进行反复查询，如返回此错误码，请您稍后再试。
   *
   * > 当Code取值为OK，且VerifyResult值不为0时计费，计费文档请参见[号码百科定价](~~154751~~)。
   * >
   */
  Code?: string;
  /**
   * 状态码的描述。
   */
  Message?: string;
  /**
   * 结构体。
   */
  Data?: object;
}
export interface DescribePhoneNumberOnlineTimeRequest {
  /**
   * 授权码。
   * > 在[号码百科控制台](https://dytns.console.aliyun.com/analysis/apply)**我的申请**页面，获取授权ID即授权码。
   * @acs-in query
   */
  AuthCode: string;
  /**
   * 待查询的号码。
   *
   * - 若Mask取值为NORMAL，该字段为11位手机号码。
   * - 若Mask取值为MD5，该字段为32位加密字符串。
   * - 若Mask取值为SHA256，该字段为64位加密字符串。
   *
   * ><notice>加密字符串中字母不区分大小写。></notice>
   * @acs-in query
   */
  InputNumber: string;
  /**
   * 号码的加密方式。取值：
   *
   * - **NORMAL**：不加密
   * - **MD5**
   * - **SHA256**
   * @acs-in query
   */
  Mask: string;
  /**
   * 对外运营商。取值：
   *
   * - **MOBILE**：中国移动。
   * - **UNICOM**：中国联通。
   * - **TELECOM**：中国电信。
   *
   * ><notice>非必填项，阿里云会根据号码归属的运营商类型做自动判断，该字段的取值对查询结果无任何影响。></notice>
   * @acs-in query
   */
  Carrier?: string;
}
export interface DescribePhoneNumberOnlineTimeResponse {
  /**
   * 请求ID。
   */
  RequestId?: string;
  /**
   * 请求状态码。取值：
   *
   * - **OK**：请求成功。
   * - **PortabilityNumberNotSupported**：不支持的携号转网号码。
   * - **RequestFrequencyLimit**：因运营商限制，禁止在短时间内高频对同一个号码进行反复查询，如返回此错误码，请您稍后再试。
   *
   * > 当Code取值为OK，且VerifyResult值不为-1时计费，计费文档请参见[号码百科定价](~~154751~~)。
   * >
   */
  Code?: string;
  /**
   * 号码状态码的描述。
   */
  Message?: string;
  /**
   * 结构体。
   */
  Data?: object;
}
export interface DescribePhoneNumberAnalysisAIRequest {
  /**
   * 待查询的号码。
   * @acs-in query
   */
  InputNumber: string;
  /**
   * 号码分数阈值。取值范围：**0~100**。
   *
   * > 是否接受指定的分数阈值由服务端决定。当不接受指定分数阈值时，此字段输入的数据无效。
   * @acs-in query
   */
  Rate?: number;
  /**
   * 授权码。
   *
   * > 在**号码分析服务**->[**标签广场**](https://dytns.console.aliyun.com/analysis/square)选择标签，提交使用申请，申请通过后，会获得该授权码。
   * @acs-in query
   */
  AuthCode: string;
  /**
   * 模型参数配置（部分标签能力需要）
   * @acs-in query
   */
  ModelConfig?: string;
}
export interface DescribePhoneNumberAnalysisAIResponse {
  /**
   * 请求ID。
   */
  RequestId?: string;
  /**
   * 返回状态码描述。
   */
  Message?: string;
  /**
   * 返回结果。
   */
  Data?: object;
  /**
   * 请求状态码。取值：
   * - OK：成功
   */
  Code?: string;
}
export interface DescribePhoneNumberAnalysisRequest {
  /**
   * 授权码。
   *
   * > 在[号码百科控制台](https://dytns.console.aliyun.com/analysis/apply)**我的申请**页面，获取授权ID即授权码。
   * @acs-in query
   */
  AuthCode: string;
  /**
   * 待查询的号码。
   * @acs-in query
   */
  InputNumber: string;
  /**
   * 号码类型。取值：
   *
   * - **0**：手机号
   *
   * - **1**：手机IMEI号
   * @acs-in query
   */
  NumberType?: number;
  /**
   * 号码的加密方式。取值：
   *
   * - **NORMAL**：不加密
   *
   * - **MD5**
   *
   * - **SHA256**
   * @acs-in query
   */
  Mask?: string;
  /**
   * 号码分数阈值。取值范围：**0~100**。
   *
   * ><notice>是否接受指定的分数阈值由服务端决定。当不接受指定分数阈值时，此字段输入的数据无效。></notice>
   * @acs-in query
   */
  Rate?: number;
}
export interface DescribePhoneNumberAnalysisResponse {
  /**
   * 请求ID。
   */
  RequestId?: string;
  /**
   * 号码状态的描述。
   */
  Message?: string;
  /**
   * 号码分析返回结果信息。
   */
  Data?: object;
  /**
   * 请求状态码。取值：
   *
   *  **OK**：成功。
   */
  Code?: string;
}
export interface DescribeEmptyNumberRequest {
  /**
   * 授权码。
   *
   * > 在[号码百科控制台](https://dytns.console.aliyun.com/analysis/apply)**我的申请**页面，获取授权ID即授权码。
   * @acs-in query
   */
  AuthCode: string;
  /**
   * 待查询的号码。
   *
   *
   * > 目前仅支持单个号码查询。
   * @acs-in query
   */
  InputNumber: string;
  /**
   * 号码的加密方式。取值：
   *
   * - **NORMAL**：不加密
   *
   * - **MD5**
   *
   * - **SHA256**
   * @acs-in query
   */
  Mask: string;
}
export interface DescribeEmptyNumberResponse {
  /**
   * 公共参数，每个请求返回的ID都是唯一的，可用于排查和定位问题。
   */
  RequestId?: string;
  /**
   * 状态码的描述。
   */
  Message?: string;
  /**
   * 返回结果。
   */
  Data?: object;
  /**
   * 返回状态码。取值：
   *
   * - **OK**：成功。
   *
   * - **InvalidPhoneNumber.Check**：手机号非法。
   */
  Code?: string;
}
export interface TwoElementsVerificationRequest {
  /**
   * 授权码。
   *
   * > 在[号码百科控制台](https://dytns.console.aliyun.com/analysis/apply)**我的申请**页面，获取授权ID即授权码。
   * @acs-in query
   */
  AuthCode: string;
  /**
   * 待检验的号码。
   *
   * - 若Mask取值为NORMAL，该字段为明文。
   * - 若Mask取值为MD5，请将该字段做MD5加密。
   * - 若Mask取值为SHA256，请将该字段做SHA256加密。
   *
   * ><notice>加密字符串中字母不区分大小写。></notice>
   * @acs-in query
   */
  InputNumber: string;
  /**
   * 加密方式。取值：
   *
   * - **NORMAL**：不加密
   *
   * - **MD5**
   *
   * - **SHA256**
   * @acs-in query
   */
  Mask: string;
  /**
   * 待核验的姓名。
   *
   * - 若Mask取值为NORMAL，该字段为明文。
   * - 若Mask取值为MD5，请将该字段做MD5加密。
   * - 若Mask取值为SHA256，请将该字段做SHA256加密。
   *
   * ><notice>加密字符串中字母不区分大小写。></notice>
   * @acs-in query
   */
  Name: string;
}
export interface TwoElementsVerificationResponse {
  /**
   * 请求状态码。
   *
   * - **OK**：请求成功。
   *
   * - 其他错误码，请参见本章的错误码表。
   * - **RequestFrequencyLimit**：因运营商限制，禁止在短时间内高频对同一个号码或姓名进行反复查询，如返回此错误码，请您稍后再试。
   */
  Code?: string;
  /**
   * 状态码的描述。
   */
  Message?: string;
  /**
   * 请求ID。
   */
  RequestId?: string;
  /**
   * 结构体。
   */
  Data?: object;
}
export interface ThreeElementsVerificationRequest {
  /**
   * 授权码。
   *
   * > 在[号码百科控制台](https://dytns.console.aliyun.com/analysis/apply)**我的申请**页面，获取授权ID即授权码。
   * @acs-in query
   */
  AuthCode: string;
  /**
   * 待检验的号码。
   *
   * - 若Mask取值为NORMAL，该字段为明文。
   * - 若Mask取值为MD5，请将该字段做MD5加密。
   * - 若Mask取值为SHA256，请将该字段做SHA256加密。
   *
   * ><notice>加密字符串中字母不区分大小写。></notice>
   * @acs-in query
   */
  InputNumber: string;
  /**
   * 加密方式。取值：
   *
   * - **NORMAL**：不加密
   *
   * - **MD5**
   *
   * - **SHA256**
   * @acs-in query
   */
  Mask: string;
  /**
   * 待核验的身份证号。
   *
   * - 若Mask取值为NORMAL，该字段为明文。
   * - 若Mask取值为MD5，请将该字段做MD5加密。
   * - 若Mask取值为SHA256，请将该字段做SHA256加密。
   *
   * ><notice>加密字符串中字母不区分大小写。></notice>
   * @acs-in query
   */
  CertCode: string;
  /**
   * 待核验的姓名。
   *
   * - 若Mask取值为NORMAL，该字段为明文。
   * - 若Mask取值为MD5，请将该字段做MD5加密。
   * - 若Mask取值为SHA256，请将该字段做SHA256加密。
   *
   * ><notice>加密字符串中字母不区分大小写。></notice>
   * @acs-in query
   */
  Name: string;
}
export interface ThreeElementsVerificationResponse {
  /**
   * 请求状态码。
   *
   * - **OK**：请求成功。
   * - 其他错误码，请参见本章的错误码表。
   * - **RequestFrequencyLimit**：因运营商限制，禁止在短时间内高频对同一个号码进行反复查询，如返回此错误码，请您稍后再试。
   */
  Code?: string;
  /**
   * 状态码的描述。
   */
  Message?: string;
  /**
   * 请求ID。
   */
  RequestId?: string;
  /**
   * 结构体。
   */
  Data?: object;
}
export interface PhoneNumberEncryptRequest {
  /**
   * 授权码。
   *
   * > 在[号码百科控制台](https://dytns.console.aliyun.com/analysis/apply)**我的申请**页面，获取授权ID即授权码。
   * @acs-in query
   */
  AuthCode: string;
  /**
   * 待查询的号码。
   *
   * > 目前仅支持单个号码查询。
   * @acs-in query
   */
  InputNumber: string;
  /**
   * 号码的加密方式。取值：**NORMAL**。
   *
   *
   * ><notice>目前仅支持NORMAL加密方式。></notice>
   * @acs-in query
   */
  Mask: string;
}
export interface PhoneNumberEncryptResponse {
  /**
   * 请求ID。
   */
  RequestId?: string;
  /**
   * 返回状态码描述。
   */
  Message?: string;
  /**
   * 数组。
   */
  Data?: Array</** 结构体。 */ object>;
  /**
   * 请求状态码。
   *
   * - 返回OK代表请求成功。
   *
   * - 其他错误码，请参见[错误码列表](~~109196~~)。
   */
  Code?: string;
}
export interface InvalidPhoneNumberFilterRequest {
  /**
   * 授权码。
   *
   * > 在[号码百科控制台](https://dytns.console.aliyun.com/analysis/apply)**我的申请**页面，获取授权ID即授权码。
   * @acs-in query
   */
  AuthCode: string;
  /**
   * 待查询的号码。
   * @acs-in query
   */
  InputNumber: string;
  /**
   * 号码的加密方式。
   *
   * ><notice>目前仅支持NORMAL加密方式。></notice>
   * @acs-in query
   */
  Mask: string;
}
export interface InvalidPhoneNumberFilterResponse {
  /**
   * 请求ID。
   */
  RequestId?: string;
  /**
   * 请求状态码。取值：
   *
   * - **OK**：成功。
   *
   * - **MobileNumberIllegal**：手机号非法。
   *
   * - **EncyrptTypeIllegal**：加密类型非法。
   *
   * - **MobileNumberTypeNotMatch**：手机号码与加密类型不匹配。
   *
   * - **CarrierIllegal**：运营商类型非法。
   *
   * - **AuthCodeNotExist**：授权码不存在。
   *
   * - **PortabilityNumberNotSupported**：不支持携号转网。
   *
   * - **Unknown**：未知异常。
   *
   * - **AuthCodeAndApiNotMatch**：系统异常。
   *
   * - **AuthCodeAndApiNotMatch**：AuthCode与API接口不匹配。
   * - **RequestFrequencyLimit**：因运营商限制，禁止在短时间内高频对同一个号码进行反复查询，如返回此错误码，请您稍后再试。
   */
  Code?: string;
  /**
   * 状态码的描述。
   */
  Message?: string;
  /**
   * 数组。
   */
  Data?: Array</** 结构体。 */ object>;
}
export interface QueryTagListPageRequest {
  /**
   * 页码。默认取值为**1**。
   * @acs-in query
   */
  PageNo?: number;
  /**
   * 分页大小。
   * @acs-in query
   */
  PageSize?: number;
}
export interface QueryTagListPageResponse {
  /**
   * 请求ID。
   */
  RequestId?: string;
  /**
   * 返回状态码描述。
   */
  Message?: string;
  /**
   * 返回数据。
   */
  Data?: object;
  /**
   * 请求状态码。 **OK**为成功。
   */
  Code?: string;
  /**
   * 是否成功。取值：
   *
   * - true：成功。
   *
   * - false：失败。
   */
  Success?: boolean;
}
export interface QueryTagInfoBySelectionRequest {
  /**
   * 行业id
   * 行业ID。
   * @acs-in query
   */
  IndustryId?: number;
  /**
   * 场景id
   * 场景ID。
   * @acs-in query
   */
  SceneId?: number;
  /**
   * 标签id
   * 标签ID。
   * @acs-in query
   */
  TagId?: number;
}
export interface QueryTagInfoBySelectionResponse {
  /**
   * 请求ID。
   */
  RequestId?: string;
  /**
   * 返回状态码描述。
   */
  Message?: string;
  /**
   * 返回的数据内容。
   */
  Data?: Array</** 返回的数据内容。 */ object>;
  /**
   * 请求状态码。 **OK**为成功。
   */
  Code?: string;
  /**
   * 是否成功。取值：
   *
   * - true：成功。
   *
   * - false：失败。
   */
  Success?: boolean;
}
export interface QueryUsageStatisticsByTagIdRequest {
  /**
   * 开始时间
   * 查询开始时间。
   * @acs-in query
   */
  BeginTime?: string;
  /**
   * 结束时间
   * 查询结束时间。
   * @acs-in query
   */
  EndTime?: string;
  /**
   * 结束时间
   * 标签ID。
   * @acs-in query
   */
  TagId?: number;
  /**
   * 当前页码，默认：1
   * @acs-in query
   */
  PageNo?: number;
  /**
   * 页面大小。
   * @acs-in query
   */
  PageSize?: number;
}
export interface QueryUsageStatisticsByTagIdResponse {
  /**
   * 请求ID。
   */
  RequestId?: string;
  /**
   * 返回状态码描述。
   */
  Message?: string;
  /**
   * 返回的数据内容。
   */
  Data?: Array</** 返回的数据内容。 */ object>;
  /**
   * 请求状态码。 **OK**为成功。
   */
  Code?: string;
  /**
   * 表示是否调用成功。
   * - true：调用成功。
   *  - false：调用失败。
   */
  Success?: boolean;
}
export interface QueryTagApplyRuleRequest {
  /**
   * 标签id
   * 标签ID。
   * @acs-in query
   */
  TagId?: number;
}
export interface QueryTagApplyRuleResponse {
  /**
   * 请求ID。
   */
  RequestId?: string;
  /**
   * 返回状态码描述。
   */
  Message?: string;
  /**
   * 返回的数据内容。
   */
  Data?: object;
  /**
   * 请求状态码。 **OK**表示成功。
   */
  Code?: string;
  /**
   * 是否成功。取值：
   *
   * - true：成功。
   *
   * - false：失败。
   */
  Success?: boolean;
}
export interface QueryAvailableAuthCodeRequest {
  /**
   * 标签id
   * 标签ID。
   * @acs-in query
   */
  TagId?: number;
}
export interface QueryAvailableAuthCodeResponse {
  /**
   * 请求ID。
   */
  RequestId?: string;
  /**
   * 返回状态码描述。
   */
  Message?: string;
  /**
   * 返回的数据内容。
   */
  Data?: Array</** 返回的数据内容。 */ string>;
  /**
   * 请求状态码。 **OK**为成功。
   */
  Code?: string;
  /**
   * 是否成功。取值：
   *
   * - true：成功。
   *
   * - false：失败。
   */
  Success?: boolean;
}

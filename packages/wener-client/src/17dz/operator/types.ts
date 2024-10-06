export interface GetLoginSessionResponse {
  accountId: string;
  accountName: string;
  loginName: string;
  companyId: string;
  companyName: string;
  activation: boolean;
  imageUrl: string;
  guide: boolean;
  customerId: string;
  taxNo: any;
  appId: string;
  platform: string;
  bizId: string;
  now: string;
}

export interface XyqPortalWebManageUserQueryResponse {
  accountId: string;
  activated: string;
  admin: boolean;
  available: string;
  birth: any;
  companyName: any;
  department: any;
  departmentRole: any;
  employeeId: number;
  entryTime: any;
  img: string;
  loginName: string;
  members: any[];
  mobile: string;
  name: string;
  others: any[];
  servyouNo: any;
  sex: string;
  superiorList: any[];
  systemRole: any;
}

export interface ManageListCustomerItem {
  address: string;
  areaName: any;
  bindType: any;
  createDate: string;
  creatorName: string;
  customerId: string;
  customerManagerName: string; // 客户经理
  customerName: string;
  customerNo: any;
  customerType: number;
  departmentId: number;
  departmentName?: string;
  fullName: string;
  hasAt: boolean;
  hasNewNote: boolean;
  hasNotes: boolean;
  industryType?: string;
  industryCategory: string;
  industryCategoryName: string;
  labelList: any;
  level: number;
  levelName: string;
  locationCode: string;
  locationName: string;
  managerName: string; // 账务会计
  newStatus: number;
  registeredDate: string;
  source: any;
  status: number;
  taxName?: string;
  taxNo: string;
  taxType: string;
  ysImg: any;
  ysNotice: any;
  ysReason: any;
  ysStatus: any;
}

export interface GetIitSingleCustomerResponse {
  customerId: number;
  deptId: number;
  accountId: string;
  customerName: string;
  taxpayerIdentifier: string;
  areaCode: string;
  tertiaryAreaCode: string;
  initState: boolean;
  branchRecordSign: string;
  virtual: boolean;
  departmentList: any[];
  keyPassword: string;
  oldPassward: any;
  realNameAccount: any;
  realNamePassword: any;
  declarationChannel: any;
  passwordType: string;
  taxAccount: any;
  registrationNumber: string;
  withholdingAgentCode: any;
  withholdingAgentName: string;
  withholdingAgentAddress: string;
  postcode: any;
  phone: string;
  email: any;
  financialLeader: string; // 财务代表人
  legalRepresentative: string; // 法定代表人
  taxRegistrationNumber: any;
  industryCode: string;
  industryName: string;
  economicTypeCode: string;
  economicTypeName: string;
  taxAuthorityCode: any;
  taxAuthorityName: any;
  superiorTaxAuthorityCode: any;
  responsibleAuthorityCode: string;
  responsibleAuthorityName: string;
  companyMemershipCode: string;
  responsibleAuthorityBranchCode: string;
  responsibleAuthorityBranchName: string;
  taxAdminCode: string;
  declarerName: string;
  isSpecificIndustry: any;
  isZhongdengCompany: any;
  registrationNumberChangedFlag: any;
  isListed: any;
  totalCapital: number;
  streetCode: string;
  deptNumber: any;
}

export interface GetIitCustomerSettingResponse {
  companyId: any;
  customerId: number;
  taxAccount: any;
  taxpayerIdentifier: string;
  keyPassword: string; // 网报密码
  passwordType: string; // 0 个税网报密码登录 1 实名账号密码登录
  subAreaCode: string;
  declarationChannel: any;
  tertiaryAreaCode: string;
  realNameAccount?: string; // 实名账号密码
  realNamePassword?: string;
  specDeductionSwitch: any;
}

export interface GetIrcAccountInfoResponse {
  authTime: number;
  companyId: number;
  companyName: string;
  contactChineseType: string;
  contactCode: string;
  contactName: string;
  contactType: string;
  contactUuid: string;
  createTime: number;
  identifyAuthFlag: string;
  isGsmModem: boolean;
  locationCode: string;
  mobilePhone?: string;
  modifyTime: number;
  personalPwd: string;
  protocol: GetAccountInfoProtocol;
  taxAccountType: number;
  taxAuthCode: string;
  taxNo: string;
  taxPassword: string;
  taxUsername: string;
}

export interface GetAccountInfoProtocol {
  accepted: boolean;
  protocols: GetAccountInfoProtocolItem[];
}

export interface GetAccountInfoProtocolItem {
  backupUrl: string;
  name: string;
  protocolUrl: string;
}

export interface GetCustomerResponse {
  customerId: string;
  customerNo: string;
  customerName: string;
  customerFullName: string;
  customerType: number;
  status: number;
  level: any;
  levelName: any;
  labelList: GetCustomerLabelList[];
  industryCategory: string;
  industryType: any;
  industryTypeName: any;
  industryCategoryName: string;
  departmentId: number;
  departmentName: any;
  area: any;
  areaName: any;
  source: any;
  sourceName: any;
  locationCode: string;
  locationName: any;
  address: any;
  taxNo: string;
  taxType: string;
  contacts: any[];
  attachmentList: any[];
  attachmentCount: number;
  contractCount: number;
  orderCount: number;
  projectCount: number;
  taxBureau: GetCustomerTaxBureau;
  commercialInfo: GetCustomerCommercialInfo;
  shareholderList: any[];
  canEdit: boolean;
  allowCreateContract: boolean;
  customerManager: GetCustomerCustomerManager;
  manager: GetCustomerManager;
  chargeManagerList: GetCustomerChargeManagerList[];
  journal: GetCustomerJournal;
  tax: GetCustomerTax;
  auditList: GetCustomerAuditList[];
  consultantList: any[];
  invoiceDrawerList: any;
  newStatus: number;
  period: string;
  agreementTypeIdList: any;
  agreementTypeNameList: any;
  zsgdTaxNoList: any[];
  securityCertificate: any;
}

export interface GetCustomerLabelList {
  customerLabelId: number;
  labelId: number;
  name: string;
}

export interface GetCustomerTaxBureau {
  registeredAddress: any;
  financialManagerName: any;
  financialManagerNo: string;
  bureauName: any;
  bureauAddress: any;
  officerName: any;
  officerMobile: string;
}

export interface GetCustomerCommercialInfo {
  taxType: any;
  registeredFund: any;
  legalPerson: any;
  legalPersonNo: string;
  registeredDate: any;
  companyType: any;
  invoiceSheetLimit: any;
  incomeLimit: any;
  ratePayingCreditGrade: any;
  registeredAddress: any;
  financialManagerName: any;
  invoicingBankName: any;
  invoicingBankAccount: string;
  businessScope: any;
  entStatus: any;
  openFrom: any;
  openTo: any;
}

export interface GetCustomerCustomerManager {
  accountId: string;
  name: string;
  relationshipId: number;
}

export interface GetCustomerManager {
  accountId: string;
  name: string;
  relationshipId: number;
}

export interface GetCustomerChargeManagerList {
  accountId: string;
  name: string;
  relationshipId: number;
}

export interface GetCustomerJournal {
  accountId: string;
  name: string;
  relationshipId: number;
}

export interface GetCustomerTax {
  accountId: string;
  name: string;
  relationshipId: number;
}

export interface GetCustomerAuditList {
  accountId: string;
  name: string;
  relationshipId: number;
}

export interface GetSocinsCustomerByIdResponse {
  id: number;
  customerId: number;
  customerName: string;
  socinsPassword: string; // 社保申报密码

  taxNo: string;
  taxpayerStateName: any;
  legalRepresentative: string;
  phone: any;
  poiAddress: any;
  industryName: string;
  registrationNumber: string; // 10013102003000527580
  responsibleAuthorityCode: string; // 13102260000
  responsibleAuthorityName: string; // 国家税务总局上海市奉贤区税务局
  responsibleAuthorityBranchCode: string; // 13102265000
  responsibleAuthorityBranchName: string; // 国家税务总局上海市奉贤区税务局第十八税务所
  areaCode: string;
  subjectTypeName: any;
  defaultCustomer: any;
}

export interface ListResponse<T> {
  list: T[];
  total: number;
}

export interface ListCustomerEmployeeItem {
  archiveNumber: string; // 档案编号
  archiveResult: any; // 档案结果
  authenticationState: string; // 认证状态
  bankAccount?: string; // 银行账号
  bankAccountAuthResult: string; // 银行账号认证结果
  bankAccountState: string; // 银行账户状态
  birthday: string; // 出生日期
  birthplaceCode?: string; // 出生地代码
  birthplaceName: any; // 出生地名称
  businessModifyDate: string; // 业务修改日期
  censusAddress?: string; // 户籍地址
  censusCityCode?: string; // 户籍城市代码
  censusCityName: string; // 户籍城市名称
  censusDistrictCode?: string; // 户籍区域代码
  censusDistrictName: string; // 户籍区域名称
  censusKind: any; // 户籍类型
  censusProvinceCode?: string; // 户籍省份代码
  censusProvinceName: string; // 户籍省份名称
  censusStreet?: string; // 户籍街道
  chargeType: any; // 收费类型
  chineseName?: string; // 中文名
  contactAddress?: string; // 联系地址
  contactCityCode?: string; // 联系城市代码
  contactCityName: string; // 联系城市名称
  contactDistrictCode?: string; // 联系区域代码
  contactDistrictName: string; // 联系区域名称
  contactProvinceCode?: string; // 联系省份代码
  contactProvinceName: string; // 联系省份名称
  contactStreet?: string; // 联系街道
  customerId: number; // 客户ID
  declarationResult: any; // 申报结果
  depositBankCode?: string; // 存款银行代码
  depositBankName: any; // 存款银行名称
  depositBankProvince?: string; // 存款银行省份
  depositBankProvinceName: string; // 存款银行省份名称
  deptId: number; // 部门ID
  deptName: any; // 部门名称
  disableCardNumber?: string; // 残疾人证号
  educationType?: string; // 教育类型
  email?: string; // 电子邮件地址
  emergencyContact: any; // 紧急联系人
  emergencyPhone: any; // 紧急联系电话
  employedDate: string; // 雇佣日期
  employeeNumber: string; // 员工编号
  employmentType: string; // 雇佣类型
  estimatedDepartureDate?: string; // 预计离职日期
  firstEmploymentSituation: string; // 首次就业情况
  firstEntryDate?: string; // 首次入职日期
  fspDownLoadFailed: boolean; // FSP下载失败
  fspMessage: any; // FSP消息
  fspModifyDate: any; // FSP修改日期
  fspStatus: any; // FSP状态
  gender: string; // 性别
  id: number; // ID
  insuranceAccount: any; // 保险账户
  insuranceEndMonth: any; // 保险结束月份
  insuranceIndividualNum: any; // 个人保险号
  insurancePayState: any; // 保险缴费状态
  insurancePlanName: any; // 保险计划名称
  insurancePlanUuid: any; // 保险计划唯一标识符
  insuranceRepayMonths: any; // 保险补缴月数
  insuranceStartMonth: any; // 保险开始月份
  insureCityCode: any; // 保险城市代码
  insureCityName: any; // 保险城市名称
  insureProvinceCode: any; // 保险省份代码
  insureProvinceName: any; // 保险省份名称
  isBereavedGaffer: string; // 是否孤老
  isDeductDeduction: string; // 是否扣除抵扣
  isDisabled: string; // 是否残疾
  isManyDeptEmp: boolean; // 是否多部门员工
  isMartyr: string; // 是否烈士
  jobType: any; // 工作类型
  licenseNumber: string; // 许可证号
  licenseTypeCode: string; // 许可证类型代码
  licenseTypeName: string; // 许可证类型名称
  mainArchiveNumber: any; // 主档案编号
  marriageState: any; // 婚姻状况
  martyrCardNumber?: string; // 烈士证号
  name: string; // 姓名
  nation: any; // 民族
  nationalityCode: string; // 国籍代码
  nationalityName: string; // 国籍名称
  nativeCityCode: any; // 籍贯城市代码
  nativeCityName: string; // 籍贯城市名称
  nativeProvinceCode: any; // 籍贯省份代码
  nativeProvinceName: string; // 籍贯省份名称
  organizationId: any; // 组织ID
  organizationName: any; // 组织名称
  otherArchiveNumbers?: string; // 其他档案编号
  otherLicenseNumber?: string; // 其他许可证号
  otherLicenseTypeCode?: string; // 其他许可证类型代码
  otherLicenseTypeName: any; // 其他许可证类型名称
  period: any; // 周期
  personInvestment?: number; // 个人投资
  personInvestmentRatio?: number; // 个人投资比例
  phone: string; // 电话号码
  politicStatus: any; // 政治面貌
  positionId: any; // 职位ID
  positionName: any; // 职位名称
  postLevel: any; // 职级
  probation: any; // 试用期
  probationState: any; // 试用期状态
  providentFundAccount: any; // 公积金账户
  providentFundEndMonth: any; // 公积金结束月份
  providentFundPayState: any; // 公积金缴纳状态
  providentFundRepayMonths: any; // 公积金补缴月数
  providentFundStartMonth: any; // 公积金开始月份
  qq: any; // QQ号
  registrationNumber?: string; // 注册号
  regularDate: any; // 转正日期
  remark?: string; // 备注
  residentAddress?: string; // 居住地址
  residentCityCode?: string; // 居住城市代码
  residentCityName: string; // 居住城市名称
  residentDistrictCode?: string; // 居住区域代码
  residentDistrictName: string; // 居住区域名称
  residentProvinceCode?: string; // 居住省份代码
  residentProvinceName: string; // 居住省份名称
  residentStreet?: string; // 居住街道
  resignDate?: string; // 离职日期
  settlementRequired: any; // 结算要求
  state: string; // 状态
  submissionState: string; // 提交状态
  taxNo: string; // 税号
  taxRefundType: any; // 税收退款类型
  taxRelatedReason: any; // 税务相关原因
  wechatBindStatus: boolean; // 微信绑定状态
  workingYears: any; // 工作年限
}

export interface InvoiceOutputStatisticsResponse {
  // 正常发票张
  totalCount: number;
  // 作废发票张
  invalidCount: number;
  // totalCount+invalidCount
  recordCount: number;
  // 金额 元
  totalPrice: number;
  // 税额 元
  totalTaxPrice: number;
}

export interface InvoiceOutputListResponseItem {
  bizDate: string; // 开票日期 2023-01-12
  complement: string; // 已补全
  documentCode?: string; // 凭证号 202301-记-001

  invoiceId: number; // 发票ID
  invoiceCode: string; // 发票代码
  invoiceNumber: string; // 发票号码
  invoiceNumberEnd: string | null; // 发票结束号码
  cargoName: string; // 货物或服务名称
  cargoPrice: number; // 货物或服务价格
  taxRates: string; // 税率
  taxPrice: number; // 税额
  taxItem: string; // 税目
  withdrawal: string; // 提现标识
  invalid: boolean; // 是否作废
  balance: number | null; // 余额
  suBalance: number | null; // 特定余额
  taxMode: string; // 税收模式
  sourceCode: number; // 来源代码
  sourceName: string; // 来源名称
  buyerTaxpayerCode: string; // 购买方纳税人识别号
  buyerName: string; // 购买方名称
  totalPrice: number; // 总价
  invoiceClass: string; // 发票类别
  documentId: string; // 文件ID
  receiptId: string | null; // 收据ID
  receiptCode: string | null; // 收据代码
  summaryInput: string | null; // 摘要输入
  completedErrorMsg: string | null; // 完成错误消息
  hasCustomWithdrawal: string | null; // 是否有自定义提现
  packageInvoice: string; // 包装发票标识
  riskDetailList: any | null; // 风险详情列表
  remark: string; // 备注
  exitInvoice: string; // 出口发票标识
  verifyStatus: string; // 验证状态
  billingMachineNumber: string; // 开票机号码
  transferStatus: string; // 转移状态
  hasOriginal: number; // 是否有原件
  lastPrintTime: string | null; // 最后打印时间
  lastPrintTimeStr: string | null; // 最后打印时间字符串
  yhssm: string | null; // 优惠税收码
  yhssmName: string | null; // 优惠税收名称
  yhszm: string | null; // 应征税种码
  yhszmName: string | null; // 应征税种名称
  officialPdfUrl: string; // 官方PDF URL
  systemPdfUrl: string | null; // 系统PDF URL
  completed: string; // 完成标识
  checkComplementCode: string | null; // 核对补充代码
  checkComplementMessage: string | null; // 核对补充消息
  hasRealOriginal: string; // 是否有实际原件
  originalPreviewFlag: string; // 原件预览标志
  pdfUrl: string | null; // PDF URL
  ofdUrl: string | null; // OFD URL
  xmlUrl: string | null; // XML URL
  identityNumber: string | null; // 身份编号
  specificFeatureTypeCode: string | null; // 特定特征类型代码
  drawerName: string; // 开票人名称
  buildServiceLocation: string | null; // 建筑服务位置
  buildServiceProjectName: string | null; // 建筑服务项目名称
}

export interface InvoiceOutputDetailResponse {
  balance: any;
  bizDate: string;
  buyerBankAccount: any;
  buyerContract: any;
  buyerCustomerId: any;
  buyerName: string;
  buyerTaxpayerCode: string;
  cargoBaseVOList: InvoiceOutputDetailResponseCargoBaseVolist[];
  cargoName: string;
  cargoPrice: number;
  checkCode: string;
  cipherText: any;
  completed: string;
  continueModify: any;
  createDate: any;
  creatorId: any;
  creatorName: any;
  customerId: number;
  documentCode: any;
  documentId: number;
  drawerName: any;
  exitInvoice: any;
  farmBuy: boolean;
  hasList: boolean;
  hasOriginal: number;
  id: number;
  interfaceCode: any;
  invalid: boolean;
  invalidDate: any;
  invalidName: any;
  invoiceClass: string;
  invoiceCode: string;
  invoiceCount: number;
  invoiceDesc: any;
  invoiceNumber: string;
  invoiceNumberEnd: any;
  invoiceStatus: any;
  invoiceType: number;
  modifierId: any;
  modifierName: any;
  modifyDate: any;
  noticeNumber: any;
  originalPrice: number;
  originalTax: number;
  payMode: number;
  payeeName: any;
  picUrl: any;
  relativeInvoiceCode: any;
  relativeInvoiceNumber: any;
  remark: string;
  reviewerName: any;
  riskDetailList: any;
  sellerBankAccount: any;
  sellerContract: any;
  source: number;
  status: number;
  suBalance: any;
  summaryInput: string;
  taxItem: string;
  taxItems: any;
  taxMode: string;
  taxModes: any;
  taxPrice: number;
  taxRate: number;
  taxRates: string;
  totalPrice: number;
  transferStatus: string;
  validTaxPrice: any;
  vehicleId: any;
  version: number;
  withdrawal: boolean;
  withdrawals: any;
}

export interface InvoiceOutputDetailResponseCargoBaseVolist {
  id: string;
  spec: string;
  unit: string;
  price: number;
  yhssm: any;
  yhszm: any;
  amount: number;
  hasTax: any;
  inList: any;
  taxItem: string;
  taxMode: string;
  taxRate: number;
  taxPrice: number;
  cargoName: string;
  invoiceId: number;
  netWeight: any;
  unitPrice: number;
  customerId: number;
  fixedAsset: boolean;
  lineNumber: number;
  totalPrice: number;
  withdrawal: string;
  grossWeight: any;
  invoiceType: string;
  originalTax: number;
  taxCategory: any;
  taxItemCode: string;
  taxItemType: any;
  originalPrice: number;
  discountTaxRate: number;
}

export interface InvoiceInputStatistics {
  // 已抵扣认证
  deductiveCount: number;
  // 可抵扣税额
  deductiveTaxAmt: number;
  deductiveValidTaxAmt: number;
  deductivePrice: number;
  deductiveTotalPrice: number;
  unDeductiveCount: number;
  unDeductivePrice: number;
  unDeductiveTotalPrice: number;
  unDeductiveTaxAmt: number;
  unDeductiveValidTaxAmt: any;
  recordCount: number;
  totalCount: number;
  certificationCount: number;
  certificationPrice: number;
  certificationTaxAmt: number;
  certificationValidTaxAmt: number;
  certificationTotalPrice: number;
  unCertificationCount: number;
  unCertificationPrice: number;
  unCertificationTaxAmt: number;
  unCertificationValidTaxAmt: any;
  unCertificationTotalPrice: number;
  unKnowntificationCount: number;
  unKnownCertificationPrice: number;
  unKnownCertificationTaxAmt: number;
  unKnownCertificationValidTaxAmt: any;
  unKnownCertificationTotalPrice: number;
}

/**
 * InputInvoiceResponseItem 接口定义了进项发票响应的数据结构。
 * 包含了发票的各种信息，如发票代码、发票号码、购买方名称、购买方纳税人识别号等。
 */
export interface InputInvoiceListResponseItem {
  accountsDate?: string; // 账目日期
  accountsSource?: string; // 账目来源
  bizDate: string; // 业务日期
  buildServiceLocation: any; // 建筑服务位置
  buildServiceProjectName: any; // 建筑服务项目名称
  buyerName: string; // 购买方名称
  buyerTaxpayerCode: string; // 购买方纳税人识别号
  cargoName: string; // 货物或服务名称
  cargoPrice: number; // 货物或服务价格
  certificationDate: string; // 认证日期
  certificationType: string; // 认证类型
  checkComplementCode: any; // 核对补充代码
  checkComplementMessage: any; // 核对补充消息
  checkMode: string; // 核对模式
  checkStatus: string; // 核对状态
  compared: string; // 比较结果
  completed: string; // 完成状态
  customerId: number; // 客户ID
  deductiveMonth?: string; // 抵扣月份
  deductiveStatus: string; // 抵扣状态
  documentCode?: string; // 文档代码
  documentId?: number; // 文档ID
  elecInvoice: boolean; // 是否为电子发票
  farmExtraDeductPeriod: string; // 农业额外抵扣期
  farmExtraDeductTax: any; // 农业额外抵扣税
  fillCode: any; // 填充代码
  fillMessage: any; // 填充消息
  hasRealOriginal: string; // 是否有实际原件
  id: number; // ID
  identityNumber: any; // 身份编号
  invoiceClass: string; // 发票类别
  invoiceCode: string; // 发票代码
  invoiceNumber: string; // 发票号码
  invoiceStatus: string; // 发票状态
  invoiceTag: any; // 发票标签
  lastPrintTime: any; // 最后打印时间
  lastPrintTimeStr: any; // 最后打印时间字符串
  managementStatus: string; // 管理状态
  officialPdfUrl?: string; // 官方PDF URL
  originalPreviewFlag: string; // 原件预览标志
  receiptCode: any; // 收据代码
  receiptId: any; // 收据ID
  remark?: string; // 备注
  sdInvoice: boolean; // 是否为数电票
  source: string; // 来源
  specificFeatureTypeCode: any; // 特定特征类型代码
  summaryInput?: string; // 摘要输入
  suplierName: string; // 供应商名称
  suplierTax: string; // 供应商税号
  systemPdfUrl: any; // 系统PDF URL
  taxItem: string; // 税目
  taxItemStr: any; // 税目字符串
  taxPeriod: string; // 税期
  taxPrice: number; // 税额
  taxRates: string; // 税率
  totalPrice: number; // 总价
  transferStatus: string; // 转移状态
  validTaxPrice?: number; // 有效税额
  verifyStatus: string; // 验证状态
  verifyTime: any; // 验证时间
  withdrawal: string; // 提现标识
}

export interface _InvoiceInputListResponseItem {
  acquisitionType: string;
  bizDate: string;
  cargoName: string;
  cargoPrice: number;
  certificationDate: string;
  certificationType: string;
  certificationTypeCode: string;
  checkMode: string;
  checkModeName: string;
  compared: string;
  completed: string;
  completedErrorMsg: any;
  createDate: string;
  customerId: string;
  deductiveMonth: string;
  deductiveStatus: string;
  documentCode: string;
  documentId: number;
  hasCustomFixedAsset: any;
  hasCustomWithdrawal: any;
  hasfixasserts: string;
  inCounselingPeriod: string;
  invoiceClass: string;
  invoiceCode: string;
  invoiceId: number;
  invoiceNumber: string;
  invoiceStatus: string;
  remark: string;
  riskDetailList: any;
  saleAddress: any;
  source: string;
  sourceName: string;
  summaryInput: any;
  suplierName: string;
  suplierTax: string;
  taxAuthorityCode: any;
  taxAuthorityName: any;
  taxItem: string;
  taxPeriod: string;
  taxPrice: number;
  taxRates: string;
  totalPrice: number;
  validTaxPrice: number;
  vehicleId: any;
  verifyStatus: string;
  withdrawal: string;
  yhssm: any;
  yhssmName: any;
  yhszm: any;
  yhszmName: any;
}

interface InputInvoice {
  customerId: number; // 客户ID
  id: number; // 发票唯一标识ID
  invoiceClass: string; // 发票分类代码
  elecInvoice: boolean; // 是否为电子发票
  sdInvoice: boolean; // 是否为服务类发票
  invoiceCode: string; // 发票代码
  invoiceNumber: string; // 发票号码
  bizDate: string; // 业务日期
  completed: string; // 完成状态码
  fillCode: string | null; // 填充代码
  fillMessage: string | null; // 填充信息
  certificationType: string; // 认证类型
  certificationDate: string; // 认证日期
  taxPeriod: string; // 税务期
  deductiveStatus: string; // 扣税状态
  deductiveMonth: string | null; // 扣税月份
  checkMode: string; // 核对模式
  suplierTax: string; // 供应商纳税人识别号
  suplierName: string; // 供应商名称
  cargoName: string; // 货物或服务名称
  taxItem: string; // 税目
  taxItemStr: string | null; // 税目描述字符串
  cargoPrice: number; // 货物或服务价格
  taxRates: string; // 税率
  taxPrice: number; // 税额
  validTaxPrice: number | null; // 有效税额
  totalPrice: number; // 总价
  invoiceStatus: string; // 发票状态
  verifyStatus: string; // 验证状态
  verifyTime: string | null; // 验证时间
  withdrawal: string; // 提现状态
  source: string; // 来源代码
  remark: string | null; // 备注
  documentId: number; // 文档ID
  documentCode: string; // 文档代码
  receiptId: string | null; // 收据ID
  receiptCode: string | null; // 收据代码
  compared: string; // 对比状态
  transferStatus: string; // 转移状态
  summaryInput: string | null; // 摘要输入
  lastPrintTime: string | null; // 最后打印时间
  lastPrintTimeStr: string | null; // 最后打印时间字符串
  invoiceTag: string | null; // 发票标签
  managementStatus: string; // 管理状态
  officialPdfUrl: string | null; // 官方PDF URL
  systemPdfUrl: string | null; // 系统PDF URL
  checkStatus: string; // 核查状态
  checkComplementCode: string | null; // 核查补充代码
  checkComplementMessage: string | null; // 核查补充消息
  hasRealOriginal: string; // 是否有真实原件
  originalPreviewFlag: string; // 原件预览标志
  accountsDate: string; // 入账日期
  accountsSource: string; // 入账来源
  farmExtraDeductPeriod: string; // 农业额外扣除期
  farmExtraDeductTax: number | null; // 农业额外扣除税额
  buyerTaxpayerCode: string; // 买方纳税人识别号
  buyerName: string; // 买方名称
  identityNumber: string | null; // 身份编号
  specificFeatureTypeCode: string | null; // 特定特征类型代码
  buildServiceLocation: string | null; // 建设服务位置
  buildServiceProjectName: string | null; // 建设服务项目名称
}

export interface InvoiceInputDetailResponse {
  id: number;
  version: number;
  createDate: string;
  modifyDate: string;
  creatorId: any;
  creatorName: any;
  modifierId: any;
  modifierName: any;
  invoiceClass: string;
  invoiceCode: string;
  invoiceNumber: string;
  cargoPrice: number;
  totalPrice: number;
  taxRate: number;
  taxPrice: number;
  validTaxPrice: number;
  cipherText: string;
  bizDate: string;
  drawerName: any;
  payeeName: any;
  reviewerName: any;
  invoiceDesc: any;
  invalid: any;
  invalidName: any;
  invalidDate: any;
  relativeInvoiceCode: any;
  relativeInvoiceNumber: any;
  noticeNumber: any;
  status: any;
  payMode: number;
  taxItem: string;
  remark: string;
  documentId: number;
  documentCode: any;
  customerId: number;
  cargoBaseVOList: InvoiceInputDetailResponseCargoBaseVolist[];
  hasList: boolean;
  vehicleId: any;
  taxMode: any;
  invoiceStatus: string;
  cargoName: string;
  completed: string;
  balance: any;
  suBalance: any;
  originalPrice: any;
  originalTax: any;
  exitInvoice: any;
  invoiceNumberEnd: any;
  taxRates: string;
  withdrawals: any;
  taxModes: any;
  taxItems: any;
  invoiceCount: number;
  summaryInput: string;
  riskDetailList: any;
  interfaceCode: string;
  picUrl: any;
  certificationDate: string;
  deductiveMonth: string;
  certificationType: string;
  deductiveStatus: string;
  suplierTax: string;
  withdrawal: string;
  suplierName: string;
  compared: string;
  hasfixasserts: string;
  source: string;
  taxPeriod: string;
  inCounselingPeriod: string;
  settedTxType: boolean;
  saleAddress: any;
  acquisitionType: any;
  taxItemOrder: string;
  taxItemStrings: any;
  invoiceType: string;
  deepProcessing: any;
  deductionRate: any;
  continueModify: any;
  checkCode: any;
  invoiceTag: any;
  needCheckValidTaxPrice: any;
}

export interface InvoiceInputDetailResponseCargoBaseVolist {
  id: string;
  lineNumber: number;
  cargoName: string;
  price: number;
  hasTax: any;
  taxRate: number;
  taxPrice: number;
  totalPrice: number;
  spec?: string;
  taxCategory: any;
  taxItem: string;
  unitPrice?: number;
  unit?: string;
  amount?: number;
  customerId: number;
  taxMode: any;
  taxItemCode: string;
  inList: any;
  invoiceType: string;
  taxItemType: any;
  invoiceId: number;
  withdrawal: string;
  netWeight: any;
  grossWeight: any;
  originalPrice: number;
  originalTax: number;
  fixedAsset: boolean;
  discountTaxRate: any;
  yhssm: any;
  yhszm: any;
}

export interface PageQueryCollectResult {
  success: boolean;
  errorContext: any;
  total: number;
  data: PageQueryCollectResultDaum[];
}

export interface PageQueryCollectResultDaum {
  getTime: number;
  invoiceType: string;
  invoiceCollectTaskType: string;
  businessType: string;
  bizDate?: string;
  period?: string;
  invoiceClasses: PageQueryCollectResultInvoiceClass[];
  status: number; // 2 成功 3 部分成功
  totalPrice: number;
  serialId: string;
  failureReason: any;
  largeFlag: any;
  certDataRepairRange: any;
  unCertDataRepairRange: any;
  collectChannel: string;
  invoiceTotal: number;
  unCertPlatformCollect?: boolean;
  needCollectCustoms?: boolean;
  subtotalList?: PageQueryCollectResultSubtotalList[];
  collectSecretKeyErrorFlag: any;
}

export interface PageQueryCollectResultInvoiceClass {
  invoiceClass: string;
  invoiceClassName: any;
  totalPrice: number;
  count: number;
  abnormalInvoice: any;
}

export interface PageQueryCollectResultSubtotalList {
  totalCount: number;
  totalPrice: number;
  status: number;
  abnormalInvoice: boolean;
  failureReason: any;
  largeFlag: any;
}

export interface InvoiceInputGeneralQueryResponseItem {
  acquisitionType: any;
  action: string;
  arrivalStation: any;
  bizDate: string;
  bunkerSurcharge: any;
  cargoName: string;
  cargoPrice: number;
  certificationDate: string;
  certificationType: string;
  checkMode: string;
  cipherText: string;
  compared: string;
  completed: string;
  createDate: string;
  customerId: number;
  deductiveMonth: any;
  deductiveStatus: string;
  departureStation: any;
  documentCode: any;
  documentId: any;
  fillCode: any;
  fillMessage: any;
  fullName: any;
  hasCustomFixedAsset: any;
  hasCustomWithdrawal: any;
  hasfixasserts: string;
  inCounselingPeriod: string;
  inputGeneralExtendDTO: any;
  invoiceClass: string;
  invoiceCode: string;
  invoiceCount: number;
  invoiceId: number;
  invoiceNumber: string;
  invoiceStatus: string;
  invoiceTag: any;
  number: any;
  receiptCode: any;
  receiptId: any;
  registerType: any;
  remark: string;
  riskDetailList: any;
  riskInvoice: string;
  saleAddress: any;
  source: string;
  spec: any;
  success: any;
  summaryInput: any;
  suplierName: string;
  suplierTax: string;
  taxAuthorityCode: any;
  taxAuthorityName: any;
  taxItem: string;
  taxItemStr: string;
  taxPeriod: string;
  taxPrice: number;
  taxRates: string;
  taxationPrice: any;
  ticketPrice: any;
  totalPrice: number;
  unDeductiveReason?: string;
  unDeductiveReasonCode?: string;
  uploadUserDepartment: any;
  uploadUserId: any;
  uploadUserJobNumber: any;
  uploadUserName: any;
  validTaxPrice: any;
  vehicleId: any;
  verifyStatus: string;
  withdrawal: string;
  withholdAgentName: any;
  withholdAgentNo: any;
  yhssm: any;
  yhssmName: any;
  yhszm: any;
  yhszmName: any;
}

export interface FinanceQueryCustomerResponseItem {
  accountSetId: number;
  accountStatus: string;
  accountStatusName: any;
  auditIdList: any;
  auditIdNameList: any;
  checkState: number;
  checkStateName: any;
  createPeriod: string;
  customerFullName: string;
  customerId: string;
  customerLabelNames: any;
  customerName: string;
  customerNo: string;
  finishTime: any;
  finisherId: any;
  finisherName: any;
  hasAt: boolean;
  hasNewNote: boolean;
  hasNotes: boolean;
  invoiceArrangeState: number;
  journalId: string;
  journalName: string;
  labelList?: string[];
  latestClosedPeriod: string;
  level?: number;
  levelName?: string;
  locationCode: string;
  managerName: any;
  markTime: any;
  markerId: any;
  markerName: any;
  period: string;
  remark: any;
  submitterId: any;
  submitterName: any;
  systemAccountId: number;
  taxType: string;
}

export interface ListFinanceAccDocItem {
  accountDocument: FinanceAccDocsListItemAccountDocument;
  entryDtoList: FinanceAccDocsListItemEntryDtoList[];
  carryOverType: any;
  carryOverConfigId: any;
  carryOverAmount: any;
  upperAmount: any;
  comment: any;
  uuid: any;
  extraInfo: any;
}

export interface FinanceAccDocsListItemAccountDocument {
  id: number;
  customerId: number;
  accountSetId: number;
  number: string;
  journalDate: string;
  receiptNum?: number;
  makerName: string;
  debitAmount: number;
  creditAmount: number;
  accountPeriod: string;
  source: string;
  type: string;
  fiscalYear: string;
  checkStatus?: string;
  checkerName?: string;
  checkDate: any;
  businessUniqueKey: string;
  entryList: any;
  remarked: boolean;
  name: any;
  pinYinInitial: any;
  remark: any;
  templateType: any;
  version: number;
  createDate: any;
  modifyDate: any;
  creatorId: any;
  creatorName: any;
  modifierId: any;
  modifierName: any;
  writeOffed: boolean;
  haveAnnex: boolean;
  assetAmount: any;
  tip: any;
}

export interface FinanceAccDocsListItemEntryDtoList {
  accountEntry: FinanceAccDocsListItemEntryDtoListAccountEntry;
  accountSetId: number;
  accountPeriod: any;
  unit: any;
  fcurCode: any;
  fullName: string;
  useAssistant: boolean;
  useQuantity: boolean;
  useFcur: boolean;
  direction: number;
  carryOverDisplayDirection: number;
  documentSource: any;
  assistantName?: string;
  assistantCode?: string;
  balance: number;
  balanceQ: number;
  ancestorTitleName: any;
  ancestorTitleCode: any;
}

export interface FinanceAccDocsListItemEntryDtoListAccountEntry {
  id: number;
  delId: any;
  rowNum: number;
  documentId: number;
  accountSetId: number;
  customerId: number;
  accountTitleId: number;
  accountTitleCode: string;
  accountTitleName: any;
  fullAccountTitleName: any;
  titleDeleteMessage: any;
  summary: string;
  debitAmount: number;
  creditAmount: number;
  debitAmountQ: number;
  creditAmountQ: number;
  debitAmountF: number;
  creditAmountF: number;
  unitPrice: number;
  exchangeRate: number;
  assistantType?: string;
  assistantId: number;
  assistantCode: any;
  businessDate: any;
  version: number;
  createDate: any;
  modifyDate: any;
  creatorId: any;
  creatorName: any;
  modifierId: any;
  modifierName: any;
  amount: number;
}

export interface FinanceAccountSetResponse {
  systemAccountId: number;
  systemAccountTypeCode: number;
  systemAccountName: any;
  customerId: number;
  customerName: string;
  customerShortName: string;
  accountSetId: number;
  createPeriod: string;
  currentPeriod: string;
  lastPeriod: string;
  newlyClosedPeriod: string;
  makerName: string;
  reclassifyFlag: string;
  incomeTaxCollectionWay: string;
  remark: any;
  appKey: string;
  terminalType: string;
  authEnable: boolean;
  authCode: string;
  companyId: number;
  locationCode: string;
  taxRegionCode: string;
  originalRegionCode: string;
  authLocationCode: string;
  addedTaxType: string;
  taxNo: string;
  financeCheckMaxPeriod: any;
  enableFinanceCheckAndOnClosedForSecurity: any;
  isInventoryPro: boolean;
  isSalaryPro: boolean;
  enableExpense: boolean;
  enableInvoicePro: boolean;
  signStr: any;
  maxDepreciationPeriod: any;
  enableAssetPro: boolean;
  token: string;
  maxHistoryClosedPeriod: string;
  accountId: string;
  fondsId: any;
  key: string;
  iv: string;
}

export interface FinanceCheckFinanceAuthResponse {
  hasEffectiveContract: any;
  owed: boolean;
  functionSwitchJOList: any[];
  switchOn: any;
  settingSwitch: any;
  expiredContract: boolean;
  expiredDate: any;
  owedMonths: any;
}

export interface FinanceGetAccountSetInfoResponse {
  accountSetId: number;
  accountSetMarkInfo: any;
  accountStatus: string;
  checkState: number;
  closeAccountsRecord: any;
  createPeriod: string;
  customerFullName: string;
  customerId: string;
  customerName: string;
  customerNo: string;
  healthGrade: any;
  incomeTaxCollectionWay: string;
  journal: string;
  labelList: any[];
  lastClosePeriod: any;
  monthDocCount: number;
  period: string;
  rejectedReason: any;
  remark: any;
  riskResult: any;
  riskScanResult: any;
  riskScanResultGroup: FinanceGetAccountSetInfoResponseRiskScanResultGroup;
  submitter: any;
  submitterId: any;
  systemAccountId: number;
  titleTemplateName: string;
}

export interface FinanceGetAccountSetInfoResponseRiskScanResultGroup {
  startScanDate: any;
  healthGrade: any;
  riskLevel: any;
  accountRiskNum: number;
  reportRiskNum: number;
  compareRiskNum: number;
  businessRiskNum: number;
  riskResults: any[];
}

export interface ListPersonalIncomeTaxReportResponse {
  showList: ListPersonalIncomeTaxReportShowList[];
  totalIncome: ListPersonalIncomeTaxReportResponseTotalIncome;
}

export interface ListPersonalIncomeTaxReportShowList {
  abroadIncome: number; // 海外收入
  abroadWorkingDays: number; // 海外工作天数
  accumulatedBabyCare: number; // 累计托幼支出抵扣
  accumulatedChildEducation: number; // 累计子女教育支出抵扣
  accumulatedContinueEducation: number; // 累计继续教育支出抵扣
  accumulatedDeductibleDonation: number; // 累计可抵扣捐赠支出
  accumulatedDeductionAmount: number; // 累计扣除额
  accumulatedExemptIncome: number; // 累计免税收入
  accumulatedHouseLoan: number; // 累计住房贷款利息支出抵扣
  accumulatedHouseRent: number; // 累计住房租金支出抵扣
  accumulatedIncome: number; // 累计收入总额
  accumulatedMonthDeduction: number; // 累计月度扣除总额
  accumulatedOtherDeduction: number; // 累计其他扣除
  accumulatedPaidAmount: number; // 累计已支付税额
  accumulatedPayableAmount: number; // 累计应纳税额
  accumulatedPersonalPension: number; // 累计个人养老金支出抵扣
  accumulatedSeriousIllness: number; // 累计大病医疗支出抵扣
  accumulatedSpecAttachDeduction: number; // 累计专项附加扣除总额
  accumulatedSpecDeduction: number; // 累计专项扣除总额
  accumulatedSupportElder: number; // 累计赡养老人支出抵扣
  accumulatedTaxDeduction: number; // 累计税收减免
  accumulatedTaxableIncome: number; // 累计应纳税所得额
  accumulatedWithholdingAmount: number; // 累计预扣预缴税额
  allPayCost: number; // 总支出
  annuity: number; // 年金
  annuityReceiptReasonCode: any; // 年金收据原因代码
  annuityReceiptReasonName: any; // 年金收据原因名称
  annuityReceiptTypeCode: any; // 年金收据类型代码
  annuityReceiptTypeName: any; // 年金收据类型名称
  apportionMonths: number; // 分摊月数
  apportionYears: number; // 分摊年数
  babyCareExpenditure: number; // 托幼支出
  backupType: string; // 备份类型
  calendarDays: number; // 日历天数
  changeType: any; // 变更类型
  childEducationExpenditure: number; // 子女教育支出
  commercialHealthInsurance: number; // 商业健康保险
  continueEducationExpenditure: number; // 继续教育支出
  createDate: any; // 创建日期
  creatorId: any; // 创建者ID
  currentSalary: number; // 当前薪资
  customerId: number; // 客户ID
  declarationId: number; // 申报ID
  deductibleDonation: number; // 可抵扣捐赠支出
  deductionAmount: number; // 扣除金额
  deptId: number; // 部门ID
  deptName: any; // 部门名称
  domesticIncome: number; // 国内收入
  domesticWorkingDays: number; // 国内工作天数
  employedDate: string; // 雇佣日期
  employeeId: number; // 员工ID
  employeeNumber: string; // 员工编号
  endowmentInsurance: number; // 养老保险
  exemptIncome: number; // 免税收入
  exhibitionCost: number; // 展览成本
  extensionEndowmentInsurance: number; // 延期养老保险
  formula: any; // 公式
  houseLoanExpenditure: number; // 住房贷款利息支出
  houseProvidentFund: number; // 住房公积金
  houseRentExpenditure: number; // 住房租金支出
  id: number; // 标识ID
  income: number; // 收入
  incomeAmount: number; // 收入金额
  incomeDetailId: any; // 收入明细ID
  incomeItemCode: string; // 收入项目代码
  incomeItemName: string; // 收入项目名称
  incomePeriodEnd: string; // 收入期间结束日期
  incomePeriodStart: string; // 收入期间开始日期
  isManyDeptEmp: boolean; // 是否多部门员工
  licenseNumber: string; // 许可证号
  licenseTypeCode: string; // 许可证类型代码
  licenseTypeName: string; // 许可证类型名称
  medicalInsurance: number; // 医疗保险
  modifierId: any; // 修改者ID
  modifyDate: any; // 修改日期
  monthDeduction: number; // 月扣除
  monthlyApportionedIncome: number; // 按月分摊收入
  name: string; // 姓名
  onceReceipt: any; // 一次性收据
  other: number; // 其他
  otherDeductionSum: number; // 其他扣除总额
  paidAmount: number; // 已支付金额
  pastDataType: any; // 过去数据类型
  payableAmount: number; // 应付金额
  period: string; // 期间
  quickDeduction: number; // 快速扣除
  refundTax: number; // 退税
  remark?: string; // 备注
  resignDate?: string; // 离职日期
  salaryDeductionBalance: number; // 薪资扣除余额
  seriousIllnessExpenditure: number; // 大病支出
  specAttachDeductionSum: number; // 特定附加扣除总额
  specDeductionSum: number; // 特定扣除总额
  supportElderExpenditure: number; // 赡养老人支出
  taxDeductible: number; // 税收减免
  taxDeduction: number; // 税收扣减
  taxRate: number; // 税率
  taxableIncome: number; // 应税收入
  taxedPayCost: number; // 已税支付成本
  unemploymentInsurance: number; // 失业保险
  withholdingAmount: number; // 预扣金额
  yearDeduction: number; // 年度扣除
}

export interface ListPersonalIncomeTaxReportResponseTotalIncome {
  abroadIncome: any; // 海外收入总计
  abroadWorkingDays: any; // 海外工作天数总计
  accumulatedBabyCare: number; // 累计托幼支出抵扣总额
  accumulatedChildEducation: number; // 累计子女教育支出抵扣总额
  accumulatedContinueEducation: number; // 累计继续教育支出抵扣总额
  accumulatedDeductibleDonation: any; // 累计可抵扣捐赠支出总额
  accumulatedDeductionAmount: any; // 累计扣除额总计
  accumulatedExemptIncome: any; // 累计免税收入总额
  accumulatedHouseLoan: number; // 累计住房贷款利息支出抵扣总额
  accumulatedHouseRent: number; // 累计住房租金支出抵扣总额
  accumulatedIncome: number; // 累计收入总额
  accumulatedMonthDeduction: any; // 累计月度扣除总额
  accumulatedOtherDeduction: any; // 累计其他扣除总额
  accumulatedPaidAmount: any; // 累计已支付税额总额
  accumulatedPayableAmount: any; // 累计应纳税额总额
  accumulatedPersonalPension: number; // 累计个人养老金支出抵扣总额
  accumulatedSeriousIllness: number; // 累计大病医疗支出抵扣总额
  accumulatedSpecAttachDeduction: number; // 累计专项附加扣除总额
  accumulatedSpecDeduction: any; // 累计专项扣除总额
  accumulatedSupportElder: number; // 累计赡养老人支出抵扣总额
  accumulatedTaxDeduction: any; // 累计税收减免总额
  accumulatedTaxableIncome: any; // 累计应纳税所得额总额
  accumulatedWithholdingAmount: any; // 累计预扣预缴税额总额
  allPayCost: number; // 总支出
  annuity: number; // 年金总额
  annuityReceiptReasonCode: any; // 年金收据原因代码
  annuityReceiptReasonName: any; // 年金收据原因名称
  annuityReceiptTypeCode: any; // 年金收据类型代码
  annuityReceiptTypeName: any; // 年金收据类型名称
  apportionMonths: any; // 分摊月数总计
  apportionYears: any; // 分摊年数总计
  babyCareExpenditure: any; // 托幼支出总额
  backupType: any; // 备份类型
  calendarDays: any; // 日历天数总计
  changeType: any; // 变更类型
  childEducationExpenditure: any; // 子女教育支出总额
  commercialHealthInsurance: number; // 商业健康保险总额
  continueEducationExpenditure: any; // 继续教育支出总额
  createDate: any; // 创建日期
  creatorId: any; // 创建者ID
  currentSalary: number; // 当前薪资总额
  customerId: any; // 客户ID
  declarationId: any; // 申报ID
  deductibleDonation: number; // 可抵扣捐赠支出
  deductionAmount: number; // 扣除金额总计
  deptId: any; // 部门ID
  deptName: any; // 部门名称
  domesticIncome: any; // 国内收入总计
  domesticWorkingDays: any; // 国内工作天数总计
  employee: number; // 员工总数
  employeeId: any; // 员工ID
  endowmentInsurance: number; // 养老保险总额
  exemptIncome: number; // 免税收入总额
  exhibitionCost: number; // 展览成本总额
  extensionEndowmentInsurance: number; // 延期养老保险总额
  formula: any; // 公式
  houseLoanExpenditure: any; // 住房贷款利息支出总额
  houseProvidentFund: number; // 住房公积金总额
  houseRentExpenditure: any; // 住房租金支出总额
  id: any; // 标识ID
  income: number; // 收入总额
  incomeAmount: any; // 收入金额总计
  incomeDetailId: any; // 收入明细ID
  incomeItemCode: any; // 收入项目代码
  incomeItemName: any; // 收入项目名称
  incomePeriodEnd: any; // 收入期间结束日期
  incomePeriodStart: any; // 收入期间开始日期
  medicalInsurance: number; // 医疗保险总额
  modifierId: any; // 修改者ID
  modifyDate: any; // 修改日期
  monthDeduction: any; // 月度扣除总额
  monthlyApportionedIncome: number; // 按月分摊的收入总额
  onceReceipt: any; // 一次性收据
  other: number; // 其他总额
  otherDeductionSum: number; // 其他扣除总和
  paidAmount: number; // 已支付金额总额
  pastDataType: any; // 过去数据类型
  payableAmount: number; // 应付金额总额
  period: any; // 期间
  quickDeduction: any; // 快速扣除总额
  refundTax: number; // 退税总额
  remark: any; // 备注
  salaryDeductionBalance: number; // 薪资扣除余额
  seriousIllnessExpenditure: any; // 大病支出总额
  specAttachDeductionSum: any; // 特定附加扣除总和
  specDeductionSum: number; // 特定扣除总和
  supportElderExpenditure: any; // 赡养老人支出总额
  taxDeductible: any; // 税收减免总额
  taxDeduction: number; // 税收扣减总额
  taxRate: any; // 税率
  taxableIncome: number; // 应税收入总额
  taxedPayCost: number; // 已税支付成本总额
  total: any; // 总计
  unemploymentInsurance: number; // 失业保险总额
  withholdingAmount: number; // 预扣金额总额
  yearDeduction: number; // 年度扣除总额
}

export interface CustomerProgressQueryResponse {
  list: CustomerProgressQueryResponseList[];
  total: number;
  customerNoteAtTotalNum: number;
  customerNoteUnreadTotalNum: number;
}

export interface CustomerProgressQueryResponseList {
  customerId: string;
  customerName: string;
  customerNo?: string;
  fullName: string;
  // 理票 - 已完成、未完成、无业务
  invoiceArrangeStatus: string | 'DONE' | 'UNDONE' | 'NO';
  // 记账
  accountStatus: string;
  // 申报
  taxDeclareStatus: string;
  // 缴款
  paymentStatus: string;
  // 清卡
  clearCardStatus: string;
  // 抄税
  copyTaxStatus: string;
  latestNote: any;
  customerNoteStatus: string;
  managerName: string;
  journalName: string;
  taxerName: string;
  taxType: string;
  taxNo?: string;
  locationCode: string;
  // 装订凭证、打印凭证
  customDataDTOMap: Record<
    string,
    {
      id: number;
      companyId: string;
      customerId: string;
      code: string;
      value: string;
      reportId: string;
      period: string;
    }
  >;
  accountSetId?: number;
  atEmitName: any;
  maxProfitLossMonth: string;
  topFlag: boolean;
  labelList?: string[];
  taxRegionCode: string;
  customerPendingNum: number;
  pendingContent: any;
}

export interface GetMemberListResponseItem {
  name: string;
  mobile: string;
  departmentRole?: string;
  department?: string;
  available: string;
  activated: string;
  systemRole?: number;
  employeeId: number;
  accountId: string;
  admin: boolean;
}

export interface ChangeGroupResponse {
  accountId: string;
  accountName: string;
  loginName: string;
  companyId: string;
  companyName: string;
  activation: boolean;
  imageUrl: string;
  guide: boolean;
  customerId: string;
  taxNo: any;
  appId: string;
}

export interface GetGroupResponse {
  id: string;
  name: string;
  fullName: string;
  accoutLicense: any;
  businessLicense: string;
  corporation: any;
  contacter: any;
  contact: any;
  locationCode: string;
  address: any;
  area: any;
  content: any;
  licenseImgPath: any;
  memo: any;
  logoImgPath: string;
  type: any;
  customerServerPhone: string;
  admins: string;
  departmentHeads: GetGroupResponseDepartmentHead[];
  companyAdmin: GetGroupResponseCompanyAdmin[];
  email: any;
  activated: string;
  province: string;
  city: string;
  district: string;
  institutionType: string;
  shxydm: string;
  adminMobileList: string[];
  marketingImgUrl: any;
  marketingImgName: any;
  cyCompany: boolean;
}

export interface GetGroupResponseDepartmentHead {
  id: string;
  name: string;
}

export interface GetGroupResponseCompanyAdmin {
  id: string;
  name: string;
}

export interface GetTaxDeclarationStatusResponse {
  declarationJO: GetTaxDeclarationStatusResponseDeclarationJo[]; // 申报状态信息数组
  addedType: string; // 添加类型
  upFollow: number; // 上游跟进数
  emptyList: boolean; // 是否为空列表
  simpleDeclareInitFlag: boolean; // 简易申报初始化标志
}

export interface GetTaxDeclarationStatusResponseDeclarationJo {
  bizCode: any; // 业务代码
  collectionItemCode: any; // 收集项目代码
  createSource?: number; // 创建来源
  creditTax: string; // 应纳税额
  cxsFlag: boolean; // 查询标志
  deadlineDate: string; // 截止日期
  declarationChannel: any; // 申报渠道
  declarationPaymentFeedBack?: GetTaxDeclarationStatusResponseDeclarationPaymentFeedBack; // 申报付款反馈信息
  declarationSerialNumber?: string; // 申报序列号
  declarationState: string; // 申报状态
  flowState?: string; // 流程状态
  id: number; // 标识ID
  iframeCode: any; // iframe代码
  infoMsg: any; // 信息消息
  isIgnored: any; // 是否忽略
  localSbxh?: string; // 本地申报序号
  operations: GetTaxDeclarationStatusResponseOperation[]; // 操作选项数组
  optional: boolean; // 是否可选
  optionalTag?: string; // 可选标签
  paidAmt: string; // 已支付金额
  paymentState: string; // 支付状态
  periodBegin: string; // 期间开始
  periodEnd: string; // 期间结束
  plannedDate: any; // 计划日期
  postDate: string; // 提交日期
  reduceAmount?: string; // 减少金额
  reportCode: any; // 报告代码
  reportRelation: any; // 报告关系
  serialNumber: number; // 序列号
  showOptionalTag?: string; // 显示可选标签
  showTips?: string; // 显示提示
  simpleDeclareInitFlag: boolean; // 简易申报初始化标志
  taskRetryCount: any; // 任务重试次数
  taskStatus: any; // 任务状态
  taxCode: string; // 税种代码
  taxCodeType: any; // 税种代码类型
  taxName: string; // 税种名称
  taxType: any; // 税种类型
  ycxxms: any; // 异常信息描述
  zsxmmc: any; // 税务项目名称
}

export interface GetTaxDeclarationStatusResponseOperation {
  routeUrl: any; // 路由URL
  operName: string; // 操作名称
  eventName: string; // 事件名称
  message: any; // 消息内容
}

export interface GetTaxDeclarationStatusResponseDeclarationPaymentFeedBack {
  feedbackResultList: GetTaxDeclarationStatusResponseFeedbackResultList[]; // 反馈结果列表
  needPay: boolean; // 需要支付
  messageTips: any; // 消息提示
  alertCompulsoryForNotYetToMust: any; // 未达到必须状态的强制警告
}

export interface GetTaxDeclarationStatusResponseFeedbackResultList {
  creditTax?: string; // 应纳税额
  declarationState: string; // 申报状态
  declarationTime: string; // 申报时间
  drawbackShowFlag: any; // 退税显示标志
  feedbackMsg: string; // 反馈信息
  paymentAmount: any; // 支付金额
  paymentStatus: any; // 支付状态
  paymentTime: any; // 支付时间
  ssdId: number; // 特定ID
  taxCode: string; // 税种代码
  taxName: string; // 税种名称
  unPaidAssert: boolean; // 未支付断言
  vatAdditionalfeedbackMsg: any; // 增值税附加反馈信息
}

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

export interface ListEmployeeItem {
  id: number;
  customerId: number;
  deptId: number;
  deptName: any;
  isManyDeptEmp: boolean;
  employeeNumber: string;
  name: string;
  chineseName?: string;
  licenseTypeCode: string;
  licenseTypeName: string;
  licenseNumber: string;
  nationalityCode: string;
  nationalityName: string;
  phone: string;
  employedDate: string;
  resignDate?: string;
  gender: string;
  birthday: string;
  nativeProvinceCode: any;
  nativeProvinceName: string;
  nativeCityCode: any;
  nativeCityName: string;
  nation: any;
  marriageState: any;
  politicStatus: any;
  jobType?: string;
  chargeType?: string;
  positionId: any;
  positionName: any;
  workingYears: any;
  probationState: any;
  probation?: string;
  regularDate: any;
  qq: any;
  email: string;
  emergencyContact: any;
  emergencyPhone: any;
  organizationId: any;
  organizationName: any;
  state: string;
  employmentType: string;
  firstEmploymentSituation: string;
  isDisabled: string;
  isMartyr: string;
  isBereavedGaffer: string;
  isDeductDeduction: string;
  censusKind: any;
  insureProvinceCode: any;
  insureProvinceName: any;
  insureCityCode: any;
  insureCityName: any;
  insurancePlanUuid: any;
  insurancePlanName: any;
  insurancePayState: any;
  insuranceIndividualNum: any;
  insuranceAccount: any;
  insuranceStartMonth: any;
  insuranceEndMonth: any;
  insuranceRepayMonths: any;
  providentFundPayState: any;
  providentFundStartMonth: any;
  providentFundEndMonth: any;
  providentFundRepayMonths: any;
  providentFundAccount: any;
  period: any;
  otherLicenseTypeCode: string;
  otherLicenseTypeName: any;
  otherLicenseNumber: string;
  submissionState: string;
  authenticationState: string;
  declarationResult: any;
  birthplaceCode?: string;
  birthplaceName: any;
  taxRelatedReason?: string;
  firstEntryDate?: string;
  estimatedDepartureDate?: string;
  depositBankCode: string;
  depositBankName: any;
  bankAccount: string;
  depositBankProvince: string;
  depositBankProvinceName: string;
  bankAccountState: string;
  bankAccountAuthResult: string;
  educationType: string;
  personInvestment?: number;
  personInvestmentRatio?: number;
  disableCardNumber: string;
  martyrCardNumber: string;
  postLevel: any;
  taxNo: string;
  registrationNumber: string;
  archiveNumber: string;
  mainArchiveNumber: any;
  otherArchiveNumbers: string;
  archiveResult: any;
  residentProvinceCode: string;
  residentProvinceName: string;
  residentCityCode: string;
  residentCityName: string;
  residentDistrictCode: string;
  residentDistrictName: string;
  residentStreet: string;
  residentAddress: string;
  censusProvinceCode: string;
  censusProvinceName: string;
  censusCityCode: string;
  censusCityName: string;
  censusDistrictCode: string;
  censusDistrictName: string;
  censusStreet: string;
  censusAddress: string;
  contactProvinceCode: string;
  contactProvinceName: string;
  contactCityCode: string;
  contactCityName: string;
  contactDistrictCode: string;
  contactDistrictName: string;
  contactStreet: string;
  contactAddress: string;
  remark: string;
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
  balance: any;
  billingMachineNumber: string;
  bizDate: string; // 开票日期 2023-01-12
  buyerName: string;
  buyerTaxpayerCode: string;
  cargoName: string;
  cargoPrice: number;
  complement: string; // 已补全
  completedErrorMsg: any;
  documentCode?: string; // 凭证号 202301-记-001
  documentId?: string;
  exitInvoice: string;
  hasCustomWithdrawal: any;
  hasOriginal: number;
  invalid: boolean; // 是否作废
  invoiceClass: string;
  invoiceCode: string;
  invoiceId: number;
  invoiceNumber: string;
  invoiceNumberEnd: any;
  lastPrintTime: any;
  lastPrintTimeStr: any;
  officialPdfUrl: any;
  packageInovice: string;
  receiptCode: any;
  receiptId: any;
  remark: string;
  riskDetailList: any;
  sourceCode: number;
  sourceName: string;
  suBalance: any;
  summaryInput: any;
  systemPdfUrl: any;
  taxItem: string;
  taxMode: string;
  taxPrice: number;
  taxRates: string;
  totalPrice: number;
  transferStatus: string;
  verifyStatus: string;
  withdrawal: string;
  yhssm: any;
  yhssmName: any;
  yhszm: any;
  yhszmName: any;
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

export interface InvoiceInputListResponseItem {
  customerId: string;
  taxPeriod: string;
  taxItem: string;
  invoiceId: number;
  invoiceClass: string;
  invoiceCode: string;
  invoiceNumber: string;
  bizDate: string;
  cargoName: string;
  cargoPrice: number;
  taxRates: string;
  taxPrice: number;
  validTaxPrice: number;
  totalPrice: number;
  deductiveMonth: string;
  deductiveStatus: string;
  certificationDate: string;
  certificationType: string;
  certificationTypeCode: string;
  hasfixasserts: string;
  withdrawal: string;
  suplierTax: string;
  suplierName: string;
  compared: string;
  completed: string;
  completedErrorMsg: any;
  documentCode: string;
  vehicleId: any;
  source: string;
  sourceName: string;
  acquisitionType: string;
  saleAddress: any;
  taxAuthorityCode: any;
  taxAuthorityName: any;
  invoiceStatus: string;
  remark: string;
  createDate: string;
  inCounselingPeriod: string;
  summaryInput: any;
  hasCustomWithdrawal: any;
  hasCustomFixedAsset: any;
  riskDetailList: any;
  documentId: number;
  checkMode: string;
  checkModeName: string;
  verifyStatus: string;
  yhssm: any;
  yhssmName: any;
  yhszm: any;
  yhszmName: any;
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

export interface FinanceAccDocsListItem {
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

export interface IitSingleReportQueryListResponse {
  showList: IitSingleReportQueryListResponseShowList[];
  totalIncome: IitSingleReportQueryListResponseTotalIncome;
}

export interface IitSingleReportQueryListResponseShowList {
  id: number;
  declarationId: number;
  customerId: number;
  deptName: any;
  deptId: number;
  employeeId: number;
  period: string;
  income: number;
  formula: any;
  incomeDetailId: any;
  domesticWorkingDays: number;
  abroadWorkingDays: number;
  calendarDays: number;
  domesticIncome: number;
  abroadIncome: number;
  incomeAmount: number;
  taxedPayCost: number;
  allPayCost: number;
  apportionMonths: number;
  onceReceipt: any;
  annuityReceiptTypeCode: any;
  annuityReceiptTypeName: any;
  annuityReceiptReasonCode: any;
  annuityReceiptReasonName: any;
  monthlyApportionedIncome: number;
  currentSalary: number;
  exemptIncome: number;
  monthDeduction: number;
  yearDeduction: number;
  exhibitionCost: number;
  endowmentInsurance: number;
  medicalInsurance: number;
  unemploymentInsurance: number;
  houseProvidentFund: number;
  specDeductionSum: number;
  childEducationExpenditure: number;
  seriousIllnessExpenditure: number;
  continueEducationExpenditure: number;
  houseRentExpenditure: number;
  houseLoanExpenditure: number;
  supportElderExpenditure: number;
  babyCareExpenditure: number;
  specAttachDeductionSum: number;
  annuity: number;
  commercialHealthInsurance: number;
  extensionEndowmentInsurance: number;
  other: number;
  remark?: string;
  deductionAmount: number;
  otherDeductionSum: number;
  taxableIncome: number;
  payableAmount: number;
  taxDeduction: number;
  paidAmount: number;
  withholdingAmount: number;
  taxRate: number;
  quickDeduction: number;
  incomeItemCode: string;
  incomeItemName: string;
  refundTax: number;
  accumulatedIncome: number;
  accumulatedExemptIncome: number;
  accumulatedMonthDeduction: number;
  accumulatedSpecDeduction: number;
  accumulatedSpecAttachDeduction: number;
  accumulatedOtherDeduction: number;
  accumulatedTaxDeduction: number;
  accumulatedDeductionAmount: number;
  accumulatedTaxableIncome: number;
  accumulatedPayableAmount: number;
  accumulatedWithholdingAmount: number;
  accumulatedChildEducation: number;
  accumulatedSeriousIllness: number;
  accumulatedContinueEducation: number;
  accumulatedHouseRent: number;
  accumulatedHouseLoan: number;
  accumulatedSupportElder: number;
  accumulatedBabyCare: number;
  accumulatedDeductibleDonation: number;
  accumulatedPaidAmount: number;
  pastDataType: any;
  deductibleDonation: number;
  salaryDeductionBalance: number;
  backupType: string;
  taxDeductible: number;
  incomePeriodStart: string;
  incomePeriodEnd: string;
  apportionYears: number;
  accumulatedPersonalPension: number;
  creatorId: any;
  modifierId: any;
  createDate: any;
  modifyDate: any;
  changeType: any;
  employeeNumber: string;
  name: string;
  licenseTypeCode: string;
  licenseTypeName: string;
  licenseNumber: string;
  employedDate: string;
  resignDate?: string;
  isManyDeptEmp: boolean;
}

export interface IitSingleReportQueryListResponseTotalIncome {
  id: any;
  declarationId: any;
  customerId: any;
  deptName: any;
  deptId: any;
  employeeId: any;
  period: any;
  income: number;
  formula: any;
  incomeDetailId: any;
  domesticWorkingDays: any;
  abroadWorkingDays: any;
  calendarDays: any;
  domesticIncome: any;
  abroadIncome: any;
  incomeAmount: any;
  taxedPayCost: number;
  allPayCost: number;
  apportionMonths: any;
  onceReceipt: any;
  annuityReceiptTypeCode: any;
  annuityReceiptTypeName: any;
  annuityReceiptReasonCode: any;
  annuityReceiptReasonName: any;
  monthlyApportionedIncome: any;
  currentSalary: number;
  exemptIncome: number;
  monthDeduction: any;
  yearDeduction: number;
  exhibitionCost: number;
  endowmentInsurance: number;
  medicalInsurance: number;
  unemploymentInsurance: number;
  houseProvidentFund: number;
  specDeductionSum: number;
  childEducationExpenditure: any;
  seriousIllnessExpenditure: any;
  continueEducationExpenditure: any;
  houseRentExpenditure: any;
  houseLoanExpenditure: any;
  supportElderExpenditure: any;
  babyCareExpenditure: any;
  specAttachDeductionSum: any;
  annuity: number;
  commercialHealthInsurance: number;
  extensionEndowmentInsurance: number;
  other: number;
  remark: any;
  deductionAmount: number;
  otherDeductionSum: number;
  taxableIncome: number;
  payableAmount: number;
  taxDeduction: number;
  paidAmount: number;
  withholdingAmount: number;
  taxRate: any;
  quickDeduction: any;
  incomeItemCode: any;
  incomeItemName: any;
  refundTax: number;
  accumulatedIncome: number;
  accumulatedExemptIncome: any;
  accumulatedMonthDeduction: any;
  accumulatedSpecDeduction: any;
  accumulatedSpecAttachDeduction: number;
  accumulatedOtherDeduction: any;
  accumulatedTaxDeduction: any;
  accumulatedDeductionAmount: any;
  accumulatedTaxableIncome: any;
  accumulatedPayableAmount: any;
  accumulatedWithholdingAmount: any;
  accumulatedChildEducation: number;
  accumulatedSeriousIllness: number;
  accumulatedContinueEducation: number;
  accumulatedHouseRent: number;
  accumulatedHouseLoan: number;
  accumulatedSupportElder: number;
  accumulatedBabyCare: number;
  accumulatedDeductibleDonation: any;
  accumulatedPaidAmount: any;
  pastDataType: any;
  deductibleDonation: number;
  salaryDeductionBalance: number;
  backupType: any;
  taxDeductible: any;
  incomePeriodStart: any;
  incomePeriodEnd: any;
  apportionYears: any;
  accumulatedPersonalPension: number;
  creatorId: any;
  modifierId: any;
  createDate: any;
  modifyDate: any;
  changeType: any;
  employee: number;
  total: any;
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

export interface PageResponse<T = any> {
  page: number;
  size: number;
  total: number;
  data: T[];
}

export interface CompanyRelationInfoListItem {
  qyid: string;
  qymc: string;
  nsrzgdm: string;
  cwlxr: string;
  cwlxfs: string;
  cjzt: string;
  cjztms?: string;
  tyzt: string;
  tyKjnd: any;
  tyKjqj: any;
  stopReason: any;
  updateTime: string;
  operator?: string;
  nsrsbh: string;
  provinceId: string;
  cityId: string;
  areaId: string;
  address?: string;
  zcrq?: string;
  khbm: string;
  dlfs?: string;
  sbzt: any;
  jdxxSbExists: boolean;
  sbztms: any;
  nsrzgzt?: string;
  bsrlx: any;
  bsr: any;
  bsrlxfs: any;
  companyTag: any;
  bazt: any;
  baztms: any;
  ztStartYear: number;
  ztStartMonth: number;
  bussinessScope?: string;
  taxProxyPersonName: string;
  gbhy?: string;
  xyjb: any;
  createTime: string;
  kjhszz: number;
  sfcfl: number;
  cklx: any;
  xyzt: any;
  xyztms: any;
  zjm: any;
  jjkc?: string;
  ncye: any;
  qmye: any;
  hbExist: string;
  gsDlfs?: string;
  gsBdsjh: string;
  gsSfzhm: any;
  loginStatus: string;
  verifyPhone: any;
  invoiceCollectSource?: number;
  digitAccStatus: number;
  digitAccRemark: any;
  taxDeclareStatus: number;
  taxDeclareRemark: any;
  verifyTime: string;
}

export interface ResultResponse<T> {
  code: string;
  message: string;
  cause?: any;
  result: T;
}

export interface CompanyInfoResponse {
  sysDzgsVO: CompanyInfoResponseSysDzgsVo;
  userInfoVO: CompanyInfoResponseUserInfoVo;
  refresh_token: string;
  access_token: string;
  kefu: string;
  sfcsfl: boolean;
  systemTime: string;
}

export interface CompanyInfoResponseSysDzgsVo {
  gsid: string;
  gsmc: string;
  gsjc: any;
  dqbm: string;
  zt: string;
  gslx: string;
  csflType: any;
  authModel: any;
  productType: string;
  buyerType: any;
  transferFlag: string;
  userType: string;
}

export interface CompanyInfoResponseUserInfoVo {
  flag: string;
  gsid: string;
  yhid: string;
  yhxm: string;
  yhdlm: string;
  loginSign: boolean;
  adminSign: boolean;
  csfl: boolean;
  userType: number;
  isTyzh: any;
  userLevel: number;
  currentDeptId: string;
  phone: string;
}

export interface GetQyStatusResponse {
  qyId: string;
  kjnd: number;
  kjqj: number;
  flagZeroDeclare: boolean;
  fetchStatus: number;
  fetchRemark: string;
  fetchUserId: string;
  fetchTime: string;
  declareStatus: number;
  declareUserId: string;
  declareTime: string;
  declareRemark: string;
  confirmStatus: number;
  confirmRemark: string;
  confirmUserId: string;
  confirmTime: any;
  paymentStatus: number;
  paymentUserId: string;
  paymentTime: any;
  paymentRemark: string;
  checkStatus: number;
  checkUserId: string;
  checkTime: string;
  checkRemark: string;
  copyStatus: number;
  copyUserId: any;
  copyTaskId: any;
  copyTaskStatus: any;
  copyRemark: any;
  copyTime: any;
  clearStatus: number;
  clearUserId: any;
  clearTaskId: any;
  clearTaskStatus: any;
  clearRemark: any;
  clearTime: any;
  lastAutoCheckStatus: number;
  lastAutoCheckTaskStatus: string;
  checkType: number;
}

export interface GetReceiptImagesResponseItem {
  qyId: string;
  taskId: string;
  gsId: string;
  kjnd: number;
  kjqj: number;
  reportId: string;
  userId: string;
  areaCode: string;
  type: number;
  subType: number;
  statusCode: number;
  taskStatus: string;
  imageType: string;
  image: string;
  resultType: any;
  generateTime: string;
  remark: string;
  expire: any;
}

export interface QueryReportAndConfigResponse {
  id: string;
  qyId: string;
  kjnd: number;
  kjqj: number;
  sbszId: string;
  reportName: string;
  szId: number;
  nsqxdm: string;
  gdsbz: number;
  areaCode: string;
  flagDeclare: number;
  needDeclare: number;
  fetchStatusCode: number;
  fetchRemark: string;
  confirmStatusCode: number;
  confirmUserId: any;
  declareStatusCode: number;
  declareTaskId: string;
  declareTaskStatus: string;
  declareRemark: string;
  declareShortDesc: string;
  paymentMoney: number;
  paymentLastMoney: any;
  paymentBankAccount: string;
  paymentStatusCode: number;
  paymentTaskStatus: any;
  paymentRemark: any;
  undoStatusCode: number;
  undoTaskStatus: any;
  undoRemark: any;
  configUndoRemark: string;
  certificateStatusCode: number;
  certificateTaskStatus: any;
  certificateRemark: any;
  transferFlag: number;
  dzBtid: string;
  boxId: string;
  groupId: string;
  declareTime: string;
  paymentTime: any;
  fetchTime: string;
  flagInit: number;
  flagNeedInit: number;
  flagPayment: number;
  flagUndo: number;
  flagCrossPeriod: number;
  undoStart: number;
  undoEnd: number;
  fetchLimitDeclared: boolean;
  fetchOverData: boolean;
  fetchLimit: any;
  fetchLimitRemark: any;
  declareLimit: any;
  declareLimitRemark: any;
  paymentLimit: any;
  paymentLimitRemark: any;
  createUserId: any;
  updateUserId: any;
  createTime: any;
  updateTime: any;
  enabled: any;
  isXwlqy: boolean;
  unlockOperType: any;
  areaName: any;
  gsId: any;
  gsName: any;
  taxType: any;
  taskType: any;
  taskTypeName: any;
  subType: any;
  errorType: any;
  errorTypeName: any;
  lockReason: any;
  lockTime: any;
  lockPwd: any;
  reportId: string;
  qyIdReportIds: any;
  isHavelock: boolean;
  fetchAfterCheck: boolean;
  taxDetailDTOS: TaxDetailDtos[];
  lossStatusCode: any;
  loss: any;
  lossTaskStatus: any;
  lossRemark: any;
  isInfoSuppl: any;
  bureauTag: any;
}

export interface TaxDetailDtos {
  formulaName: string;
  formulaValue: string;
}

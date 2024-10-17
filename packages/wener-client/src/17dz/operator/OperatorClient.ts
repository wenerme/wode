import type { FetchLike, MaybePromise } from '@wener/utils';
import dayjs from 'dayjs';
import { decrypt } from '../crypto';
import { requestFromSession, type SessionRequestOptions } from './requestFromSession';
import type {
  _InvoiceInputListResponseItem,
  ChangeGroupResponse,
  CustomerProgressQueryResponse,
  FinanceAccountSetResponse,
  FinanceCheckFinanceAuthResponse,
  FinanceGetAccountSetInfoResponse,
  FinanceQueryCustomerResponseItem,
  GetCustomerResponse,
  GetGroupResponse,
  GetIitCustomerSettingResponse,
  GetIitSingleCustomerResponse,
  GetIrcAccountInfoResponse,
  GetLoginSessionResponse,
  GetMemberListResponseItem,
  GetSocinsCustomerByIdResponse,
  GetTaxDeclarationStatusResponse,
  InputInvoiceListResponseItem,
  InvoiceInputDetailResponse,
  InvoiceInputGeneralQueryResponseItem,
  InvoiceInputStatistics,
  InvoiceOutputDetailResponse,
  InvoiceOutputListResponseItem,
  InvoiceOutputStatisticsResponse,
  ListCustomerEmployeeItem,
  ListFinanceAccDocItem,
  ListPersonalIncomeTaxReportResponse,
  ListResponse,
  ManageListCustomerItem,
  PageQueryCollectResult,
  XyqPortalWebManageUserQueryResponse,
} from './types';

// pageNo > 重量可能出现网络错误的提示

export class OperatorClient {
  readonly options: OperatorClientOptions;

  constructor(o: Partial<OperatorClientOptions>) {
    this.options = {
      fetch: globalThis.fetch,
      cookie: () => undefined,
      ...o,
    };
  }

  with(o: Partial<OperatorClientOptions>) {
    return new OperatorClient({ ...this.options, ...o });
  }

  cookie(): MaybePromise<string | undefined> {
    return this.options.cookie();
  }

  async getCustomer(params: { customerId: string }) {
    return this.request<GetCustomerResponse>({
      url: 'https://17dz.com/xqy-portal-web/manage/v2/customer/getCustomer',
      params,
    });
  }

  async getCustomerProgressQuery(params: {
    accountId?: string;
    key?: string;
    pageNo?: number;
    pageSize?: number;
    period: string;
    taxType?: string;
  }) {
    return this.request<CustomerProgressQueryResponse>({
      url: 'https://www.17dz.com/xmanage/manage/customer/progress/query',
      body: {
        pageNo: 1,
        pageSize: 100,
        ...params,
      },
    });
  }

  /**
   * 部门成员
   */
  async listMember(params: {
    admin?: string;
    available?: boolean; // true 为在职员工
    key?: number;
    nameInitial?: number;
  }) {
    return this.request<GetMemberListResponseItem[]>({
      url: 'https://www.17dz.com/xmanage/manage/team/members/getMemberList',
      body: {
        admin: '',
        available: '',
        key: '',
        nameInitial: '',
        ...params,
      },
    }).then((v) => {
      for (const vv of v) {
        vv.mobile = decrypt(vv.mobile);
      }

      return v;
    });
  }

  /**
   * 社保信息+税务
   */
  async getSocinsCustomerById(params: { customerId: string }) {
    return this.request<GetSocinsCustomerByIdResponse>({
      url: 'https://17dz.com/socinsweb/imposition/customerInfo/getByCustomerId',
      params,
    }).then((v) => {
      v.socinsPassword = decrypt(v.socinsPassword);
      return v;
    });
  }

  /**
   * 网报账号
   */
  async getIrcTaxAccountInfo(params: {
    companyId: string; // 同 customerId
    taxAccountType?: number; // 105,107,305 - 企业登录 CA登录 证书登录
    bizType?: number; // 4
    bizCode?: string; // dz-taxSetting
  }) {
    return this.request<string>({
      url: 'https://irc.17win.com/irc/tax/getAccountInfo',
      params: {
        taxAccountType: 105,
        bizType: 4,
        bizCode: 'dz-taxSetting',
        ...params,
      },
    }).then((v) => JSON.parse(decrypt(v)) as GetIrcAccountInfoResponse);
  }

  /**
   * 个税申报设置
   */
  async getIitCustomerSetting(params: { customerId: string }) {
    return this.request<GetIitCustomerSettingResponse>({
      url: 'https://17dz.com/iitweb/iitweb/yqdz/customer/getCustomerSetting',
      params,
      transform({ data }) {
        data.keyPassword = decrypt(data.keyPassword);
        data.realNamePassword = decrypt(data.realNamePassword);
        return data;
      },
    });
  }

  // 常用所得 正常工资薪金 declarationType 1 reportType 0101
  async listPersonalIncomeTaxReport(params: {
    customerId: string | number;
    period: string;
    declarationType?: string | number;
    declarationTypeCode?: string | number;
    pageNum?: string | number;
    pageSize?: string | number;
    [k: string]: any;
    // sortColumn=&sortMode=&declarationTypeCode=1
  }) {
    return this.request<ListPersonalIncomeTaxReportResponse>({
      url: 'https://www.17dz.com/iitweb/iit/v2/single/report/zhsds/queryList',
      params: {
        deptId: '0',
        reportType: '0101',
        incomeItemCode: '0101',
        declarationType: 1,
        declarationTypeCode: 1,
        key: '',
        sortColumn: '',
        sortMode: '',
        pageNum: 1,
        pageSize: 100,
        ...params,
      },
    });
  }

  async getIitSingleCustomer({ deptId = 0, ...params }: { customerId: string; deptId?: string | number }) {
    return this.request<GetIitSingleCustomerResponse>({
      url: 'https://17dz.com/iitweb/iit/v2/single/singleCustomer/getCustomer',
      params: {
        deptId,
        ...params,
      },
      transform({ data }) {
        data.keyPassword = decrypt(data.keyPassword);
        data.oldPassward = decrypt(data.oldPassward);
        data.realNamePassword = decrypt(data.realNamePassword);
        return data;
      },
    });
  }

  async listCustomer(params: {
    key?: string;
    newStatusList?: string[];
    pageNo?: number;
    pageSize?: number;
    fromCreateDate?: string;
    toCreateDate?: string;
  }) {
    return this.request<{ list: ManageListCustomerItem[]; total: number }>({
      url: 'https://17dz.com/xqy-portal-web/manage/v2/customer/queryCustomers',
      body: {
        // fromCreateDate:"2022-12-21"
        // toCreateDate:"2022-12-21"
        // 搜索 - 可以是税号
        key: '',
        // 5/服务中 2/暂停服务 3/已流失 4/未建账
        newStatusList: ['2', '3', '4', '5'],
        pageNo: 1,
        pageSize: 1000,
        ...params,
      },
    });
  }

  /**
   * 财务/客户列表
   *
   * - 包含 accountSetId
   */
  async listFinanceCustomer(params: {
    period?: string;
    includeSubordinate?: boolean;
    pageNo?: number;
    pageSize?: number;
    relationshipType?: string;
    accountStatuses?: string[]; // 记账状态 0 未建帐，3 未开始，4 进行中，2 已结账，-1 无需记账
    arrangeStates?: string[]; // 理票状态 0 未整理，1 整理中，2 已完成
    checkStates?: string[]; // 审账进度 4 未提交 1 待审账 2 审账通过 3 审账不通过
  }) {
    return this.request<ListResponse<FinanceQueryCustomerResponseItem>>({
      url: 'https://17dz.com/xmanage-finance/manage/v2/finance/queryCustomer',
      body: {
        pageNo: 1,
        pageSize: 1000,
        period: dayjs().subtract(1, 'm').format('YYYYMM'),
        relationshipType: 'JOURNAL',
        includeSubordinate: true,
        key: '',
        ...params,
      },
    });
  }

  /**
   * 查凭证
   */
  async listFinanceAccDoc(params: {
    beginPeriod: string; // begin 和 end 相同
    endPeriod: string;
    titleCode?: string;
    beginNumber?: string;
    endNumber?: string;
    beginMoney?: string;
    endMoney?: string;
    summary?: string;
    pageSize?: number;
    pageNo?: number;
    type?: string;
    [k: string]: any;
  }) {
    return this.request<{ totalCount: number; docDtoList: ListFinanceAccDocItem[] }>({
      url: 'https://17dz.com/xqy-portal-web/finance/accDocs/list',
      body: {
        pageNo: 0,
        pageSize: 1000,
        ...params,
      },
    });
  }

  /**
   * 获取帐套信息
   */
  async getSessionFinanceAccountSet(params: { token: string }) {
    // 88880003 从Session获取客户账套信息失败！
    // CW000032 账套令牌已过期，请重新进入账套！
    return this.request<FinanceAccountSetResponse>({
      url: 'https://17dz.com/xqy-portal-web/finance/account/session/accountSet',
      headers: {
        Accountsettoken: params.token,
      },
      transform({ data }) {
        data.iv = decrypt(data.iv);
        data.key = decrypt(data.key);
        return data;
      },
    });
  }

  /**
   * 设置帐套信息
   */
  async setSessionFinanceAccountSet(params: {
    accountSetId: string | number;
    customerId: string | number;
    customerName?: string;
    customerShortName?: string;
    platform?: string;
  }) {
    const data = new URLSearchParams();
    for (const [key, value] of Object.entries({ platform: 'yqdz', ...params })) {
      data.append(key, String(value));
    }

    return this.request<FinanceAccountSetResponse>({
      method: 'PUT',
      url: 'https://17dz.com/xqy-portal-web/finance/account/session/accountSet',
      body: data,
      transform({ data }) {
        data.iv = decrypt(data.iv);
        data.key = decrypt(data.key);
        return data;
      },
    });
  }

  async financeCheckFinanceAuth(params: string[]) {
    return this.request<FinanceCheckFinanceAuthResponse>({
      url: 'https://17dz.com/xmanage-finance/manage/v2/bill/checkFinanceAuth',
      body: params,
    });
  }

  async getFinanceAccountSetInfo(params: { customerId: string; period?: string }) {
    return this.request<FinanceGetAccountSetInfoResponse>({
      url: 'https://17dz.com/xmanage-finance/manage/v2/finance/getAccountSetInfo',
      params: {
        period: dayjs().subtract(1, 'M').format('YYYYMM'),
        ...params,
      },
    });
  }

  async whoami() {
    return this.request<XyqPortalWebManageUserQueryResponse>({
      url: 'https://17dz.com/xqy-portal-web/manage/user/query',
    });
  }

  async getLoginSession() {
    return this.request<GetLoginSessionResponse>({
      url: 'https://17dz.com/xqy-portal-web/activity/activity/login/getLoginSession',
    });
  }

  async listCustomerEmployee({
    customerId,
    pageNumber = 1,
    deptId = 0,
    ...body
  }: {
    pageNumber?: number;
    pageSize?: number;
    period: string; // '202211';
    nameLike?: string;
    organizationId?: string;
    positionId?: string;
    jobType?: string; // 工作性质 0 全职 1 兼职 3 实习 4 劳务 5 劳务派遣 6 退休返聘 7 合同工
    chargeType?: string;
    employedDateStart?: string;
    employedDateEnd?: string;
    resignDateStart?: string;
    resignDateEnd?: string;
    state?: string; // 0 在职 1 离职
    employmentTypes?: string; // 任职受雇从业类型 10 雇员 21 保险营销员 22 证券经纪人 23 实习学生（全日制学历教育） 29 其他
    area?: string; // 0 境内 1 境外
    submissionState?: string;
    authenticationState?: string; //  身份验证状态 0 暂不验证 1 验证通过 2 验证不通过 3 验证中 4 待验证
    bankAccountState?: string; // 银行卡状态 0 验证中 1 验证通过 2 验证不通过 9 待验证 - 实际场景不怎么用，都是 9
    filterDuplicatePhone?: boolean;
    orderBy?: string;
    viewCode?: string;
    customerId?: number | string;
    deptId?: number;
    isDisabled?: number | string; // 残疾
    isMartyr?: number | string; // 烈属
    isBereavedGaffer?: number | string; // 孤老
  }) {
    // 201 居民身份证 208 外国护照 210 港澳居民来往内地通行证 213 台湾居民来往大陆通行证 227 中国护照
    return this.request<ListResponse<ListCustomerEmployeeItem>>({
      url: 'https://17dz.com/employeeweb/v2/employee/pageEmployee',
      params: { customerId },
      body: {
        pageNum: pageNumber,
        pageNo: pageNumber,
        pageNumber,
        pageSize: 1000, // Web 上只能 25，实际使用 100 也没问题
        // period: '202211',
        // nameLike: '',
        // organizationId: '',
        // positionId: '',
        // jobType: '',
        // chargeType: '',
        // employedDateStart: '',
        // employedDateEnd: '',
        // resignDateStart: '',
        // resignDateEnd: '',
        // state: '',
        // employmentTypes: '',
        // area: '',
        // submissionState: '',
        // authenticationState: '',
        // bankAccountState: '',
        // filterDuplicatePhone: false,
        // orderBy: '',
        viewCode: '1',
        customerId,
        deptId,
        ...body,
      },
      headers: {
        // appId: '08580100010000',
        customerId,
        deptId,
      },
    }).then((v) => {
      for (const a of ['licenseNumber', 'taxNo', 'phone', 'otherLicenseNumber', 'name'] as const) {
        for (const b of v.list) {
          (b as any)[a] = decrypt(b[a]);
        }
      }

      return v;
    });
  }

  async invoiceInputStatistics(params: {
    beginDate: string; // 2023-04-01
    endDate: string;
    customerId: string | number; // 561000000000
    [k: string]: any;
  }) {
    return this.request<InvoiceInputStatistics>({
      url: 'https://17dz.com/invoiceweb/invoice/input/statistics',
      body: {
        ...params,
      },
    });
  }

  async _listInputInvoice(params: {
    beginDate: string; // 2023-04-01
    endDate: string;
    customerId: string | number;
    page?: number;
    pageSize?: number;
    [k: string]: any;
  }) {
    return this.request<_InvoiceInputListResponseItem[]>({
      url: 'https://17dz.com/invoiceweb/invoice/input/list',
      body: {
        page: 1,
        pageSize: 1000,
        ...params,
      },
    });
  }

  async listInputInvoice(params: {
    billingDateRange: { start: string; end: string };
    invoiceClass?: string[];
    sortName?: string;
    sortOrder?: string;
    customerId: number | string;
    page?: number;
    pageSize?: number;
    [k: string]: any;
  }) {
    return this.request<InputInvoiceListResponseItem[]>({
      url: 'https://www.17dz.com/invoiceweb/invoice/input/query/getInputPageList',
      body: {
        page: 1,
        pageSize: 1000,
        sortName: 'biz_Date',
        sortOrder: 'descend',
        invoiceClass: [
          '0',
          '1',
          '10',
          '11',
          '12',
          '13',
          '14',
          '15',
          '16',
          '17',
          '2',
          '25',
          '26',
          '31',
          '32',
          '33',
          '6',
          '7',
          '8',
          '9',
        ],
        ...params,
      },
    });
  }

  async invoiceInputDetail(params: { customerId: string | number; invoiceId: string | number; [k: string]: any }) {
    return this.request<InvoiceInputDetailResponse>({
      url: 'https://17dz.com/invoiceweb/invoice/input/general/detail',
      params: {
        ...params,
      },
    });
  }

  async invoiceOutputStatistics(params: {
    beginDate: string; // 2023-04-01
    endDate: string;
    customerId: string | number; // 561000000000
    [k: string]: any;
  }) {
    return this.request<InvoiceOutputStatisticsResponse>({
      url: 'https://17dz.com/invoiceweb/invoice/output/statistics',
      body: {
        ...params,
      },
    });
  }

  async listOutputInvoice(params: {
    beginDate: string; // 2023-04-01
    endDate: string;
    customerId: string | number;
    page?: number;
    pageSize?: number;
    invoiceClasses?: string[];
    [k: string]: any;
  }) {
    return this.request<InvoiceOutputListResponseItem[]>({
      url: 'https://17dz.com/invoiceweb/invoice/output/list',
      body: {
        page: 1,
        pageSize: 1000,
        withComplement: '1',
        // sortName: 'biz_date',
        // sortOrder: null,
        ...params,
      },
    });
  }

  async getInvoiceOutputDetail(params: { customerId: string | number; id: string | number; [k: string]: any }) {
    return this.request<InvoiceOutputDetailResponse>({
      url: 'https://17dz.com/invoiceweb/invoice/output/general/detail',
      params: {
        ...params,
      },
    });
  }

  async invoicewebCollectPageQueryCollectResult(params: {
    customerId: string | number;
    pageSize?: number;
    currentPage?: number;
  }) {
    return this.request<PageQueryCollectResult>({
      url: 'https://17dz.com/invoiceweb/invoice/collect/pageQueryCollectResult',
      body: {
        pageSize: 100,
        currentPage: 1,
        ...params,
      },
    });
  }

  async invoicewebInvoiceCollectAcquireV4(params: {
    customerId: string | number;
    accountId: string;
    nsrsbh: string;
    areaCode: string;
    companyId: string | number;
    collectTaskTypeRequestList: Array<Record<string, any>>;
    [k: string]: any;
  }) {
    return this.request<{ success: boolean; errorContext: any }>({
      url: 'https://17dz.com/invoiceweb/invoice/collect/acquire/v4',
      body: {
        // nsrsbh: '913101165867881482',
        addedType: '1',
        channel: 'invoiceweb',
        // areaCode: '310100',
        platform: 'DZ',
        checkLoginForPlatformCollect: true,
        collectButtonType: 'collectAll',
        // collectTaskTypeRequestList: [
        //   {
        //     collectTaskType: 'inputGeneral',
        //     invoiceType: '0',
        //     collectMonth: '202204;202303',
        //   },
        // ],
        ...params,
      },
    });
  }

  async invoicewebInvoiceCollectAcquireV3(params: {
    customerId: string | number;
    accountId: string;
    areaCode: string;
    companyId: string | number;
    startDate?: string; // 202302
    endDate?: string;
    period?: string;
    // inputGeneral_0 普通发票 type=0 startDate，endDate
    // oneKey_1 需要 period - type=1 销项
    // oneKey_0 需要 period - type=0 进项
    collectTaskType: 'inputGeneral_0' | 'oneKey_1' | 'oneKey_0' | string;
    invoiceType: '0' | '1' | string;
    [k: string]: any;
  }) {
    // 请在提取成功后，点开单张发票详情，补充校验码（后六位），以进行发票查验补全，判断抵扣状态
    return this.request<{ success: boolean; errorContext: any }>({
      url: 'https://17dz.com/invoiceweb/invoice/collect/acquire/v3',
      body: {
        addedType: '2',
        // period: '202304',
        // invoiceType: '0',
        channel: 'invoiceweb',
        platform: 'DZ',
        // startDate: '202302',
        // endDate: '202304',
        ...params,
      },
    });
  }

  async listGeneralInputInvoice(params: {
    companyId: string | number; // customerId
    bizBeginDate: string; // 2023-01-01
    bizEndDate: string;
    pageNumber?: number;
    pageSize?: number;
  }) {
    return this.request<InvoiceInputGeneralQueryResponseItem[]>({
      url: 'https://17dz.com/invoiceweb/invoice/input/general/query',
      body: {
        pageSize: 1000,
        pageNumber: 1,
        ...params,
      },
    });
  }

  /**
   * 组织列表
   */
  listGroup() {
    return this.request<
      Array<{
        id: string;
        name: string;
      }>
    >({
      url: 'https://www.17dz.com/xactivity/activity/group/getGroupList',
    });
  }

  getTaxDeclarationStatus(params: {
    customerId: string;
    period: string;
    source?: string;
    areaCode: string;
    taxNo?: string;
  }) {
    return this.request<GetTaxDeclarationStatusResponse>({
      url: 'https://www.17dz.com/xqy-tax/tax/declaration/state/query',
      params,
    });
  }

  changeGroup(params: { groupId: string }) {
    return this.request<ChangeGroupResponse>({
      method: 'POST',
      url: 'https://www.17dz.com/xactivity/activity/group/changeGroup',
      params,
    });
  }

  getGroup() {
    return this.request<GetGroupResponse>({
      url: 'https://www.17dz.com/xactivity/activity/group/getGroup',
    });
  }

  async request<T>(opts: SessionRequestOptions<T>): Promise<T> {
    return requestFromSession<T>({ ...this.options, ...opts });
  }
}

export interface OperatorClientOptions extends Omit<SessionRequestOptions<any>, 'cookie' | 'fetch' | 'url'> {
  fetch: FetchLike;
  cookie: () => MaybePromise<string | undefined>;
}

// 大多都是 0,1,31,32

const InvoiceTypes = [
  { label: '增值税专票', value: '' },
  {
    label: '增值税电子专票',
    value: '',
  },
  { label: '机动车发票', value: '' },
  { label: '海关专用缴款书', value: '' },
  {
    label: '农产品收购发票',
    value: '',
  },
  { label: '农产品销售发票', value: '' },
  {
    label: '代扣代缴完税凭证',
    value: '',
  },
  { label: '通行费电子发票', value: '' },
  { label: '二手车发票', value: '' },
  {
    label: '数电票（专票）',
    value: '',
  },
  { label: '数电票（普票）', value: '' },
  { label: '桥闸通行费发票', value: '' },
  {
    label: '购进不动产发票',
    value: '',
  },
  { label: '旅客运输服务发票', value: '' },
  { label: '机动车发票', value: '' },
  {
    label: '海关专用缴款书',
    value: '',
  },
  { label: '农产品收购发票', value: '' },
  {
    label: '农产品销售发票',
    value: '',
  },
  { label: '代扣代缴完税凭证', value: '' },
  { label: '通行费电子发票', value: '' },
  {
    label: '二手车发票',
    value: '',
  },
  { label: '数电票（专票）', value: '' },
  { label: '数电票（普票）', value: '' },
];

const OutputInvoiceClassOptions = [
  { label: '增值税专票', value: '0' },
  { label: '增值税电子专票', value: '26' },
  {
    label: '机动车发票',
    value: '1',
  },
  { label: '海关专用缴款书', value: '2' },
  { label: '农产品收购发票', value: '3' },
  {
    label: '农产品销售发票',
    value: '4',
  },
  { label: '代扣代缴完税凭证', value: '5' },
  { label: '通行费电子发票', value: '7' },
  {
    label: '二手车发票',
    value: '10',
  },
  { label: '数电票（专票）', value: '31' },
  { label: '数电票（普票）', value: '32' },
  { label: '桥闸通行费发票', value: '21' },
  {
    label: '购进不动产发票',
    value: '22',
  },
  { label: '旅客运输服务发票', value: '23' },
  {
    label: '机动车发票',
    value: '1',
  },
  { label: '海关专用缴款书', value: '2' },
  { label: '农产品收购发票', value: '3' },
  {
    label: '农产品销售发票',
    value: '4',
  },
  { label: '代扣代缴完税凭证', value: '5' },
  { label: '通行费电子发票', value: '7' },
  {
    label: '二手车发票',
    value: '10',
  },
  { label: '数电票（专票）', value: '31' },
  { label: '数电票（普票）', value: '32' },
  { value: '8', text: '电子普票', abbr: '电普' },
  {
    value: '32',
    text: '数电票（普票）',
    abbr: '数电普',
  },
  { value: '26', text: '电子专票', abbr: '电专' },
  {
    value: '31',
    text: '数电票（专票）',
    abbr: '数电专',
  },
  { value: '7', text: '通行费发票', abbr: '通行费' },
  {
    value: '25',
    text: '区块链发票',
    abbr: '区块链',
  },
  { value: '6', text: '普票', abbr: '普票' },
  { value: '0', text: '专票', abbr: '专票' },
  {
    value: '1',
    text: '机动车发票',
    abbr: '机动车',
  },
  { value: '9', text: '卷票', abbr: '卷票' },
  { value: '11', text: '定额发票', abbr: '定额' },
  {
    value: '12',
    text: '机打发票',
    abbr: '机打',
  },
  { value: '17', text: '过路费', abbr: '过路费' },
  {
    value: '13',
    text: '出租车票',
    abbr: '出租车',
  },
  { value: '14', text: '火车票', abbr: '火车票' },
  {
    value: '15',
    text: '客运汽车/船票',
    abbr: '客运票',
  },
  { value: '16', text: '飞机行程单', abbr: '飞机票' },
  {
    value: '27',
    text: '完税凭证',
    abbr: '完税',
  },
  { value: '10', text: '二手车发票', abbr: '二手车' },
  {
    value: '33',
    text: '财政票据',
    abbr: '财政',
  },
  { value: '20', text: '其他', abbr: '其他' },
];

import { type MaybePromise } from '@wener/utils';
import dayjs from 'dayjs';
import { decrypt } from '../crypto';
import { requestFromSession, SessionRequestOptions } from './requestFromSession';
import type {
  FinanceAccDocsListItem,
  FinanceAccountSetResponse,
  FinanceCheckFinanceAuthResponse,
  FinanceGetAccountSetInfoResponse,
  FinanceQueryCustomerResponseItem,
  GetCustomerResponse,
  GetIitCustomerSettingResponse,
  GetIitSingleCustomerResponse,
  GetIrcAccountInfoResponse,
  GetLoginSessionResponse,
  GetSocinsCustomerByIdResponse,
  InvoiceInputDetailResponse,
  InvoiceInputGeneralQueryResponseItem,
  InvoiceInputListResponseItem,
  InvoiceInputStatistics,
  InvoiceOutputDetailResponse,
  InvoiceOutputListResponseItem,
  InvoiceOutputStatisticsResponse,
  ListEmployeeItem,
  ListResponse,
  ManageListCustomerItem,
  PageQueryCollectResult,
  XyqPortalWebManageUserQueryResponse,
  IitSingleReportQueryListResponse,
} from './types';

export class OperatorClient {
  readonly options: OperatorClientOptions;

  constructor(o: Partial<OperatorClientOptions>) {
    this.options = {
      fetch: globalThis.fetch,
      cookie: () => undefined,
      ...o,
    };
  }

  cookie(): MaybePromise<string | undefined> {
    return this.options.cookie();
  }

  getCustomer(params: { customerId: string }) {
    return this.request<GetCustomerResponse>({
      url: `https://17dz.com/xqy-portal-web/manage/v2/customer/getCustomer`,
      params,
    });
  }

  /**
   * 社保信息+税务
   */
  getSocinsCustomerById(params: { customerId: string }) {
    return this.request<GetSocinsCustomerByIdResponse>({
      url: `https://17dz.com/socinsweb/imposition/customerInfo/getByCustomerId`,
      params,
    }).then((v) => {
      v.socinsPassword = decrypt(v.socinsPassword);
      return v;
    });
  }

  /**
   * 网报账号
   */
  getIrcTaxAccountInfo(params: {
    companyId: string; // 同 customerId
    taxAccountType?: number; // 105,107,305 - 企业登录 CA登录 证书登录
    bizType?: number; // 4
    bizCode?: string; // dz-taxSetting
  }) {
    return this.request<string>({
      url: `https://irc.17win.com/irc/tax/getAccountInfo`,
      params: {
        taxAccountType: 105,
        bizType: 4,
        bizCode: 'dz-taxSetting',
        ...params,
      },
    }).then((v) => {
      return JSON.parse(decrypt(v)) as GetIrcAccountInfoResponse;
    });
  }

  /**
   * 个税申报设置
   */
  getIitCustomerSetting(params: { customerId: string }) {
    return this.request<GetIitCustomerSettingResponse>({
      url: `https://17dz.com/iitweb/iitweb/yqdz/customer/getCustomerSetting`,
      params,
      transform: ({ data }) => {
        data.keyPassword = decrypt(data.keyPassword);
        data.realNamePassword = decrypt(data.realNamePassword);
        return data;
      },
    });
  }

  // 常用所得 正常工资薪金 declarationType 1 reportType 0101
  iitSingleReportQueryList(params: {
    customerId: string | number;
    period: string;
    declarationType?: string | number;
    declarationTypeCode?: string | number;
    pageNum?: string | number;
    pageSize?: string | number;
    [k: string]: any;
    // sortColumn=&sortMode=&declarationTypeCode=1
  }) {
    return this.request<IitSingleReportQueryListResponse>({
      url: `https://17dz.com/iitweb/iit/v2/single/report/zhsds/queryList`,
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
        pageSize: 1000,
        ...params,
      },
    });
  }

  getIitSingleCustomer({ deptId = 0, ...params }: { customerId: string; deptId?: string | number }) {
    return this.request<GetIitSingleCustomerResponse>({
      url: `https://17dz.com/iitweb/iit/v2/single/singleCustomer/getCustomer`,
      params: {
        deptId,
        ...params,
      },
      transform: ({ data }) => {
        data.keyPassword = decrypt(data.keyPassword);
        data.oldPassward = decrypt(data.oldPassward);
        data.realNamePassword = decrypt(data.realNamePassword);
        return data;
      },
    });
  }

  listCustomer(params: {
    key?: string;
    newStatusList?: string[];
    pageNo?: number;
    pageSize?: number;
    fromCreateDate?: string;
    toCreateDate?: string;
  }) {
    return this.request<{ list: ManageListCustomerItem[]; total: number }>({
      url: `https://17dz.com/xqy-portal-web/manage/v2/customer/queryCustomers`,
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
   * 包含 accountSetId
   */
  financeQueryCustomer(params: {
    period?: string;
    includeSubordinate?: boolean;
    pageNo?: number;
    pageSize?: number;
    relationshipType?: string;
  }) {
    return this.request<ListResponse<FinanceQueryCustomerResponseItem>>({
      url: `https://17dz.com/xmanage-finance/manage/v2/finance/queryCustomer`,
      body: {
        pageNo: 1,
        pageSize: 1000,
        period: dayjs().subtract(1, 'm').format('YYYYMM'),
        relationshipType: 'JOURNAL',
        includeSubordinate: true,
        ...params,
      },
    });
  }

  /**
   * 查凭证
   */
  financeAccDocsList(params: {
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
    return this.request<{ totalCount: number; docDtoList: FinanceAccDocsListItem[] }>({
      url: `https://17dz.com/xqy-portal-web/finance/accDocs/list`,
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
  financeGetAccountSet(params: { token: string }) {
    // 88880003 从Session获取客户账套信息失败！
    // CW000032 账套令牌已过期，请重新进入账套！
    return this.request<FinanceAccountSetResponse>({
      url: `https://17dz.com/xqy-portal-web/finance/account/session/accountSet`,
      headers: {
        Accountsettoken: params.token,
      },
      transform: ({ data }) => {
        data.iv = decrypt(data.iv);
        data.key = decrypt(data.key);
        return data;
      },
    });
  }

  /**
   * 设置帐套信息
   */
  financePutAccountSet(params: {
    accountSetId: string | number;
    customerId: string | number;
    customerName?: string;
    customerShortName?: string;
    platform?: string;
  }) {
    const data = new URLSearchParams();
    Object.entries({ platform: 'yqdz', ...params }).forEach(([key, value]) => {
      data.append(key, String(value));
    });
    return this.request<FinanceAccountSetResponse>({
      method: 'PUT',
      url: `https://17dz.com/xqy-portal-web/finance/account/session/accountSet`,
      body: data,
      transform: ({ data }) => {
        data.iv = decrypt(data.iv);
        data.key = decrypt(data.key);
        return data;
      },
    });
  }

  financeCheckFinanceAuth(params: string[]) {
    return this.request<FinanceCheckFinanceAuthResponse>({
      url: `https://17dz.com/xmanage-finance/manage/v2/bill/checkFinanceAuth`,
      body: params,
    });
  }

  financeGetAccountSetInfo(params: { customerId: string; period?: string }) {
    return this.request<FinanceGetAccountSetInfoResponse>({
      url: `https://17dz.com/xmanage-finance/manage/v2/finance/getAccountSetInfo`,
      params: {
        period: dayjs().subtract(1, 'm').format('YYYYMM'),
        ...params,
      },
    });
  }

  whoami() {
    return this.request<XyqPortalWebManageUserQueryResponse>({
      url: `https://17dz.com/xqy-portal-web/manage/user/query`,
    });
  }

  getLoginSession() {
    return this.request<GetLoginSessionResponse>({
      url: `https://17dz.com/xqy-portal-web/activity/activity/login/getLoginSession`,
    });
  }

  listEmployee({
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
    return this.request<ListResponse<ListEmployeeItem>>({
      url: `https://17dz.com/employeeweb/v2/employee/pageEmployee`,
      params: { customerId },
      body: {
        pageNum: pageNumber,
        pageNo: pageNumber,
        pageNumber,
        pageSize: 100, // Web 上只能 25，实际使用 100 也没问题
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
          b[a] = decrypt(b[a]);
        }
      }
      return v;
    });
  }

  invoiceInputStatistics(params: {
    beginDate: string; // 2023-04-01
    endDate: string;
    customerId: string | number; // 561000000000
    [k: string]: any;
  }) {
    return this.request<InvoiceInputStatistics>({
      url: `https://17dz.com/invoiceweb/invoice/input/statistics`,
      body: {
        ...params,
      },
    });
  }

  invoiceInputList(params: {
    beginDate: string; // 2023-04-01
    endDate: string;
    customerId: string | number;
    page?: number;
    pageSize?: number;
    [k: string]: any;
  }) {
    return this.request<Array<InvoiceInputListResponseItem>>({
      url: `https://17dz.com/invoiceweb/invoice/input/list`,
      body: {
        page: 1,
        pageSize: 1000,
        ...params,
      },
    });
  }

  invoiceInputDetail(params: { customerId: string | number; invoiceId: string | number; [k: string]: any }) {
    return this.request<InvoiceInputDetailResponse>({
      url: `https://17dz.com/invoiceweb/invoice/input/general/detail`,
      params: {
        ...params,
      },
    });
  }

  invoiceOutputStatistics(params: {
    beginDate: string; // 2023-04-01
    endDate: string;
    customerId: string | number; // 561000000000
    [k: string]: any;
  }) {
    return this.request<InvoiceOutputStatisticsResponse>({
      url: `https://17dz.com/invoiceweb/invoice/output/statistics`,
      body: {
        ...params,
      },
    });
  }

  invoiceOutputList(params: {
    beginDate: string; // 2023-04-01
    endDate: string;
    customerId: string | number;
    page?: number;
    pageSize?: number;
    [k: string]: any;
  }) {
    return this.request<Array<InvoiceOutputListResponseItem>>({
      url: `https://17dz.com/invoiceweb/invoice/output/list`,
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

  invoiceOutputDetail(params: { customerId: string | number; id: string | number; [k: string]: any }) {
    return this.request<InvoiceOutputDetailResponse>({
      url: `https://17dz.com/invoiceweb/invoice/output/general/detail`,
      params: {
        ...params,
      },
    });
  }

  invoicewebCollectPageQueryCollectResult(params: {
    customerId: string | number;
    pageSize?: number;
    currentPage?: number;
  }) {
    return this.request<PageQueryCollectResult>({
      url: `https://17dz.com/invoiceweb/invoice/collect/pageQueryCollectResult`,
      body: {
        pageSize: 100,
        currentPage: 1,
        ...params,
      },
    });
  }

  invoicewebInvoiceCollectAcquireV4(params: {
    customerId: string | number;
    accountId: string;
    nsrsbh: string;
    areaCode: string;
    companyId: string | number;
    collectTaskTypeRequestList: Array<Record<string, any>>;
    [k: string]: any;
  }) {
    return this.request<{ success: boolean; errorContext: any }>({
      url: `https://17dz.com/invoiceweb/invoice/collect/acquire/v4`,
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

  invoicewebInvoiceCollectAcquireV3(params: {
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
      url: `https://17dz.com/invoiceweb/invoice/collect/acquire/v3`,
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

  invoiceInputGeneralQuery(params: {
    companyId: string | number; // customerId
    bizBeginDate: string; // 2023-01-01
    bizEndDate: string;
    pageNumber?: number;
    pageSize?: number;
  }) {
    return this.request<InvoiceInputGeneralQueryResponseItem[]>({
      url: `https://17dz.com/invoiceweb/invoice/input/general/query`,
      body: {
        pageSize: 1000,
        pageNumber: 1,
        ...params,
      },
    });
  }

  async request<T>(opts: SessionRequestOptions<T>): Promise<T> {
    // eslint-disable-next-line @typescript-eslint/return-await
    return requestFromSession<T>({ cookie: this.cookie.bind(this), fetch, ...opts });
  }
}

export interface OperatorClientOptions {
  fetch: typeof globalThis.fetch;
  cookie: () => MaybePromise<string | undefined>;
}

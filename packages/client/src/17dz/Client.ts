import { requireSuccessResponse } from './request';
import { sign } from './sign';
import { QueryCustomerItem, ListResponse } from './types';

export class Client {
  readonly options: ClientOptions;

  constructor(o: ClientInitOptions = {}) {
    this.options = {
      fetch: globalThis.fetch,
      baseUrl: 'https://openapi.17win.com/gateway/openyqdz/',
      // appKey: process.env.WIN17_APP_KEY,
      // appSecret: process.env.WIN17_APP_SECRET,
      ...o,
    } as ClientOptions;
    if (!(this.options.appKey && this.options.appSecret)) {
      throw new Error('appKey and appSecret are required');
    }
  }

  async request<T = any>(init: {
    method?: string;
    url: string;
    headers?: Record<string, string>;
    options?: Record<string, string>;
    body?: any;
  }): Promise<T> {
    const { fetch, baseUrl, appKey, appSecret } = this.options;
    let { url, method = 'POST', options = {}, body, ...rest } = init;
    const headers = {
      'Content-Type': 'application/json; charset=utf-8',
      ...init.headers,
      ...(await sign(options, { appKey, appSecret })),
    };
    const r = {
      method,
      ...rest,
      headers,
      body: body && typeof body === 'object' ? JSON.stringify(body) : body,
    };
    url = url.replace(/^\/+/, '');
    url = new URL(url, baseUrl).toString();
    return fetch(url, r).then(requireSuccessResponse);
  }

  customerQuery({
    pageNo = 1,
    pageSize = 200,
    ...rest
  }: {
    pageNo?: number;
    pageSize?: number;
    customerIds?: string[];
    /**
     * 增值税类型 1：一般纳税人， 2：小规模纳税人
     */
    taxType?: '1' | '2';
    customerLikeCriteria?: {
      name?: string; // 客户简称
      customerNo?: string;
      taxNo?: string;
      fullName?: string;
    };
  }) {
    return this.request<ListResponse & { customerList: QueryCustomerItem[] }>({
      url: '/manage/customer/queryCustomers',
      body: { pageNo, pageSize, ...rest },
    });
  }

  customerUpdate({
    ...rest
  }: {
    customerId: string;
    operatorLoginName: string;
    customerNo?: string;
    name?: string;
    fullName?: string;
    taxNo?: string;
    taxType?: '1' | '2';
    industryCategory?: string; // 行业大类码
    industryType?: string; // 行业大、中、小类码
    locationCode?: string;
    address?: string;
  }) {
    return this.request<string>({
      url: '/manage/customer/updateCustomer',
      body: { ...rest },
    });
  }

  customerAdd({
    ...rest
  }: {
    customerName: string;
    operatorLoginName: string;
    customerNo?: string;
    fullName?: string;
    taxNo?: string;
    taxType?: '1' | '2';
    industryCategory?: string; // 行业大类码
    industryType?: string; // 行业大、中、小类码
    locationCode?: string;
    address?: string;
  }) {
    return this.request<string>({
      url: '/manage/customer/addCustomer',
      body: { ...rest },
    });
  }

  customerUpdateStatus({
    ...rest
  }: {
    customerId: string;
    operatorLoginName: string;
    status: number; //客户状态 1 正常 2 暂停 传数字
  }) {
    return this.request<QueryCustomerItem>({
      url: '/manage/customer/updateCustomerStatus',
      body: { ...rest },
    });
  }

  customerBatchAssignRoles(body: {
    operatorLoginName: string; // 操作人手机号(必须存在于亿企代账)
    customerIdList: string[]; // 客户Id列表
    roleAssignmentList: Array<{
      /**
       * 角色类型 1: 服务顾问, 2:其他服务人员, 3:税务会计,4:财务会计, 5:审核会计,6:收款负责人，7：客户经理，8：开票员
       *
       * ① 客户经理、服务顾问、税务会计、财务会计只能分配一人 ② 除客户经理，其他角色都允许置空；所有角色都允许修改
       */
      relationshipType: number;
      loginNameList: string[]; // 登录名称列表: 一般是登录人手机号 人员列表(若为空,则表示删除)
    }>;
  }) {
    return this.request<QueryCustomerItem>({
      url: '/manage/customer/batchAssignRoles',
      body: { ...body },
    });
  }
}

export interface MutationResponse {
  code: string;
  description: string;
  msg: string;
  time: string;
  status: string;
}

export interface ClientInitOptions extends Partial<ClientOptions> {}

interface ClientOptions {
  appKey: string;
  appSecret: string;
  baseUrl: string;
  fetch: typeof globalThis.fetch;
}

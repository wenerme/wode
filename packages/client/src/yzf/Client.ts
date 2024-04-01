import {
  createFetchWithLogging,
  createLogger,
  Errors,
  maybeFunction,
  type FetchLike,
  type MaybePromise,
} from '@wener/utils';
import { decrypt } from './decrypt';
import { request, type RequestOptions, type Token, type TokenProvider } from './request';
import { ping } from './token';
import type {
  CompanyInfoResponse,
  CompanyRelationInfoListItem,
  GetQyStatusResponse,
  GetReceiptImagesResponseItem,
  PageResponse,
  QueryReportAndConfigResponse,
} from './types';

export type ClientOptionsInit = Partial<ClientOptions> & {
  debug?: boolean;
};

export interface ClientOptions {
  baseUrl?: string;
  fetch?: FetchLike;
  token?: TokenProvider;
  onTokenChange?: (token: Token) => void;
}

export class Client {
  readonly options: ClientOptions;
  private log = createLogger();
  #info: CompanyInfoResponse | undefined;

  constructor({ debug, ...options }: ClientOptionsInit = {}) {
    this.options = {
      ...options,
      fetch: debug ? createFetchWithLogging({ fetch: options.fetch }) : options.fetch,
    };
  }

  async request<T>(
    o: Omit<RequestOptions, 'token'> & {
      token?: TokenProvider | boolean;
    },
  ) {
    const { fetch } = this.options;
    const { token = true, ...rest } = o;
    const init: RequestOptions = rest;
    if (typeof token === 'boolean') {
      if (token) {
        init.token = this.getToken;
      }
    } else {
      init.token = token;
    }

    return request<T>({ fetch, ...init });
  }

  getToken: () => MaybePromise<Token | undefined> = async () => maybeFunction(this.options.token);

  async ping() {
    const token = await this.getToken();
    if (!token) {
      throw new Error('No token');
    }

    return ping(token);
  }

  // /api/fintax/application/dz/company/index/info
  async getCompanyInfo() {
    return this.request<CompanyInfoResponse>({
      url: '/api/fintax/application/dz/company/index/info',
      body: {},
      onSuccess: ({ data }) => {
        if (!this.#info) {
          this.#info = data;
          // `${Client.name}@${data.userInfoVO.yhid}/${data.userInfoVO.yhxm}`
          this.log = createLogger();
        }
      },
    });
  }

  async getCompanyRelationInfoList(params: {
    pageNum?: number;
    pageSize?: number;
    tyzt?: string;
    gsid?: string;
    xzqhid?: string;
    deptId?: string;
    isAllUser?: boolean;
    userIds?: string[];
  }) {
    return this.request<PageResponse<CompanyRelationInfoListItem>>({
      url: '/api/fintax/application/dz/company/info/queryCompanyRelationInfoList',
      body: {
        pageNum: 1,
        pageSize: 100,
        tyzt: '1',
        // "gsid": "1083",
        // "xzqhid": "31",
        isAllUser: false,
        ...params,
      },
      transform: ({ data }) => {
        const dec = decrypt(data);
        if (!dec || !dec.startsWith('{')) {
          this.log.warn(`decrypt failed: ${dec || data}`);
          throw Errors.InternalServerError.asError('invalid encrypt data');
        }

        return JSON.parse(dec);
      },
    });
  }

  async getQyStatus(params: { kjnd: number; kjqj: number; qyId: string }) {
    return this.request<GetQyStatusResponse>({
      url: '/api/fintax/application/dz/tax/copy-and-clear-tax/getQyStatus',
      method: 'PUT',
      body: {
        ...params,
      },
    });
  }

  async getReceiptImages(params: {
    kjnd: number;
    kjqj: number;
    qyId: string;
    hzrwType?: string;
    statusCode?: string;
    sbszId: string;
  }) {
    return this.request<GetReceiptImagesResponseItem[]>({
      url: '/api/fintax/application/dz/tax/report/getReceiptImages',
      method: 'GET',
      params: {
        statusCode: '2',
        hzrwType: 1,
        ...params,
      },
    });
  }

  async queryReportAndConfig(params: { kjnd: number; kjqj: number; qyid: string }) {
    return this.request<QueryReportAndConfigResponse[]>({
      url: '/api/fintax/application/dz/tax/report/queryReportAndConfig',
      method: 'POST',
      body: {
        ...params,
      },
    });
  }
}

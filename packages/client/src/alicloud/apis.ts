export interface AliCloudApis {}

export interface AliCloudApis {
  Dytnsapi: {
    '2020-02-17': AliCloudDytnsapiV20200217;
  };
}

export interface QueryTagListPageRequest {
  PageNo?: number;
  PageSize?: number;
}
export interface QueryTagListPageResponse {}
export interface AliCloudDytnsapiV20200217 {
  QueryTagListPage(param: QueryTagListPageRequest): Promise<QueryTagListPageResponse>;
}

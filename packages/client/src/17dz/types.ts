// https://jvilk.com/MakeTypes/

export interface QueryCustomerItem {
  customerId: string;
  name: string;
  fullName: string;
  customerNo: string;
  // 客户类型（1:代账客户,0:非代账客户,-1:未知）
  customerType: number;
  taxNo: string;
  // 所属行业 大类
  industryCategory?: string;
  // 属行业 中小类
  industryType?: string;
  locationCode: string;
  address?: null;
  // 增值税类型 1：一般纳税人， 2：小规模纳税人
  taxType: string;
  createDate: number;
  accountList?: CustomerAccountList[];
  // 客户状态（1未签约、2已签约、3暂停服务、4正常、 -1未知）
  status: number;
  level?: null;
  departmentId: number;
}

export interface CustomerAccountList {
  //  会计id
  accountId: string;
  // 关系（1: 服务顾问, 2:其他服务人员, 3:税务会计,4:财务会计, 5:审核会计,6:收款负责人，7：客户经理，8：开票员）
  relationshipType: number;
  // 员工登录手机号
  loginName: string;
}

export interface ListResponse {
  [k: string]: any;

  pager: {
    currentPage: number;
    pageSize: number;
  };
  total: number;
}

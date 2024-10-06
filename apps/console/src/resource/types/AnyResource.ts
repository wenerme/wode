export type AnyResource = {
  __typename?: string; // GQL 类型

  id: string; // 主键  - <TYPETAG>_<ULID>
  uid?: string; // UUID
  tid?: string; // 租户
  sid?: number; // 顺序ID - 对用户友好 - 租户+实体类型维度递增
  eid?: string; // 外部 ID - 例如 对接已有系统
  cid?: string; // 平台 ID - CID+RID - 平台+平台ID - 组成 vendor 相关的外部资源
  rid?: string; // 平台关联 ID

  // 常见的名字字段 - 避免使用 name
  loginName?: string; // 可登录对象
  displayName?: string; // 用于显示 - 优先显示
  fullName?: string; // 全名
  title?: string; // 标题
  description?: string; // 描述
  topic?: string; // 主题

  avatarUrl?: string; // 头像
  photoUrl?: string; // 照片
  logoUrl?: string; // Logo

  bannerUrl?: string;

  code?: string; // 大多数情况下 tid+code 是唯一的

  // 基础 profile 信息
  phoneNumber?: string;
  phoneNumberVerifiedAt?: Date | string;
  email?: string;

  // 常见的客户联系信息
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  contactAddress?: string;

  // 冗余联系信息
  alternativeName?: string;
  alternativePhone?: string;
  alternativeEmail?: string;
  alternativeAddress?: string;

  // 行政区划信息
  divisionCode?: string;
  province?: string;
  city?: string;

  notes?: string; // 面向业务员 -  后台备注
  remark?: string; // 面向用户 - 前台备注 - 一般少用

  state?: string; // 状态 - 粗粒度系统定义
  status?: string; // 阶段 - 细粒度业务定义
  stateLabel?: string; // 自动 resolve 出来的显示内容
  statusLabel?: string;

  tags?: string[]; // 标记体系 - 自定义
  metadata?: Record<string, any>; // 元数据

  userId?: string; // 可关联用户
  user?: AnyResource;

  labels?: AnyResource[]; // 标签体系 - 系统定义

  // 排序用
  sort?: number;
  displayOrder?: number;

  // 可归属资源
  ownerId?: string;
  ownerType?: string | 'User' | 'Team';

  // 具体归属 ID 基于 type 生成
  owningUserId?: string;
  owningTeamId?: string;
  owningUser?: AnyResource;
  owningTeam?: AnyResource;

  // 通用对象关联 Entity
  entityId?: string;
  entityType?: string;
  entity?: AnyResource; // 通常 GQL 层能够解析

  // 客户所属资源
  customerId?: string;
  customerType?: string | 'Account' | 'Contact';
  accountId?: string;
  contactId?: string;
  account?: AnyResource;
  contact?: AnyResource;

  // audit 相关
  createdById?: string;
  updatedById?: string;
  deletedById?: string;
  createdBy?: AnyResource;
  updatedBy?: AnyResource;
  deletedBy?: AnyResource;

  updatedAt?: Date | string; // 创建时间
  createdAt?: Date | string; // 更新时间
  deletedAt?: Date | string; // 删除时间

  attributes?: Record<string, any>; // 面向客户端+服务端 - 客户端读写
  properties?: Record<string, any>; // 面向服务端 - 客户端只读
  extensions?: Record<string, any>; // 面向客户端 - 客户端不可见

  // 常见级联关系
  parentId?: string;
  children?: AnyResource[];
  parent?: AnyResource;

  [key: string]: any;
};

// 避免 nullable，其他地方的代码太难处理了
// type OptionalNullable<T> = {
//   [K in keyof T]: undefined extends T[K] ? T[K] | null : T[K];
// };
//
// export type AnyResource = OptionalNullable<_AnyResource>;

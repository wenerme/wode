export interface GetUserResponse {
  userid: string; //成员UserID。对应管理端的帐号，企业内必须唯一。不区分大小写，长度为1~64个字节；第三方应用返回的值为open_userid
  name: string; //成员名称；第三方不可获取，调用时返回userid以代替name；代开发自建应用需要管理员授权才返回；对于非第三方创建的成员，第三方通讯录应用也不可获取；未返回name的情况需要通过通讯录展示组件来展示名字
  mobile: string; //手机号码，代开发自建应用需要管理员授权且成员oauth2授权获取；第三方仅通讯录应用可获取；对于非第三方创建的成员，第三方通讯录应用也不可获取；上游企业不可获取下游企业成员该字段
  department: number[]; //成员所属部门id列表，仅返回该应用有查看权限的部门id；成员授权模式下，固定返回根部门id，即固定为1。对授权了“组织架构信息”权限的第三方应用，返回成员所属的全部部门id
  order: number[]; //部门内的排序值，默认为0。数量必须和department一致，数值越大排序越前面。值范围是[0, 2^32)。成员授权模式下不返回该字段
  position: string; //职务信息；代开发自建应用需要管理员授权才返回；第三方仅通讯录应用可获取；对于非第三方创建的成员，第三方通讯录应用也不可获取；上游企业不可获取下游企业成员该字段
  gender: string; //性别。0表示未定义，1表示男性，2表示女性。代开发自建应用需要管理员授权且成员oauth2授权获取；第三方仅通讯录应用可获取；对于非第三方创建的成员，第三方通讯录应用也不可获取；上游企业不可获取下游企业成员该字段。注：不可获取指返回值0
  email: string; //邮箱，代开发自建应用需要管理员授权且成员oauth2授权获取；第三方仅通讯录应用可获取；对于非第三方创建的成员，第三方通讯录应用也不可获取；上游企业不可获取下游企业成员该字段
  biz_mail: string; //企业邮箱，代开发自建应用需要管理员授权且成员oauth2授权获取；第三方仅通讯录应用可获取；对于非第三方创建的成员，第三方通讯录应用也不可获取；上游企业不可获取下游企业成员该字段
  is_leader_in_dept: number[]; //表示在所在的部门内是否为部门负责人，数量与department一致；第三方通讯录应用或者授权了“组织架构信息-应用可获取企业的部门组织架构信息-部门负责人”权限的第三方应用可获取；对于非第三方创建的成员，第三方通讯录应用不可获取；上游企业不可获取下游企业成员该字段
  direct_leader: string[]; //直属上级UserID，返回在应用可见范围内的直属上级列表，最多有五个直属上级；第三方通讯录应用或者授权了“组织架构信息-应用可获取可见范围内成员组织架构信息-直属上级”权限的第三方应用可获取；对于非第三方创建的成员，第三方通讯录应用不可获取；上游企业不可获取下游企业成员该字段；代开发自建应用不可获取该字段
  avatar: string; //头像url。 代开发自建应用需要管理员授权且成员oauth2授权获取；第三方仅通讯录应用可获取；对于非第三方创建的成员，第三方通讯录应用也不可获取；上游企业不可获取下游企业成员该字段
  thumb_avatar: string; //头像缩略图url。第三方仅通讯录应用可获取；对于非第三方创建的成员，第三方通讯录应用也不可获取；上游企业不可获取下游企业成员该字段
  telephone: string; //座机。代开发自建应用需要管理员授权才返回；第三方仅通讯录应用可获取；对于非第三方创建的成员，第三方通讯录应用也不可获取；上游企业不可获取下游企业成员该字段
  alias: string; //别名；第三方仅通讯录应用可获取；对于非第三方创建的成员，第三方通讯录应用也不可获取；上游企业不可获取下游企业成员该字段
  extattr: string; //扩展属性，代开发自建应用需要管理员授权才返回；第三方仅通讯录应用可获取；对于非第三方创建的成员，第三方通讯录应用也不可获取；上游企业不可获取下游企业成员该字段
  status: number; //激活状态: 1=已激活，2=已禁用，4=未激活，5=退出企业。 已激活代表已激活企业微信或已关注微信插件（原企业号）。未激活代表既未激活企业微信又未关注微信插件（原企业号）。
  qr_code: string; //员工个人二维码，扫描可添加为外部联系人(注意返回的是一个url，可在浏览器上打开该url以展示二维码)；代开发自建应用需要管理员授权且成员oauth2授权获取；第三方仅通讯录应用可获取；对于非第三方创建的成员，第三方通讯录应用也不可获取；上游企业不可获取下游企业成员该字段
  external_profile: string; //成员对外属性，字段详情见对外属性；代开发自建应用需要管理员授权才返回；第三方仅通讯录应用可获取；对于非第三方创建的成员，第三方通讯录应用也不可获取；上游企业不可获取下游企业成员该字段
  external_position: string; //对外职务，如果设置了该值，则以此作为对外展示的职务，否则以position来展示。代开发自建应用需要管理员授权才返回；第三方仅通讯录应用可获取；对于非第三方创建的成员，第三方通讯录应用也不可获取；上游企业不可获取下游企业成员该字段
  address: string; //地址。代开发自建应用需要管理员授权且成员oauth2授权获取；第三方仅通讯录应用可获取；对于非第三方创建的成员，第三方通讯录应用也不可获取；上游企业不可获取下游企业成员该字段
  open_userid: string; //全局唯一。对于同一个服务商，不同应用获取到企业内同一个成员的open_userid是相同的，最多64个字节。仅第三方应用可获取
  main_department: number; //主部门，仅当应用对主部门有查看权限时返回。
}

export interface ExtAttr {
  attrs: ExtAttrItem[];
}

export type ExtAttrItem =
  | {
      type: number; // 0 text, 1 web
      name: string;
      text?: {
        value: string;
      };
      web?: {
        url: string;
        title: string;
      };
    }
  | {
      type: 0;
      name: string;
      text: {
        value: string;
      };
    }
  | {
      type: 1;
      name: string;
      web: {
        url: string;
        title: string;
      };
    }
  | {
      type: 2;
      name: string;
      miniprogram: {
        appid: string;
        pagepath: string;
        title: string;
      };
    };

export interface ExternalProfile {
  external_corp_name: string; //外部联系人所在企业名称
  wechat_channels: {
    nickname: string;
    status: number;
  };
  external_attr: ExtAttr[]; //外部联系人在外部企业的属性
}

export interface GetTokenResponse {
  access_token: string;
  expires_in: number;
  expires_at: number;
}

export interface GetExternalContactResponse {
  external_contact: ExternalContact;
  follow_user?: ExternalContactFollowInfo[];
  next_cursor: string;
}

export interface BatchGetExternalContactByUserResponse {
  external_contact_list: Array<{
    external_contact: ExternalContact;
    follow_info: ExternalContactFollowInfo;
  }>;
  next_cursor: string;
}

export interface ExternalContact {
  external_userid: string;
  name: string;
  position: string;
  avatar: string;
  corp_name: string;
  corp_full_name: string;
  type: number;
  gender: number;
  unionid: string;
  external_profile: ExternalProfile;
}

export interface ExternalContactFollowInfo {
  userid: string;
  remark: string;
  description: string;
  createtime: number;
  tags?: TagsEntity[] | null;
  remark_corp_name?: string | null;
  remark_mobiles?: string[] | null;
  oper_userid: string;
  add_way: number;
  wechat_channels?: WechatChannels | null;
  state?: string | null;
}

export interface TagsEntity {
  group_name: string;
  tag_name: string;
  tag_id?: string | null;
  type: number;
}

export interface WechatChannels {
  nickname: string;
  source: number;
}

export interface GetMessageAuditGroupChatResponse {
  roomname: string;
  creator: string;
  room_create_time: number;
  notice: string;
  members: Array<{ memberid: string; jointime: number }>;
}

export interface GetExternalContactGroupChat {
  group_chat: ExternalContactGroupChat;
}

export interface ExternalContactGroupChat {
  chat_id: string;
  name: string;
  owner: string;
  create_time: number;
  notice: string;
  member_list: ExternalContactGroupChatMemberListEntity[];
  admin_list?: Array<{ userid: string }>;
}

export interface ExternalContactGroupChatMemberListEntity {
  userid: string;
  type: number;
  join_time: number;
  join_scene: number;
  invitor?: Array<{ userid: string }> | { userid: string };
  group_nickname: string;
  name: string;
  unionid?: string;
}

export interface GeneralRequestParams extends Record<string, any> {
  corpid?: string | true;
  corpsecret?: string | true;
  access_token?: string | true;
}

import { ExtAttr, ExternalProfile } from './types';

export interface GeneralResponse {
  errcode: number;
  errmsg: string;
}

// export interface GetUserResponse {
//   userid: string;
//   name: string;
//   department: number[];
//   order: number[];
//   position: string;
//   mobile: string;
//   gender: string;
//   email: string;
//   biz_mail: string;
//   is_leader_in_dept: number[];
//   direct_leader: string[];
//   avatar: string;
//   thumb_avatar: string;
//   telephone: string;
//   alias: string;
//   address: string;
//   open_userid: string;
//   main_department: number;
//   extattr: ExtAttr;
//   status: number;
//   qr_code: string;
//   external_position: string;
//   external_profile: ExternalProfile;
// }

// export interface ExtAttrs {
//   attrs: ExtAttr[];
// }
//
// export interface ExtAttr {
//   type: number;
//   name: string;
//   text?: TextAttr;
//   web?: WebAttr;
//   miniprogram?: MiniprogramAttr;
// }
//
// export interface TextAttr {
//   value: string;
// }
//
// export interface WebAttr {
//   url: string;
//   title: string;
// }

// export interface ExternalProfile {
//   external_corp_name: string;
//   wechat_channels: WechatChannels;
//   external_attr: ExtAttr[];
// }
//
// export interface WechatChannels {
//   nickname: string;
//   status: number;
// }
//
// export interface MiniprogramAttr {
//   appid: string;
//   pagepath: string;
//   title: string;
// }

export interface CreateUserRequest {
  userid: string;
  name: string;
  alias: string;
  mobile: string;
  department: string[];
  order: string[];
  position: string;
  gender: string;
  email: string;
  biz_mail: string;
  is_leader_in_dept: string[];
  direct_leader: string[];
  enable: string;
  avatar_mediaid: string;
  telephone: string;
  address: string;
  main_department: string;
  extattr: ExtAttr;
  to_invite: string;
  external_position: string;
  external_profile: ExternalProfile;
}

export interface DepartmentInput {
  id?: number;
  name: string;
  name_en?: string;
  parentid?: number;
  order?: number;
}
export interface DepartmentOutput {
  id: number;
  name: string;
  name_en?: string;
  parentid: number;
  order: number;
  department_leader?: string[];
}

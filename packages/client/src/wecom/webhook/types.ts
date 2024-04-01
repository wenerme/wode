import { type WechatWebhookQuery } from '../../wechat/webhook';

export interface WecomWebhookEncryptPayload {
  ToUserName: string;
  Encrypt: string;
  AgentID: number;
}

export interface WecomWebhookPayload {
  // https://developer.work.weixin.qq.com/document/path/90973 异步任务完成通知

  ToUserName: string;
  FromUserName: string;
  CreateTime: number;
  MsgType: string | 'event';
  Event: string | 'batch_job_result';
  MsgId: string;
  AgentID: number;
  ErrCode: number;
  ErrMsg: string;
  BatchJob?: {
    JobId: string;
  };
  JobType: string; // sync_user(增量更新成员)、 replace_user(全量覆盖成员）、invite_user(邀请成员关注）、replace_party(全量覆盖部门)
}

export type WecomWebhookQuery = WechatWebhookQuery;

export type WecomWebhookEventPayload =
  | WecomBatchJobResultEventPayload
  | WecomUserCreateEventPayload
  | WecomUserUpdateEventPayload
  | WecomUserDeleteEventPayload
  | WecomDepartmentCreateEventPayload
  | WecomDepartmentUpdateEventPayload
  | WecomDepartmentDeleteEventPayload;

export interface WecomTextMessagePayload {
  ToUserName: string;
  FromUserName: string;
  CreateTime: number;
  MsgType: 'text';
  Content: string;
  MsgId: number;
  AgentID: number;
}

export interface WecomImageMessagePayload {
  ToUserName: string;
  FromUserName: string;
  CreateTime: number;
  MsgType: 'image';
  PicUrl: string;
  MediaId: string;
  MsgId: number;
  AgentID: number;
}

export interface WecomVoiceMessagePayload {
  ToUserName: string;
  FromUserName: string;
  CreateTime: number;
  MsgType: 'voice';
  Format: string;
  MediaId: string;
  MsgId: number;
  AgentID: number;
}

export interface WecomVideoMessagePayload {
  ToUserName: string;
  FromUserName: string;
  CreateTime: number;
  MsgType: 'video';
  ThumbMediaId: string;
  MediaId: string;
  MsgId: number;
  AgentID: number;
}

export interface WecomLocationMessagePayload {
  ToUserName: string;
  FromUserName: string;
  CreateTime: number;
  MsgType: 'location';
  Location_X: number;
  Location_Y: number;
  Scale: number;
  Label: string;
  MsgId: number;
  AgentID: number;
  AppType: 'wxwork';
}

export type WecomMessagePayload =
  | WecomTextMessagePayload
  | WecomImageMessagePayload
  | WecomLinkMessagePayload
  | WecomVideoMessagePayload
  | WecomVoiceMessagePayload
  | WecomLocationMessagePayload;

export interface WecomLinkMessagePayload {
  ToUserName: string;
  FromUserName: string;
  CreateTime: number;
  MsgType: 'link';
  Title: string;
  Description: string;
  Url: string;
  PicUrl: string;
  MsgId: number;
  AgentID: number;
}

/**
 * @see https://developer.work.weixin.qq.com/document/path/90973
 */
export interface WecomBatchJobResultEventPayload {
  ToUserName: string;
  FromUserName: string;
  CreateTime: number;
  MsgType: 'event';
  Event: 'batch_job_result';
  BatchJob: WecomBatchJobResultEventPayloadBatchJob;
}

export interface WecomBatchJobResultEventPayloadBatchJob {
  JobId: string;
  JobType: string;
  ErrCode: number;
  ErrMsg: string;
}

export interface WecomTagMemberUpdateEventPayload {
  ToUserName: string;
  FromUserName: 'sys';
  CreateTime: number;
  MsgType: 'event';
  Event: 'change_contact';
  ChangeType: 'update_tag';
  TagId: number;
  AddUserItems: string;
  DelUserItems: string;
  AddPartyItems: string;
  DelPartyItems: string;
}

export interface WecomDepartmentCreateEventPayload {
  ToUserName: string;
  FromUserName: 'sys';
  CreateTime: number;
  MsgType: 'event';
  Event: 'change_contact';
  ChangeType: 'create_party';
  Id: number;
  Name: string;
  ParentId: number;
  Order: number;
}

export interface WecomDepartmentUpdateEventPayload {
  ToUserName: string;
  FromUserName: 'sys';
  CreateTime: number;
  MsgType: 'event';
  Event: 'change_contact';
  ChangeType: 'update_party';
  Id: number;
  Name: string;
  ParentId: number;
}

export interface WecomDepartmentDeleteEventPayload {
  ToUserName: string;
  FromUserName: 'sys';
  CreateTime: number;
  MsgType: 'event';
  Event: 'change_contact';
  ChangeType: 'delete_party';
  Id: number;
}

export interface WecomUserDeleteEventPayload {
  ToUserName: string;
  FromUserName: 'sys';
  CreateTime: number;
  MsgType: 'event';
  Event: 'change_contact';
  ChangeType: 'delete_user';
  UserID: string;
}

export interface WecomUserUpdateEventPayload {
  ToUserName: string;
  FromUserName: 'sys';
  CreateTime: number;
  MsgType: 'event';
  Event: 'change_contact';
  ChangeType: 'update_user';
  UserID: string;
  NewUserID: string;
  Name: string;
  Department: string;
  MainDepartment: number;
  IsLeaderInDept: string;
  Position: string;
  Mobile: number;
  Gender: number;
  Email: string;
  Status: number;
  Avatar: string;
  Alias: string;
  Telephone: string;
  Address: string;
  ExtAttr: WecomEventPayloadExtAttr;
}

export interface WecomUserCreateEventPayload {
  ToUserName: string;
  FromUserName: 'sys';
  CreateTime: number;
  MsgType: 'event';
  Event: 'change_contact';
  ChangeType: 'create_user';
  UserID: string;
  Name: string;
  Department: string;
  MainDepartment: number;
  IsLeaderInDept: string;
  DirectLeader: string;
  Position: string;
  Mobile: number;
  Gender: number;
  Email: string;
  BizMail: string;
  Status: number;
  Avatar: string;
  Alias: string;
  Telephone: string;
  Address: string;
  ExtAttr: WecomEventPayloadExtAttr;
}

export interface WecomEventPayloadExtAttr {
  Item: WecomEventPayloadExtAttrItem[];
}

export interface WecomEventPayloadExtAttrItem {
  Name: string;
  Type: number;
  Text?: WecomEventPayloadExtAttrItemText;
  Web?: WecomEventPayloadExtAttrItemWeb;
}

export interface WecomEventPayloadExtAttrItemText {
  Value: string;
}

export interface WecomEventPayloadExtAttrItemWeb {
  Title: string;
  Url: string;
}

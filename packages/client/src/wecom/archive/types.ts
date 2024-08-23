export type SwitchMessage = {
  msgid: string;
  action: 'switch';
  user: string;
  time: number;
};

interface BaseMessage {
  msgid: string;
  action: string;
  msgtype?: string;

  from: string; // 消息发送方id，同一企业为userid，非同企业为external_userid
  tolist: string[]; // 消息接收方列表，内容为userid或external_userid
  roomid?: string; // 群聊消息的群id，单聊为空
  msgtime: number; // 消息发送时间戳，单位为毫秒的UTC时间
}

export type RecallMessage = {
  msgid: string;
  action: 'recall';
  from: string;
  tolist: string[];
  roomid: string;
  msgtime: number;
  msgtype: 'revoke';
  revoke: {
    pre_msgid: string;
  };
};

// export type ArchiveMessage = {
//   msgid: string; // 消息id，消息的唯一标识
//   action: 'send' | 'recall' | 'switch'; // 消息动作：发送、撤回、切换企业日志

// };

export type SendMessage = {
  msgid: string;
  action: 'send';
  from: string; // 消息发送方id。同一企业内容为userid，非相同企业为external_userid。消息如果是机器人发出，也为external_userid。
  tolist: string[]; // 消息接收方列表，可能是多个，同一个企业内容为userid，非相同企业为external_userid。
  roomid?: string;
  msgtime: number;
  msgtype: string;
};

export interface ImageMessage extends SendMessage {
  msgtype: 'image';
  image: {
    md5sum: string;
    filesize: number;
    sdkfileid: string;
  };
}

export interface CorpDiskFileMessage extends SendMessage {
  msgtype: 'qydiskfile';
  info: {
    filename: string;
  };
}

/**
 * 音视频通话分为微信互通通话和普通通话两种类型。
 * 微信互通：1次音视频通话只会产生1条记录。
 * 普通通话：1次音视频通话会产生多条记录，由参与人数决定。
 */
export interface VoipTextMessage extends SendMessage {
  msgtype: 'voiptext';
  info: {
    callduration: number; // 通话时长，单位秒
    invitetype: 1 | 2 | 3 | 4; // 1; //单人视频通话 2; //单人语音通话 3; //多人视频通话 4; //多人语音通话
  };
}

/**
 * @title 视频号消息
 */
export interface WeChatChannelMessage extends SendMessage {
  msgtype: 'sphfeed';
  sphfeed: {
    feed_type: number;
    sph_name: string;
    feed_desc: string;
  };
}

/**
 * @title 互通红包消息
 */
export interface ExternalRedPacketMessage extends SendMessage {
  msgtype: 'external_redpacket';
  redpacket: {
    type: 1 | 2; // 1 普通红包、2 拼手气群红包
    wish: string;
    totalcnt: number; // 红包总个数
    totalamount: number; // 红包总金额
  };
}

export interface VoipDocShareMessage extends SendMessage {
  msgtype: 'voip_doc_share';
  voip_doc_share: {
    filename: string;
    md5sum: string;
    filesize: number;
    sdkfileid: string;
  };
}

/**
 * 如果音频过程中包括文档演示或屏幕共享，meeting_voice_call内会包含demofiledata数组跟sharescreendata数组，对应音频过程中的多次文档演示跟屏幕共享。
 */
export interface MettingVoiceCallMessage extends SendMessage {
  msgtype: 'meeting_voice_call';
  meeting_voice_call: {
    endtime: number;
    sdkfileid: string; // 音频媒体下载的id
    demofiledata: {
      filename: string;
      demooperator: string;
      starttime: number;
      endtime: number;
    }[];
    sharescreendata: {
      share: string;
      starttime: number;
      endtime: number;
    }[];
  };
}

export type MixedMessageItem = {
  type: string;
  content: string; // json string, 类型参考 MessageTypeContent
};

export interface MixedMessage extends SendMessage {
  msgtype: 'mixed';
  mixed: {
    // 消息内容。可包含图片、文字、表情等多种消息
    item: MixedMessageItem[];
  };
}

export interface CalendarMessage extends SendMessage {
  msgtype: 'calendar';
  calendar: {
    title: string;
    creatorname: string;
    attendeename: string[];
    starttime: number;
    endtime: number;
    place: string;
    remarks: string;
  };
}

export type NewsMessageItem = {
  title: string;
  description: string;
  url: string;
  picurl: string;
};

export interface NewsMessage extends SendMessage {
  msgtype: 'news';
  info: {
    item: NewsMessageItem[];
  };
}

export interface MarkdownMessage extends SendMessage {
  msgtype: 'markdown';
  info: {
    content: string;
  };
}

export interface DocumentMessage extends SendMessage {
  msgtype: 'docmsg';
  doc: {
    title: string;
    doc_creator: string; // 在线文档创建者。本企业成员创建为userid；外部企业成员创建为external_userid
    link_url: string;
  };
}

export interface MeetingNotificationMessage extends SendMessage {
  msgtype: 'meeting_notification';
  info: {
    content: string; // 会议系统消息内容
    meeting_id: number;
    notification_type: 1 | 2; // 1表示有人加入了会议，2表示会议已经结束
  };
}

export interface MeetingMessage extends SendMessage {
  msgtype: 'meeting';
  meeting: {
    topic: string;
    starttime: number;
    endtime?: number; // 快速会议为空
    address?: string; // 快速会议为空
    remarks?: string; // 快速会议为空
    meetingid: string | number; // int64
  };
}

export interface RedPacketMessage extends SendMessage {
  msgtype: 'redpacket';
  redpacket: {
    type: 1 | 2; // 1 个人红包 2 群红包
    wish: string;
    totalcnt: number;
    totalamount: number;
  };
}

export interface CollectFormMessageItem extends SendMessage {
  id: number;
  ques: string; // 表项名称
  type: 'Text' | 'Number' | 'Date' | 'Time';
}

export interface CollectFormMessage extends SendMessage {
  msgtype: 'collect';
  collect: {
    room_name: string;
    creator: string; // 表项id
    create_time: string;
    title: string;
    details: Array<CollectFormMessageItem>;
  };
}

export interface VoteMessage extends SendMessage {
  msgtype: 'vote';
  vote: {
    votetitle: string;
    voteitem: string[];
    votetype: 101 | 102; // 101 发起投票 102 参与投票
    voteid: string; // 投票id - 用于参与投票消息与发起投票消息进行前后对照
  };
}

export interface TodoMessage extends SendMessage {
  msgtype: 'todo';
  todo: {
    title: string;
    content: string;
  };
}

type ChatRecordMessageItemType =
  | 'ChatRecordText'
  | 'ChatRecordFile'
  | 'ChatRecordImage'
  | 'ChatRecordVideo'
  | 'ChatRecordLink'
  | 'ChatRecordLocation'
  | 'ChatRecordMixed'
  | 'chatrecord';

export type ChatRecordMessageItem = {
  type: string;
  msgtime: number;
  content: string;
  from_chatroom: boolean;
};

export interface ChatRecordMessage extends SendMessage {
  msgtype: 'chatrecord';
  chatrecord: {
    title: string;
    item: ChatRecordMessageItem[];
  };
}

export interface WeAppMessage extends SendMessage {
  msgtype: 'weapp';
  weapp: {
    title: string;
    description: string;
    username: string;
    displayname: string; // 小程序名称
  };
}

export interface LinkMessage extends SendMessage {
  msgtype: 'link';
  link: {
    title: string;
    description: string;
    link_url: string;
    image_url: string;
  };
}

export interface FileMessage extends SendMessage {
  msgtype: 'file';
  file: {
    md5sum: string;
    filename: string;
    filesize: number;
    sdkfileid: string;
    fileext: string;
  };
}

export interface EmotionMessage extends SendMessage {
  msgtype: 'emotion';
  emotion: {
    type: number; // png, gif
    width: number;
    height: number;
    imagesize: number; // 文件大小
    md5sum: string;
    sdkfileid: string;
  };
}

export interface LocationMessage extends SendMessage {
  msgtype: 'location';
  location: {
    longitude: number;
    latitude: number;
    address: string;
    title: string;
    zoom: number;
  };
}

export interface CardMessage extends SendMessage {
  msgtype: 'card';
  card: {
    corpname: string;
    userid: string;
  };
}

export interface VideoMessage extends SendMessage {
  msgtype: 'video';
  video: {
    md5sum: string;
    filesize: number;
    play_length: number;
    sdkfileid: string;
  };
}

export interface VoiceMessage extends SendMessage {
  msgtype: 'voice';
  voice: {
    md5sum: string;
    voice_size: number;
    play_length: number;
    sdkfileid: string;
  };
}

export interface AggreeMessage extends SendMessage {
  msgtype: 'agree';
  agree: {
    userid: string;
    agree_time: number;
  };
}

export interface DisagreeMessage extends SendMessage {
  msgtype: 'disagree';
  disagree: {
    userid: string;
    disagree_time: number;
  };
}

export interface RevokeMessage extends SendMessage {
  msgtype: 'revoke';
  revoke: {
    pre_msgid: string;
  };
}

export interface TextMessage extends SendMessage {
  msgtype: 'text'; // 消息类型，文本消息为text
  text: {
    content: string;
  }; // 消息内容
}

export type AnySendMessage =
  | CorpDiskFileMessage
  | VoipTextMessage
  | ImageMessage
  | WeChatChannelMessage
  | ExternalRedPacketMessage
  | VoipDocShareMessage
  | MettingVoiceCallMessage
  | MixedMessage
  | CalendarMessage
  | NewsMessage
  | MarkdownMessage
  | DocumentMessage
  | MeetingNotificationMessage
  | MeetingMessage
  | RedPacketMessage
  | CollectFormMessage
  | VoteMessage
  | TodoMessage
  | ChatRecordMessage
  | WeAppMessage
  | LinkMessage
  | FileMessage
  | EmotionMessage
  | LocationMessage
  | CardMessage
  | VideoMessage
  | VoiceMessage
  | AggreeMessage
  | DisagreeMessage
  | RevokeMessage
  | TextMessage;

export type ArchiveMessage = AnySendMessage | SwitchMessage | RecallMessage;

export type AnyArchiveMessage = {
  msgid: string;
  action: string;
  from?: string;
  tolist?: string[];
  roomid?: string;
  msgtime?: number;
  msgtype?: string;

  user?: SwitchMessage['user'];
  time?: SwitchMessage['time'];

  // 24 types

  revoke?: RevokeMessage['revoke'];
  redpacket?: RedPacketMessage['redpacket'] | ExternalRedPacketMessage['redpacket'];
  link?: LinkMessage['link'];
  location?: LocationMessage['location'];
  file?: FileMessage['file'];
  image?: ImageMessage['image'];
  emotion?: EmotionMessage['emotion'];
  card?: CardMessage['card'];
  video?: VideoMessage['video'];
  voice?: VoiceMessage['voice'];
  text?: TextMessage['text'];
  chatrecord?: ChatRecordMessage['chatrecord'];
  info?:
    | NewsMessage['info']
    | MarkdownMessage['info']
    | CorpDiskFileMessage['info']
    | VoipTextMessage['info']
    | MeetingNotificationMessage['info'];
  weapp?: WeAppMessage['weapp'];
  mixed?: MixedMessage['mixed'];
  disagree?: DisagreeMessage['disagree'];
  agree?: AggreeMessage['agree'];
  voip_doc_share?: VoipDocShareMessage['voip_doc_share'];
  meeting_voice_call?: MettingVoiceCallMessage['meeting_voice_call'];
  sphfeed?: WeChatChannelMessage['sphfeed'];
  vote?: VoteMessage['vote'];
  collect?: CollectFormMessage['collect'];
  calendar?: CalendarMessage['calendar'];
  meeting?: MeetingMessage['meeting'];
  doc?: DocumentMessage['doc'];
  todo?: TodoMessage['todo'];
};

type TypeContent = {
  // special
  revoke: RevokeMessage['revoke'];
  switch: never;

  // text
  text: TextMessage['text'];
  markdown: MarkdownMessage['info'];

  // file
  emotion: EmotionMessage['emotion'];
  file: FileMessage['file'];
  image: ImageMessage['image'];
  voice: VoiceMessage['voice'];
  video: VideoMessage['video'];

  // structure
  mixed: MixedMessage['mixed'];
  chatrecord: ChatRecordMessage['chatrecord'];

  redpacket: RedPacketMessage['redpacket'];
  external_redpacket: ExternalRedPacketMessage['redpacket'];
  link: LinkMessage['link'];
  location: LocationMessage['location'];
  card: CardMessage['card'];
  weapp: WeAppMessage['weapp'];
  agree: AggreeMessage['agree'];
  disagree: DisagreeMessage['disagree'];
  voip_doc_share: VoipDocShareMessage['voip_doc_share'];
  meeting_voice_call: MettingVoiceCallMessage['meeting_voice_call'];
  sphfeed: WeChatChannelMessage['sphfeed'];
  vote: VoteMessage['vote'];
  collect: CollectFormMessage['collect'];
  calendar: CalendarMessage['calendar'];
  meeting: MeetingMessage['meeting'];
  docmsg: DocumentMessage['doc'];
  todo: TodoMessage['todo'];
  news: NewsMessage['info'];
  qydiskfile: CorpDiskFileMessage['info'];
  voiptext: VoipTextMessage['info'];
  meeting_notification: MeetingNotificationMessage['info'];
};

export type MessageTypeContent = {
  [K in keyof TypeContent]: {
    type: K;
    content: TypeContent[K];
  };
};

type ChatRecordMessageTypeContentMapping = Pick<
  TypeContent,
  'text' | 'file' | 'image' | 'video' | 'link' | 'location' | 'mixed' | 'chatrecord'
>;

const ChatRecordMessageTypeToMessageType = {
  ChatRecordText: 'text',
  ChatRecordFile: 'file',
  ChatRecordImage: 'image',
  ChatRecordVideo: 'video',
  ChatRecordLink: 'link',
  ChatRecordLocation: 'location',
  ChatRecordMixed: 'mixed',
  chatrecord: 'chatrecord',
} as const;

export type ParsedChatRecordMessageItem = {
  [K in keyof ChatRecordMessageTypeContentMapping]: {
    type: K;
    content: ChatRecordMessageTypeContentMapping[K];
  };
} & {
  msgtime: number;
  from_chatroom: boolean;
};

// 目前只遇到 text 和 image
export type ParsedMixedMessageItem =
  | {
      type: 'text';
      content: TextMessage['text'];
    }
  | {
      type: 'image';
      content: ImageMessage['image'];
    };

import { ChatRecordMessageItem, MixedMessageItem, ParsedChatRecordMessageItem, ParsedMixedMessageItem } from './types';

const ChatRecordMessageTypeToMessageType = {
  ChatRecordText: 'text',
  ChatRecordFile: 'file',
  ChatRecordImage: 'image',
  ChatRecordVideo: 'video',
  ChatRecordLink: 'link',
  ChatRecordLocation: 'location',
  ChatRecordMixed: 'mixed',
  chatrecord: 'chatrecord',
};

export function parseChatRecordMessageItem(v: ChatRecordMessageItem): ParsedChatRecordMessageItem {
  const { type, msgtime, from_chatroom, content } = v;
  return {
    type: ChatRecordMessageTypeToMessageType[type as 'ChatRecordText'] || type,
    content: typeof content === 'string' ? JSON.parse(content) : content,
    msgtime,
    from_chatroom,
  } as any;
}

export function parseMixedMessageItem(v: MixedMessageItem | ParsedMixedMessageItem): ParsedMixedMessageItem {
  const { type, content } = v;
  return {
    type,
    content: typeof content === 'string' ? JSON.parse(content) : content,
  } as any;
}

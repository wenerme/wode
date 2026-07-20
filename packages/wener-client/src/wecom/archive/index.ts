export { MessageAction, MessageType } from './enum';
export type * from './types';

export { type CollectSdkFileItem, collectSdkFiles } from './utils/collectSdkFiles';
export { normalizeMessageTypeContent } from './utils/normalizeMessageTypeContent';
export { parseChatRecordMessageItem } from './utils/parseChatRecordMessageItem';
export { parseMixedMessageItem } from './utils/parseMixedMessageItem';

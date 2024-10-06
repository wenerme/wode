export type * from './types';
export { MessageType, MessageAction } from './enum';

export { collectSdkFiles, type CollectSdkFileItem } from './utils/collectSdkFiles';
export { normalizeMessageTypeContent } from './utils/normalizeMessageTypeContent';
export { parseChatRecordMessageItem } from './utils/parseChatRecordMessageItem';
export { parseMixedMessageItem } from './utils/parseMixedMessageItem';

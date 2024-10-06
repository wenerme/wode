import type { AnyArchiveMessage, MessageTypeContent } from '../types';

export function normalizeMessageTypeContent(msg: AnyArchiveMessage): MessageTypeContent {
  const {
    action,
    revoke,
    msgtype: type = action,
    redpacket,
    image,
    file,
    emotion,
    video,
    text,
    link,
    location,
    voice,
    info,
    voip_doc_share,
    meeting_voice_call,
    mixed,
    disagree,
    agree,
    weapp,
    chatrecord,
    card,
    meeting,
    calendar,
    doc,
    sphfeed,
    vote,
    todo,
    time,
    user,
  } = msg;

  let content: any =
    revoke ||
    image ||
    file ||
    emotion ||
    video ||
    text ||
    voice ||
    info ||
    voip_doc_share ||
    redpacket ||
    link ||
    location ||
    meeting_voice_call ||
    mixed ||
    disagree ||
    agree ||
    weapp ||
    chatrecord ||
    card ||
    meeting ||
    vote ||
    sphfeed ||
    calendar ||
    doc ||
    todo;
  // if (type === 'switch') {
  //   content = {
  //     // 具体为切换企业的成员的userid
  //     user,
  //     time,
  //   };
  // }
  return {
    type,
    content: content,
  } as any as MessageTypeContent;
}

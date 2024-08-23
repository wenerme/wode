export function parseQuoteMessage(msg: string):
  | {
      content: string;
    }
  | {
      user: string;
      quote: string;
      content: string;
    } {
  // https://developer.work.weixin.qq.com/document/path/91774#%E6%96%87%E6%9C%AC

  // 企业微信格式
  // 这是一条引用/回复消息：
  // This is a quote/reply:

  /* 另外一种格式 微信格式
「USER：QUOTE」
- - - - - - - - - - - - - - -
CONTENT
*/

  {
    const m =
      msg.match(
        /^(这是一条引用\/回复消息：|This is a quote\/reply:)\n["“](?<user>[^\n]+)[：:]\s?\n(?<quote>.*?)[”"]\n-{6}\n(?<content>.*)$/s,
      ) || msg.match(/^「(?<user>[^\n]+)：\n?(?<quote>.*?)」\n-( -){14}\n(?<content>.+)$/s);
    if (m) {
      return {
        user: m.groups?.user!,
        quote: m.groups?.quote!,
        content: m.groups?.content!,
      };
    }
  }
  return {
    content: msg,
  };
}

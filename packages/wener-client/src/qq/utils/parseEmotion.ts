import Emotions from './emotions.json' with { type: 'json' };

export function getEmotions(): Array<Emotion> {
  return Emotions;
}

type Element = string | Emotion;
type Emotion = { id: number; cn: string; en?: string; alias?: string[]; emoji?: string };

let regex: RegExp;
let _lookup: { [key: string]: Emotion };

/**
 * Parse emotion text to elements
 *
 * @see {https://bot.q.qq.com/wiki/develop/api/openapi/emoji/model.html QQ Bot}
 * @see {https://pub.idqqimg.com/smartqq/js/mq.js WebQQ Source}
 */
export function parseEmotion(message: string): Array<Element> {
  if (!message) return [];

  if (!_lookup) {
    _lookup = getEmotions().reduce(
      (c, v) => {
        c[v.cn] = v;
        v.en && (c[v.en] = v);
        v.alias && v.alias.forEach((a) => (c[a] = v));
        return c;
      },
      {} as { [key: string]: Emotion },
    );
  }
  if (!regex) {
    let all = Object.keys(_lookup).sort().join('|');
    regex = new RegExp(`\\[(${all})]`, 'ig');
  }

  const o: Element[] = [];
  let m;
  let last = 0;
  while ((m = regex.exec(message))) {
    const pre = message.substring(last, m.index);
    if (pre) {
      o.push(pre);
    }
    const text = m[1];
    o.push(_lookup[text] || m[0]);
    last = m.index + m[0].length;
  }
  const rest = message.substring(last);
  if (rest) {
    o.push(rest);
  }
  // 动态构建正则保障了绝对匹配
  // if (merge) {
  //   return o.reduce((c, v) => {
  //     const lastIndex = c.length - 1;
  //     const last = c[lastIndex];
  //     if (typeof v === 'string' && typeof last === 'string') {
  //       c[lastIndex] = last + v;
  //     } else {
  //       c.push(v);
  //     }
  //     return c;
  //   }, [] as Element[]);
  // }
  return o;
}

type Mention = {
  start: number;
  end: number;
  mention: string;
};
type Element = Mention | string;

export function parseMention(s: string): Array<Element> {
  if (!s) return [];

  const regex = /@(?<mention>\S+?)\u2005/g;
  // const m = s.matchAll();
  const o: Array<Element> = [];
  let m;
  let last = 0;
  while ((m = regex.exec(s))) {
    const pre = s.substring(last, m.index);
    if (pre) {
      o.push(pre);
    }

    o.push({ start: m.index, end: m.index + m[0].length, mention: m.groups?.mention || '' });
    last = m.index + m[0].length;
  }
  const rest = s.substring(last);
  if (rest) {
    o.push(rest);
  }

  return o;
}

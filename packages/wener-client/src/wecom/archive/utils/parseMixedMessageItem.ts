import type { MixedMessageItem, ParsedMixedMessageItem } from '../types';

export function parseMixedMessageItem(v: MixedMessageItem | ParsedMixedMessageItem): ParsedMixedMessageItem {
  const { type, content } = v;
  return {
    type,
    content: typeof content === 'string' ? JSON.parse(content) : content,
  } as any;
}

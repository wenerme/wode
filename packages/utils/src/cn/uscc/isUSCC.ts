import { USCC } from './USCC';

/**
 * USCC - 统一社会信用代码
 */
export function isUSCC(s: string) {
  return USCC.get().verify(s);
}

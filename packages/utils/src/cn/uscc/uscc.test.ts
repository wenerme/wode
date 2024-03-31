import { expect, test } from 'vitest';
import { isUSCC } from './isUSCC';
import { Mod31Checksum } from './Mod31Checksum';
import { USCC } from './USCC';

test('uscc', () => {
  let cs = Mod31Checksum.get();

  // 阿里云计算
  expect(cs.verify('91330106673959654P')).toBeTruthy();
  expect(cs.generate('91330106673959654')).toBe('P');

  expect(isUSCC('91330106673959654P')).toBeTruthy();

  console.log(USCC.get().parse('91330106673959654P'));
});

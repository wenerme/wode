import { expect, test } from 'vitest';
import { isUSCC } from './isUSCC';
import { Mod31 } from './Mod31';
import { USCC } from './USCC';

test('uscc', () => {
  let cs = Mod31;

  // 阿里云计算
  expect(cs.validate('91330106673959654P')).toBeTruthy();
  expect(cs.generate('91330106673959654')).toBe('P');

  expect(isUSCC('91330106673959654P')).toBeTruthy();

  console.log(USCC.parse('91330106673959654P'));
});

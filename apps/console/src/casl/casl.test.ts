import * as console from 'node:console';
import { fieldPatternMatcher } from '@casl/ability';
import { expect, test } from 'vitest';
import { buildUserAbility } from '@/casl/casl';

test('casl', () => {
  console.log(fieldPatternMatcher<string>(['/a/*', '/about/?'])('/about'));
  const builder = buildUserAbility({
    id: '1',
    roles: ['user'],
  });
  console.log(builder.rules);

  let ab = builder.build();
  let { can } = ab;
  can = can.bind(ab);
  expect(can('view', 'page', '/about')).toBe(true);
  expect(can('view', 'page', '/about/')).toBe(true);
});

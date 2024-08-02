import { assert, expect, test } from 'vitest';
import { Mod11 } from './Mod11';
import { ResidentIdNumber } from './ResidentIdNumber';

test('id', (t) => {
  const ids = ['11010519491231002X', '11010219840406970X'];

  let cs = Mod11;
  for (const id of ids) {
    assert.equal(cs.generate(id.slice(0, -1)), id.at(-1));
  }

  let parse = ResidentIdNumber.parse(ids[0]);
  expect(parse?.toObject()).toMatchObject({
    division: '110105',
    birthDate: new Date('1949-12-31'),
    sequence: 2,
    checksum: 'X',
  });
});

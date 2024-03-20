import { test, assert, expect } from 'vitest';
import { Mod11Checksum } from './Mod11Checksum';
import { ResidentIdNumber } from './ResidentIdNumber';

test('id', (t) => {
  const ids = ['11010519491231002X', '11010219840406970X'];

  let cs = Mod11Checksum.get();
  for (const id of ids) {
    assert.equal(cs.generate(id.slice(0, -1)), id.at(-1));
  }

  let parse = ResidentIdNumber.get().parse(ids[0]);
  expect(parse?.toObject()).toEqual({
    division: '110105',
    date: new Date('1949-12-31'),
    sequence: 2,
    checksum: 'X',
  });
});

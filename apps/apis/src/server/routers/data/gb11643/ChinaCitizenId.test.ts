import dayjs from 'dayjs';
import { test, assert } from 'vitest';
import { ChinaCitizenId } from './ChinaCitizenId';

test('ChinaCitizenId', (t) => {
  const input = '11010519491231002X';
  const parsed = ChinaCitizenId.parse(input);
  const { division, sequence, sum, valid, date, gender } = parsed;
  assert.deepEqual(
    {
      division,
      sequence,
      sum,
      valid,
      date,
      gender,
      raw: parsed.toString(),
      next: parsed.next().toString(),
      prev: parsed.prev().toString(),
    },
    {
      sum: 'X',
      division: '110105',
      gender: 'female',
      sequence: 2,
      valid: true,
      date: dayjs('1949-12-31'),
      prev: '110105194912310011', // 001
      raw: input, // 002
      next: '110105194912310038', // 003
    },
  );

  for (let i = 0; i < 100; i++) {
    const id = ChinaCitizenId.random();
    assert.isTrue(id.valid, id.toString());
  }
});

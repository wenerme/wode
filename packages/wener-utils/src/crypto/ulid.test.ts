import { expect, test } from 'vitest';
import { randomUUID } from '../web/randomUUID';
import { createULID, isULID, parseULID, ulid } from './ulid';

test('isULID', () => {
  for (const [a, b] of [
    [undefined, false],
    [null, false],
    ['', false],
    [randomUUID(), false],
    [ulid(), true],
  ] as const) {
    expect(isULID(a), `${a} -> ${b}`).toEqual(b);
  }
});

test('ulid', () => {
  // monotonic
  {
    let lastTime = 0;
    const ulid = createULID({
      now: () => {
        lastTime ||= Date.now();
        return lastTime;
      },
    });

    const ulid1 = ulid();
    expect(parseULID(ulid1).timestamp).toBe(lastTime);
    expect(isULID(ulid1), ulid1).toBeTruthy();

    const ulid2 = ulid();
    expect(ulid1 < ulid2).toBeTruthy();
    expect(isULID(ulid2), ulid2).toBeTruthy();
    expect(parseULID(ulid2).timestamp).toBe(lastTime);
  }

  {
    const next = createULID();
    expect(isULID(next().toLowerCase())).toBeTruthy();
    expect(isULID('ttttttttttrrrrrrrrrrrrrrrr')).toBeTruthy();
  }
});

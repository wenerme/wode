import test from 'ava';
import { createULID, isULID, parseULID } from './ulid';

test('ulid', (t) => {
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
    t.is(parseULID(ulid1).timestamp, lastTime);
    t.true(isULID(ulid1), ulid1);

    const ulid2 = ulid();
    t.true(ulid1 < ulid2);
    t.true(isULID(ulid2), ulid2);
    t.is(parseULID(ulid2).timestamp, lastTime);
  }

  {
    const next = createULID();
    t.true(isULID(next().toLowerCase()));
    t.true(isULID('ttttttttttrrrrrrrrrrrrrrrr'));
  }
});

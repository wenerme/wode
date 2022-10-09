import test from 'ava';
import { createULID, parseULID } from './ulid';

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
    t.is(parseULID(ulid1).time, lastTime);

    const ulid2 = ulid();
    t.true(ulid1 < ulid2);
    t.is(parseULID(ulid2).time, lastTime);
  }
});

import { inspect } from 'node:util';
import { describe, expect, test } from 'vitest';
import { Currents } from './Currents';

describe('Currents', () => {
  test('Basic', () => {
    const V1 = Currents.create<string, string>('abc');
    const V2 = Currents.create<string, string>('V2');
    const log = (...msg: any[]) =>
      console.log(...msg, `\n\tStore #${hashid(Currents.store)} ${inspect(Currents.store)}`);
    Currents.run(() => {
      V1.set('1');
      expect(V1.get()).toEqual('1');

      log(`T1 Start`);
      Currents.run(() => {
        expect(V1.get()).toEqual('1');
        V1.set('2');
        expect(V1.get()).toEqual('2');
      });
      expect(V1.get()).toEqual('1');
      log(`T1 Done`);

      //
      V2.set('2');
      expect(V2.get()).toEqual('2');

      log(`T2 Start`);
      {
        let map = new Map(Object.entries({ [V1.key]: 'X' }));
        Currents.run(
          () => {
            log(`T2 MAP #${hashid(map)} ${inspect(map)}`);

            expect(V1.get()).toEqual('X');
            V1.set('Y');
            expect(V1.get()).toEqual('Y');
            expect(Currents.store).toEqual(map);
            expect(map.get(V1.key)).toEqual('Y');
            // inherit
            expect(V2.get()).toEqual('2');
          },
          {
            store: map,
          },
        );
      }
      log(`T2 Done`);

      expect(V1.get()).toEqual('1');
      expect(V2.get()).toEqual('2');

      Currents.run(
        () => {
          expect(V1.get()).toEqual(undefined);
          expect(V2.get()).toEqual(undefined);
          V2.set('3');
        },
        {
          inherit: false,
        },
      );
      expect(V2.get()).toEqual('2');
    });
  });

  test('run return', async () => {
    let n = 1;
    expect(
      await Currents.run(async () => {
        n = 2;
        return 3;
      }),
    ).toEqual(3);
    expect(n).toEqual(2);
  });
});

let _id = 1;
let _m = new WeakMap();

function hashid(k: WeakKey | undefined) {
  if (k === undefined) {
    return 0;
  }
  if (!_m.has(k)) {
    _m.set(k, _id++);
  }
  return _m.get(k);
}

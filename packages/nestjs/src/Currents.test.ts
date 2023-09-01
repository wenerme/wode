import { expect, test } from 'vitest';
import { Currents } from './Currents';

test('Currents', () => {
  const val = Currents.create<string>('abc');
  Currents.run(() => {
    val.set('123');
    expect(val.get()).toEqual('123');
    Currents.run(() => {
      expect(val.get()).toEqual('123');
      val.set('456');
      expect(val.get()).toEqual('456');
    });
    expect(val.get()).toEqual('123');

    Currents.run(
      () => {
        expect(val.get()).toEqual(undefined);
      },
      {
        inherit: false,
      },
    );
  });
});

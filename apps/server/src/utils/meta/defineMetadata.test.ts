import { expect, test } from 'vitest';
import { createMetadataKey, defineMetadata, getMetadata } from '@/utils/meta/defineMetadata';

test('defineMetadata', () => {
  const key = createMetadataKey<string>('name');

  const user = {
    metadata: {},
  };

  defineMetadata(user, key, 'wener');

  expect(user.metadata).toEqual({ name: 'wener' });
  expect(getMetadata(user, key)).toEqual('wener');
});

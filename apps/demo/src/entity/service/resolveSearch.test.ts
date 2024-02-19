import { test } from 'vitest';
import { resolveSearch } from './resolveSearch';

test('resolveSearch', () => {
  resolveSearch('18700000000', {
    onKeyLike: (s) => {
      console.log('onKeyLike', s);
    },
    onMobilePhone: (s) => {
      console.log('onMobilePhone', s);
    },
  });
});

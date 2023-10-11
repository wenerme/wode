import { bench, describe } from 'vitest';
import { md5 } from './md5';
import { createHash } from 'node:crypto';

describe('md5', () => {
  const dataset = new Array(10000).fill(0).map((_, i) => String(Math.random() * i));
  let iterations = 0
  bench('js', function() {
    iterations++
    md5(dataset[iterations % dataset.length]);
  }, {
    iterations: 10000,
  });

  bench('native', function() {
    iterations++
    createHash('md5').update(dataset[iterations % dataset.length]).digest('hex');
  }, {
    iterations: 10000,
  });
});

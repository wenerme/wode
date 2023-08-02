import { test } from 'vitest';
import { createLogger } from './slog';

test('slog', () => {
  const log = createLogger();
  log.info('hello');
  log.debug('hello', { name: 'wener', age: 18 });
});

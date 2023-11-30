import { test } from 'vitest';
import { App } from './App';

test('App', async ({}) => {
  console.log(`App`, JSON.stringify(App, null, 2));
});

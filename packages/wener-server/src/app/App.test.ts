import { test } from 'vite-plus/test';
import { App } from './App';

test('App', async (_ctx) => {
	console.log(`App`, JSON.stringify(App, null, 2));
});

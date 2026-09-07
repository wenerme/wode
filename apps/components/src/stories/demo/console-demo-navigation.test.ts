import { describe, expect, it } from 'vite-plus/test';
import { dataListPages, isDataListPage, type DemoPage } from './console-demo-navigation';

describe('console demo navigation surfaces', () => {
	it('classifies every routed resource page as a data list', () => {
		expect(dataListPages).toEqual([
			'account',
			'contact',
			'order',
			'opportunity',
			'lead',
			'form',
			'admin-user',
			'meta-tenant',
			'meta-user',
		]);
		for (const page of dataListPages) expect(isDataListPage(page)).toBe(true);
	});

	it.each<DemoPage>(['home', 'files', 'workspace', 'admin-settings', 'preferences', 'user-system'])(
		'keeps %s outside data list layout ownership',
		(page) => expect(isDataListPage(page)).toBe(false),
	);
});

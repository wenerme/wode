import { describe, expect, it } from 'vite-plus/test';
import { GrafanaHeaderNames, GrafanaMcpServerHandlerDef } from './def';

describe('GrafanaMcpServerHandlerDef', () => {
	it('resolves auth and preserves extra headers', () => {
		const config = GrafanaMcpServerHandlerDef.resolveConfig(
			{
				type: 'grafana',
				url: 'http://grafana.local',
				serviceAccountToken: 'abc',
				headers: {
					[GrafanaHeaderNames.ORG_ID]: '9',
					'X-Custom': 'yes',
				},
			},
			new Headers(),
		);

		expect(config).toEqual({
			url: 'http://grafana.local',
			serviceAccountToken: 'abc',
			orgId: 9,
			username: undefined,
			password: undefined,
			timeoutMs: undefined,
			extraHeaders: {
				'X-Custom': 'yes',
			},
		});
	});
});

import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';
import { parseCliConfig, resolveCliContext } from './CliConfig';

describe('configuration crossing execution realms', () => {
	it('accepts plain configuration from another realm and keeps service extensions', () => {
		const input: unknown = runInNewContext(`({
			services: [{name: 'remote', type: 'http', baseUrl: 'https://example.com', future: {retained: true}}],
			contexts: {local: {services: []}}, futureRoot: {retained: true}
		})`);
		const config = parseCliConfig(input);
		expect(config.futureRoot).toEqual({ retained: true });
		expect(resolveCliContext(config).services.remote).toMatchObject({ provider: 'http', future: { retained: true } });
	});

	it('continues to reject class instances and non-record objects from another realm', () => {
		for (const source of ['new Date()', 'new Map()', 'new (class Config { constructor() { this.services = [] } })()']) {
			expect(() => parseCliConfig(runInNewContext(source))).toThrow('Invalid CLI configuration');
		}
	});
});

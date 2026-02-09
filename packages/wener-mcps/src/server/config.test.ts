import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { loadConfig } from './config';
import { writeFileSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { resolve, join } from 'node:path';
import YAML from 'yaml';
import { tmpdir } from 'node:os';

describe('Config Loading', () => {
	// Use a unique temp directory for each test to avoid conflicts
	let testDir: string;

	beforeEach(() => {
		testDir = join(tmpdir(), `mcps-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
		mkdirSync(testDir, { recursive: true });
	});

	afterEach(() => {
		// Cleanup test directory
		if (existsSync(testDir)) {
			rmSync(testDir, { recursive: true, force: true });
		}
	});

	describe('YAML config loading', () => {
		it('should load YAML config from .mcps.yaml', () => {
			const config = {
				servers: {
					'test-relay': {
						type: 'relay',
						url: 'https://example.com/mcp',
					},
				},
				models: [
					{
						name: 'test-model',
						baseUrl: 'http://localhost:8080',
						adapter: 'openai',
					},
				],
			};

			// Write YAML config
			writeFileSync(resolve(testDir, '.mcps.yaml'), YAML.stringify(config));

			const loaded = loadConfig(testDir);
			expect(loaded.servers['test-relay']).toBeDefined();
			expect(loaded.servers['test-relay'].type).toBe('relay');
			expect(loaded.models).toHaveLength(1);
			expect(loaded.models?.[0].name).toBe('test-model');
			expect(loaded.models?.[0].baseUrl).toBe('http://localhost:8080');
		});

		it('should prefer YAML over JSON when both exist', () => {
			// Write JSON config (lower priority)
			writeFileSync(
				resolve(testDir, '.mcps.json'),
				JSON.stringify({
					servers: {
						'json-server': { type: 'prometheus', url: 'http://json.example.com' },
					},
				}),
			);

			// Write YAML config (higher priority)
			writeFileSync(
				resolve(testDir, '.mcps.yaml'),
				YAML.stringify({
					servers: {
						'yaml-server': { type: 'relay', url: 'https://yaml.example.com' },
					},
				}),
			);

			const loaded = loadConfig(testDir);
			// Both servers should be present since configs are merged
			expect(loaded.servers['yaml-server']).toBeDefined();
			expect(loaded.servers['json-server']).toBeDefined();
		});

		it('should merge local config over base config', () => {
			// Write base config
			writeFileSync(
				resolve(testDir, '.mcps.yaml'),
				YAML.stringify({
					servers: {
						'base-server': { type: 'relay', url: 'https://base.example.com' },
					},
					models: [
						{
							name: 'base-model',
							baseUrl: 'http://base:8080',
							adapter: 'openai',
						},
					],
				}),
			);

			// Write local config (higher priority)
			writeFileSync(
				resolve(testDir, '.mcps.local.yaml'),
				YAML.stringify({
					servers: {
						'local-server': { type: 'prometheus', url: 'http://local.example.com' },
					},
					models: [
						{
							name: 'local-model',
							baseUrl: 'http://local:8080',
							adapter: 'anthropic',
						},
					],
				}),
			);

			const loaded = loadConfig(testDir);
			// Both servers should be present
			expect(loaded.servers['base-server']).toBeDefined();
			expect(loaded.servers['local-server']).toBeDefined();
			// Both models should be present
			expect(loaded.models).toHaveLength(2);
			expect(loaded.models?.find((m) => m.name === 'base-model')).toBeDefined();
			expect(loaded.models?.find((m) => m.name === 'local-model')).toBeDefined();
		});

		it('should override model by name in local config', () => {
			// Write base config
			writeFileSync(
				resolve(testDir, '.mcps.yaml'),
				YAML.stringify({
					models: [
						{
							name: 'shared-model',
							baseUrl: 'http://base:8080',
							adapter: 'openai',
						},
					],
				}),
			);

			// Write local config with same model name (should override)
			writeFileSync(
				resolve(testDir, '.mcps.local.yaml'),
				YAML.stringify({
					models: [
						{
							name: 'shared-model',
							baseUrl: 'http://local:9090',
							adapter: 'anthropic',
						},
					],
				}),
			);

			const loaded = loadConfig(testDir);
			// Only one model with the name
			expect(loaded.models).toHaveLength(1);
			expect(loaded.models?.[0].name).toBe('shared-model');
			expect(loaded.models?.[0].baseUrl).toBe('http://local:9090');
			expect(loaded.models?.[0].adapter).toBe('anthropic');
		});
	});
});

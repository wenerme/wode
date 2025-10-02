#!/usr/bin/env tsx
import { getFeishuDevDocsConfig, validateFeishuDevDocsConfig } from './src/server/config';
import { createFeishuDevDocsServiceImpl } from './src/devdocs/createFeishuDevDocsServiceImpl';
import consola from 'consola';
import * as fs from 'fs/promises';
import * as path from 'path';
import { homedir } from 'os';

const logger = consola.withTag('cache-test');

async function testCache() {
	try {
		logger.info('🧪 Testing Feishu DevDocs MCP with cache...');

		// Get configuration
		const config = getFeishuDevDocsConfig();
		validateFeishuDevDocsConfig(config);

		logger.info('Configuration:', {
			domain: config.domain,
			cache: config.cache
		});

		// Create service implementation
		const service = createFeishuDevDocsServiceImpl({ config });

		// Test health check
		logger.info('Testing health check...');
		const health = await service.healthCheck();
		logger.info('Health check result:', health);

		if (health.status === 'unhealthy') {
			logger.error('❌ Health check failed, cannot test cache functionality');
			return;
		}

		// Test cache functionality
		const testQuery = 'API documentation';

		logger.info('🔍 First search (should hit API and cache result)...');
		const start1 = Date.now();
		const result1 = await service.recallDeveloperDocuments({ query: testQuery });
		const time1 = Date.now() - start1;
		logger.info(`First search completed in ${time1}ms, found ${result1.resultCount} results`);

		if (result1.resultCount > 0) {
			logger.info('Sample result:', result1.results[0].substring(0, 100) + '...');
		}

		logger.info('🔍 Second search (should use cached result)...');
		const start2 = Date.now();
		const result2 = await service.recallDeveloperDocuments({ query: testQuery });
		const time2 = Date.now() - start2;
		logger.info(`Second search completed in ${time2}ms, found ${result2.resultCount} results`);

		// Check cache directory
		const cacheDir = path.join(homedir(), '.cache', 'wener-feishu-devdocs-mcp');
		try {
			const files = await fs.readdir(cacheDir);
			const jsonFiles = files.filter(f => f.endsWith('.json'));
			logger.info(`📁 Cache directory contains ${jsonFiles.length} cache files`);

			if (jsonFiles.length > 0) {
				// Read one cache file to verify structure
				const cacheFile = path.join(cacheDir, jsonFiles[0]);
				const cacheContent = await fs.readFile(cacheFile, 'utf-8');
				const cacheEntry = JSON.parse(cacheContent);
				logger.info('📄 Cache entry structure:', {
					query: cacheEntry.query,
					timestamp: new Date(cacheEntry.timestamp).toISOString(),
					expiry: cacheEntry.expiry ? new Date(cacheEntry.expiry).toISOString() : 'none',
					resultsCount: cacheEntry.data?.results?.length || 0
				});
			}
		} catch (error) {
			logger.warn('Could not access cache directory:', error instanceof Error ? error.message : String(error));
		}

		// Compare timing - cache should be significantly faster
		if (time1 > time2) {
			logger.success(`✅ Cache working! Second request was ${Math.round(((time1 - time2) / time1) * 100)}% faster`);
		} else {
			logger.warn('⚠️  Second request was not faster - cache might not be working as expected');
		}

		logger.success('🎉 Cache test completed successfully!');

	} catch (error) {
		logger.error('❌ Cache test failed:', error instanceof Error ? error.message : String(error));
		process.exit(1);
	}
}

// Only run if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
	testCache();
}
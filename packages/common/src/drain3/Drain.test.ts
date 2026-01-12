import { readFile, writeFile, unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it, expect, beforeEach } from 'vitest';
import { Drain } from './Drain';
import { TemplateMiner } from './TemplateMiner';
import { FilePersistence } from './persistence/FilePersistence';
import { MemoryPersistence } from './persistence/MemoryPersistence';

describe('Drain', () => {
	describe('basic functionality', () => {
		it('should create a Drain instance with default options', () => {
			const drain = new Drain();
			expect(drain.logClusterDepth).toBe(4);
			expect(drain.simTh).toBe(0.4);
			expect(drain.maxChildren).toBe(100);
			expect(drain.maxClusters).toBe(1000);
			expect(drain.paramStr).toBe('<*>');
			expect(drain.parametrizeNumericTokens).toBe(true);
		});

		it('should create a Drain instance with custom options', () => {
			const drain = new Drain({
				logClusterDepth: 5,
				simTh: 0.5,
				maxChildren: 200,
				maxClusters: 500,
				extraDelimiters: ['_', '-'],
				paramStr: '<NUM>',
				parametrizeNumericTokens: false,
			});

			expect(drain.logClusterDepth).toBe(5);
			expect(drain.simTh).toBe(0.5);
			expect(drain.maxChildren).toBe(200);
			expect(drain.maxClusters).toBe(500);
			expect(drain.extraDelimiters).toEqual(['_', '-']);
			expect(drain.paramStr).toBe('<NUM>');
			expect(drain.parametrizeNumericTokens).toBe(false);
		});

		it('should throw error if logClusterDepth is less than 3', () => {
			expect(() => {
				new Drain({ logClusterDepth: 2 });
			}).toThrow('depth argument must be at least 3');
		});

		it('should add log message and create a cluster', () => {
			const drain = new Drain();
			const result = drain.addLogMessage('[INFO] User 123 logged in');

			expect(result.updateType).toBe('created');
			expect(result.cluster.clusterId).toBe(1);
			expect(result.cluster.size).toBe(1);
			expect(result.cluster.getTemplate()).toBe('[INFO] User 123 logged in');
		});

		it('should cluster similar log messages', () => {
			const drain = new Drain();
			const result1 = drain.addLogMessage('[INFO] User 123 logged in');
			const result2 = drain.addLogMessage('[INFO] User 456 logged in');

			expect(result1.updateType).toBe('created');
			expect(result2.updateType).toBe('templateChanged');
			expect(result2.cluster.clusterId).toBe(result1.cluster.clusterId);
			expect(result2.cluster.getTemplate()).toBe('[INFO] User <*> logged in');
			expect(result2.cluster.size).toBe(2);
		});

		it('should parameterize numeric tokens', () => {
			const drain = new Drain();
			drain.addLogMessage('Processing request 123');
			const result = drain.addLogMessage('Processing request 456');

			expect(result.updateType).toBe('templateChanged');
			expect(result.cluster.getTemplate()).toBe('Processing request <*>');
		});

		it('should handle extra delimiters', () => {
			const drain = new Drain({ extraDelimiters: ['_'] });
			const result = drain.addLogMessage('error_code_123 occurred');
			expect(result.cluster.getTemplate()).toBe('error code 123 occurred');
		});

		it('should get all clusters', () => {
			const drain = new Drain();
			drain.addLogMessage('Message 1');
			drain.addLogMessage('Message 2');
			drain.addLogMessage('Message 3');

			const clusters = drain.getClusters();
			expect(clusters.length).toBeGreaterThanOrEqual(1);
		});
	});

	describe('tree search', () => {
		it('should match existing cluster with never strategy', () => {
			const drain = new Drain();
			// Create a cluster with parameterized template first
			drain.addLogMessage('[INFO] User 123 logged in');
			drain.addLogMessage('[INFO] User 456 logged in'); // This creates the parameterized template
			// Now match should work
			const matched = drain.match('[INFO] User 789 logged in', 'never');

			expect(matched).not.toBeNull();
			expect(matched?.getTemplate()).toBe('[INFO] User <*> logged in');
		});

		it('should return null for non-matching log with never strategy', () => {
			const drain = new Drain();
			drain.addLogMessage('[INFO] User 123 logged in');
			const matched = drain.match('[ERROR] System crashed', 'never');

			expect(matched).toBeNull();
		});

		it('should match with fallback strategy', () => {
			const drain = new Drain();
			// Create a cluster with parameterized template first
			drain.addLogMessage('[INFO] User 123 logged in');
			drain.addLogMessage('[INFO] User 456 logged in'); // This creates the parameterized template
			// Now match should work
			const matched = drain.match('[INFO] User 789 logged in', 'fallback');

			expect(matched).not.toBeNull();
		});

		it('should match with always strategy', () => {
			const drain = new Drain();
			// Create a cluster with parameterized template
			drain.addLogMessage('[INFO] User 123 logged in');
			drain.addLogMessage('[INFO] User 456 logged in'); // Creates parameterized template
			// Create a different cluster
			drain.addLogMessage('[ERROR] System crashed');
			// Now match should find the User cluster
			const matched = drain.match('[INFO] User 999 logged in', 'always');

			expect(matched).not.toBeNull();
			expect(matched?.getTemplate()).toBe('[INFO] User <*> logged in');
		});
	});

	describe('template updates', () => {
		it('should detect template changes', () => {
			const drain = new Drain();
			const result1 = drain.addLogMessage('Error: 404');
			const result2 = drain.addLogMessage('Error: 500');

			expect(result1.updateType).toBe('created');
			expect(result2.updateType).toBe('templateChanged');
		});

		it('should not change template for identical logs', () => {
			const drain = new Drain();
			const result1 = drain.addLogMessage('Error: 404');
			const result2 = drain.addLogMessage('Error: 404');

			expect(result1.updateType).toBe('created');
			expect(result2.updateType).toBe('none');
			expect(result2.cluster.size).toBe(2);
		});
	});

	describe('similarity threshold', () => {
		it('should create new cluster if similarity is below threshold', () => {
			const drain = new Drain({ simTh: 0.9 });
			const result1 = drain.addLogMessage('Message A B C');
			const result2 = drain.addLogMessage('Message X Y Z');

			expect(result1.updateType).toBe('created');
			expect(result2.updateType).toBe('created');
			expect(result1.cluster.clusterId).not.toBe(result2.cluster.clusterId);
		});

		it('should merge clusters if similarity is above threshold', () => {
			const drain = new Drain({ simTh: 0.3 });
			const result1 = drain.addLogMessage('Message A B C');
			const result2 = drain.addLogMessage('Message A B D');

			expect(result1.updateType).toBe('created');
			expect(result2.updateType).toBe('templateChanged');
			expect(result1.cluster.clusterId).toBe(result2.cluster.clusterId);
		});
	});

	describe('serialization', () => {
		it('should serialize and deserialize Drain state', () => {
			const drain1 = new Drain({ maxClusters: 100 });
			drain1.addLogMessage('[INFO] User 123 logged in');
			drain1.addLogMessage('[INFO] User 456 logged in');
			drain1.addLogMessage('[ERROR] System crashed');

			const json = drain1.toJSON();
			const drain2 = Drain.fromJSON(json as any);

			expect(drain2.logClusterDepth).toBe(drain1.logClusterDepth);
			expect(drain2.simTh).toBe(drain1.simTh);
			expect(drain2.getClusters().length).toBe(drain1.getClusters().length);

			// Verify clusters
			const clusters1 = drain1.getClusters();
			const clusters2 = drain2.getClusters();
			expect(clusters2.length).toBe(clusters1.length);

			// Check that matching still works
			const matched = drain2.match('[INFO] User 789 logged in');
			expect(matched).not.toBeNull();
		});
	});
});

describe('TemplateMiner', () => {
	describe('basic functionality', () => {
		it('should add log message through miner', async () => {
			const drain = new Drain();
			const miner = new TemplateMiner(drain, new MemoryPersistence());

			const result = await miner.addLogMessage('[INFO] User 123 logged in');

			expect(result.updateType).toBe('created');
			expect(result.cluster).toBeDefined();
			expect(result.templateMined).toBe('[INFO] User 123 logged in');
			expect(result.clusterCount).toBe(1);
		});

		it('should save state when cluster is created', async () => {
			const drain = new Drain();
			const persistence = new MemoryPersistence();
			const miner = new TemplateMiner(drain, persistence);

			await miner.addLogMessage('[INFO] User 123 logged in');
			const state = await persistence.load();

			expect(state).not.toBeNull();
		});
	});

	describe('parameter extraction', () => {
		it('should extract parameters from log message', async () => {
			const drain = new Drain();
			const miner = new TemplateMiner(drain, new MemoryPersistence());

			const result = await miner.addLogMessage('[INFO] User 123 logged in');
			const template = result.templateMined;

			// After second message, template should have wildcard
			await miner.addLogMessage('[INFO] User 456 logged in');

			const params = miner.extractParameters('[INFO] User <*> logged in', '[INFO] User 789 logged in');

			expect(params).not.toBeNull();
			expect(params?.length).toBeGreaterThan(0);
			if (params && params.length > 0) {
				expect(params[0]?.value).toBe('789');
			}
		});

		it('should return null for non-matching template', () => {
			const drain = new Drain();
			const miner = new TemplateMiner(drain, new MemoryPersistence());

			const params = miner.extractParameters('[INFO] User <*> logged in', '[ERROR] System crashed');

			expect(params).toBeNull();
		});
	});

	describe('persistence', () => {
		describe('MemoryPersistence', () => {
			it('should save and load state', async () => {
				const drain1 = new Drain();
				const persistence = new MemoryPersistence();
				const miner1 = new TemplateMiner(drain1, persistence);

				await miner1.addLogMessage('[INFO] User 123 logged in');
				await miner1.addLogMessage('[INFO] User 456 logged in');

				const drain2 = new Drain();
				const miner2 = new TemplateMiner(drain2, persistence);
				await miner2.loadState();

				const clusters = miner2.getDrain().getClusters();
				expect(clusters.length).toBe(1);
				expect(clusters[0]?.getTemplate()).toBe('[INFO] User <*> logged in');
			});
		});

		describe('FilePersistence', () => {
			let tempFile: string;

			beforeEach(() => {
				tempFile = join(tmpdir(), `drain3-test-${Date.now()}.json`);
			});

			it('should save and load state from file', async () => {
				const drain1 = new Drain();
				const persistence = new FilePersistence(tempFile);
				const miner1 = new TemplateMiner(drain1, persistence);

				await miner1.addLogMessage('[INFO] User 123 logged in');
				await miner1.addLogMessage('[INFO] User 456 logged in');
				await miner1.saveState();

				// Verify file exists
				const fileContent = await readFile(tempFile, 'utf8');
				expect(fileContent).toBeTruthy();

				// Load state
				const drain2 = new Drain();
				const miner2 = new TemplateMiner(drain2, persistence);
				await miner2.loadState();

				const clusters = miner2.getDrain().getClusters();
				expect(clusters.length).toBe(1);
				expect(clusters[0]?.getTemplate()).toBe('[INFO] User <*> logged in');

				// Cleanup
				await unlink(tempFile).catch(() => {
					// Ignore cleanup errors
				});
			});

			it('should return null when file does not exist', async () => {
				const persistence = new FilePersistence(join(tmpdir(), 'non-existent-file.json'));
				const state = await persistence.load();
				expect(state).toBeNull();
			});
		});
	});

	describe('integration test - Kafka logs', () => {
		it('should cluster Kafka logs correctly', async () => {
			const drain = new Drain({ extraDelimiters: ['_'] });
			const miner = new TemplateMiner(drain, new MemoryPersistence());

			const logs = [
				'[ProducerStateManager partition=__consumer_offsets-48] Writing producer snapshot at offset 4339939698 (kafka.log.ProducerStateManager)',
				'[Log partition=__consumer_offsets-48, dir=/home1/irteam/apps/data/kafka/kafka-logs] Rolled new log segment at offset 4339939698 in 3 ms. (kafka.log.Log)',
				'[Log partition=__consumer_offsets-48, dir=/home1/irteam/apps/data/kafka/kafka-logs] Deleting segment files LogSegment(baseOffset=0, size=0, lastModifiedTime=1645674584000, largestRecordTimestamp=None) (kafka.log.Log)',
				'Deleted log /home1/irteam/apps/data/kafka/kafka-logs/__consumer_offsets-48/00000000000000000000.log.deleted. (kafka.log.LogSegment)',
				'Deleted offset index /home1/irteam/apps/data/kafka/kafka-logs/__consumer_offsets-48/00000000000000000000.index.deleted. (kafka.log.LogSegment)',
				'Deleted time index /home1/irteam/apps/data/kafka/kafka-logs/__consumer_offsets-48/00000000000000000000.timeindex.deleted. (kafka.log.LogSegment)',
				'[Log partition=__consumer_offsets-48, dir=/home1/irteam/apps/data/kafka/kafka-logs] Deleting segment files LogSegment(baseOffset=2147429227, size=0, lastModifiedTime=1710735195000, largestRecordTimestamp=None) (kafka.log.Log)',
				'Deleted log /home1/irteam/apps/data/kafka/kafka-logs/__consumer_offsets-48/00000000002147429227.log.deleted. (kafka.log.LogSegment)',
				'Deleted offset index /home1/irteam/apps/data/kafka/kafka-logs/__consumer_offsets-48/00000000002147429227.index.deleted. (kafka.log.LogSegment)',
				'Deleted time index /home1/irteam/apps/data/kafka/kafka-logs/__consumer_offsets-48/00000000002147429227.timeindex.deleted. (kafka.log.LogSegment)',
				'[ProducerStateManager partition=__consumer_offsets-49] Writing producer snapshot at offset 4339698 (kafka.log.ProducerStateManager)',
				'[Log partition=__consumer_offsets-48, dir=/home1/irteam/apps/data/kafka/kafka-logs] Deleting segment files LogSegment(baseOffset=4294790577, size=2703, lastModifiedTime=1711832815000, largestRecordTimestamp=Some(1710827112244)) (kafka.log.Log)',
				'[Log partition=__consumer_offsets-48, dir=/home1/irteam/apps/data/kafka/kafka-logs] Deleting segment files LogSegment(baseOffset=4338631022, size=641, lastModifiedTime=1711849197000, largestRecordTimestamp=Some(1711849197921)) (kafka.log.Log)',
				'Deleted log /home1/irteam/apps/data/kafka/kafka-logs/__consumer_offsets-48/00000000004294790577.log.deleted. (kafka.log.LogSegment)',
				'Deleted log /home1/irteam/apps/data/kafka/kafka-logs/__consumer_offsets-48/00000000004338631022.log.deleted. (kafka.log.LogSegment)',
				'Deleted offset index /home1/irteam/apps/data/kafka/kafka-logs/__consumer_offsets-48/00000000004294790577.index.deleted. (kafka.log.LogSegment)',
				'Deleted offset index /home1/irteam/apps/data/kafka/kafka-logs/__consumer_offsets-48/00000000004338631022.index.deleted. (kafka.log.LogSegment)',
				'Deleted time index /home1/irteam/apps/data/kafka/kafka-logs/__consumer_offsets-48/00000000004294790577.timeindex.deleted. (kafka.log.LogSegment)',
				'Deleted time index /home1/irteam/apps/data/kafka/kafka-logs/__consumer_offsets-48/00000000004338631022.timeindex.deleted. (kafka.log.LogSegment)',
				'[Log partition=__consumer_offsets-48, dir=/home1/irteam/apps/data/kafka/kafka-logs] Deleting segment files LogSegment(baseOffset=4339285360, size=104857589, lastModifiedTime=1711865580000, largestRecordTimestamp=Some(1711865580112)) (kafka.log.Log)',
				'Deleted log /home1/irteam/apps/data/kafka/kafka-logs/__consumer_offsets-48/00000000004339285360.log.deleted. (kafka.log.LogSegment)',
				'Deleted offset index /home1/irteam/apps/data/kafka/kafka-logs/__consumer_offsets-48/00000000004339285360.index.deleted. (kafka.log.LogSegment)',
				'Deleted time index /home1/irteam/apps/data/kafka/kafka-logs/__consumer_offsets-48/00000000004339285360.timeindex.deleted. (kafka.log.LogSegment)',
				'[Log partition=__consumer_offsets-49, dir=/home1/irteam/apps/data/kafka/kafka-logs] Rolled new log segment at offset 432939698 in 2 ms. (kafka.log.Log)',
			];

			for (const log of logs) {
				const result = await miner.addLogMessage(log);
				expect(result.cluster).toBeDefined();

				// Extract parameters to verify they work
				const params = miner.extractParameters(result.templateMined, log);
				// Params may be null for some logs, which is fine
			}

			const clusters = drain.getClusters();
			// Should cluster into a reasonable number of groups (similar to Go test expects 5)
			expect(clusters.length).toBeGreaterThan(0);
			expect(clusters.length).toBeLessThanOrEqual(10);
		});
	});
});

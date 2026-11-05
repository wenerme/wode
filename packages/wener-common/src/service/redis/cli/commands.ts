import type { z } from 'zod';
import { type ServiceCliDefinition, type ServiceCliInputContext, type ServiceCliOptions, serviceCliString } from '../../cli/ServiceCliDefinition';
import { ServiceCliInputError } from '../../cli/ServiceCliInputError';
import type { RedisServiceClient } from '../interface';
import { RedisFieldInputSchema, RedisRangeStreamInputSchema, RedisScanInputSchema } from '../schema';
import { redisCliTable, redisPingTable } from './output';
import { RedisCliPingError } from './RedisCliPingError';
import { scanAll } from './scan';

export const RedisCliHelpText = '\nExamples:\n' +
	'  woctl redis ping\n' +
	'  woctl redis get --service cache session:abc\n' +
	'  woctl redis ttl session:abc\n' +
	'  woctl redis type session:abc\n' +
	"  woctl redis scan --match 'user:*' --count 100\n" +
	"  woctl redis scan --all --match 'user:*' --count 100\n" +
	'  woctl redis hgetall user:1\n' +
	'  woctl redis xrange stream:events --start - --end + --count 20';
export const RedisCliDefinition: ServiceCliDefinition<RedisServiceClient> = {
	name: 'redis', aliases: ['valkey'], description: 'Redis datasource operations', helpText: RedisCliHelpText,
	commands: [
		{ name: 'info', aliases: ['ping'], description: 'Ping the Redis datasource', table: redisPingTable,
			prepare({ args }) {
				noArguments(args);
				return async (client, options) => { const result = await client.ping(options); if (!result.success) throw new RedisCliPingError(result); return result; };
			},
		},
		...([
			['get', 'GET a key value', 'get'], ['type', 'Get the TYPE of a key', 'getType'], ['ttl', 'Get the TTL of a key', 'getTtl'],
		] as const).map(([name, description, method]) => ({
			name, description, argument: 'key', table: redisCliTable(name),
			prepare(context: ServiceCliInputContext) {
				const input = keyInput(context.args);
				return async (client: RedisServiceClient, options: { signal?: AbortSignal }) => ({ ...(await client[method](input, options)), key: input.key });
			},
		})),
		{ name: 'scan', description: 'SCAN keys', table: redisCliTable('scan'), options: [
			{ name: 'cursor', description: 'Start cursor', default: '0' }, { name: 'match', description: 'MATCH glob pattern' },
			{ name: 'count', description: 'COUNT hint per batch', default: '100' }, { name: 'type', description: 'TYPE filter' },
			{ name: 'all', description: 'Follow SCAN cursors until cursor 0', type: 'boolean' },
		], prepare({ args, options }) {
			noArguments(args);
			const input = parseInput(RedisScanInputSchema, { cursor: serviceCliString(options, 'cursor') ?? '0', match: serviceCliString(options, 'match'), count: parseCount(options, 100), type: serviceCliString(options, 'type') });
			if (options.all !== undefined && typeof options.all !== 'boolean') throw new ServiceCliInputError('--all must be a boolean');
			return (client, callOptions) => options.all ? scanAll(client, input, callOptions) : client.scan(input, callOptions);
		} },
		{ name: 'hgetall', description: 'Get all fields and values of a hash', argument: 'key', table: redisCliTable('hgetall'),
			prepare({ args }) { const input = keyInput(args); return (client, options) => client.getHash(input, options); } },
		{ name: 'xrange', description: 'Read entries from a stream', argument: 'key', table: redisCliTable('xrange'), options: [
			{ name: 'start', description: 'Start ID', default: '-' }, { name: 'end', description: 'End ID', default: '+' },
			{ name: 'count', description: 'Max entries', default: '50' },
		], prepare({ args, options }) {
			const input = parseInput(RedisRangeStreamInputSchema, { ...keyInput(args), start: serviceCliString(options, 'start') ?? '-', end: serviceCliString(options, 'end') ?? '+', count: parseCount(options, 50) });
			return (client, callOptions) => client.rangeStream(input, callOptions);
		} },
	],
};
function noArguments(args: readonly string[]) { if (args.length) throw new ServiceCliInputError('Unexpected Redis positional argument'); }
function keyInput(args: readonly string[]) {
	if (args.length !== 1) throw new ServiceCliInputError('Exactly one key is required');
	return parseInput(RedisFieldInputSchema, { key: args[0] });
}
function parseCount(options: ServiceCliOptions, fallback: number) {
	const raw = serviceCliString(options, 'count');
	const value = raw === undefined ? fallback : Number(raw);
	if (!Number.isInteger(value) || value < 1 || value > 10_000) throw new ServiceCliInputError('--count must be an integer between 1 and 10000');
	return value;
}
function parseInput<T extends z.ZodType>(schema: T, value: unknown): z.output<T> {
	const parsed = schema.safeParse(value);
	if (parsed.success) return parsed.data;
	const issue = parsed.error.issues[0];
	throw new ServiceCliInputError(`Invalid ${issue?.path.join('.') || 'input'}: ${issue?.message ?? 'invalid value'}`);
}

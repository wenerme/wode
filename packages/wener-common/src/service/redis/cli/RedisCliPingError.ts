import type { RedisPingResult } from '../interface';

export class RedisCliPingError extends Error {
	override name = 'RedisCliPingError';
	readonly #result: RedisPingResult;
	constructor(result: RedisPingResult) { super('Redis ping failed'); this.#result = result; }
	get result() { return this.#result; }
}

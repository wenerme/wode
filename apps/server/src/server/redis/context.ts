import type Redis from 'ioredis';
import Redlock from 'redlock';
import { createRedis } from '@/server/redis/redis';

let _redis;

export function getRedis(): Redis {
	return (_redis ||= createRedis());
}

let _redlock: Redlock;

export function getRedlock(): Redlock {
	return (_redlock ||= new Redlock([getRedis()], {
		retryCount: 3,
		retryDelay: 200,
		retryJitter: 200,
		automaticExtensionThreshold: 500,
	}));
}

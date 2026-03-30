import 'reflect-metadata';
import type { INestApplicationContext } from '@nestjs/common';
import { getAppContext as getApplicationContext, setAppContext as setApplicationContext } from '../ApplicationContext';

export function setAppContext(ctx: INestApplicationContext) {
	setApplicationContext(ctx);
}

export function getAppContext<T extends INestApplicationContext = INestApplicationContext>(): T {
	return getApplicationContext<T>();
}

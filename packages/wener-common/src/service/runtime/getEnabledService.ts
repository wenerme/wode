import { type CliServiceConfig, isCliServiceEnabled } from '../config';
import type { ResolvedServiceContext } from './types';

/** 执行准入同时检查配置映射与启用映射，包括宿主手工构造的 context。 */
export function getEnabledService(context: ResolvedServiceContext, name: string): CliServiceConfig {
	const configured = context.configuredServices;
	if (configured && Object.hasOwn(configured, name) && !isCliServiceEnabled(configured[name]))
		throw new Error('Selected service is disabled');
	if (!Object.hasOwn(context.services, name)) throw new Error('Unknown service');
	const service = context.services[name];
	if (!isCliServiceEnabled(service)) throw new Error('Selected service is disabled');
	return service;
}

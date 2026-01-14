import type { EntityManager } from '@mikro-orm/core';
import { Logger } from '@nestjs/common';
import { getCurrentTenantId } from '../app';

const log = new Logger('CurrentTenantIdFilter');
export const CurrentTenantIdFilter = {
	name: 'CurrentTenantIdFilter',
	args: false,
	default: true,
	cond: (_: Record<string, unknown>, type: string, _em: EntityManager) => {
		const tid = getCurrentTenantId();
		if (!tid) {
			log.warn(`${type} without tenant`);
			return {};
		}
		// log.debug(`${type} by ${tid}`);
		return { tid };
	},
};

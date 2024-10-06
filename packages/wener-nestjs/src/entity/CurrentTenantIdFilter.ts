import type { Filter } from '@mikro-orm/core';
import { Logger } from '@nestjs/common';
import type { ArgumentsType } from 'vitest';
import { getCurrentTenantId } from '../app';

type FilterDef = ArgumentsType<typeof Filter>[0];
const log = new Logger('CurrentTenantIdFilter');
export const CurrentTenantIdFilter = {
  name: 'CurrentTenantIdFilter',
  args: false,
  default: true,
  cond: (_, type, em) => {
    const tid = getCurrentTenantId();
    if (!tid) {
      log.warn(`${type} without tenant`);
      return {};
    }
    // log.debug(`${type} by ${tid}`);
    return { tid };
  },
} satisfies FilterDef;

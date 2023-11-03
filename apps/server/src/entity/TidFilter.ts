import type { FilterDef } from '@mikro-orm/core/typings';
import { Logger } from '@nestjs/common';
import { getTenantId } from '../modules/tenant';

const log = new Logger('TidFilter');
export const TidFilter = {
  name: 'tenant',
  args: false,
  default: true,
  cond(_, type, em) {
    const tid = getTenantId();
    if (!tid) {
      log.warn(`${type} without tenant`);
      return {};
    }
    log.debug(`${type} by ${tid}`);
    return { tid };
  },
} satisfies FilterDef;

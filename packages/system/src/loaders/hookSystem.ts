import { createChildLogger, Logger } from '@wener/utils';
import { instantiatePackageProtocol } from '../hooks/instantiatePackageProtocol';
import { resolveBareSpecifier } from '../hooks/resolveBareSpecifier';
import { SystemJS } from '../utils/getGlobalSystem';

export function hookSystem({
  System,
  logger,
  hooks = true,
}: {
  System: SystemJS;
  logger: Logger;
  hooks: boolean | Array<[hook: (o: { System: SystemJS; logger: Logger }) => void, opts?: object]>;
}) {
  if (!hooks) {
    return;
  }
  if (Array.isArray(hooks)) {
    for (const [hook, opts] of hooks) {
      hook({ System, logger, ...opts });
    }
    return;
  }
  // default hooks
  resolveBareSpecifier({ System, logger: createChildLogger(logger, { c: 'resolveBareSpecifier' }) });
  instantiatePackageProtocol({ System, logger: createChildLogger(logger, { c: 'instantiatePackageProtocol' }) });
}

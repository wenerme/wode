import { createDeepCompareHooks } from '../utils/createDeepCompareHooks';
import { deepEqual } from '@wener/utils';

const { useDeepCompareMemoize, useDeepCompareCallback, useDeepCompareEffect, useDeepCompareMemo } =
  createDeepCompareHooks(deepEqual);

export { useDeepCompareMemoize, useDeepCompareCallback, useDeepCompareEffect, useDeepCompareMemo };

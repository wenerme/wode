import { deepEqual } from '@wener/utils';
import { createDeepCompareHooks } from '../utils/createDeepCompareHooks';

const { useDeepCompareMemoize, useDeepCompareCallback, useDeepCompareEffect, useDeepCompareMemo } =
  createDeepCompareHooks(deepEqual);

export { useDeepCompareMemoize, useDeepCompareCallback, useDeepCompareEffect, useDeepCompareMemo };

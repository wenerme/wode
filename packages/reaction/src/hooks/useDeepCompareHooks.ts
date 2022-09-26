import { createDeepCompareHooks } from '../utils/createDeepCompareHooks';
import { dequal } from '@wener/utils';

const { useDeepCompareMemoize, useDeepCompareCallback, useDeepCompareEffect, useDeepCompareMemo } =
  createDeepCompareHooks(dequal);

export { useDeepCompareMemoize, useDeepCompareCallback, useDeepCompareEffect, useDeepCompareMemo };

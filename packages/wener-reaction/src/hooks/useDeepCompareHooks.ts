import { deepEqual } from '@wener/utils';
import { createDeepCompareHooks } from '../utils/createDeepCompareHooks';

const { useDeepCompareMemoize, useDeepCompareCallback, useDeepCompareEffect, useDeepCompareMemo } =
	createDeepCompareHooks(deepEqual);

export { useDeepCompareCallback, useDeepCompareEffect, useDeepCompareMemo, useDeepCompareMemoize };

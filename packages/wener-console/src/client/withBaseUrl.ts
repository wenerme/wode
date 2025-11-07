import { buildBaseUrl } from '@wener/common/utils';
import { getBaseUrl } from './getBaseUrl';

export function withBaseUrl(api: string) {
	return buildBaseUrl(api, getBaseUrl());
}

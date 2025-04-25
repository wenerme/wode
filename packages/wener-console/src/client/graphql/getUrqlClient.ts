import type { Client } from '@urql/core';
import { getGlobalStates, setGlobalStates } from '@wener/utils';
import { getAccessToken } from '../../console/context';
import { createUrqlClient } from '../../urql';
import { getGraphQLUrl } from './getGraphQLUrl';

const key = 'UrqlClient';

export function getUrqlClient(): Client {
	return getGlobalStates(key, () =>
		createUrqlClient({
			getToken: getAccessToken,
			url: getGraphQLUrl(),
		}),
	);
}

export function setUrlqClient(client: Client) {
	setGlobalStates(key, client);
}

import type { Client } from '@urql/core';
import { getGlobalStates } from '@wener/utils';
import { getAccessToken } from '../../console/context';
import { createUrqlClient } from '../../urql';
import { getGraphQLUrl } from './getGraphQLUrl';

export function getUrqlClient(): Client {
  return getGlobalStates('UrqlClient', () =>
    createUrqlClient({
      getToken: getAccessToken,
      url: getGraphQLUrl(),
    }),
  );
}

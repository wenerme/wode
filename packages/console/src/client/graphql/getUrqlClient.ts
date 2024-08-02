import { Client } from '@urql/core';
import { getAccessToken } from '../../console';
import { getGlobalStates } from '../../state';
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

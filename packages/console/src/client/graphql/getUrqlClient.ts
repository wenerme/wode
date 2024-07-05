import { Client } from '@urql/core';
import { getGraphQLUrl } from '@/client/graphql/getGraphQLUrl';
import { getAccessToken, getGlobalStates } from '@/state';
import { createUrqlClient } from '@/urql';

export function getUrqlClient(): Client {
  return getGlobalStates('UrqlClient', () =>
    createUrqlClient({
      getToken: getAccessToken,
      url: getGraphQLUrl(),
    }),
  );
}

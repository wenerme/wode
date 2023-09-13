import { firstOfAsyncIterator, nextOfAsyncIterator } from '@wener/utils';
import { ClientRequest, ClientResponse } from './types';

export async function handleResponse({
  res,
  req,
}: {
  res: ClientResponse | AsyncIterator<ClientResponse>;
  req: ClientRequest;
}) {
  const [result] = await nextOfAsyncIterator(res);
  if (!result.ok) {
    throw Object.assign(new Error(result.description), { res: result, status: result.status });
  }
  return result.body;
}

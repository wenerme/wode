import type { DescMessage, DescMethodUnary, DescService, MessageInitShape, MessageShape } from '@bufbuild/protobuf';
import { createClient, type Client, type ConnectError } from '@connectrpc/connect';
import { useQuery as _useConnectQuery, type UseQueryOptions } from '@connectrpc/connect-query';
import { createConnectTransport } from '@connectrpc/connect-web';
import type { SkipToken, UseQueryResult } from '@tanstack/react-query';
import { getGlobalStates } from '@wener/utils';

export function getConnectTransport() {
	return getGlobalStates('ConnectRpcTransport', () => {
		return createConnectTransport({
			baseUrl: `${location.origin}/api/connect`,
		});
	});
}

export function getConnectServiceClient<T extends DescService>(service: T): Client<T> {
	return createClient(service, getConnectTransport());
}

export { useMutation as useConnectMutation } from '@connectrpc/connect-query';

export function useConnectQuery<I extends DescMessage, O extends DescMessage, SelectOutData = MessageShape<O>>(
	schema: DescMethodUnary<I, O>,
	input?: SkipToken | MessageInitShape<I>,
	options?: UseQueryOptions<O, SelectOutData>,
): UseQueryResult<SelectOutData, ConnectError> {
	return _useConnectQuery(schema, input, {
		...options,
	});
}

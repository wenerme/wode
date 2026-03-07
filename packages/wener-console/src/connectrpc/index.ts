import type { DescMessage, DescMethodUnary, DescService, MessageInitShape, MessageShape } from '@bufbuild/protobuf';
import { type Client, type ConnectError, createClient, type Transport } from '@connectrpc/connect';
import { useQuery as _useConnectQuery, type UseQueryOptions } from '@connectrpc/connect-query';
import { createConnectTransport } from '@connectrpc/connect-web';
import type { SkipToken, UseQueryResult } from '@tanstack/react-query';
import { getGlobalStates, setGlobalStates } from '@wener/utils';

export function getConnectTransport(): Transport {
	return getGlobalStates(_ConnectRpcTransportKey, () => {
		return createConnectTransport({
			baseUrl: `${location.origin}/api/connect`,
		});
	});
}

const _ConnectRpcTransportKey = 'ConnectRpcTransport';
export function setConnectTransport(transport: Transport) {
	setGlobalStates(_ConnectRpcTransportKey, transport);
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

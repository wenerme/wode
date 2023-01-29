import { trpc, trpcClient } from '../utils/trpc';

export function useTrpc() {
  return { trpc, client: trpcClient } as const;
}

export function useTrpcClient() {
  return trpcClient;
}

export function useTrpcQueryClient() {
  return trpc;
}

import { trpc } from '../utils/trpc';

export function useTrpcClient() {
  return trpc.useContext();
}

export function useTrpcQueryClient() {
  return trpc;
}

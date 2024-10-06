import type { GeneralResponseObject } from '@wener/nestjs/type-graphql';
import { createPubSub } from 'graphql-yoga';

const pubSub = createPubSub<{
  TICKER: [GeneralResponseObject];
  USER: [string, IMessage];
}>();

export function getPubSub() {
  return pubSub;
}

export type GraphPubSub = typeof pubSub;

interface IMessage {
  type: string;
  payload?: any;
  metadata?: any;
}

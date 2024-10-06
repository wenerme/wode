import { getConsoleContainer, getConsoleContext, type ConsoleContext as _ConsoleContext } from '@wener/console/console';
import type { AwilixContainer } from 'awilix/browser';

export type ConsoleContext = _ConsoleContext & {};

type Container = AwilixContainer<ConsoleContext>;

export function getContext(): ConsoleContext {
  return getConsoleContext();
}

export function getContainer(): Container {
  return getConsoleContainer();
}

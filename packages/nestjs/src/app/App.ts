import os from 'node:os';
import { randomUUID } from '@wener/utils';

export interface App {
  name: string;
  component: string;
  instanceId: string;
  readonly service: string;

  reset(): void;
}

class DefaultApp implements App {
  #instanceId?: string;
  #name?: string;
  #component?: string;

  get service() {
    return `${this.name}-${this.component}`;
  }

  get name() {
    return (this.#name ||= process.env.APP_NAME || 'app');
  }

  set name(name: string) {
    this.#name = name;
    this.reset();
  }

  get instanceId() {
    let prefix = this.service;
    let hostname = os.hostname().replaceAll('.', '-');
    if (hostname.startsWith(prefix)) {
      prefix = hostname;
    } else {
      prefix = `${prefix}-${process.pid}`;
    }
    return (this.#instanceId ||= process.env.APP_ID || `${prefix}-${randomUUID()}`.slice(0, 36).replace(/-$/, ''));
  }

  set instanceId(v) {
    this.#instanceId = v;
    this.reset();
  }

  get component() {
    return (this.#component ||= process.env.APP_COMPONENT || 'server');
  }

  set component(v) {
    this.#component = v;
  }

  /**
   * If env changed, we should reset what we already init
   */
  reset() {
    this.#component = undefined;
    this.#name = undefined;
    this.#instanceId = undefined;
  }
}

export const App = new DefaultApp();

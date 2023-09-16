import { getGlobalThis, randomUUID } from '@wener/utils';

export interface App {
  readonly region?: string;
  readonly zone?: string;
  name: string;
  component: string;
  instanceId: string;
  readonly service: string;

  reset(): void;
}

class DefaultApp implements App {
  #region?: string;
  #zone?: string;
  #instanceId?: string;
  #name?: string;
  #component?: string;

  get region() {
    return (this.#region ||= process.env.APP_REGION);
  }

  get zone() {
    return (this.#zone ||= process.env.APP_ZONE);
  }

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
    let hostname = '';
    let pid = 0;
    const globalThis: any = getGlobalThis();
    if (typeof globalThis.os === 'object' && 'hostname' in globalThis.os) {
      hostname = globalThis.os
        .hostname()
        .toLowerCase()
        .replaceAll(/[^-a-z\d]/g, '-');
    }

    if (typeof globalThis.process === 'object' && 'pid' in globalThis.process) {
      pid = globalThis.process.pid;
    }

    prefix = hostname.startsWith(prefix) ? hostname : `${prefix}-${pid}`;
    return (this.#instanceId ||= process.env.APP_ID || `${prefix}-${randomUUID()}`.slice(0, 36).replace(/-$/, ''));
  }

  set instanceId(v) {
    this.reset();
    this.#instanceId = v;
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
    this.#region = undefined;
    this.#zone = undefined;
    this.#component = undefined;
    this.#name = undefined;
    this.#instanceId = undefined;
  }
}

export const App = new DefaultApp();

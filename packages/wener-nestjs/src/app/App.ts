import { getGlobalThis, randomUUID } from '@wener/utils';

export interface App {
  readonly region?: string;
  readonly zone?: string;
  readonly env?: string;
  readonly mode?: string;

  name: string;
  component: string;
  instanceId: string;
  readonly service: string;
  readonly isProduction: boolean;
  readonly isDevelopment: boolean;

  envs(): Record<string, any>;

  reset(): void;
}

class DefaultApp implements App {
  private static readonly DEFAULT_NAME = 'app';
  private static readonly DEFAULT_COMPONENT = typeof document !== 'undefined' ? 'web' : 'server';

  #region?: string;
  #zone?: string;
  #instanceId?: string;
  #name?: string;
  #component?: string;
  #mode?: string;
  #env?: string;
  #envs: Record<string, any> = {};

  toJSON() {
    return {
      region: this.region,
      zone: this.zone,
      mode: this.mode,
      env: this.env,
      name: this.name,
      component: this.component,
      instanceId: this.instanceId,
      service: this.service,
      isProduction: this.isProduction,
      isDevelopment: this.isDevelopment,
    };
  }

  envs() {
    if (typeof process === 'object' && 'env' in process) {
      return process.env;
    }
    return this.#envs;
  }

  get region() {
    return (this.#region ||= process.env.APP_REGION);
  }

  get zone() {
    return (this.#zone ||= process.env.APP_ZONE);
  }

  get mode() {
    return (this.#mode ||= process.env.NODE_ENV);
  }

  get env() {
    return (this.#mode ||= process.env.APP_ENV);
  }

  get service() {
    return `${this.name}-${this.component}`;
  }

  get name() {
    return (this.#name ||= process.env.APP_NAME || DefaultApp.DEFAULT_NAME);
  }

  set name(name: string) {
    this.#name = name;
  }

  get isProduction() {
    switch (this.mode) {
      case 'production':
      case 'prod':
      case 'prd':
        return true;
      default:
        return false;
    }
  }

  get isDevelopment() {
    switch (this.mode) {
      case 'development':
      case 'dev':
        return true;
      default:
        return false;
    }
  }

  get instanceId() {
    if (this.#instanceId) {
      return this.#instanceId;
    }

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
    this.#instanceId = v;
  }

  get component() {
    return (this.#component ||= process.env.APP_COMPONENT || DefaultApp.DEFAULT_COMPONENT);
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
    this.#mode = undefined;
    this.#env = undefined;
  }
}

export const App = new DefaultApp();

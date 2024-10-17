import type { FetchLike } from '@wener/utils';
import type { CubeLoadRequest, CubeLoadResponse } from './service';

/**
 * https://cube.dev/docs/reference/rest-api
 */
export class CubeClient {
  constructor(readonly options: CubeClientOptions) {}

  async load(req: CubeLoadRequest) {
    return this.request<CubeLoadResponse>({
      path: '/v1/load',
      body: req,
    });
  }

  async request<T>({
    path,
    body,
    method = body ? 'POST' : 'GET',
  }: {
    path: string;
    body?: any;
    method?: string;
  }): Promise<T> {
    const { fetch, endpoint } = this.options;
    // fixme
    if (path.startsWith('/v1')) {
      path = '/cubejs-api' + path;
    }

    const url = `${endpoint}${path}`;

    const init: Record<string, any> = {
      method,
      headers: {},
    };

    if (body) {
      init.body = JSON.stringify(body);
      init.headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(url, init);

    if (!res.ok) {
      let out;
      try {
        out = await res.text();
      } catch {}

      throw new Error(`Request ${method} ${url}: ${res.status} ${res.statusText} ${out}`);
    }

    return res.json();
  }

  async readyz() {
    return this.request<{ health: 'HEALTH' | 'DOWN' }>({
      path: '/readyz',
    });
  }

  async livez() {
    return this.request<{ health: 'HEALTH' | 'DOWN' }>({
      path: '/livez',
    });
  }
}

export interface CubeClientOptions {
  endpoint: string;
  fetch: FetchLike;
}

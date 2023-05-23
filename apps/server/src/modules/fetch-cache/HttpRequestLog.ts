import { Entity, EntityRepositoryType, Property, types } from '@mikro-orm/core';
import { MinimalBaseEntity } from '../../app/mikro-orm/entity';
import { HttpRequestLogRepository } from './HttpRequestLog.repository';

@Entity({ customRepository: () => HttpRequestLogRepository, schema: '*' })
export class HttpRequestLog extends MinimalBaseEntity<HttpRequestLog> {
  [EntityRepositoryType]?: HttpRequestLogRepository;

  @Property({ type: types.string, nullable: false })
  method!: string;

  @Property({ type: types.string, nullable: false })
  origin!: string;

  @Property({ type: types.string, nullable: false })
  pathname!: string;

  @Property({ type: types.string, nullable: false })
  url!: string;

  @Property({ type: types.json, nullable: true })
  query!: Record<string, any>;

  @Property({ type: types.json, nullable: true })
  requestHeaders!: Record<string, any>;

  @Property({ type: types.json, nullable: true })
  requestPayload?: any;

  @Property({ type: types.blob, nullable: true })
  requestBody?: Buffer;

  @Property({ type: types.json, nullable: true })
  responseHeaders!: Record<string, any>;

  @Property({ type: types.json, nullable: true })
  responsePayload?: any;

  @Property({ type: types.blob, nullable: true })
  responseBody?: Buffer;

  @Property({ type: types.integer, nullable: true })
  contentLength?: number;

  @Property({ type: types.string, nullable: true })
  contentType?: string;

  @Property({ type: types.boolean, nullable: false })
  ok?: boolean;

  @Property({ type: types.integer, nullable: false, default: 0 })
  statusCode!: number;

  @Property({ type: types.string, nullable: false, default: '' })
  statusText!: string;

  @Property({ type: types.integer, nullable: true })
  duration?: number;

  @Property({ type: types.json, nullable: true })
  attributes!: Record<string, any>;

  @Property({ type: types.integer, nullable: false, default: 0 })
  hit?: number;

  fromUrl(o: string) {
    const u = new URL(o);
    u.searchParams.sort();
    this.assign({
      origin: u.origin,
      pathname: u.pathname,
      url: u.href,
      query: Object.fromEntries(u.searchParams.entries()),
    });
    return this;
  }

  fromRequest(u: RequestInfo | URL, init: RequestInit = {}) {
    if (typeof u === 'string') {
      this.fromUrl(u);
    } else if ('url' in u) {
      this.fromUrl(u.url);
    } else {
      this.fromUrl(u.toString());
    }
    this.assign({
      method: init.method || 'GET',
      requestHeaders: Object.fromEntries(new Headers(init.headers).entries()),
      // requestPayload: init.body,
    });
    return this;
  }

  fromResponse(resp: Response) {
    const headers = Object.fromEntries(new Headers(resp.headers).entries());
    this.assign({
      statusCode: resp.status,
      statusText: resp.statusText,
      responseHeaders: headers,
      contentLength: headers['content-length'] ? parseInt(headers['content-length']) : undefined,
      contentType: headers['content-type'],
      // responsePayload: resp.body,
    });
    return this;
  }

  toResponse(): Response {
    const { responsePayload, responseBody, statusCode: status, responseHeaders: headers } = this;
    return new Response(responseBody || JSON.stringify(responsePayload), {
      status,
      headers,
    });
  }
}

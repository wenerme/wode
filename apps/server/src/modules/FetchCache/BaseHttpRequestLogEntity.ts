import { Entity, Property, types, type Opt } from '@mikro-orm/core';
import { MinimalBaseEntity } from '@wener/nestjs/mikro-orm';

@Entity({ abstract: true })
export class BaseHttpRequestLogEntity extends MinimalBaseEntity {
  @Property({ type: types.string, nullable: true })
  tid?: string;

  @Property({ type: types.string, nullable: true })
  eid?: string;

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

  @Property({ type: types.string, nullable: true })
  requestId?: string;

  @Property({ type: types.string, nullable: true })
  responseId?: string;

  @Property({ type: types.boolean, nullable: true })
  ok?: boolean;

  @Property({ type: types.integer, nullable: true })
  statusCode?: number;

  @Property({ type: types.string, nullable: true })
  statusText?: string;

  @Property({ type: types.integer, nullable: true })
  duration?: number;

  @Property({ type: types.json, nullable: false, defaultRaw: '{}' })
  attributes!: Record<string, any> & Opt;

  @Property({ type: types.json, nullable: false, defaultRaw: '{}' })
  properties!: Record<string, any> & Opt;

  @Property({ type: types.json, nullable: false, defaultRaw: '{}' })
  extensions!: Record<string, any> & Opt;

  @Property({ type: types.integer, nullable: false, default: 0 })
  hit!: number & Opt;

  fromUrl(o: string) {
    const u = new URL(o);
    u.searchParams.sort();
    this.assign({
      origin: u.origin,
      pathname: u.pathname,
      url: u.href,
      query: Object.fromEntries(u.searchParams.entries()),
    } as any);
    return this;
  }

  fromRequest(u: RequestInfo | URL | string, init: RequestInit = {}) {
    if (typeof u === 'string') {
      this.fromUrl(u);
    } else if ('url' in u) {
      this.fromUrl(u.url);
    } else {
      this.fromUrl(u.toString());
    }
    let hdrs = Object.fromEntries(new Headers(init.headers).entries());
    this.assign({
      method: init.method || 'GET',
      requestHeaders: hdrs,
      requestId: hdrs['x-request-id'] || hdrs['x-amzn-requestid'],
      // requestPayload: init.body,
    } as any);
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
    } as any);
    this.responseId ||= headers['x-request-id'] || headers['x-amzn-requestid'];
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

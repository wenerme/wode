import { Entity } from '@mikro-orm/core';
import { BaseHttpRequestLogEntity } from './BaseHttpRequestLogEntity';

@Entity({ tableName: 'http_request_log' })
export class HttpRequestLogEntity extends BaseHttpRequestLogEntity<HttpRequestLogEntity> {}

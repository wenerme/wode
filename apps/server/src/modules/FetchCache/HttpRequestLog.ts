import { Entity } from '@mikro-orm/decorators/legacy';
import { BaseHttpRequestLogEntity } from './BaseHttpRequestLogEntity';

@Entity({ tableName: 'http_request_log' })
export class HttpRequestLogEntity extends BaseHttpRequestLogEntity {}

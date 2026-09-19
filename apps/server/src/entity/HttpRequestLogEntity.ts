import { Entity } from '@mikro-orm/decorators/legacy';
import { BaseHttpRequestLogEntity } from '../modules/FetchCache';

@Entity({ tableName: 'http_request_log' })
export class HttpRequestLogEntity extends BaseHttpRequestLogEntity {}

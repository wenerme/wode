export type {
	CreateLogsetRequest,
	CreateLogsetResponse,
	CreateTopicRequest,
	CreateTopicResponse,
	DeleteLogsetRequest,
	DeleteLogsetResponse,
	DeleteTopicRequest,
	DeleteTopicResponse,
	DescribeLogContextRequest,
	ListLogsetRequest,
	ListLogsetResponse,
	ListTopicRequest,
	ListTopicResponse,
	ModifyTopicRequest,
	ModifyTopicResponse,
	PutLogsRequest,
	PutLogsResponse,
	SearchLogRequest,
	SearchLogResponse,
} from './TencentLogClient';
export { TencentLogClient, type TencentLogClientInit } from './TencentLogClient';
export type * from './types';
export { isTopicId } from './utils';

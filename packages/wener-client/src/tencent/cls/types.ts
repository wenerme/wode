// Data types from https://www.tencentcloud.com/document/api/614/42831

export type Tag = {
	Key: string;
	Value: string;
};

export type ConditionInfo = {
	Attributes?: string;
	Rule?: number;
	ConditionValue?: string;
};

export type AnonymousInfo = {
	Operations?: string[];
	Conditions?: ConditionInfo[];
};

export type TopicExtendInfo = {
	AnonymousAccess?: AnonymousInfo;
};

export type LogsetInfo = {
	LogsetId: string;
	LogsetName: string;
	CreateTime: string;
	AssumerName?: string;
	Tags?: Tag[];
	TopicCount: number;
	RoleName?: string;
};

export type TopicInfo = {
	LogsetId: string;
	TopicId: string;
	TopicName: string;
	PartitionCount: number;
	Index: boolean;
	AssumerName?: string;
	CreateTime: string;
	Status: boolean;
	Tags?: Tag[];
	AutoSplit?: boolean;
	MaxSplitPartitions?: number;
	StorageType?: string;
	Period?: number;
	SubAssumerName?: string;
	Describes?: string;
	HotPeriod?: number;
	BizType?: number;
	IsWebTracking?: boolean;
	Extends?: TopicExtendInfo;
};

export type LogGroup = {
	Source?: string;
	Filename?: string;
	Logs: LogItem[];
};

export type Filter = {
	Key: string;
	Values: string[];
};

export type MultiTopicSearchInformation = {
	TopicId?: string;
	/**
	 * You can pass through the Context value (validity: 1 hour) returned by the last API to continue to get logs, which can get up to 10,000 raw logs.
	 */
	Context?: string;
};

export type LogInfo = {
	Time: number; // Log time in milliseconds
	TopicId: string; // Log topic ID
	TopicName: string; // Log topic name
	Source: string; // Log source IP
	FileName: string; // Log filename
	PkgId: string; // ID of the request package for log reporting
	PkgLogId: string; // Log ID in request package
	LogJson: string | null; // Serialized JSON string of log content, may be null
	HostName?: string | null; // Source host name of logs, may be null
	RawLog?: string | null; // Raw log, only present when an exception occurred while creating indexes, may be null
	IndexStatus?: string | null; // Cause of index creation exception, only present when an exception occurred, may be null
};

export type LogItems = {
	Data: LogItem[]; // Key-Value pair returned in analysis result
};

export type LogItem = {
	Key: string;
	Value: string;
};

export type Column = {
	Name: string;
	Type: string;
};

export type SearchLogErrors = {
	TopicId?: string | null; // Log topic ID, may be null
	ErrorMsg?: string | null; // Error Message, may be null
	ErrorCodeStr?: string | null; // Error Code, may be null
};

export type SearchLogInfos = {
	TopicId: string; // Log Topic ID
	Period: number; // Log storage lifetime
	Context?: string | null; // Context for pagination, may be null
};

export type SearchLogTopics = {
	Errors: SearchLogErrors[];
	Infos: SearchLogInfos[];
};

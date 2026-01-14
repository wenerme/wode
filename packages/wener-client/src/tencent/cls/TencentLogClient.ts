import type { FetchLike } from '@wener/utils';
import { request, sign, type RequestOptions } from './request';
import { searchAnalysisLogStream, type SearchAnalysisLogStreamOptions } from './searchAnalysisLogStream';
import { searchLogStream, type SearchLogStreamOptions } from './searchLogStream';
import type {
	Column,
	Filter,
	LogContextInfo,
	LogGroup,
	LogInfo,
	LogItems,
	LogsetInfo,
	MultiTopicSearchInformation,
	SearchLogTopics,
	Tag,
	TopicInfo,
} from './types';
import { isTopicId } from './utils';

type CommonListRequest = {
	Filters?: Filter[];
	Offset?: number;
	Limit?: number;
};

type CommonListResponse = {
	TotalCount: number;
	RequestId: string;
};

export type PutLogsRequest = {
	TopicId: string;
	LogGroupName?: string;
	Source?: string;
	CompressType?: 'gzip' | 'lz4';
	LogGroups: LogGroup[];
};

export type SearchLogRequest = {
	/**
	 * 要检索的日志的起始时间，Unix 毫秒时间戳
	 */
	From: number;
	/**
	 * 要检索的日志的结束时间，Unix 毫秒时间戳
	 */
	To: number;
	/**
	 * 检索与分析语句。最大长度：12 KB
	 * 当不需要日志分析时，可以省略管道符 | 和 SQL 语句。
	 * 查询所有日志可使用 * 或空字符串
	 */
	Query: string;
	/**
	 * 检索语法规则，默认为 0，推荐使用 1（CQL 语法）。
	 * 0：Lucene 语法，1：CQL 语法。
	 * 详细说明请参考检索语法规则
	 */
	SyntaxRule?: 0 | 1;
	/**
	 * 要检索的日志主题 ID，仅可指定一个日志主题。
	 * 若需同时检索多个日志主题，请使用 Topics 参数。
	 */
	TopicId?: string;
	/**
	 * 要检索的日志主题 ID 列表（最多 20 个）。
	 * 若需检索单个日志主题，请使用 TopicId 参数。
	 * TopicId 与 Topics 不能同时使用。
	 */
	Topics?: MultiTopicSearchInformation[];
	/**
	 * 单次查询返回的原始日志条数，默认为 100，最大为 1000。
	 * 获取后续日志请使用 Context 参数。
	 * 注意：仅当检索与分析语句（Query）不包含 SQL 时有效
	 * 指定 SQL 结果数量的方法请参考 SQL LIMIT 语法
	 */
	Limit?: number;
	/**
	 * 返回日志的时间顺序。可选值：asc（升序）；desc（降序）。默认值：desc
	 * 注意：
	 * - 仅当查询语句（Query）不包含 SQL 语句时有效。
	 * - 若需对分析结果排序，请参考 SQL ORDER BY 语法。
	 */
	Sort?: 'asc' | 'desc';
	/**
	 * 传递上次 API 调用返回的 Context 值以获取更多后续日志。
	 * 最多可获取 10,000 条原始日志，有效期为 1 小时。
	 * 注意：传递此参数时，除该参数外请勿修改其他参数
	 * 仅适用于单日志主题检索。多主题检索请使用 Topics 内的 Context。
	 * 仅当检索分析语句（Query）不包含 SQL 时有效。
	 * 获取后续 SQL 结果请参考 SQL LIMIT 语法
	 */
	Context?: string;
	/**
	 * 指定在统计分析前是否对原始日志进行采样（Query 包含 SQL 语句时）。
	 * 0：自动采样。
	 * 0-1：按指定采样率采样，如 0.02。
	 * 1：精确分析不采样。
	 * 默认值：1
	 */
	SamplingRate?: number;
	/**
	 * 若为 true，使用新响应方式，输出参数 AnalysisRecords 和 Columns 有效。
	 * 若为 false，使用旧响应方式，输出参数 AnalysisResults 和 ColNames 有效。
	 * 两种响应方式在编码格式上略有差异，建议使用新方式（true）。
	 */
	UseNewAnalysis?: boolean;
};

export type ListLogsetRequest = CommonListRequest;

export type ListTopicRequest = CommonListRequest & {
	/**
	 * PreciseSearch: Match mode for Filters fields.
	 * - 0: Fuzzy match for topicName and logsetName. This is the default value.
	 * - 1: Exact match for topicName.
	 * - 2: Exact match for logsetName.
	 * - 3: Exact match for topicName and logsetName.
	 */
	PreciseSearch?: 0 | 1 | 2 | 3 | number;
	/**
	 * BizType: Topic type
	 * - 0 (default): Log topic.
	 * - 1: Metric topic.
	 */
	BizType?: 0 | 1 | number;
};

export type CreateLogsetRequest = {
	LogsetName: string;
	Tags?: Tag[];
};

export type CreateTopicRequest = {
	LogsetId: string;
	TopicName: string;
	PartitionCount?: number;
	Tags?: Tag[];
	AutoSplit?: boolean;
	MaxSplitPartitions?: number;
	StorageType?: string;
	Period?: number;
};

export type ModifyTopicRequest = {
	TopicId: string;
	TopicName?: string;
	Status?: boolean;
	Tags?: Tag[];
	AutoSplit?: boolean;
	MaxSplitPartitions?: number;
	Period?: number;
};

export type DeleteTopicRequest = {
	TopicId: string;
};

export type DeleteLogsetRequest = {
	LogsetId: string;
};

export type PutLogsResponse = CommonListResponse;

export type SearchLogResponse = {
	/** 上次 API 调用返回的 Context 值，可用于获取更多日志，1 小时内有效。仅适用于单日志主题检索，多主题请用 Topics 内的 Context。*/
	Context: string;
	/** 是否已返回所有原始日志结果。若为 false，可用 Context 继续获取。仅当 Query 不含 SQL 时有效。*/
	ListOver: boolean;
	/** 是否为分析（SQL）结果 */
	Analysis?: boolean;
	/** 原始日志，满足检索条件的日志 */
	Results?: LogInfo[] | null;
	/** 日志分析的列名，仅当 UseNewAnalysis 为 false 时有效 */
	ColNames?: string[] | null;
	/** 日志分析结果，仅当 UseNewAnalysis 为 false 时有效 */
	AnalysisResults?: LogItems[] | null;
	/** 日志分析结果，仅当 UseNewAnalysis 为 true 时有效 */
	AnalysisRecords?: string[] | null;
	/** 日志分析的列属性，仅当 UseNewAnalysis 为 true 时有效 */
	Columns?: Column[] | null;
	/** 本次统计分析使用的采样率 */
	SamplingRate?: number | null;
	/** 多日志主题检索时，每个主题的基础信息，如错误信息 */
	Topics?: SearchLogTopics | null;
	/** 唯一请求 ID，每次请求都会返回。定位问题时需提供。*/
	RequestId: string;
};

export type ListLogsetResponse = CommonListResponse & {
	Logsets: LogsetInfo[];
};

export type ListTopicResponse = CommonListResponse & {
	Topics: TopicInfo[];
};

export type CreateLogsetResponse = {
	LogsetId: string;
} & CommonListResponse;

export type CreateTopicResponse = {
	TopicId: string;
} & CommonListResponse;

export type ModifyTopicResponse = CommonListResponse;

export type DeleteTopicResponse = CommonListResponse;

export type DeleteLogsetResponse = CommonListResponse;

export type DescribeLogContextRequest = {
	/** 日志主题 ID */
	TopicId: string;
	/**
	 * 日志时间，格式：YYYY-mm-dd HH:MM:SS.FFF
	 * 时区为 UTC+8
	 */
	BTime: string;
	/** 日志包序号 */
	PkgId: string;
	/** 日志包内的日志序号 */
	PkgLogId: number;
	/** 前 N 条日志数量，默认值 10，最大值 100 */
	PrevLogs?: number;
	/** 后 N 条日志数量，默认值 10，最大值 100 */
	NextLogs?: number;
	/** 检索条件过滤，最大长度 12KB，仅支持检索条件，不支持 SQL 语句 */
	Query?: string;
	/** 起始时间，毫秒时间戳 */
	From?: number;
	/** 结束时间，毫秒时间戳 */
	To?: number;
};

export type DescribeLogContextResponse = {
	/** 日志上下文信息集合 */
	LogContextInfos: LogContextInfo[];
	/** 上文日志是否全部返回，true 为全部返回 */
	PrevOver: boolean;
	/** 下文日志是否全部返回，true 为全部返回 */
	NextOver: boolean;
	/** 唯一请求 ID */
	RequestId: string;
};

export type TencentLogClientInit = {
	fetch?: FetchLike;
	clientId: string;
	clientSecret: string;
	region?: string;
	endpoint?: string;
};

export type TencentLogClientOptions = {
	fetch: FetchLike;
	clientId: string;
	clientSecret: string;
	region: string;
	endpoint: string;
};

export class TencentLogClient {
	options: TencentLogClientOptions;

	constructor({ region, endpoint, ...init }: TencentLogClientInit) {
		if (region) {
			endpoint ||= `cls.${region}.tencentcloudapi.com`;
		}
		region ||= 'ap-shanghai';
		endpoint ||= `cls.tencentcloudapi.com`;
		this.options = {
			...init,
			fetch: init.fetch || globalThis.fetch,
			region,
			endpoint,
		};
	}

	async request<T = any>(action: string, data: any, options: Partial<RequestOptions> = {}): Promise<T> {
		const timestamp = Math.floor(Date.now() / 1000);
		const payload = JSON.stringify(data);
		const host = this.options.endpoint;
		const uri = '/';
		const method = 'POST';

		const { authorization } = sign({
			clientId: this.options.clientId,
			clientKey: this.options.clientSecret,
			service: 'cls',
			region: this.options.region,
			action,
			version: '2020-10-16',
			timestamp,
			payload,
			method,
			host,
			uri,
		});

		return request<T>({
			url: `https://${host}${uri}`,
			method,
			data,
			headers: {
				Authorization: authorization,
				'Content-Type': 'application/json',
				'X-TC-Action': action,
				'X-TC-Version': '2020-10-16',
				'X-TC-Region': this.options.region,
				'X-TC-Timestamp': timestamp.toString(),
			},
			fetch: this.options.fetch,
			...options,
		});
	}

	async putLogs(request: PutLogsRequest): Promise<PutLogsResponse> {
		return this.request('UploadLog', request);
	}

	async searchLog(request: SearchLogRequest): Promise<SearchLogResponse> {
		return this.request('SearchLog', request);
	}

	searchLogStream(request: Omit<SearchLogStreamOptions, 'client'>) {
		return searchLogStream({
			client: this,
			...request,
		});
	}

	searchAnalysisLogStream(request: Omit<SearchAnalysisLogStreamOptions, 'client'>) {
		return searchAnalysisLogStream({
			client: this,
			...request,
		});
	}

	async listLogset(request: ListLogsetRequest = {}): Promise<ListLogsetResponse> {
		// filters: logsetName, logsetId , tagKey, tag:<tagKey>
		return this.request('DescribeLogsets', request);
	}

	async listTopic(request: ListTopicRequest = {}): Promise<ListTopicResponse> {
		// filters: topicName, logsetName, topicId, logsetId, tagKey, tag:<tagKey>, storageType = hot,cold
		return this.request('DescribeTopics', request);
	}

	async resolveTopicIds(needle: string[]) {
		let ids = needle.filter((v) => isTopicId(v));
		let names = needle.filter((v) => !isTopicId(v));
		if (names.length) {
			let out = await this.resolveTopics(names);
			for (let t of out) {
				ids.push(t.TopicId);
			}
		}
		return ids;
	}

	async resolveTopics(needle: string[]) {
		let ids = needle.filter((v) => isTopicId(v));
		let names = needle.filter((v) => !isTopicId(v));
		const q: ListTopicRequest = {};
		q.Filters ||= [];

		if (ids.length) {
			q.Filters.push({
				Key: 'topicId',
				Values: ids,
			});
		}
		if (names.length) {
			q.Filters.push({
				Key: 'topicName',
				Values: names,
			});
		}

		return (await this.listTopic(q)).Topics;
	}

	async listTopicByLogset(
		logsetId: string,
		options: Omit<ListTopicRequest, 'Filters'> = {},
	): Promise<ListTopicResponse> {
		return this.listTopic({
			...options,
			Filters: [
				{
					Key: 'logsetId',
					Values: [logsetId],
				},
			],
		});
	}

	async createLogset(request: CreateLogsetRequest): Promise<CreateLogsetResponse> {
		return this.request('CreateLogset', request);
	}

	async createTopic(request: CreateTopicRequest): Promise<CreateTopicResponse> {
		return this.request('CreateTopic', request);
	}

	async modifyTopic(request: ModifyTopicRequest): Promise<ModifyTopicResponse> {
		return this.request('ModifyTopic', request);
	}

	async deleteTopic(request: DeleteTopicRequest): Promise<DeleteTopicResponse> {
		return this.request('DeleteTopic', request);
	}

	async deleteLogset(request: DeleteLogsetRequest): Promise<DeleteLogsetResponse> {
		return this.request('DeleteLogset', request);
	}

	async describeLogContext(request: DescribeLogContextRequest): Promise<DescribeLogContextResponse> {
		return this.request('DescribeLogContext', request);
	}
}

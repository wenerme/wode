export type TransportOptions = {
  /**
   * [jwt auth token](security)
   */
  authorization: string;
  /**
   * path to `/cubejs-api/v1`
   */
  apiUrl: string;
  /**
   * custom headers
   */
  headers?: Record<string, string>;
  credentials?: 'omit' | 'same-origin' | 'include';
  method?: 'GET' | 'PUT' | 'POST' | 'PATCH';
};

export interface ITransportResponse<R> {
  subscribe: <CBResult>(cb: (result: R, resubscribe: () => Promise<CBResult>) => CBResult) => Promise<CBResult>;
  // Optional, supported in WebSocketTransport
  unsubscribe?: () => Promise<void>;
}

export interface ITransport<R> {
  request(method: string, params: Record<string, unknown>): ITransportResponse<R>;
}

// /**
//  * Default transport implementation.
//  * @order 3
//  */
// export class HttpTransport implements ITransport<ResultSet> {
//   /**
//    * @hidden
//    */
//   protected authorization: TransportOptions['authorization'];
//   /**
//    * @hidden
//    */
//   protected apiUrl: TransportOptions['apiUrl'];
//   /**
//    * @hidden
//    */
//   protected method: TransportOptions['method'];
//   /**
//    * @hidden
//    */
//   protected headers: TransportOptions['headers'];
//   /**
//    * @hidden
//    */
//   protected credentials: TransportOptions['credentials'];
//
//   constructor(options: TransportOptions);
//
//   public request(method: string, params: any): ITransportResponse<ResultSet>;
// }

export type CubeJSApiOptions = {
  /**
   * URL of your Cube.js Backend. By default, in the development environment it is `http://localhost:4000/cubejs-api/v1`
   */
  apiUrl: string;
  /**
   * Transport implementation to use. [HttpTransport](#http-transport) will be used by default.
   */
  transport?: ITransport<any>;
  headers?: Record<string, string>;
  pollInterval?: number;
  credentials?: 'omit' | 'same-origin' | 'include';
  parseDateMeasures?: boolean;
  resType?: 'default' | 'compact';
};

// export type LoadMethodOptions = {
//   /**
//    * Key to store the current request's MUTEX inside the `mutexObj`. MUTEX object is used to reject orphaned queries results when new queries are sent. For example: if two queries are sent with the same `mutexKey` only the last one will return results.
//    */
//   mutexKey?: string;
//   /**
//    * Object to store MUTEX
//    */
//   mutexObj?: Object;
//   /**
//    * Pass `true` to use continuous fetch behavior.
//    */
//   subscribe?: boolean;
//   /**
//    * A Cube API instance. If not provided will be taken from `CubeProvider`
//    */
//   cubejsApi?: CubejsApi;
//   /**
//    * If enabled, all members of the 'number' type will be automatically converted to numerical values on the client side
//    */
//   castNumerics?: boolean;
//   /**
//    * Function that receives `ProgressResult` on each `Continue wait` message.
//    */
//   progressCallback?(result: ProgressResult): void;
// };
//
// export type LoadMethodCallback<T> = (error: Error | null, resultSet: T) => void;

export type QueryOrder = 'asc' | 'desc';

export type TQueryOrderObject = { [key: string]: QueryOrder };
export type TQueryOrderArray = Array<[string, QueryOrder]>;

export type Annotation = {
  title: string;
  shortTitle: string;
  type: string;
  format?: 'currency' | 'percent' | 'number';
};

export type QueryAnnotations = {
  dimensions: Record<string, Annotation>;
  measures: Record<string, Annotation>;
  timeDimensions: Record<string, Annotation>;
};

type PivotQuery = Query & {
  queryType: QueryType;
};

type QueryType = 'regularQuery' | 'compareDateRangeQuery' | 'blendingQuery';

type LeafMeasure = {
  measure: string;
  additive: boolean;
  type: 'count' | 'countDistinct' | 'sum' | 'min' | 'max' | 'number' | 'countDistinctApprox';
};

export type TransformedQuery = {
  allFiltersWithinSelectedDimensions: boolean;
  granularityHierarchies: Record<string, string[]>;
  hasMultipliedMeasures: boolean;
  hasNoTimeDimensionsWithoutGranularity: boolean;
  isAdditive: boolean;
  leafMeasureAdditive: boolean;
  leafMeasures: string[];
  measures: string[];
  sortedDimensions: string[];
  sortedTimeDimensions: [[string, string]];
  measureToLeafMeasures?: Record<string, LeafMeasure[]>;
  ownedDimensions: string[];
  ownedTimeDimensionsAsIs: [[string, string | null]];
  ownedTimeDimensionsWithRollupGranularity: [[string, string]];
};

export type PreAggregationType = 'rollup' | 'rollupJoin' | 'rollupLambda' | 'originalSql';

type UsedPreAggregation = {
  targetTableName: string;
  type: PreAggregationType;
};

type LoadResponseResult<T> = {
  annotation: QueryAnnotations;
  lastRefreshTime: string;
  query: Query;
  data: T[];
  external: boolean | null;
  dbType: string;
  extDbType: string;
  requestId?: string;
  usedPreAggregations?: Record<string, UsedPreAggregation>;
  transformedQuery?: TransformedQuery;
  total?: number;
};

export type LoadResponse<T> = {
  queryType: QueryType;
  results: LoadResponseResult<T>[];
  pivotQuery: PivotQuery;
  [key: string]: any;
};

/**
 * Configuration object that contains information about pivot axes and other options.
 *
 * Let's apply `pivotConfig` and see how it affects the axes
 * ```js
 * // Example query
 * {
 *   measures: ['Orders.count'],
 *   dimensions: ['Users.country', 'Users.gender']
 * }
 * ```
 * If we put the `Users.gender` dimension on **y** axis
 * ```js
 * resultSet.tablePivot({
 *   x: ['Users.country'],
 *   y: ['Users.gender', 'measures']
 * })
 * ```
 *
 * The resulting table will look the following way
 *
 * | Users Country | male, Orders.count | female, Orders.count |
 * | ------------- | ------------------ | -------------------- |
 * | Australia     | 3                  | 27                   |
 * | Germany       | 10                 | 12                   |
 * | US            | 5                  | 7                    |
 *
 * Now let's put the `Users.country` dimension on **y** axis instead
 * ```js
 * resultSet.tablePivot({
 *   x: ['Users.gender'],
 *   y: ['Users.country', 'measures'],
 * });
 * ```
 *
 * in this case the `Users.country` values will be laid out on **y** or **columns** axis
 *
 * | Users Gender | Australia, Orders.count | Germany, Orders.count | US, Orders.count |
 * | ------------ | ----------------------- | --------------------- | ---------------- |
 * | male         | 3                       | 10                    | 5                |
 * | female       | 27                      | 12                    | 7                |
 *
 * It's also possible to put the `measures` on **x** axis. But in either case it should always be the last item of the array.
 * ```js
 * resultSet.tablePivot({
 *   x: ['Users.gender', 'measures'],
 *   y: ['Users.country'],
 * });
 * ```
 *
 * | Users Gender | measures     | Australia | Germany | US  |
 * | ------------ | ------------ | --------- | ------- | --- |
 * | male         | Orders.count | 3         | 10      | 5   |
 * | female       | Orders.count | 27        | 12      | 7   |
 */
export type PivotConfig = {
  /**
   * Dimensions to put on **x** or **rows** axis.
   */
  x?: string[];
  /**
   * Dimensions to put on **y** or **columns** axis.
   */
  y?: string[];
  /**
   * If `true` missing dates on the time dimensions will be filled with `0` for all measures.Note: the `fillMissingDates` option set to `true` will override any **order** applied to the query
   */
  fillMissingDates?: boolean | null;
  /**
   * Give each series a prefix alias. Should have one entry for each query:measure. See [chartPivot](#result-set-chart-pivot)
   */
  aliasSeries?: string[];
};

export type DrillDownLocator = {
  xValues: string[];
  yValues?: string[];
};

export type Series<T> = {
  key: string;
  title: string;
  shortTitle: string;
  series: T[];
};

export type Column = {
  key: string;
  title: string;
  series: [];
};

export type SeriesNamesColumn = {
  key: string;
  title: string;
  shortTitle: string;
  yValues: string[];
};

export type ChartPivotRow = {
  x: string;
  xValues: string[];
  [key: string]: any;
};

export type TableColumn = {
  key: string;
  dataIndex: string;
  meta: any;
  type: string | number;
  title: string;
  shortTitle: string;
  format?: any;
  children?: TableColumn[];
};

export type PivotRow = {
  xValues: Array<string | number>;
  yValuesArray: Array<[string[], number]>;
};

export type SerializedResult<T = any> = {
  loadResponse: LoadResponse<T>;
};

export type Filter = BinaryFilter | UnaryFilter | LogicalOrFilter | LogicalAndFilter;
export type LogicalAndFilter = {
  and: Filter[];
};

export type LogicalOrFilter = {
  or: Filter[];
};

export interface BinaryFilter {
  /**
   * @deprecated Use `member` instead.
   */
  dimension?: string;
  member?: string;
  operator: BinaryOperator;
  values: string[];
}

export interface UnaryFilter {
  /**
   * @deprecated Use `member` instead.
   */
  dimension?: string;
  member?: string;
  operator: UnaryOperator;
  values?: never;
}

export type UnaryOperator = 'set' | 'notSet';
export type BinaryOperator =
  | 'equals'
  | 'notEquals'
  | 'contains'
  | 'notContains'
  | 'startsWith'
  | 'notStartsWith'
  | 'endsWith'
  | 'notEndsWith'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'inDateRange'
  | 'notInDateRange'
  | 'beforeDate'
  | 'beforeOrOnDate'
  | 'afterDate'
  | 'afterOrOnDate';

export type TimeDimensionGranularity = 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';

export type DateRange = string | [string, string];

export interface TimeDimensionBase {
  dimension: string;
  granularity?: TimeDimensionGranularity;
}

type TimeDimensionComparisonFields = {
  compareDateRange: Array<DateRange>;
  dateRange?: never;
};
export type TimeDimensionComparison = TimeDimensionBase & TimeDimensionComparisonFields;

type TimeDimensionRangedFields = {
  dateRange?: DateRange;
};
export type TimeDimensionRanged = TimeDimensionBase & TimeDimensionRangedFields;

export type TimeDimension = TimeDimensionComparison | TimeDimensionRanged;

type DeeplyReadonly<T> = {
  readonly [K in keyof T]: DeeplyReadonly<T[K]>;
};

export interface Query {
  measures?: string[];
  dimensions?: string[];
  filters?: Filter[];
  timeDimensions?: TimeDimension[];
  segments?: string[];
  limit?: null | number;
  offset?: number;
  order?: TQueryOrderObject | TQueryOrderArray;
  timezone?: string;
  renewQuery?: boolean;
  ungrouped?: boolean;
  responseFormat?: 'compact' | 'default';
  total?: boolean;
}

export type QueryRecordType<T extends DeeplyReadonly<Query | Query[]>> =
  T extends DeeplyReadonly<Query[]>
    ? QueryArrayRecordType<T>
    : T extends DeeplyReadonly<Query>
      ? SingleQueryRecordType<T>
      : never;

type QueryArrayRecordType<T extends DeeplyReadonly<Query[]>> = T extends readonly [infer First, ...infer Rest]
  ? SingleQueryRecordType<DeeplyReadonly<First>> | QueryArrayRecordType<Rest & DeeplyReadonly<Query[]>>
  : never;

// If we can't infer any members at all, then return any.
type SingleQueryRecordType<T extends DeeplyReadonly<Query>> =
  ExtractMembers<T> extends never ? any : { [K in string & ExtractMembers<T>]: string | number | boolean | null };

type ExtractMembers<T extends DeeplyReadonly<Query>> =
  | (T extends { dimensions: readonly (infer Names)[] } ? Names : never)
  | (T extends { measures: readonly (infer Names)[] } ? Names : never)
  | (T extends { timeDimensions: infer U } ? ExtractTimeMembers<U> : never);

type ExtractTimeMembers<T> = T extends readonly [infer First, ...infer Rest]
  ? ExtractTimeMember<First> | ExtractTimeMembers<Rest>
  : never;

type ExtractTimeMember<T> = T extends { dimension: infer Dimension; granularity: infer Granularity }
  ? Dimension | `${Dimension & string}.${Granularity & string}`
  : never;

export interface UnsubscribeObj {
  /**
   * Allows to stop requests in-flight in long polling or web socket subscribe loops.
   * It doesn't cancel any submitted requests to the underlying databases.
   */
  unsubscribe(): Promise<void>;
}

export type SqlQueryTuple = [string, any[], any];

export type SqlData = {
  aliasNameToMember: Record<string, string>;
  cacheKeyQueries: SqlQueryTuple[];
  dataSource: boolean;
  external: boolean;
  sql: SqlQueryTuple;
  preAggregations: any[];
  rollupMatchResults: any[];
};

export type MemberType = 'measures' | 'dimensions' | 'segments';

type TOrderMember = {
  id: string;
  title: string;
  order: QueryOrder | 'none';
};

type TCubeMemberType = 'time' | 'number' | 'string' | 'boolean';

// @see BaseCubeMember
// @deprecated
export type TCubeMember = {
  type: TCubeMemberType;
  name: string;
  title: string;
  shortTitle: string;
  description?: string;
  /**
   * @deprecated use `public` instead
   */
  isVisible?: boolean;
  public?: boolean;
  meta?: any;
};

export type BaseCubeMember = {
  type: TCubeMemberType;
  name: string;
  title: string;
  shortTitle: string;
  description?: string;
  /**
   * @deprecated use `public` instead
   */
  isVisible?: boolean;
  public?: boolean;
  meta?: any;
};

export type TCubeMeasure = BaseCubeMember & {
  aggType: 'count' | 'number';
  cumulative: boolean;
  cumulativeTotal: boolean;
  drillMembers: string[];
  drillMembersGrouped: {
    measures: string[];
    dimensions: string[];
  };
  format?: 'currency' | 'percent';
};

export type TCubeDimension = BaseCubeMember & {
  primaryKey?: boolean;
  suggestFilterValues: boolean;
};

export type TCubeSegment = Omit<BaseCubeMember, 'type'>;

type TCubeMemberByType<T> = T extends 'measures'
  ? TCubeMeasure
  : T extends 'dimensions'
    ? TCubeDimension
    : T extends 'segments'
      ? TCubeSegment
      : never;

export type CubeMember = TCubeMeasure | TCubeDimension | TCubeSegment;

/**
 * @deprecated use DryRunResponse
 */
type TDryRunResponse = {
  queryType: QueryType;
  normalizedQueries: Query[];
  pivotQuery: PivotQuery;
  queryOrder: Array<{ [k: string]: QueryOrder }>;
  transformedQueries: TransformedQuery[];
};

export type DryRunResponse = {
  queryType: QueryType;
  normalizedQueries: Query[];
  pivotQuery: PivotQuery;
  queryOrder: Array<{ [k: string]: QueryOrder }>;
  transformedQueries: TransformedQuery[];
};

export type Cube = {
  name: string;
  title: string;
  description?: string;
  measures: TCubeMeasure[];
  dimensions: TCubeDimension[];
  segments: TCubeSegment[];
  connectedComponent?: number;
  type?: 'view' | 'cube';
  /**
   * @deprecated use `public` instead
   */
  isVisible?: boolean;
  public?: boolean;
};

export type CubeMap = {
  measures: Record<string, TCubeMeasure>;
  dimensions: Record<string, TCubeDimension>;
  segments: Record<string, TCubeSegment>;
};

export type CubesMap = Record<string, CubeMap>;

export type MetaResponse = {
  cubes: Cube[];
};

type FilterOperator = {
  name: string;
  title: string;
};

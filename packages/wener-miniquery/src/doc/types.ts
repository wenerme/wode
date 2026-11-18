type Prev = [never, 0, 1, 2, 3, 4, 5, ...0[]];

type PathObjectElement<E> = Exclude<Extract<NonNullable<E>, object>, Date | readonly unknown[]>;

type PathFor<K extends string, V, D extends number> = V extends readonly (infer E)[]
	? [PathObjectElement<E>] extends [never]
		? K
		: K | `${K}.${Paths<PathObjectElement<E>, Prev[D]>}`
	: V extends Date
		? K
		: V extends object
			? K | `${K}.${Paths<V, Prev[D]>}`
			: K;

type Paths<T, D extends number = 5> = [D] extends [never]
	? never
	: T extends object
		? { [K in Extract<keyof T, string>]-?: PathFor<K, NonNullable<T[K]>, D> }[Extract<keyof T, string>]
		: never;

type TypeFromPath<T, P extends string> = T extends unknown
	? [NonNullable<T>] extends [readonly (infer E)[]]
		? TypeFromPath<E, P>
		: P extends `${infer K}.${infer R}`
			? K extends keyof T
				? TypeFromPath<NonNullable<T[K]>, R>
				: never
			: P extends keyof T
				? NonNullable<T[P]>
				: never
	: never;

/** MongoDB `$comment` and `$$` keys are metadata and ignored; `$$disable: true` skips the object. */
export type QueryMetadata = { $comment?: unknown; $$disable?: boolean } & { [key: `$$${string}`]: unknown };

type FieldGroups<T> = Array<T> | Record<string, T>;

type LiteralValue<T> = T extends Date ? T : T extends object ? never : T;
type ComparableValue<T> = Exclude<LiteralValue<T>, null>;

type NonLiteralObject<T> = Exclude<Extract<T, object>, Date>;
type ObjectElement<T> = Exclude<NonLiteralObject<T>, readonly unknown[]>;

type ComparisonFields<T> = {
	$eq?: LiteralValue<T> | null;
	$ne?: LiteralValue<T> | null;
	$gt?: ComparableValue<T>;
	$gte?: ComparableValue<T>;
	$lt?: ComparableValue<T>;
	$lte?: ComparableValue<T>;
	/** `null` in the list also matches `NULL` */
	$in?: Array<LiteralValue<T> | null>;
	$nin?: Array<LiteralValue<T> | null>;
	$like?: string;
	$nlike?: string;
	/** regular expression, MiniQuery `~` */
	$regex?: string | RegExp;
	/** `IS NOT NULL` / `IS NULL`: a missing field and `null` are not told apart */
	$exists?: boolean;
};

/** Operators on one field. A field may also take a value (`=`, `null` is `IS NULL`) or an array (`IN`). */
type ScalarComparison<T> = QueryMetadata &
	ComparisonFields<T> & {
		$not?: ScalarComparison<T> | LiteralValue<T>;
		$and?: FieldGroups<ScalarComparison<T>>;
		$or?: FieldGroups<ScalarComparison<T>>;
		$nor?: FieldGroups<ScalarComparison<T>>;
	};

type ArrayComparison<E> = QueryMetadata &
	ComparisonFields<E> & {
		/** array length, `LENGTH(field) = n` */
		$size?: number;
		/** array contains all, MiniQuery `@>` */
		$all?: Array<LiteralValue<E> | null>;
		$not?: ArrayComparison<E> | LiteralValue<E>;
		$and?: FieldGroups<ArrayComparison<E>>;
		$or?: FieldGroups<ArrayComparison<E>>;
		$nor?: FieldGroups<ArrayComparison<E>>;
	};

export type ComparisonOperators<T> = [T] extends [readonly (infer E)[]] ? ArrayComparison<E> : ScalarComparison<T>;

type ScalarFieldValue<T> = [T] extends [never]
	? never
	:
			| LiteralValue<T>
			| ([ObjectElement<T>] extends [never] ? never : NestedQuery<ObjectElement<T>>)
			| Array<LiteralValue<T> | null>
			| ComparisonOperators<T>;

type ArrayFieldValue<T> = T extends readonly (infer E)[]
	?
			| LiteralValue<E>
			| ([NonLiteralObject<E>] extends [never]
					? T
					: [ObjectElement<E>] extends [never]
						? never
						: NestedQuery<ObjectElement<E>>)
			| Array<LiteralValue<E> | null>
			| ArrayComparison<E>
	: never;

type FieldValueOf<T> = [Extract<T, readonly unknown[]>] extends [never]
	? ScalarFieldValue<T>
	: ScalarFieldValue<Exclude<T, readonly unknown[]>> | ArrayFieldValue<Extract<T, readonly unknown[]>>;

type FieldValue<T> = [NonNullable<T>] extends [never]
	? null | RegExp | ScalarComparison<null>
	: FieldValueOf<NonNullable<T>> | null | RegExp;

type NestedFilter<T> = {
	[P in keyof T]?: FieldValue<T[P]>;
};

type PathFilter<T> = {
	[P in Paths<T>]?: FieldValue<TypeFromPath<T, P>>;
};

type QueryShape<T> = Partial<NestedFilter<T> & PathFilter<T>> & QueryMetadata;

type NestedQueryGroups<T> = NestedQuery<T>[] | Record<string, NestedQuery<T>>;

/** A nested document query has logical operators but `$text` is query-level only. */
type NestedQuery<T> = QueryShape<T> & {
	$and?: NestedQueryGroups<T>;
	$or?: NestedQueryGroups<T>;
	$nor?: NestedQueryGroups<T>;
	$not?: NestedQuery<T>;
};

// A list of queries or a record of named groups. To switch a group off, set `$$disable: true` inside it.
// `$$` metadata directly on the record is accepted at runtime but not typed: one index signature can not give
// `$$` keys and group names different value types, and group values must stay checked as queries.
type QueryGroups<T> = DocumentQuery<T>[] | Record<string, DocumentQuery<T>>;

/**
 * Mongo-like filter. Fields are combined with AND, nested objects and dotted keys address nested fields,
 * `$and` / `$or` / `$nor` take a list or a record (named groups), `$not` negates a filter or a field condition.
 * Keys starting with `$$` are ignored; an object with `$$disable: true` is skipped.
 */
export type DocumentQuery<T> = QueryShape<T> & {
	$and?: QueryGroups<T>;
	$or?: QueryGroups<T>;
	$nor?: QueryGroups<T>;
	$not?: DocumentQuery<T>;
	/** full text search, handled by the `onSearch` option */
	$text?: { $search: string } & QueryMetadata;
};

export type AnyDocumentQuery = DocumentQuery<any>;
/** A document query or the legacy list form accepted by `formatDocumentQuery`. */
export type DocumentQueryInput = AnyDocumentQuery | AnyDocumentQuery[];

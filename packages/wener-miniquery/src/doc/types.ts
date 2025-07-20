type Prev = [never, 0, 1, 2, 3, 4, 5, ...0[]];

type Join<K, P> = K extends string | number
	? P extends string | number
		? `${K}${'' extends P ? '' : '.'}${P}`
		: never
	: never;

type Paths<T, D extends number = 5> = [D] extends [never]
	? never
	: T extends object
		? { [K in keyof T]-?: Join<K, Paths<T[K], Prev[D]>> }[keyof T]
		: '';

type TypeFromPath<T, P extends string> = P extends `${infer K}.${infer R}`
	? K extends keyof T
		? TypeFromPath<T[K], R>
		: any
	: P extends keyof T
		? T[P]
		: any;

type ComparisonOperators<T> = {
	$eq?: T;
	$ne?: T;
	$gt?: T;
	$gte?: T;
	$lt?: T;
	$lte?: T;
	$in?: T[];
	$nin?: T[];
	$like?: string;
	$nlike?: string;
	$exists?: boolean;
	$type?: string;
	$all?: T extends (infer E)[] ? E[] : never;
	$size?: T extends any[] ? number : never;
	$elemMatch?: T extends (infer E)[] ? (E extends object ? DocumentQuery<E> : ComparisonOperators<E>) : never;
	$regex?: string;
};

type NestedFilter<T> = {
	[P in keyof T]?: T[P] extends (infer E)[]
		? T[P] | ComparisonOperators<T[P]> | (E extends object ? DocumentQuery<E> : ComparisonOperators<E>)
		: T[P] extends Date
			? T[P] | ComparisonOperators<T[P]>
			: T[P] extends object
				? T[P] | DocumentQuery<T>
				: T[P] | ComparisonOperators<T[P]>;
};

type PathFilter<T> = {
	[P in Paths<T> as string]?: TypeFromPath<T, P> | ComparisonOperators<TypeFromPath<T, P>>;
};

type QueryShape<T> = Partial<NestedFilter<T> & PathFilter<T>>;

export type DocumentQuery<T> = QueryShape<T> & {
	$and?: QueryShape<T>[] | Record<string, QueryShape<T>>;
	$or?: QueryShape<T>[] | Record<string, QueryShape<T>>;
	$nor?: QueryShape<T>[] | Record<string, QueryShape<T>>;
	$not?: QueryShape<T>;
	$expr?: any;
};

export type AnyDocumentQuery = DocumentQuery<any>;

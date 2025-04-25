export type ListQueryInput = {
	/** Filter string */
	filter?: string;
	/** Filter array */
	filters?: string[];
	/** Filter by IDs */
	ids?: string[];
	/** Search query */
	search?: string;
	/** Items per page */
	limit?: number;
	/** Offset for pagination */
	offset?: number;
	/** Ordering criteria */
	order?: string[];
	/** Page index (0-based) */
	pageIndex?: number;
	/** Page number (1-based) */
	pageNumber?: number;
	/** Items per page */
	pageSize?: number;
	/** Cursor for pagination */
	cursor?: string;
	/** Whether to include deleted items */
	deleted?: boolean;
};

type ListResult<T = any> = {
	/** List of items */
	data: T[];
	/** Total number of items */
	total: number;
};

type PageInfo = {
	/** Whether there are more items */
	hasNextPage: boolean;
	/** Whether there are previous items */
	hasPreviousPage: boolean;

	// /** Start cursor */
	// startCursor?: string;
	// /** End cursor */
	// endCursor?: string;
};

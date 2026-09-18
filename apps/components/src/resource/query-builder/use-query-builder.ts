import { useCallback, useEffect, useRef, useState } from 'react';
import type { QueryGroup } from './query-model';
import { createQueryGroup } from './query-model';
import type { QueryAction, QueryReducerOptions } from './query-state';
import { areQueriesEqual, cloneQuery, isQueryGroupValue, reduceQuery } from './query-state';

export type QueryChangeHandler = (query: QueryGroup, action: QueryAction) => void;

export type UseQueryBuilderControllerOptions = {
	query: QueryGroup;
	onQueryChange: QueryChangeHandler;
	reducerOptions?: QueryReducerOptions;
};

export function useQueryBuilderController({ query, onQueryChange, reducerOptions }: UseQueryBuilderControllerOptions) {
	const dispatch = useCallback(
		(action: QueryAction) => {
			const next = reduceQuery(query, action, reducerOptions);
			if (next === query) return query;
			onQueryChange(next, action);
			return next;
		},
		[onQueryChange, query, reducerOptions],
	);
	return { query, dispatch };
}

export type QueryDraftApplyOptions = {
	force?: boolean;
};

export type UseQueryBuilderDraftOptions<TIssue = never> = {
	value: QueryGroup;
	onApply?: (query: QueryGroup) => void;
	validate?: (query: QueryGroup) => readonly TIssue[];
	reducerOptions?: QueryReducerOptions;
};

export type QueryDraftSetter = (query: QueryGroup | ((current: QueryGroup) => QueryGroup)) => void;

function prepareExternalQuery(value: unknown) {
	return isQueryGroupValue(value)
		? { query: cloneQuery(value), valid: true }
		: { query: createQueryGroup('query-invalid-external'), valid: false };
}

export function useQueryBuilderDraft<TIssue = never>({
	value,
	onApply,
	validate,
	reducerOptions,
}: UseQueryBuilderDraftOptions<TIssue>) {
	const initialRef = useRef<ReturnType<typeof prepareExternalQuery> | null>(null);
	if (!initialRef.current) initialRef.current = prepareExternalQuery(value);
	const initial = initialRef.current;
	const baselineRef = useRef<QueryGroup>(initial.query);
	const latestExternalRef = useRef<QueryGroup>(initial.query);
	const seenExternalRef = useRef<QueryGroup>(initial.query);
	const draftRef = useRef<QueryGroup>(initial.query);
	const [draft, setDraftState] = useState(initial.query);
	const [stale, setStale] = useState(false);
	const [invalidExternal, setInvalidExternal] = useState(!initial.valid);
	const staleRef = useRef(false);

	const setDraft = useCallback<QueryDraftSetter>((next) => {
		setDraftState((current) => {
			const resolved = typeof next === 'function' ? next(current) : next;
			if (!isQueryGroupValue(resolved)) return current;
			if (areQueriesEqual(current, resolved)) return current;
			const owned = cloneQuery(resolved);
			draftRef.current = owned;
			return owned;
		});
	}, []);

	useEffect(() => {
		if (!isQueryGroupValue(value)) {
			setInvalidExternal(true);
			return;
		}
		setInvalidExternal(false);
		const incoming = cloneQuery(value);
		if (areQueriesEqual(seenExternalRef.current, incoming)) return;
		seenExternalRef.current = incoming;
		latestExternalRef.current = incoming;
		const draftMatchesIncoming = areQueriesEqual(draftRef.current, incoming);
		const draftMatchesBaseline = areQueriesEqual(draftRef.current, baselineRef.current);
		const baselineMatchesIncoming = areQueriesEqual(baselineRef.current, incoming);
		if (draftMatchesIncoming || draftMatchesBaseline) {
			baselineRef.current = incoming;
			draftRef.current = incoming;
			setDraftState(incoming);
			staleRef.current = false;
			setStale(false);
		} else if (baselineMatchesIncoming) {
			staleRef.current = false;
			setStale(false);
		} else {
			staleRef.current = true;
			setStale(true);
		}
	}, [value]);

	useEffect(() => {
		if (!staleRef.current || !areQueriesEqual(draft, latestExternalRef.current)) return;
		baselineRef.current = cloneQuery(latestExternalRef.current);
		staleRef.current = false;
		setStale(false);
	}, [draft]);

	const dispatch = useCallback(
		(action: QueryAction) => {
			const current = draftRef.current;
			const next = reduceQuery(current, action, reducerOptions);
			if (next === current) return current;
			draftRef.current = next;
			setDraftState(next);
			return next;
		},
		[reducerOptions],
	);

	const reset = useCallback(() => {
		const next = cloneQuery(latestExternalRef.current);
		baselineRef.current = next;
		draftRef.current = next;
		setDraftState(next);
		staleRef.current = false;
		setStale(false);
		return next;
	}, []);

	const apply = useCallback(
		(options: QueryDraftApplyOptions = {}) => {
			if (staleRef.current && !options.force) return undefined;
			const next = cloneQuery(draftRef.current);
			onApply?.(cloneQuery(next));
			return next;
		},
		[onApply],
	);
	const overwrite = useCallback(() => apply({ force: true }), [apply]);

	return {
		draft,
		dispatch,
		setDraft,
		onQueryChange: setDraft,
		dirty: !areQueriesEqual(draft, baselineRef.current),
		stale,
		canApply: !stale,
		invalidExternal,
		issues: validate?.(draft) ?? [],
		apply,
		overwrite,
		reset,
	};
}

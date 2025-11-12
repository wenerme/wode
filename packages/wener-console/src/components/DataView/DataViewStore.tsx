import { use, type ReactNode } from 'react';
import type { AnyResource } from '@wener/common/resource';
import { createReactContext } from '@wener/reaction';
import { createBoundedUseStore } from '@wener/reaction/zustand';
import type Emittery from 'emittery';
import { create, type ExtractState } from 'zustand';
import { mutative } from 'zustand-mutative';
import { createEmitter } from '../../events/createEmitter';
import type { ComponentName, ComponentState } from '../ComponentsState';
import { createViewComponentStateHook } from '../createViewComponentStateHook';

type Identifiable = { id: string };

export type ViewMode = 'table' | 'list' | 'grid' | 'card' | string;

export type SortRule = {
	field: string;
	order: 'asc' | 'desc';
	nulls?: 'last' | 'first';
};

export type QueryInput = {
	pageIndex?: number;
	pageSize?: number;
	order?: string[];
	search?: string;
	filters?: string[];
	where?: Record<string, any>;
};

export type DataViewStoreDumpState = Record<string, any> & {
	dataType?: string;
	version?: string;
};

export type DataViewStoreState<T extends Identifiable = AnyResource> = {
	// Data Layer
	data: T[];
	total: number;
	loading: boolean;
	error?: any;
	// for raw result
	result: {
		data: T[];
		total: number;
		[k: string]: any;
	};

	// Selection Layer
	selected: string[];
	active?: T;

	// Query Layer - Server API
	query: {
		search: string;
		pageIndex: number;
		pageSize: number;
		sort?: SortRule[];
		filters?: string[];
		where?: Record<string, any>;
	};

	// Filter layer - Client Side
	filter: {
		search: string;
		pageIndex: number;
		pageSize: number;
		[k: string]: any;
	};

	// View Layer
	view: {
		mode: ViewMode;
	};
	// View extensions
	components: Record<ComponentName, ComponentState>;

	// Event System
	events: DataViewEmitter;

	// Actions
	actions: DataViewActions<T>;

	// Metadata
	metadata: Record<string, any>;
};

export type DataViewActions<T extends Identifiable = any> = {
	// Data operations
	refresh: () => void;
	reset: () => void;
	setData: (data: T[], total?: number) => void;
	setLoading: (loading: boolean) => void;
	setError: (error?: any) => void;

	// Selection operations
	setSelected: (selected: string[]) => void;
	toggleSelection: (id: string) => void;
	clearSelection: () => void;
	setActive: (item?: T) => void;
	toggleActive: (item: T) => void;

	// Query operations
	setQuery: (query: Partial<DataViewStoreState<T>['query']>) => void;

	// View operations
	setView: (view: Partial<DataViewStoreState<T>['view']>) => void;
	setViewMode: (mode: ViewMode) => void;
	setComponentState: (name: ComponentName, state: Partial<ComponentState>) => void;
	getComponentState: (name: ComponentName) => ComponentState;

	// Utility operations
	getQueryInput: (state?: DataViewStoreState<T>) => QueryInput;
	debug: () => void;
};

export type DataViewStore<T extends Identifiable = any> = ReturnType<typeof createDataViewStore<T>>;

export const DataViewEventType = {
	Refresh: 'Refresh',
	Reset: 'Reset',
	DataChanged: 'DataChanged',
	SelectionChanged: 'SelectionChanged',
	ActiveChanged: 'ActiveChanged',
	QueryChanged: 'QueryChanged',
	ViewChanged: 'ViewChanged',
	ComponentStateChanged: 'ComponentStateChanged',
	Debug: 'Debug',
} as const;

export type DataViewEventData = {
	[DataViewEventType.Refresh]: {};
	[DataViewEventType.Reset]: {};
	[DataViewEventType.DataChanged]: { data: any[]; total: number };
	[DataViewEventType.SelectionChanged]: { selected: string[] };
	[DataViewEventType.ActiveChanged]: { active?: any };
	[DataViewEventType.QueryChanged]: { query: QueryInput };
	[DataViewEventType.ViewChanged]: { view: { mode: ViewMode } };
	[DataViewEventType.ComponentStateChanged]: { name: ComponentName; state: ComponentState };
	[DataViewEventType.Debug]: {};
};

export type DataViewEmitter = Emittery<DataViewEventData>;

export function createDataViewStore<T extends Identifiable = any>(
	initialState: Partial<Omit<DataViewStoreState<T>, 'query' | 'filter'>> & {
		query?: Partial<DataViewStoreState['query']>;
		filter?: Partial<DataViewStoreState['filter']>;
	} = {},
) {
	return create(
		mutative<DataViewStoreState<T>>((setState, getState, store) => {
			const events: DataViewEmitter = createEmitter('DataViewEmitter');

			// Default state
			const defaultState: DataViewStoreState<T> = {
				// Data Layer
				data: [],
				total: 0,
				loading: false,
				error: undefined,
				result: {
					data: [],
					total: 0,
				},

				// Selection Layer
				selected: [],
				active: undefined,

				query: {
					search: '',
					pageIndex: 0,
					pageSize: 30,
					sort: [],
					filters: [],
					where: undefined,
				},

				filter: {
					search: '',
					pageIndex: 0,
					pageSize: 30,
				},

				// View Layer
				view: {
					mode: 'list',
				},
				components: {},

				// Event System
				events,

				// Metadata
				metadata: {},

				// Actions (will be set below)
				actions: {} as DataViewActions<T>,
			};

			// Merge with initial state
			const state = { ...defaultState, ...initialState };

			return {
				...state,
				query: {
					...defaultState.query,
					...initialState?.query,
				},
				filter: {
					...defaultState.filter,
					...initialState?.filter,
				},
				// Actions
				actions: {
					// Data operations
					refresh() {
						events.emit(DataViewEventType.Refresh, {});
					},

					reset() {
						events.emit(DataViewEventType.Reset, {});
						setState((state) => {
							Object.assign(state, defaultState);
						});
					},

					setData(data, total) {
						setState((state) => {
							state.data = data as any;
							state.total = total ?? data.length;
						});
						events.emit(DataViewEventType.DataChanged, { data, total: total ?? data.length });
					},

					setLoading(loading) {
						setState((state) => {
							state.loading = loading;
						});
					},

					setError(error) {
						setState((state) => {
							state.error = error;
						});
					},

					// Selection operations
					setSelected(selected) {
						setState((state) => {
							state.selected = selected;
						});
						events.emit(DataViewEventType.SelectionChanged, { selected });
					},

					toggleSelection(id) {
						setState((state) => {
							const index = state.selected.indexOf(id);
							if (index >= 0) {
								state.selected.splice(index, 1);
							} else {
								state.selected.push(id);
							}
						});
						const newSelected = getState().selected;
						events.emit(DataViewEventType.SelectionChanged, { selected: newSelected });
					},

					clearSelection() {
						setState((state) => {
							state.selected = [];
						});
						events.emit(DataViewEventType.SelectionChanged, { selected: [] });
					},

					setActive(active) {
						setState((state) => {
							state.active = active as any;
						});
						events.emit(DataViewEventType.ActiveChanged, { active });
					},

					toggleActive(item) {
						setState((state) => {
							// 如果当前 active 和传入的 item 是同一个对象，则清除 active
							// 否则设置为传入的 item
							if (state.active?.id === item.id) {
								state.active = undefined;
							} else {
								state.active = item as any;
							}
						});
						const newActive = getState().active;
						events.emit(DataViewEventType.ActiveChanged, { active: newActive });
					},

					// Query operations
					setQuery(queryUpdate) {
						setState((state) => {
							Object.assign(state.query, queryUpdate);
							// Reset to first page when search changes
							if (queryUpdate.search !== undefined) {
								state.query.pageIndex = 0;
							}
							if (queryUpdate.pageSize !== undefined) {
								state.query.pageIndex = 0;
							}
						});
						const query = getState().actions.getQueryInput();
						events.emit(DataViewEventType.QueryChanged, { query });
					},

					// View operations
					setView(viewUpdate) {
						setState((state) => {
							Object.assign(state.view, viewUpdate);
						});
						const view = getState().view;
						events.emit(DataViewEventType.ViewChanged, { view });
					},

					setViewMode(mode) {
						getState().actions.setView({ mode });
					},

					setComponentState(name, state) {
						setState((s) => {
							s.components[name] = { ...s.components[name], ...state };
						});
						const componentState = getState().components[name];
						events.emit(DataViewEventType.ComponentStateChanged, { name, state: componentState });
					},

					getComponentState(name) {
						return getState().components[name] || {};
					},

					// Utility operations
					getQueryInput(state = getState()) {
						const { query } = state;
						return {
							pageIndex: query.pageIndex,
							pageSize: query.pageSize,
							order: query.sort ? formatSort(query.sort) : [],
							search: query.search,
							filters: query.filters,
							where: query.where,
						};
					},

					debug() {
						events.emit(DataViewEventType.Debug, {});
						console.log('DataViewStore State:', getState());
					},
				},
			};
		}),
	);
}

const DataViewContext = createReactContext<DataViewStore | undefined>('DataViewContext', undefined);

export function useDataViewStoreContext<T extends Identifiable = AnyResource>(): DataViewStore<T> {
	let store = use(DataViewContext);
	if (!store) {
		throw new Error(`DataViewStore not found in context`);
	}
	return store;
}

type UseDataViewStore = {
	<R extends Identifiable = any>(): ExtractState<DataViewStore<R>>;
	<R extends Identifiable = any, T = any>(selector: (state: ExtractState<DataViewStore<R>>) => T): T;
};
export const useDataViewStore: UseDataViewStore = createBoundedUseStore(useDataViewStoreContext) as UseDataViewStore;
export function useDataViewActions() {
	return useDataViewStore((s) => s.actions);
}

function formatSort(sort: SortRule[]): string[] {
	return sort
		.map(({ field, order, nulls }) => {
			if (field) {
				let r = field;
				if (order) {
					r += ` ${order}`;
				}
				if (nulls) {
					r += ` nulls ${nulls}`;
				}
				return r;
			}
			return '';
		})
		.filter(Boolean);
}

export type DataViewProviderProps<T extends Identifiable = any> = {
	value: DataViewStore<T>;
	children: ReactNode;
};

export function DataViewProvider<T extends Identifiable = any>({ value, children }: DataViewProviderProps<T>) {
	return <DataViewContext.Provider value={value}>{children}</DataViewContext.Provider>;
}

export const useDataViewComponentState = createViewComponentStateHook(useDataViewStore);

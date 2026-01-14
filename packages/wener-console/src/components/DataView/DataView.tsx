import { useCallback, type ComponentPropsWithRef } from 'react';
import { cn } from '@wener/console';
import { NotReadyPlaceholder } from '@wener/console/components';
import { DevOnly } from '@wener/reaction';
import { pick } from 'es-toolkit';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { ActionIcon } from '../icons';
import { SearchInput as BaseSearchInput } from '../SearchInput';
import { useEmitteryListen } from '../useEmitteryListen';
import { DataViewLayout } from './DataViewLayout';
import { DataViewEventType, DataViewProvider, useDataViewStore, useDataViewStoreContext } from './DataViewStore';
import { PageInfo as BasePageInfo, type PageInfoProps } from './PageInfo';
import { PageNav as BasePageNav, type PageNavProps } from './PageNav';

type QueryFilterMode = 'filter' | 'query';
type ModeProps = {
	mode?: QueryFilterMode;
};
export namespace DataView {
	export const Provider = DataViewProvider;

	export const useViewStore = useDataViewStore;
	export const useActions = () => {
		return useViewStore((s) => s.actions);
	};
	export const useViewStoreContext = useDataViewStoreContext;

	export function SearchInput({ mode, ...props }: ModeProps) {
		const [{ search }, setState] = usePaginationSearchState(mode, ['search']);
		return (
			<BaseSearchInput
				{...props}
				initialValue={search}
				onValueChange={(value) => {
					setState({ search: value });
				}}
			/>
		);
	}

	export function RefreshButton({ className, ...props }: ComponentPropsWithRef<'button'>) {
		const { loading, actions } = useViewStore((s) => {
			return {
				loading: s.loading,
				actions: s.actions,
			};
		});
		return (
			<button
				type={'button'}
				data-loading={loading || null}
				className={cn('btn btn-square btn-sm btn-ghost', className)}
				onClick={() => {
					actions.refresh();
				}}
				{...props}
			>
				<ActionIcon.Refresh />
			</button>
		);
	}

	export function PageInfo({ mode, ...props }: PageInfoProps & ModeProps) {
		const [{ pageIndex, pageSize, total }, setState] = usePaginationSearchState(mode, [
			'pageIndex',
			'pageSize',
			'total',
		]);

		return (
			<BasePageInfo
				{...props}
				total={total}
				pageSize={pageSize}
				from={pageIndex * pageSize}
				to={Math.min((pageIndex + 1) * pageSize, total)}
				onPageSizeChange={(size) => {
					setState({ pageSize: size });
				}}
			/>
		);
	}

	export function PageNav({ mode, ...props }: PageNavProps & ModeProps) {
		const [{ pageIndex, pageSize, total }, setState] = usePaginationSearchState(mode, [
			'pageIndex',
			'pageSize',
			'total',
		]);
		const pageCount = Math.ceil(total / pageSize);
		return (
			<BasePageNav
				{...props}
				pageCount={pageCount}
				pageNumber={pageIndex + 1}
				onPageNumberChange={(n) => {
					setState({ pageIndex: n - 1 });
				}}
			/>
		);
	}
	export function Footer({ left, right, mode, children, ...props }: DataViewLayout.FooterProps & ModeProps) {
		const actions = useActions();
		return (
			<DataViewLayout.Footer
				{...props}
				left={
					<div className={'flex items-center gap-2'}>
						<PageInfo mode={mode} />
						<PageNav mode={mode} />
						{left}
					</div>
				}
				right={
					<div className={'flex items-center gap-2'}>
						<QueryStatus />
						{right}
						<DevOnly>
							<button type={'button'} className={'btn btn-secondary btn-xs'} onClick={() => actions.debug()}>
								DEBUG
							</button>
						</DevOnly>
					</div>
				}
			>
				{children}
			</DataViewLayout.Footer>
		);
	}

	export const Sidecar = () => {
		const store = useViewStoreContext();
		const { actions, events } = useStore(
			store,
			useShallow(({ actions, events, result }) => ({ events, actions, result })),
		);

		useEmitteryListen(events, {
			[DataViewEventType.Debug]: async () => {
				const state = store.getState();
				console.log(`[DEBUG] DataViewState`, state);
				console.log(`use window._DataViewStore to access the store`);
				(window as any)._DataViewStore = store;
			},
		});
	};

	const QueryStatus = () => {
		const { loading, error } = useViewStore(({ loading, error }) => {
			return { loading, error };
		});
		return <NotReadyPlaceholder loading={loading} error={error} />;
	};
}

type PaginationSearchState = {
	search: string;
	pageIndex: number;
	pageSize: number;
	total: number;
};

function usePaginationSearchState(
	mode: QueryFilterMode = 'query',
	keys: (keyof PaginationSearchState)[] = ['search', 'pageIndex', 'pageSize', 'total'],
): [Pick<PaginationSearchState, (typeof keys)[number]>, (v: Partial<PaginationSearchState>) => void] {
	const store = DataView.useViewStoreContext();
	const state = useStore(
		store,
		useShallow((s) => {
			return pick(
				{
					search: s[mode].search,
					pageIndex: s[mode].pageIndex,
					pageSize: s[mode].pageSize,
					total: s.total,
				},
				keys,
			);
		}),
	);

	return [
		state,
		useCallback(
			(partialState: Partial<PaginationSearchState> = {}) => {
				store.setState((state) => {
					Object.assign(state[mode], partialState);
				});
			},
			[store],
		),
	];
}

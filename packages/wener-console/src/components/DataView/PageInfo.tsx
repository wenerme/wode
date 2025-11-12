import type React from 'react';
import { PiDotBold } from 'react-icons/pi';

export type PageInfoProps = {
	total?: number;
	from?: number;
	to?: number;
	pageSize?: number;
	pageSizeOptions?: number[];
	onPageSizeChange?: (size: number) => void;
};

export const PageInfo = ({
	from = 0,
	to = 0,
	total = 0,
	pageSizeOptions = [10, 20, 30, 50, 100, 200, 500, 1000],
	pageSize = 30,
	onPageSizeChange,
}: PageInfoProps) => {
	return (
		<div className={'flex items-center text-sm font-thin tabular-nums'}>
			{from}-{to}
			<PiDotBold className={'h-4 w-4'} />
			<span className={'总数'}>{total}</span>
			<PiDotBold className={'h-4 w-4'} />
			<div className='dropdown dropdown-top dropdown-hover'>
				<div
					title={'每页数量'}
					tabIndex={0}
					role='button'
					className='btn btn-ghost btn-xs px-1 text-sm font-thin opacity-50 hover:opacity-75'
				>
					{pageSize}
				</div>
				<ul tabIndex={0} className='menu dropdown-content z-[1] w-20 rounded-box bg-base-100 p-2 shadow'>
					{pageSizeOptions.map((v) => {
						return (
							<li
								key={v}
								onClick={() => {
									onPageSizeChange?.(v);
								}}
							>
								<a>{v}</a>
							</li>
						);
					})}
				</ul>
			</div>
		</div>
	);
};

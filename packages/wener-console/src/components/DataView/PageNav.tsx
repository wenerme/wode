import type React from 'react';
import { useEffect, useState } from 'react';
import { PiArrowLeftThin, PiArrowLineLeftThin, PiArrowLineRightThin, PiArrowRightThin } from 'react-icons/pi';
import { clamp } from '@wener/utils';

export type PageNavProps = {
	canPrev?: boolean;
	canNext?: boolean;
	pageNumber?: number;
	onPageNumberChange?: (pageNumber: number) => void;
	pageCount?: number;
};
export const PageNav = ({
	pageNumber = 1,
	onPageNumberChange,
	pageCount = 1,
	canPrev = pageNumber > 1,
	canNext = pageNumber < pageCount,
}: PageNavProps) => {
	const goto = (n: number) => {
		onPageNumberChange?.(n);
	};
	const [value, setValue] = useState(String(pageNumber));
	useEffect(() => {
		setValue(String(pageNumber));
	}, [pageNumber]);
	const btnClass = 'join-item btn btn-xs btn-square px-0 [&>svg]:flex-shrink-0 not-hover:bg-transparent border-none';
	return (
		<div className='join font-thin tabular-nums *:px-2 disabled:*:opacity-50'>
			<button type={'button'} disabled={!canPrev} onClick={() => goto(1)} className={btnClass} title={'第一页'}>
				<PiArrowLineLeftThin className={'h-3 w-3'} />
			</button>
			<button
				type={'button'}
				disabled={!canPrev}
				onClick={() => goto(pageNumber - 1)}
				className={btnClass}
				title={'上一页'}
			>
				<PiArrowLeftThin className={'h-3 w-3'} />
			</button>
			<input
				value={value}
				onChange={(e) => {
					setValue(e.currentTarget.value);
				}}
				onKeyUp={(e) => {
					if (e.key === 'Enter') {
						const n = clamp(Number(value) || 1, 1, pageCount);
						goto(n);
						setValue(String(n));
					}
				}}
				className='input input-xs w-[5ch] text-center input-ghost tabular-nums join-item'
			/>
			<button
				type={'button'}
				disabled={!canNext}
				onClick={() => goto(pageNumber + 1)}
				className={btnClass}
				title={'下一页'}
			>
				<PiArrowRightThin className={'h-3 w-3'} />
			</button>
			<button
				type={'button'}
				disabled={!canNext}
				onClick={() => goto(pageCount)}
				title={'最后一页'}
				className={btnClass}
			>
				<PiArrowLineRightThin className={'h-3 w-3'} />
			</button>
		</div>
	);
};

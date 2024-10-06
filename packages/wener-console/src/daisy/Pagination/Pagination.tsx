import type React from 'react';
import { HiChevronLeft, HiChevronRight } from 'react-icons/hi2';
import classNames from 'clsx';
import { Button } from '../Button/Button';

export const Pagination: React.FC<{
  pageIndex: number;
  onPageIndexChange?: (v: number) => void;
  href?: (v: number) => string;
  pageCount: number;
  pageOptions?: number[];
}> = ({ pageIndex = 0, onPageIndexChange, pageCount, href, pageOptions = buildPageOptions(pageIndex, pageCount) }) => {
  const pageNumber = pageIndex + 1;
  const canNextPage = pageNumber < pageCount;
  const canPreviousPage = pageNumber > 1;
  // const previousPage = () => onPageIndexChange?.(pageIndex - 1);
  // const nextPage = () => onPageIndexChange?.(pageIndex + 1);
  // let firstPage = () => onPageIndexChange(0);
  // let lastPage = () => onPageIndexChange(pageCount - 1);

  return (
    <div className={'flex items-center gap-1'}>
      {/* <div className={'btn-group'}> */}
      {/*  <Button size={'xs'} className={'p-1'} onClick={firstPage} disabled={!canPreviousPage}> */}
      {/*    <ChevronDoubleLeftIcon className={'h-4 w-4'} /> */}
      {/*  </Button> */}
      {canPreviousPage && (
        <Button
          href={href?.(pageIndex - 1)}
          onClick={() => onPageIndexChange?.(pageIndex - 1)}
          className={'btn btn-xs p-1'}
        >
          <HiChevronLeft className={'h-4 w-4'} />
        </Button>
      )}
      {!canPreviousPage && (
        <button disabled className={'btn btn-xs p-1'}>
          <HiChevronLeft className={'h-4 w-4'} />
        </button>
      )}

      <div className={'flex items-center gap-1'}>
        {!pageOptions && (
          <button className={'btn btn-xs'}>
            {pageNumber}/{pageCount}
          </button>
        )}
        {pageOptions?.map((v, i) => {
          let n = v;
          switch (v) {
            case -1:
              n = pageIndex - 5;
              break;
            case -2:
              n = pageIndex + 5;
              break;
          }
          return (
            <Button
              key={v > 0 ? v : -i}
              className={classNames('btn btn-ghost btn-xs bg-transparent font-mono', v === pageIndex && 'btn-active')}
              href={href?.(n)}
              onClick={() => onPageIndexChange?.(n)}
              // disabled={v === pageIndex || v < 0}
              title={`第${n + 1}页`}
            >
              {/* 1-2位的数字不至于导致 UI 错位 */}
              <span className={'min-w-[2ch]'}>{v >= 0 ? v + 1 : '...'}</span>
            </Button>
          );
        })}
      </div>

      {canNextPage && (
        <Button
          href={href?.(pageIndex + 1)}
          onClick={() => onPageIndexChange?.(pageIndex + 1)}
          className={'btn btn-xs p-1'}
        >
          <HiChevronRight className={'h-4 w-4'} />
        </Button>
      )}
      {!canNextPage && (
        <button type={'button'} disabled className={'btn btn-xs p-1'}>
          <HiChevronRight className={'h-4 w-4'} />
        </button>
      )}
      {/* <Button size={'xs'} className={'p-1'} onClick={lastPage} disabled={!canNextPage}> */}
      {/*  <ChevronDoubleRightIcon className={'h-4 w-4'} onClick={() => onPageIndexChange(pageCount - 1)} /> */}
      {/* </Button> */}
      {/* </div> */}
      {/* <hr className={'border-r h-6 mx-2'} /> */}
      {/* <small> */}
      {/*  <b> */}
      {/*    */}
      {/*  </b> */}
      {/* </small> */}
    </div>
  );
};
const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export function buildPageOptions(pageIndex: number, pageCount: number): number[] {
  let ops: number[] = [];
  // 默认显示 5 个 - 包含最前最后就是7个
  if (pageCount <= 7) {
    ops = new Array(pageCount).fill(null).map((_, i) => i);
  } else {
    let min = clamp(pageIndex - 2, 0, pageCount - 1);
    let max = clamp(pageIndex + 2, 0, pageCount - 1);
    // 处理不够补齐情况
    const maxPad = Math.abs(pageIndex - 2 - min);
    const minPad = Math.abs(pageIndex + 2 - max);
    max += maxPad;
    min -= minPad;

    if (min !== 0) {
      ops.push(0);
      if (min !== 1) {
        ops.push(-1);
      }
    }

    for (let i = min; i < pageIndex; i++) {
      ops.push(i);
    }
    ops.push(pageIndex);
    for (let i = pageIndex + 1; i <= max; i++) {
      ops.push(i);
    }

    if (max < pageCount - 1) {
      if (max !== pageCount - 2) {
        ops.push(-2);
      }
      ops.push(pageCount - 1);
    }
  }
  return ops;
}

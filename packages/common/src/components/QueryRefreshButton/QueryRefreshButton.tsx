import React from 'react';
import { TbRefresh } from 'react-icons/tb';
import classNames from 'classnames';
import type { UseQueryResult } from '@tanstack/react-query';
import { Button } from '../../daisy';

export const QueryRefreshButton: React.FC<{ result: UseQueryResult }> = ({
  result: { isError, refetch, error, isFetching },
}) => {
  return (
    <Button
      title={'刷新'}
      // disabled={isFetching} // 会产生背景
      className={classNames(
        'btn-ghost btn-square btn-sm',
        isFetching && 'opacity-75 loading cursor-progress',
        isError && 'text-error',
      )}
      onClick={() => !isFetching && refetch()}
    >
      <TbRefresh className={'h-6 w-6'} />
    </Button>
  );
};

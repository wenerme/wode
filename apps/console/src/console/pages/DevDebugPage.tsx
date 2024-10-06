import React from 'react';
import { SettingLayout, useDebugState } from '@wener/console/web';
import { useSnapshot } from 'valtio';

const isDev = process.env.NODE_ENV === 'development';

export const DevDebugPage = () => {
  return (
    <SettingLayout title={'调试设置'}>
      {!isDev && (
        <div className='alert alert-error shadow-lg'>
          <div>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              className='h-6 w-6 flex-shrink-0 stroke-current'
              fill='none'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='2'
                d='M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z'
              />
            </svg>
            <span>当前为非开发状态，部分功能无法使用</span>
          </div>
        </div>
      )}
      <fieldset disabled={!isDev} className={'flex flex-col gap-2 rounded border p-2'}>
        <legend>ReactQuery</legend>
        <ReactQueryDevSetting />
      </fieldset>
    </SettingLayout>
  );
};

export default DevDebugPage;

const ReactQueryDevSetting = () => {
  const state = useDebugState().ReactQuery.devtools;
  const { enable } = useSnapshot(state);
  return (
    <div>
      <div className='form-control'>
        <label className='label cursor-pointer'>
          <span className='label-text'>开发者工具</span>
          <input
            type='checkbox'
            className='toggle'
            checked={enable || false}
            onChange={(e) => {
              state.enable = e.target.checked;
            }}
          />
        </label>
      </div>
    </div>
  );
};

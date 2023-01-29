import React from 'react';
import { useSnapshot } from 'valtio';
import { useDebugState } from '../components';
import { SettingLayout } from '../layouts';

const isDev = process.env.NODE_ENV === 'development';

export const DevDebug = () => {
  return (
    <SettingLayout title={'调试设置'}>
      {!isDev && (
        <div className="alert alert-error shadow-lg">
          <div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="stroke-current flex-shrink-0 h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>当前为非开发状态，部分功能无法使用</span>
          </div>
        </div>
      )}
      <fieldset className={'border rounded p-2 flex flex-col gap-2'}>
        <legend>ReactQuery</legend>
        <ReactQueryDevSetting />
      </fieldset>
    </SettingLayout>
  );
};

export default DevDebug;

const ReactQueryDevSetting = () => {
  const state = useDebugState().ReactQuery.devtools;
  const { enable } = useSnapshot(state);
  return (
    <div>
      <div className="form-control">
        <label className="label cursor-pointer">
          <span className="label-text">开发者工具</span>
          <input
            type="checkbox"
            className="toggle"
            disabled={!isDev}
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

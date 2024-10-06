'use client';

import React from 'react';
import { HiKey, HiMagnifyingGlass } from 'react-icons/hi2';
import { Button } from '@wener/console/daisy';
import type { ZXCVBNResult } from 'zxcvbn';
import { ZxcvbnNote } from './ZxcvbnNote';

export const ZxcvbnPasswordStrength: React.FC<{
  password?: string;
  data?: ZXCVBNResult;
}> = ({ password, data }) => {
  return (
    <div className={'p-2'}>
      <h3 className={'flex gap-2 border-b py-4 text-xl font-bold'}>
        <HiKey className={'h-6 w-6'} />
        Zxcvbn 密码强度检测
      </h3>
      <form method={'get'} className={'px-2 py-1'}>
        <div className='form-control'>
          <label className='join'>
            <input
              type='search'
              placeholder='密码'
              className='input join-item input-bordered flex-1'
              name={'password'}
              defaultValue={password || ''}
            />
            <Button
              type={'submit'}
              className={'join-item'}
              // loading={navigation.state !== 'idle'}
            >
              <HiMagnifyingGlass className={'h-6 w-6'} />
            </Button>
          </label>
        </div>
      </form>
      <section className={'flex items-center justify-center p-4'}>
        {data && password && <ZxcvbnDescription data={data} password={password} />}
      </section>
      {data && (
        <section>
          <h4 className={'p-2'}>JSON</h4>
          <pre>
            <code>{JSON.stringify(data, null, 2)}</code>
          </pre>
        </section>
      )}
      <section>
        <ZxcvbnNote />
      </section>
    </div>
  );
};

const ZxcvbnDescription: React.FC<{ data: ZXCVBNResult; password: string }> = ({ data, password }) => {
  const { score, guesses, guesses_log10, feedback, crack_times_display: times } = data;
  const scoreColors = ['#D50000', '#F44336', '#FF5722', '#FFC107', '#43A047'];
  const crackTimes = [
    {
      label: '100 个每小时',
      speedTip: '被限流的在线破解速度',
      value: times.online_throttling_100_per_hour,
    },
    {
      label: '10 个每秒',
      speedTip: '未被限流的在线破解速度',
      value: times.online_no_throttling_10_per_second,
    },
    {
      label: '10,000 个每秒',
      speedTip: '离线破解, 较慢的算法, 多核',
      value: times.offline_slow_hashing_1e4_per_second,
    },
    {
      label: '10亿 个每秒',
      speedTip: '离线破解, 较快的算法, 多核',
      value: times.offline_fast_hashing_1e10_per_second,
    },
  ];
  return (
    <div className='card w-full bg-base-100 shadow-xl'>
      <div className='card-body'>
        <h2 className='card-title'>
          检测结果{' '}
          <span className={'font-normal'}>
            <span style={{ color: scoreColors[score] }}>{score}</span>
            <small className={'font-think'}>/100</small>
          </span>
        </h2>
        <div className={'sm:gay-y-2 grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2'}>
          <div>密码</div>
          <span>{password}</span>
          <div>猜测次数</div>
          <div>
            <div>{guesses}</div>
            <div>
              {guesses_log10.toFixed(6)} <small>LOG10</small>
            </div>
          </div>
          <div>建议</div>
          <div>
            {feedback.warning && <div style={{ color: scoreColors[2] }}>{feedback.warning}</div>}
            <ul>
              {feedback.suggestions.map((v) => (
                <li key={v}>{v}</li>
              ))}
            </ul>
          </div>
          <div>破解时间</div>
          <div>
            {crackTimes.map(({ label, speedTip, value }) => (
              <div key={label}>
                <span style={{ fontWeight: 'bold' }}>{label}:</span>
                <span style={{ fontSize: '1.2rem', padding: '0 8px' }}>{value}</span> ({speedTip})
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

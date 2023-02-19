import React from 'react';
import { HiKey, HiMagnifyingGlass } from 'react-icons/hi2';
import { Form, useLoaderData, useNavigation } from 'react-router-dom';
import { Button } from 'common/src/daisy';
import type { ZXCVBNResult } from 'zxcvbn';
import { ZxcvbnNote } from './ZxcvbnNote';

export const ZxcvbnPasswordStrength = () => {
  const data = useLoaderData() as ZXCVBNResult & { password: string };
  const navigation = useNavigation();
  return (
    <div className={'p-2'}>
      <h3 className={'font-bold text-xl flex gap-2 border-b py-4'}>
        <HiKey className={'w-6 h-6'} />
        Zxcvbn 密码强度检测
      </h3>
      <Form method={'get'} action={'/password/strength'} className={'py-1 px-2'}>
        <div className="form-control">
          <label className="input-group">
            <input
              type="search"
              placeholder="密码"
              className="input-bordered input flex-1"
              name={'password'}
              defaultValue={data?.password || ''}
            />
            <Button type={'submit'} loading={navigation.state !== 'idle'}>
              <HiMagnifyingGlass className={'w-6 h-6'} />
            </Button>
          </label>
        </div>
      </Form>
      <section className={'p-4 flex justify-center items-center'}>
        {data && <ZxcvbnDescription result={data} />}
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

export default ZxcvbnPasswordStrength;

const ZxcvbnDescription: React.FC<{ result: ZXCVBNResult & { password: string } }> = ({ result }) => {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const { score, guesses, guesses_log10, feedback, password, crack_times_display: times } = result;
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
    <div className="card w-full bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">
          检测结果{' '}
          <span className={'font-normal'}>
            <span style={{ color: scoreColors[score] }}>{score}</span>
            <small className={'font-think'}>/100</small>
          </span>
        </h2>
        <div className={'grid grid-cols-1 gap-x-4 gap-y-8 sm:gay-y-2 sm:grid-cols-2'}>
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

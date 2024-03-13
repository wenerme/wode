import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { HiClipboardCopy, HiGlobe, HiRefresh, HiSearch } from 'react-icons/hi';
import { copy } from '@wener/utils';
import classNames from 'classnames';
import type { IResult } from 'ua-parser-js';
import UAParser from 'ua-parser-js';
import { useImmer } from 'use-immer';

export const UserAgentContent = () => {
  const [state, update] = useImmer<{ ua: string; result?: IResult }>({ ua: '' });
  const [randomLoading, setRandomLoading] = useState(false);
  const parser = useMemo(() => new UAParser(), []);
  useEffect(() => {
    update({ ...state, ua: navigator.userAgent });
  }, []);
  const ua = useDeferredValue(state.ua);
  useEffect(() => {
    if (!ua) {
      return;
    }
    const result = parser.setUA(ua).getResult();
    console.log(`Result`, result);
    update({ ...state, result });
  }, [ua]);
  const randomUserAgent = async () => {
    setRandomLoading(true);
    try {
      const { getRandom } = await import('@/shims/random-useragent');
      update({ ...state, ua: getRandom() || state.ua });
    } catch (e) {
      console.error(e);
    } finally {
      setRandomLoading(false);
    }
  };
  return (
    <div className={'flex flex-col'}>
      <div className={'mx-auto max-w-prose flex flex-col gap-4 items-center justify-center '}>
        <div className='form-control'>
          <div className='input-group w-[500px]'>
            <span>
              <HiGlobe className={'h-6 w-6'} />
            </span>
            <input
              type='search'
              placeholder='UserAgent'
              className='flex-1 input input-bordered'
              value={state.ua}
              onChange={(e) => update({ ...state, ua: e.currentTarget.value })}
            />
            <button type={'button'} className={'btn btn-square'} onClick={() => copy(state.ua)}>
              <HiClipboardCopy className={'h-6 w-6'} />
            </button>
          </div>
        </div>
        <div>
          <div className={'btn-group'}>
            <button type={'button'} className={classNames('btn', randomLoading && 'loading')} onClick={randomUserAgent}>
              <HiRefresh className='h-6 w-6' />
              Random
            </button>
            <button type={'button'} className='btn' onClick={() => update({ ...state, ua: navigator.userAgent })}>
              <HiRefresh className='h-6 w-6' />
              Reset
            </button>
          </div>
        </div>
      </div>
      <hr className={'my-4'} />
      <div className={'stats shadow'}>
        <div className={'stat'}>
          <div className={'stat-title'}>Browser</div>
          <div className={'stat-value text-primary'}>{state.result?.browser.name}</div>
          <div className={'stat-desc'}>{state.result?.browser.major}</div>
        </div>
        <div className={'stat'}>
          <div className={'stat-title'}>Engine</div>
          <div className={'stat-value text-primary'}>{state.result?.engine.name}</div>
          <div className={'stat-desc'}>{state.result?.engine.version}</div>
        </div>
        <div className={'stat'}>
          <div className={'stat-title'}>Device</div>
          <div className={classNames('stat-value', state.result?.device.model && 'text-primary')}>
            {state.result?.device.model ?? '-'}
          </div>
          <div className={'stat-desc'}>
            {state.result?.device.type} {state.result?.device.vendor}
          </div>
        </div>
        <div className={'stat'}>
          <div className={'stat-title'}>OS</div>
          <div className={'stat-value text-primary'}>{state.result?.os.name}</div>
          <div className={'stat-desc'}>{state.result?.os.version}</div>
        </div>
        <div className={'stat'}>
          <div className={'stat-title'}>CPU</div>
          <div className={'stat-value text-primary'}>{state.result?.cpu.architecture ?? '-'}</div>
        </div>
      </div>

      <hr className={'my-2'} />
      <div className={'alert'}>
        <div>{state.ua}</div>
      </div>
    </div>
  );
};

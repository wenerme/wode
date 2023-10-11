import React, { useEffect } from 'react';
import { MdRefresh } from 'react-icons/md';
import { nanoid } from '@src/shims/nanoid';
import { ulid } from '@src/shims/ulid';
import type { NextPage } from 'next';
import Head from 'next/head';
import { useImmer } from 'use-immer';

interface Spec {
  title: string;
  name: string;
  next?: () => string;
}
const ids: Spec[] = [
  {
    title: 'UUIDv4',
    name: 'uuidv4',
    next: globalThis.crypto?.randomUUID.bind(globalThis.crypto),
  },
  { title: 'ULID', name: 'ulid', next: ulid },
  { title: 'NanoID', name: 'nanoid', next: globalThis.crypto ? nanoid : undefined },
];

const PageContent = () => {
  const [state, update] = useImmer<{
    ids: Array<{ spec: Spec; time: number; timeRate: number; value: string; disabled: boolean }>;
  }>(() => {
    return {
      ids: ids.map((v) => ({
        spec: v,
        disabled: true,
        value: '',
        time: 0,
        timeRate: 0,
        // value: '',
      })),
    };
  });
  useEffect(() => {
    update((s) => {
      for (const id of s.ids) {
        id.value = id.spec.next?.() || '';
        id.disabled = !id.spec.next;
      }
    });
  }, []);
  const doBenchmark = async (n: number) => {
    const measures = ids.filter((v) => v.next).map((v) => ({ run: v.next!, name: v.name, time: 0, rate: 0 }));
    const loop = n / 10;
    for (const m of measures) {
      const f = m.run;
      const start = performance.now();
      performance.mark(m.name);
      for (let i = 0; i < loop; i++) {
        f();
        f();
        f();
        f();
        f();
        f();
        f();
        f();
        f();
        f();
      }
      performance.measure(m.name);
      const end = performance.now();
      m.time = end - start;
      await Promise.resolve();
    }
    const min = measures.reduce((a, b) => Math.min(a, b.time), Number.POSITIVE_INFINITY);
    measures.forEach((v) => {
      v.rate = v.time / min;
    });
    update((s) => {
      for (let i = 0; i < s.ids.length; i++) {
        const id = s.ids[i];
        if (!id.spec.next) {
          continue;
        }
        id.time = measures[i].time;
        id.timeRate = measures[i].rate;
      }
    });

    performance.clearMarks();
    performance.clearMeasures();
  };
  return (
    <div className={'container mx-auto'}>
      <div className={'prose'}>
        <h1>UUID, ULID, NanoID Benchmarks</h1>
      </div>
      <div className={'flex flex-col gap-8'}>
        <div className={'btn-group'}>
          <button onClick={() => doBenchmark(1000)} type={'button'} className='btn btn-sm'>
            Run 1000 times
          </button>
          <button onClick={() => doBenchmark(10000)} type={'button'} className='btn btn-sm'>
            Run 10,000 times
          </button>
          <button onClick={() => doBenchmark(100000)} type={'button'} className='btn btn-sm'>
            Run 100,000 times
          </button>
          <button
            onClick={() =>
              update((s) => {
                s.ids.forEach((v) => {
                  v.time = 0;
                  v.timeRate = 0;
                });
              })
            }
            type={'button'}
            className='btn btn-sm btn-info'
          >
            Reset
          </button>
        </div>
        <table className={'table w-full'}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Value</th>
              <th></th>
              <th>Performance</th>
            </tr>
          </thead>
          <tbody>
            {state.ids.map((v, i) => (
              <tr key={v.spec.name}>
                <td>{v.spec.title}</td>
                <td>{v.value || 'N/A'}</td>
                <td>
                  <button
                    disabled={v.disabled}
                    onClick={() =>
                      update((s) => {
                        s.ids[i].value = s.ids[i].spec.next?.() || '';
                      })
                    }
                    type={'button'}
                    className='btn btn-square btn-sm'
                  >
                    <MdRefresh />
                  </button>
                </td>
                <td>
                  {Boolean(v.time) && (
                    <span>
                      {v.timeRate.toFixed(2)} / {v.time.toFixed(2)}ms
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const CurrentPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>Demo Page</title>
      </Head>
      <PageContent />
    </>
  );
};

export default CurrentPage;

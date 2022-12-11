import { useEffect } from 'react';
import { HiMagnifyingGlass, HiOutlineXCircle } from 'react-icons/hi2';
import { useImmer } from 'use-immer';
import { USICCard } from '@src/components/cn/USICCard';
import type { ParsedIt, ParseResult } from '@src/components/cn/parseIt';
import { parseIt, tryParse } from '@src/components/cn/parseIt';
import { randomUsci } from '@src/components/cn/usic/randomUsci';

export const ChinaIdInfoPage = () => {
  const [state, update] = useImmer<{
    id: string;
    info: ParsedIt;
    maybe: ParseResult[];
    alter?: { level: string; message: string };
  }>({
    id: '91310000775785552L',
    info: parseIt('91310000775785552L')!,
    maybe: tryParse('91310000775785552L'),
  });
  useEffect(() => {
    update((s) => {
      s.alter = undefined;
    });
  }, [state.id]);
  const { alter, maybe } = state;
  return (
    <div className={'container mx-auto'}>
      <form
        className={'flex flex-col items-center justify-center gap-2'}
        onSubmit={(e) => {
          e.preventDefault();
          update((s) => {
            const info = parseIt(s.id);
            if (!info) {
              s.alter = {
                level: 'error',
                message: '无法解析',
              };
            }
          });
        }}
      >
        <div className="form-control">
          <label className="input-group input-group-lg">
            <span>ID</span>
            <input
              type="text"
              placeholder="身份证、统一信用代码"
              value={state.id}
              onChange={(e) => {
                update((s) => {
                  s.id = e.target.value;
                });
              }}
              className="input input-bordered input-lg md:min-w-[24rem]"
            />
            <button className="btn btn-square btn-lg">
              <HiMagnifyingGlass className={'w-5 h-5'} />
            </button>
          </label>
        </div>

        <div>
          <button
            type={'button'}
            className={'btn'}
            onClick={() => {
              update((s) => {
                const info = randomUsci();
                s.info = {
                  raw: info.raw,
                  type: 'USCI',
                  usci: info,
                };
                s.id = s.info.raw;
              });
            }}
          >
            生成 统一社会信用代码
          </button>
        </div>
      </form>

      <div className={'max-w-lg mx-auto'}>
        {alter && (
          <div
            className={`py-4 alert shadow-lg ${
              { info: 'alert-info', success: 'alert-success', warning: 'alert-warning', error: 'alert-error' }[
                alter.level
              ]
            }`}
          >
            <div>
              {alter.level === 'error' && <HiOutlineXCircle className={'w-7 h-7'} />}
              <span>{alter.message}</span>
            </div>
          </div>
        )}
      </div>
      <div className={'py-4 max-w-lg mx-auto'}>
        {maybe
          .filter((v) => v.matched)
          .map((v) => {
            const name = v.parser.name;
            switch (name) {
              case 'USCI':
                return <USICCard key={name} item={v.data as any} />;
            }
          })}
      </div>
    </div>
  );
};

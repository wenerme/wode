import { useEffect } from 'react';
import { HiMagnifyingGlass, HiOutlineXCircle } from 'react-icons/hi2';
import { ChinaCitizenIdDescription } from '@src/components/cn/ChinaCitizenIdDescription';
import { ParserCard } from '@src/components/cn/ParserCard';
import { Parsers } from '@src/components/cn/Parsers';
import { UnifiedSocialCreditIdDescription } from '@src/components/cn/UnifiedSocialCreditIdDescription';
import { isDefined } from '@wener/utils';
import { useImmer } from 'use-immer';
import type { ParseResult } from './parseIt';
import { tryParse } from './parseIt';

export const ChinaIdInfoPage = () => {
  const [state, update] = useImmer<{
    id: string;
    // info: ParsedIt;
    maybe: ParseResult[];
    alter?: { level: string; message: string };
  }>({
    id: '91310000775785552L',
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    maybe: tryParse('91310000775785552L', Parsers),
  });
  useEffect(() => {
    update((s) => {
      s.alter = undefined;
    });
  }, [state.id]);

  const parse = (id: () => string) => {
    update((s) => {
      s.id = id();
      // const info = parseIt(s.id);
      // if (!info) {
      //   s.alter = {
      //     level: 'error',
      //     message: '无法解析',
      //   };
      // }
      s.maybe = tryParse(s.id, Parsers);
    });
  };

  const { alter, maybe } = state;
  return (
    <div className={'container mx-auto'}>
      <form
        className={'flex flex-col items-center justify-center gap-2'}
        onSubmit={(e) => {
          e.preventDefault();
          parse(() => state.id);
        }}
      >
        <div className='form-control'>
          <label className='input-group input-group-lg'>
            <span>ID</span>
            <input
              type='text'
              placeholder='身份证、统一信用代码'
              value={state.id}
              onChange={(e) => {
                update((s) => {
                  s.id = e.target.value;
                });
              }}
              className='input input-bordered input-lg md:min-w-[24rem]'
            />
            <button className='btn btn-square btn-lg'>
              <HiMagnifyingGlass className={'w-5 h-5'} />
            </button>
          </label>
        </div>

        <div className={'flex flex-wrap gap-2'}>
          {Parsers.filter((v) => isDefined(v.generate)).map(({ title, name, generate }) => {
            return (
              <button
                key={name}
                type={'button'}
                className={'btn'}
                onClick={() => {
                  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion,@typescript-eslint/no-non-null-assertion
                  parse(generate!);
                }}
              >
                生成 {title}
              </button>
            );
          })}
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
      <div className={'py-4 max-w-lg mx-auto flex flex-col gap-4'}>
        {maybe
          .filter((v) => v.matched)
          .map((v) => {
            const name = v.parser.name;
            let content: React.ReactNode;
            switch (name) {
              case 'USCI':
                content = <UnifiedSocialCreditIdDescription item={v.data} />;
                break;
              case 'ChinaCitizenId':
                content = <ChinaCitizenIdDescription item={v.data} />;
                break;
            }
            return (
              <ParserCard key={name} parser={v.parser} parsed={v.data} onChange={(s) => parse(() => s)}>
                {content}
              </ParserCard>
            );
          })}
      </div>
    </div>
  );
};

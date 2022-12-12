import { useEffect } from 'react';
import { HiMagnifyingGlass, HiOutlineXCircle } from 'react-icons/hi2';
import { useImmer } from 'use-immer';
import { ChinaCitizenIdDescription } from '@src/components/cn/ChinaCitizenIdDescription';
import { Parsers } from '@src/components/cn/Parsers';
import { UnifiedSocialCreditIdDescription } from '@src/components/cn/UnifiedSocialCreditIdDescription';
import { isDefined } from '@wener/utils';
import type { Parser, ParseResult } from './parseIt';
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
            switch (name) {
              case 'USCI':
                return (
                  <ParserCard key={name} parser={v.parser}>
                    <UnifiedSocialCreditIdDescription item={v.data} />
                  </ParserCard>
                );
              case 'ChinaCitizenId':
                return (
                  <ParserCard key={name} parser={v.parser}>
                    <ChinaCitizenIdDescription item={v.data} />
                  </ParserCard>
                );
              default:
                return <ParserCard key={name} parser={v.parser}></ParserCard>;
            }
          })}
      </div>
    </div>
  );
};

export const ParserCard: React.FC<{
  parser: Parser;
  parsed?: any;
  children?: React.ReactNode;
}> = ({ parser, children }) => {
  const { title, description } = parser;
  return (
    <>
      <div className="card bg-base-200 shadow-xl">
        <div className="card-body">
          <div className="card-title">
            <h3 className="text-lg font-medium leading-6">{title}</h3>
            <p className="mt-1 max-w-2xl text-sm opacity-75">{description}</p>
          </div>
          {children && <div className="border-t border-base-300 px-4 py-5 sm:px-6">{children}</div>}
        </div>
      </div>
    </>
  );
};

import { useEffect } from 'react';
import { HiMagnifyingGlass, HiOutlineXCircle } from 'react-icons/hi2';
import { useImmer } from 'use-immer';
import { isDefined } from '@wener/utils';
import { IdTypes } from './code';
import { ChinaCitizenId } from './gb11643/ChinaCitizenId';
import type { Parser, ParseResult } from './parseIt';
import { parseIt, Parsers, tryParse } from './parseIt';
import { ParsedUSCI, USICRegistryBureauCode } from './usci/usci';

export const ChinaIdInfoPage = () => {
  const [state, update] = useImmer<{
    id: string;
    // info: ParsedIt;
    maybe: ParseResult[];
    alter?: { level: string; message: string };
  }>({
    id: '91310000775785552L',
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    maybe: tryParse('91310000775785552L'),
  });
  useEffect(() => {
    update((s) => {
      s.alter = undefined;
    });
  }, [state.id]);

  const parse = (id: () => string) => {
    update((s) => {
      s.id = id();
      const info = parseIt(s.id);
      if (!info) {
        s.alter = {
          level: 'error',
          message: '无法解析',
        };
      }
      s.maybe = tryParse(s.id);
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
              <button key={name} type={'button'} className={'btn'} onClick={() => parse(generate!)}>
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
                    <USCIDescription item={v.data} />
                  </ParserCard>
                );
              case 'ChinaCitizenId':
                return (
                  <ParserCard key={name} parser={v.parser}>
                    <CnIdDescription item={v.data} />
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

const USCIDescription: React.FC<{ item: ParsedUSCI }> = ({ item }) => {
  return (
    <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <dt className="text-sm font-medium opacity-85">{IdTypes.USCI.label}</dt>
        <dd className="mt-1 text-sm">{item.raw}</dd>
      </div>
      <div className="sm:col-span-1">
        <dt className="text-sm font-medium opacity-85">登记管理部门</dt>
        <dd className="mt-1 text-sm">{USICRegistryBureauCode[item.registryBureauCode]?.label}</dd>
      </div>
      <div className="sm:col-span-1">
        <dt className="text-sm font-medium opacity-85">机构类别</dt>
        <dd className="mt-1 text-sm">
          {USICRegistryBureauCode[item.registryBureauCode]?.codes?.[item.registryBureauTypeCode]?.label}
        </dd>
      </div>
      <div className="sm:col-span-1">
        <dt className="text-sm font-medium opacity-85">登记管理机关行政区划码</dt>
        <dd className="mt-1 text-sm">{item.registryBureauDistrictCode}</dd>
      </div>
      <div className="sm:col-span-1">
        <dt className="text-sm font-medium opacity-85">主体标识码/组织机构代码</dt>
        <dd className="mt-1 text-sm">{item.subjectCode}</dd>
      </div>
      <div className="sm:col-span-1">
        <dt className="text-sm font-medium opacity-85">校验码</dt>
        <dd className="mt-1 text-sm">{item.checkCode}</dd>
      </div>
    </dl>
  );
};

const CnIdDescription: React.FC<{ item: ChinaCitizenId }> = ({ item }) => {
  return (
    <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <dt className="text-sm font-medium opacity-85">{'身份证'}</dt>
        <dd className="mt-1 text-sm">{item.toString()}</dd>
      </div>
      <div className="sm:col-span-1">
        <dt className="text-sm font-medium opacity-85">出生地编号</dt>
        <dd className="mt-1 text-sm">{item.division}</dd>
      </div>
      <div className="sm:col-span-1">
        <dt className="text-sm font-medium opacity-85">性别</dt>
        <dd className="mt-1 text-sm">{item.gender}</dd>
      </div>
      <div className="sm:col-span-1">
        <dt className="text-sm font-medium opacity-85">出生日期</dt>
        <dd className="mt-1 text-sm">{item.date.format('YYYY-MM-DD')}</dd>
      </div>
      <div className="sm:col-span-1">
        <dt className="text-sm font-medium opacity-85">序号</dt>
        <dd className="mt-1 text-sm">{item.sequence}</dd>
      </div>
      <div className="sm:col-span-1">
        <dt className="text-sm font-medium opacity-85">校验码</dt>
        <dd className="mt-1 text-sm">
          {item.sum} {item.valid ? '✅' : '❌'}
        </dd>
      </div>
    </dl>
  );
};

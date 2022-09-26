import React, { useEffect, useMemo } from 'react';
import classNames from 'classnames';
import MarkdownIt from 'markdown-it';
import type { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useImmer } from 'use-immer';
import { SampleMd } from '@src/contents/MarkdownIt/const';

const Demo = () => {
  const [options, updateOptions] = useImmer<MarkdownIt.Options>({
    html: false,
    xhtmlOut: false,
    breaks: false,
    langPrefix: 'language-',
    linkify: false,
    quotes: '“”‘’',
    typographer: false,
  });
  let md = useMemo(() => new MarkdownIt(options), [options]);
  useEffect(() => {
    (window as any)['markdownIt'] = md;
  }, [md]);
  const {
    query: { tab = 'render' },
  } = useRouter();

  const [state, update] = useImmer<{
    json: string;
    jsonMinify: boolean;
    jsonTrimEmpty: boolean;
    html: string;
    md: string;
  }>(() => ({
    json: '',
    html: '',
    jsonMinify: false,
    jsonTrimEmpty: false,
    md: SampleMd,
  }));
  useEffect(() => {
    update((s) => {
      switch (tab) {
        case 'render':
        case 'html':
          s.html = md.render(s.md);
          break;
        case 'json':
          let minify = (key: string, value: any): any => {
            switch (value) {
              case 0:
              case '':
              case null:
              case false:
                return;
            }
            return value;
          };
          s.json = JSON.stringify(md.parse(s.md, { references: {} }), state.jsonTrimEmpty ? minify : undefined, 2);
          console.log(`render json`, s.json.length);
          break;
      }
    });
  }, [md, tab, state.md, state.jsonMinify, state.jsonTrimEmpty]);

  const opts = [
    { label: 'HTML Tag?', name: 'html', tooltip: 'Keep html tag in output' },
    { label: 'XHtml Out?', name: 'xhtmlOut', tooltip: 'Self close tag, xml compatible' },
    { label: 'Breaks(\\n)?', name: 'breaks' },
    { label: 'Linkify?', name: 'linkify' },
    { label: 'Typographer?', name: 'typographer' },
    { label: 'Lang prefix', name: 'langPrefix', tooltip: 'Code block classname prefix' },
  ];
  return (
    <div className={'container mx-auto flex-1 flex flex-col '}>
      <div className={'form-control flex-row gap-4'}>
        {opts.map((v, i) => {
          let val = options[v.name as keyof MarkdownIt.Options];
          return (
            <label key={i} className={'label'}>
              <span data-tip={v.tooltip} className={classNames('label-text', v.tooltip && 'tooltip tooltip-bottom')}>
                {v.label}
              </span>
              {typeof val === 'boolean' && (
                <input
                  type={'checkbox'}
                  checked={Boolean(val)}
                  onChange={(e) => updateOptions({ ...options, [v.name]: e.currentTarget.checked })}
                />
              )}
              {typeof val !== 'boolean' && (
                <input
                  className={'border rounded p-0.5 ml-1'}
                  value={String(val)}
                  onChange={(e) => updateOptions({ ...options, [v.name]: e.currentTarget.value })}
                />
              )}
            </label>
          );
        })}
      </div>

      <div className={'flex-1 grid grid-cols-2 gap-2 pb-4'}>
        <div className={'flex flex-col'}>
          <textarea
            className={'border p-2 resize-none h-full'}
            defaultValue={state.md}
            onBlur={(e) => {
              let next = e.currentTarget.value;
              update((s) => {
                if (s.md === next) {
                  return;
                }
                s.md = next;
              });
            }}
          />
        </div>

        <div className={'border p-2 flex flex-col'}>
          <div className="tabs">
            <Link href={{ query: { tab: 'render' } }}>
              <a className={classNames('tab tab-lifted', tab === 'render')}>Render</a>
            </Link>
            <Link href={{ query: { tab: 'html' } }}>
              <a className={classNames('tab tab-lifted', tab === 'html')}>HTML</a>
            </Link>
            <Link href={{ query: { tab: 'json' } }}>
              <a className={classNames('tab tab-lifted', tab === 'json')}>JSON</a>
            </Link>
          </div>
          {tab === 'render' && (
            <div className={'prose'}>
              <article dangerouslySetInnerHTML={{ __html: state.html }} />
            </div>
          )}
          {tab === 'html' && <textarea readOnly className={'resize-none w-full h-full'} value={state.html} />}
          {tab === 'json' && (
            <div className={'flex-1 flex flex-col'}>
              <div className={'border-b p-1 px-4 form-control flex-row'}>
                <label className={'label'}>
                  <span className={'label-text'}>Trim Empty</span>
                  <input
                    type="checkbox"
                    checked={state.jsonTrimEmpty}
                    onChange={(e) => update({ ...state, jsonTrimEmpty: e.currentTarget.checked })}
                  />
                </label>
              </div>
              <textarea readOnly className={'flex-1 resize-none w-full h-full'} value={state.json} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const CurrentPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>MarkdownIt Demo</title>
      </Head>
      <Demo />
    </>
  );
};

export default CurrentPage;

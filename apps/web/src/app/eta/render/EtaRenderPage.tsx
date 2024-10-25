'use client';

import React, { type FC } from 'react';
import { useCompareEffect } from '@wener/reaction';
import { deepEqual } from '@wener/utils';
import { Eta } from 'eta';
import { useMutative } from 'use-mutative';

const eta = new Eta();
type EtaConfig = typeof Eta.prototype.config;

export const EtaRenderPage = () => {
  const [state, update] = useMutative({
    template: 'Hello <%=it.name%>!',
    data: {
      name: 'Wener',
    },
    options: {
      useWith: true,
      autoTrim: false,
    } as Partial<EtaConfig>,
    output: '',
  });
  useCompareEffect(
    () => {
      const { template, data, options } = state;
      update((s) => {
        try {
          s.output = eta.withConfig(options).renderString(template, {
            it: data,
            $: MarkdownUtils,
          });
        } catch (e) {
          console.error(e);
        }
      });
    },
    [state.template, state.output, state.data],
    deepEqual,
  );
  return (
    <div className={'grid h-full grid-cols-2 gap-2'}>
      <div className={'flex flex-col'}>
        <h3 className={'font-bold'}>ETA Template</h3>
        <textarea
          className={'textarea textarea-bordered'}
          cols={30}
          rows={10}
          value={state.template}
          onChange={(e) => {
            update((s) => {
              s.template = e.target.value;
            });
          }}
        />
        <div className={'flex flex-col'}>
          <h3 className={'font-bold'}>Data</h3>
          <DataInput
            initialData={{ name: 'Wener' }}
            onDataChange={(v) =>
              update((s) => {
                s.data = v;
              })
            }
          />
        </div>
      </div>
      <textarea cols={30} rows={10} value={state.output} className={'textarea textarea-bordered'} />
    </div>
  );
};

const DataInput: FC<{ initialData?: any; onDataChange?: (v: any) => void }> = ({ initialData, onDataChange }) => {
  const [{ value, data }, update] = useMutative(() => {
    return {
      value: initialData ? JSON.stringify(initialData, null, 2) : '{}',
      format: 'json',
      data: initialData ?? {},
    };
  });
  return (
    <div className={'flex flex-col'}>
      <div>
        <button className={'btn btn-sm'}>Pretty</button>
      </div>
      <textarea
        className={'textarea textarea-bordered'}
        cols={30}
        rows={10}
        value={value}
        onChange={(e) => {
          update((s) => {
            s.value = e.target.value;
            try {
              s.data = JSON.parse(e.target.value);
              onDataChange?.(s.data);
            } catch (e) {
              console.error(e);
            }
          });
        }}
      />
    </div>
  );
};

const MarkdownUtils: TemplateUtils = {
  link: (txt: string, href?: string) => {
    if (href) {
      return `[${txt}](${href})`;
    }
    return txt;
  },
};
const HTMLUtils: TemplateUtils = {
  link: (txt: string, href?: string) => {
    if (href) {
      return `<a href='${encodeURI(href)}'>${txt}</a>`;
    }
    return txt;
  },
};
const TextUtils: TemplateUtils = {
  link: (txt: string, href?: string) => {
    return href || txt;
  },
};

export interface TemplateUtils {
  link(txt: string, href?: string): string;
}

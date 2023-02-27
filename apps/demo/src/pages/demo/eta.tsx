import React from 'react';
import * as Eta from 'eta';
import { EtaConfig } from 'eta/dist/types/config';
import { useImmer } from 'use-immer';
import { useCompareEffect } from '@wener/reaction';
import { deepEqual } from '@wener/utils';

const CurrentPage = () => {
  const [state, update] = useImmer({
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
          s.output = Eta.render(
            template,
            {
              it: data,
              $: MarkdownUtils,
            },
            Eta.getConfig(options),
          );
        } catch (e) {
          console.error(e);
        }
      });
    },
    [state.template, state.output, state.data],
    deepEqual,
  );
  return (
    <div className={'grid grid-cols-2 gap-2 h-full'}>
      <div className={'flex flex-col'}>
        <h3 className={'font-bold'}>Template</h3>
        <textarea
          cols="30"
          rows="10"
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
      <textarea cols="30" rows="10" value={state.output} />
    </div>
  );
};

const DataInput: React.FC<{ initialData?: any; onDataChange?: (v: any) => void }> = ({ initialData, onDataChange }) => {
  const [{ value, data }, update] = useImmer(() => {
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
        cols="30"
        rows="10"
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

export default CurrentPage;

'use client';

import React, { useEffect } from 'react';
import { useAsyncEffect } from '@wener/reaction';
import type { transform } from 'sucrase';
import { useMutative } from 'use-mutative';

export const SucraseTransformPage = () => {
  const [state, update] = useMutative({
    input: `import React,{useEffect} from 'react';

export const DefaultName = 'wener';
export default function Hello({name = DefaultName}) {
  return <div>Hello {name}!</div>
}
`,
    output: '',
    version: '',
    transform: (() => {
      return { code: '' };
    }) as typeof transform,
    error: undefined as any,
  });
  useAsyncEffect(async () => {
    const { transform, getVersion } = await import('sucrase');
    update((s) => {
      s.version = getVersion();
      s.transform = transform;
    });
  }, []);

  useEffect(() => {
    const { input, transform } = state;
    update((s) => {
      try {
        s.output = transform(input, {
          transforms: ['jsx', 'typescript'],
        }).code;
      } catch (e) {
        s.error = e;
      }
    });
  }, [state.transform, state.input]);
  return (
    <div className={'container mx-auto flex flex-1 flex-col'}>
      <h3 className={'font-lg font-medium'}>
        sucrase Transform <small>v{state.version}</small>
      </h3>
      <div className={'grid grid-cols-2 gap-2'}>
        <textarea
          className={'textarea textarea-bordered'}
          rows={10}
          value={state.input}
          onChange={(e) => update({ ...state, input: e.currentTarget.value })}
        />
        <textarea className={'textarea textarea-bordered'} rows={10} value={state.output} />
      </div>
    </div>
  );
};

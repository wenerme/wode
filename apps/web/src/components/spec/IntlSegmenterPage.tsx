'use client';

import React, { useEffect } from 'react';
import { HiXCircle } from 'react-icons/hi2';
import { useDeepCompareEffect } from '@wener/reaction';
import { useMutative } from 'use-mutative';

export const IntlSegmenterPage = () => {
  const [state, update] = useMutative({
    hasSegmenter: true,
    input: '今天天气真的好好，好想出去玩，真希望明天也有这么好的天气。',
    output: {
      grapheme: [] as SegmentData[],
      word: [] as SegmentData[],
      sentence: [] as SegmentData[],
    },
    locales: ['zh-CN', 'zh-TW', 'en-US'] as string[],
    segment: (s: string) => {
      return {
        grapheme: [] as SegmentData[],
        word: [] as SegmentData[],
        sentence: [] as SegmentData[],
      };
    },
  });
  useEffect(() => {
    if (!global.Intl?.Segmenter) {
      update((s) => {
        s.hasSegmenter = false;
      });
    }
  }, []);
  useDeepCompareEffect(() => {
    const { locales } = state;
    const a = new Intl.Segmenter(locales, { granularity: 'grapheme' });
    const b = new Intl.Segmenter(locales, { granularity: 'word' });
    const c = new Intl.Segmenter(locales, { granularity: 'sentence' });
    update((s) => {
      s.segment = (s: string) => {
        return {
          grapheme: Array.from(a.segment(s)),
          word: Array.from(b.segment(s)),
          sentence: Array.from(c.segment(s)),
        };
      };
      s.output = s.segment(s.input.trim());
    });
  }, [state.locales]);
  const doSegment = () => {
    const { input } = state;
    update((s) => {
      s.output = s.segment(input.trim());
    });
  };
  return (
    <div className={'container mx-auto flex flex-1 flex-col'}>
      <h3 className={'font-lg font-medium'}>Intl.Segmenter</h3>
      {!state.hasSegmenter && (
        <div className='alert alert-error shadow-lg'>
          <div>
            <HiXCircle className={'h-4 w-4'} />
            <span>Do not support Intl.Segmenter</span>
          </div>
        </div>
      )}
      <div className={'flex flex-wrap gap-2 p-4'}>
        <div className='form-control'>
          <label className='input-group'>
            <span>Locals</span>
            <input
              type='text'
              defaultValue={'zh-CN,zh-TW,en-US'}
              onChange={(e) => {
                update({ ...state, locales: e.currentTarget.value.split(',').map((v) => v.trim()) });
              }}
              className='input input-bordered'
            />
          </label>
        </div>

        <button onClick={doSegment} className={'btn btn-primary'}>
          Segment
        </button>
      </div>
      <div className={'grid grid-cols-2 gap-2'}>
        <textarea
          className={'textarea textarea-bordered'}
          value={state.input}
          onChange={(e) => update({ ...state, input: e.currentTarget.value })}
        />
        <div className={'flex flex-col'}>
          <h4>grapheme</h4>
          <textarea
            rows={3}
            className={'textarea textarea-bordered'}
            readOnly
            value={state.output.grapheme.map((v) => v.segment).join(' / ')}
          />
          <h4>word</h4>
          <textarea
            rows={3}
            className={'textarea textarea-bordered'}
            readOnly
            value={state.output.word.map((v) => v.segment).join(' / ')}
          />
          <h4>sentence</h4>
          <textarea
            rows={3}
            className={'textarea textarea-bordered'}
            readOnly
            value={state.output.sentence.map((v) => v.segment).join(' / ')}
          />
        </div>
      </div>
    </div>
  );
};

interface SegmentData {
  segment: string;
  index: number;
  input: string;
  isWordLike?: boolean;
}

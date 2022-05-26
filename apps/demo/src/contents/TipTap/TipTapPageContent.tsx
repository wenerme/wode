import React from 'react';
import { TipTapWord } from '@src/components/TipTapWord/TipTapWord';
import { CharacterCounter } from '@src/components/TipTapWord/Statusbar/CharacterCounter';
import { useImmer } from 'use-immer';
import { DataViewer } from '@src/components/TipTapWord/Statusbar/DataViewer';

export const TipTapPageContent = () => {
  let [state, update] = useImmer({ count: 0 });
  return (
    <TipTapWord>
      <TipTapWord.Status>
        <CharacterCounter />
      </TipTapWord.Status>
      <TipTapWord.Status placement={'right'}>
        <DataViewer />
      </TipTapWord.Status>
      <TipTapWord.Status>
        <button
          className={'hover:bg-gray-200 rounded p-0.5'}
          onClick={() =>
            update((s) => {
              s.count++;
            })
          }
        >
          Counter {state.count}
        </button>
      </TipTapWord.Status>
    </TipTapWord>
  );
};

import React, { memo } from 'react';
import { useEditorState } from '@src/contents/TipTap/TipTapWord/hooks';

export const CharacterCount = memo(() => {
  const [state] = useEditorState({
    initialState: { characters: 0, words: 0 },
    onUpdate({ state: s, editor }) {
      s.characters = editor.storage.characterCount.characters();
      s.words = editor.storage.characterCount.words();
    },
  });

  return (
    <span className={'flex gap-2'}>
      <span>
        字数 <span className={'w-[3ch] inline-block'}>{state.characters}</span>
      </span>
      <span>
        词数 <span className={'w-[3ch] inline-block'}>{state.words}</span>
      </span>
    </span>
  );
});

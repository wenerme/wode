import React, { memo } from 'react';
import { CharacterCount } from '@src/contents/TipTap/TipTapWord/Statusbar/CharacterCount';
import { DataViewer } from '@src/contents/TipTap/TipTapWord/Statusbar/DataViewer';

export const Statusbar = memo(() => {
  return (
    <div className={'bg-white border-t text-xs h-6 flex items-center px-4 justify-between'}>
      <CharacterCount />

      <DataViewer />
    </div>
  );
});
Statusbar.displayName = 'StatusBar';

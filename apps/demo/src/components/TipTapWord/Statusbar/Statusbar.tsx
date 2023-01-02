import React, { memo } from 'react';
import { PlaceSlot } from '../components/PlaceSlot';

export const Statusbar = memo(() => {
  return (
    <div className={'bg-white border-t text-xs h-6 flex items-center px-4 justify-between'}>
      <div className={'flex items-center gap-2'}>
        <PlaceSlot slot={'Status'} placement={'left'} />
      </div>

      <div className={'flex items-center gap-2'}>
        <PlaceSlot slot={'Status'} placement={'right'} />
      </div>
    </div>
  );
});
Statusbar.displayName = 'StatusBar';

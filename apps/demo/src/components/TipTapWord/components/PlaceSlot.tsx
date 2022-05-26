import React, { memo, useCallback } from 'react';
import { useEditorStore } from '@src/components/TipTapWord/useEditorStore';

export const PlaceSlot = memo<{ slot: string; placement?: string }>(({ slot, placement }) => {
  const children = useEditorStore(
    useCallback(
      (s) => {
        return (
          s.slots[slot]
            ?.filter((v) => v.placement === placement)
            .map((v, i) => <React.Fragment key={i}>{v.children}</React.Fragment>) || []
        );
      },
      [slot, placement],
    ),
  );
  return <>{children}</>;
});
PlaceSlot.displayName = 'PlaceSlot';

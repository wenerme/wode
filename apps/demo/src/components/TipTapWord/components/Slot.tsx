import React, { memo, useEffect, useId } from 'react';
import type { EditorStore } from '@src/components/TipTapWord/useEditorStore';
import { useEditorStoreApi } from '@src/components/TipTapWord/useEditorStore';
import { useCompareEffect } from '@wener/reaction';
import produce from 'immer';
import type { DraftFunction } from 'use-immer';

export interface SlotProps {
  name: string;
  placement?: string;
  order?: number;
  children?: React.ReactNode;
}

export const Slot: React.FC<SlotProps> = memo<SlotProps>((props) => {
  const api = useEditorStoreApi();
  const updateSlots = (f: DraftFunction<EditorStore['slots']>) => {
    api.setState((s) => {
      const next = produce<EditorStore['slots']>(f)(s.slots);
      if (s.slots === next) {
        return s;
      }
      return { ...s, slots: next };
    });
  };
  const id = useId();
  useCompareEffect(() => {
    updateSlots((slots) => {
      const slot = { order: 100, ...props, id };
      const place = (slots[slot.name || ''] ||= []);
      const idx = place.findIndex((v) => v.id === id);
      if (idx >= 0) {
        place[idx] = slot;
      } else {
        place.push(slot);
      }
    });
  }, Object.values(props));
  useEffect(() => {
    return () => {
      updateSlots((slots) => {
        const slot = (slots[props.name || ''] ||= []);
        const idx = slot.findIndex((v) => v.id === id);
        if (idx < 0) {
          return;
        }
        slot.splice(idx, 1);
      });
    };
  });
  return <></>;
});
Slot.displayName = 'Slot';

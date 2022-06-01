import React, { memo, useEffect, useId } from 'react';
import { EditorStore, useEditorStoreApi } from '@src/components/TipTapWord/useEditorStore';
import { DraftFunction } from 'use-immer';
import produce from 'immer';
import { useCompareEffect } from '@wener/reaction';

export interface SlotProps {
  name: string;
  placement?: string;
  order?: number;
  children?: React.ReactNode;
}

export const Slot: React.FC<SlotProps> = memo<SlotProps>((props) => {
  let api = useEditorStoreApi();
  const updateSlots = (f: DraftFunction<EditorStore['slots']>) => {
    api.setState((s) => {
      const next = produce<EditorStore['slots']>(f)(s.slots);
      if (s.slots === next) {
        return s;
      }
      return { ...s, slots: next };
    });
  };
  let id = useId();
  useCompareEffect(() => {
    updateSlots((slots) => {
      let slot = { order: 100, ...props, id };
      const place = (slots[slot.name || ''] ||= []);
      let idx = place.findIndex((v) => v.id === id);
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
        let idx = slot.findIndex((v) => v.id === id);
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

import type { FC, PropsWithChildren, ReactNode } from 'react';
import React, { memo, useCallback, useDebugValue, useEffect, useId } from 'react';
import { useCompareEffect } from '@wener/reaction';
import { createStore } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { shallow } from 'zustand/shallow';
import { createStoreContext } from '../../components/zustand';

export interface SlotProps<
  S extends Record<string, string> = {},
  N extends string = keyof S & string,
  P extends string = S[N],
> {
  name: N;
  placement?: P;
  order?: number;
  children: ReactNode;
}
export interface SlotPlaceholderProps<
  S extends Record<string, string> = {},
  N extends string = keyof S & string,
  P extends string = S[N],
> {
  name: N;
  // aux
  placement?: P;
  // placeholder for missing slot content
  placeholder?: ReactNode;
}

export interface SlotData {
  id: string;
  name: string;
  placement: string;
  order: number;
  children: ReactNode;
}

interface SlotStore {
  slots: Record<string, SlotData[]>;
}

const createSlotStore = () => createStore<SlotStore>()(immer(() => ({ slots: {} })));

export function createSlotContext<SlotTypes extends Record<string, string> = {}>() {
  const { Provider, useStore, useStoreApi } = createStoreContext<ReturnType<typeof createSlotStore>>();
  const SlotProvider: FC<PropsWithChildren<{ name?: string }>> = ({ children }) => {
    return <Provider createStore={createSlotStore}>{children}</Provider>;
  };

  const Slot = memo<SlotProps<SlotTypes>>(({ name, placement = 'default', order = 0, children }) => {
    const api = useStoreApi();
    const slotId = useId();
    placement ||= 'default';
    order ||= 0;
    const slotPlace = `${name}/${placement}`;
    useCompareEffect(() => {
      // wrap children with key
      api.setState((s) => {
        const slots = (s.slots[slotPlace] ||= []);
        const slot = slots.find((v) => v.id === slotId);
        if (slot) {
          Object.assign(slot, {
            name,
            placement,
            order,
            children,
          });
        } else {
          slots.push({
            id: slotId,
            name,
            placement,
            order,
            children,
          });
        }
        slots.sort((a, b) => b.order - a.order);
      });
    }, [slotPlace, order, children]);
    useEffect(() => {
      return () => {
        api.setState((s) => {
          s.slots[slotPlace] = s.slots[slotPlace]?.filter((v) => v.id !== slotId);
        });
      };
    }, []);
    useDebugValue(`Slot ${slotPlace}@{${slotId}`);
    return null;
  });
  Slot.displayName = 'Slot';

  function useSlot({ name, placement }: { name: string; placement?: string }) {
    const slotPlace = `${name}/${placement || 'default'}`;
    return useStore(
      useCallback((s) => s.slots[slotPlace] || [], [slotPlace]),
      shallow,
    );
  }

  const SlotPlaceholder = memo<SlotPlaceholderProps<SlotTypes>>(({ name, placement, placeholder }) => {
    const slotPlace = `${name}/${placement || 'default'}`;
    const slot = useStore(
      useCallback((s) => s.slots[slotPlace] || [], [slotPlace]),
      shallow,
    );
    useDebugValue(`SlotPlaceholder ${name}${placement ? `@${placement}` : ''}`);
    const children = slot.length
      ? slot.map((v) => {
          return v.children;
        })
      : placeholder;
    return <>{children}</>;
  });
  SlotPlaceholder.displayName = 'SlotPlaceholder';
  return { Slot, useSlot, SlotPlaceholder, SlotProvider };
}

export const { Slot, SlotPlaceholder, SlotProvider, useSlot } = createSlotContext();

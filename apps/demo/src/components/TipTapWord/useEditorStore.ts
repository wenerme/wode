import React, { RefObject } from 'react';
import create from 'zustand';
import createContext from 'zustand/context';
import { Editor } from '@tiptap/react';

export const {
  Provider: EditorStoreProvider,
  useStore: useEditorStore,
  useStoreApi: useEditorStoreApi,
} = createContext<ReturnType<typeof createEditorStore>>();

type Optional<T, K extends keyof T> = Omit<T, K> & Partial<T>;
export const createEditorStore = (init: Optional<EditorStore, 'settings' | 'slots'>) =>
  create<EditorStore>(() => {
    return {
      slots: {},
      ...init,
      settings: { presetStyleName: 'prose-gray', ...init.settings },
    };
  });

export interface EditorStore {
  editor: Editor;
  editorDomRef: RefObject<HTMLDivElement>;
  settings: EditorSettings;
  slots: Record<string, SlotState[]>;
}

export interface EditorSettings {
  viewSize?: string;
  presetStyleName?: 'prose-gray' | string;

  [key: string]: any;
}

export interface SlotState {
  id: string;
  name: string;
  placement?: string;
  order: number;
  children?: React.ReactNode;
}

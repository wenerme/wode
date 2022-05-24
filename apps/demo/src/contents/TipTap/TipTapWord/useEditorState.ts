import createContext from 'zustand/context';
import create from 'zustand';
import { Editor } from '@tiptap/react';
import { RefObject } from 'react';

export const {
  Provider: EditorStoreProvider,
  useStore: useEditorStore,
  useStoreApi: useEditorStoreApi,
} = createContext<ReturnType<typeof createEditorStore>>();

export const createEditorStore = (init: Omit<EditorStore, 'settings'> & Partial<Pick<EditorStore, 'settings'>>) =>
  create<EditorStore>(() => {
    return {
      settings: {},
      ...init,
    };
  });

export interface EditorStore {
  editor: Editor;
  editorDomRef: RefObject<HTMLDivElement>;
  settings: Record<string, any>;
}
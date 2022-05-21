import createContext from 'zustand/context';
import create from 'zustand';
import { Editor } from '@tiptap/react';
import { MutableRefObject, RefObject } from 'react';

export const {
  Provider: EditorStoreProvider,
  useStore: useEditorStore,
  useStoreApi: useEditorStoreApi,
} = createContext<ReturnType<typeof createEditorStore>>();

export const createEditorStore = (init: EditorStore) =>
  create<EditorStore>(() => {
    return {
      ...init,
    };
  });

export interface EditorStore {
  editor: Editor;
  editorDomRef: RefObject<HTMLDivElement>;
}

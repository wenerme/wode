import { Draft } from 'immer';
import { Editor } from '@tiptap/react';
import { Updater, useImmer } from 'use-immer';
import { EditorStore, useEditorStore } from '@src/components/TipTapWord/useEditorStore';
import { useEffect } from 'react';

export function useEditorDerivedState<S = any>(o: {
  initialState: S;
  onUpdate: (o: { state: Draft<S>; editor: Editor }) => void;
}): { state: S; update: Updater<S>; editor: Editor } {
  const editor: Editor = useEditorStore((s) => s.editor);
  const [state, update] = useImmer(o.initialState);
  useEffect(() => {
    const e = editor;
    let handleUpdate = () => {
      update((state) => {
        o.onUpdate({ state, editor });
      });
    };
    e.on('update', handleUpdate);
    return () => {
      e.off('update', handleUpdate);
    };
  }, [editor]);
  return { state, update, editor };
}

let selectEditor = (s: EditorStore) => s.editor;

export function useCurrentEditor() {
  return useEditorStore(selectEditor);
}

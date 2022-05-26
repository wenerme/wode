import { Draft } from 'immer';
import { Editor } from '@tiptap/react';
import { Updater, useImmer } from 'use-immer';
import { EditorStore, useEditorStore } from '@src/contents/TipTap/TipTapWord/useEditorState';
import { useEffect } from 'react';

export function useEditorState<S = any>(o: {
  initialState: S;
  onUpdate: (o: { state: Draft<S>; editor: Editor }) => void;
}): [S, Updater<S>] {
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
  return [state, update];
}

let selectEditor = (s: EditorStore) => s.editor;

export function useCurrentEditor() {
  return useEditorStore(selectEditor);
}

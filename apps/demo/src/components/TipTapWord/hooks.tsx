import { useEffect } from 'react';
import type { Draft } from 'immer';
import type { Updater } from 'use-immer';
import { useImmer } from 'use-immer';
import type { EditorStore } from '@src/components/TipTapWord/useEditorStore';
import { useEditorStore } from '@src/components/TipTapWord/useEditorStore';
import type { Editor } from '@tiptap/react';

export function useEditorDerivedState<S = any>(o: {
  initialState: S;
  onUpdate: (o: { state: Draft<S>; editor: Editor }) => void;
}): { state: S; update: Updater<S>; editor: Editor } {
  const editor: Editor = useEditorStore((s) => s.editor);
  const [state, update] = useImmer(o.initialState);
  useEffect(() => {
    const e = editor;
    const handleUpdate = () => {
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

const selectEditor = (s: EditorStore) => s.editor;

export function useCurrentEditor() {
  return useEditorStore(selectEditor);
}

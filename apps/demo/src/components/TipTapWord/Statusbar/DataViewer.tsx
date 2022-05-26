import React, { memo, useEffect, useRef, useState } from 'react';
import { useEditorStore } from '@src/components/TipTapWord/useEditorStore';
import { useImmer } from 'use-immer';
import { createPortal } from 'react-dom';
import { Editor } from '@tiptap/react';

const modes: Record<string, { title: string; get: (e: Editor) => string; set?: (e: Editor, v: string) => void }> = {
  json: {
    title: 'JSON',
    get: (e) => JSON.stringify(e.getJSON(), null, 2),
    set: (e, v) => e.commands.setContent(JSON.parse(v)),
  },
  html: {
    title: 'HTML',
    get: (e) => e.getHTML(),
    set: (e, v) => e.commands.setContent(v),
  },
  text: {
    title: 'Text',
    get: (e) => e.getText(),
  },
};
export const DataViewer = memo(() => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const editor = useEditorStore((s) => s.editor);
  const [state, update] = useImmer<{
    mode: string;
  }>({
    mode: '',
  });

  let mode = modes[state.mode] || { title: '' };
  const setMode = (mode: string) => {
    update({ mode });
    if (!mode) {
      dialogRef.current?.close();
    } else {
      dialogRef.current?.showModal();
    }
  };
  return (
    <>
      {createPortal(
        <div className={'absolute z-20 inset-0 isolate pointer-events-none'}>
          <dialog
            ref={dialogRef}
            className={
              'bg-white border shadow-lg pointer-events-auto m-0 absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-1/2'
            }
          >
            <DisplayValue
              value={mode?.get?.(editor) || ''}
              onSet={mode.set ? (v) => mode.set?.(editor, v) : undefined}
              title={mode.title}
            />
            <hr />
            <form method="dialog">
              <button onClick={() => setMode('')}>Close</button>
            </form>
          </dialog>
        </div>,
        document.body,
      )}

      <div className={'flex gap-2'}>
        <button className={'hover:bg-gray-300 active:bg-gray-400 rounded p-0.5'} onClick={() => setMode('html')}>
          HTML
        </button>
        <button className={'hover:bg-gray-300 active:bg-gray-400 rounded p-0.5'} onClick={() => setMode('json')}>
          JSON
        </button>
        <button className={'hover:bg-gray-300 active:bg-gray-400 rounded p-0.5'} onClick={() => setMode('text')}>
          TEXT
        </button>
      </div>
    </>
  );
});
DataViewer.displayName = 'DataViewer';

const DisplayValue: React.FC<{ title: string; value: string; onSet?: (v: string) => void }> = ({
  title,
  value,
  onSet,
}) => {
  const [edit, setEdit] = useState(value);
  const lastRef = useRef(value);

  useEffect(() => {
    if (lastRef.current === edit) {
      setEdit(value);
      lastRef.current = value;
    }
  }, [value]);
  return (
    <div className={'flex flex-col gap-2'}>
      <h3 className={'border-b flex justify-between items-center p-2'}>
        <span className={'font-bold'}>{title}</span>

        <div className={'flex gap-2'}>
          <button
            type={'button'}
            className={'btn btn-xs btn-outline'}
            disabled={edit === value}
            onClick={() => {
              lastRef.current = value;
              setEdit(value);
            }}
          >
            Reset
          </button>
          <button
            type={'button'}
            className={'btn btn-xs btn-outline'}
            disabled={edit === value || !onSet}
            onClick={() => {
              lastRef.current = edit;
              onSet?.(edit);
            }}
          >
            Set
          </button>
        </div>
      </h3>
      <textarea
        spellCheck="false"
        rows={10}
        className={'border rounded font-mono'}
        value={edit}
        onChange={(e) => setEdit(e.target.value)}
      />
    </div>
  );
};
declare global {
  interface HTMLDialogElement {
    close(): void;

    show(): void;

    showModal(): void;
  }
}

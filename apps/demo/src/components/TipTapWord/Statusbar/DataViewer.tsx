import type { ButtonHTMLAttributes } from 'react';
import React, { memo, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useImmer } from 'use-immer';
import type { Editor } from '@tiptap/react';
import { createMarkdownSerializer } from '@wener/tiptap';
import { useEditorStore } from '../useEditorStore';

const modes: Record<
  string,
  {
    title: string;
    get: (e: Editor) => string;
    set?: (e: Editor, v: string) => void;
    format?: (v: string) => string;
    minify?: (v: string) => string;
  }
> = {
  html: {
    title: 'HTML',
    get: (e) => e.getHTML(),
    set: (e, v) => e.commands.setContent(v),
  },
  json: {
    title: 'JSON',
    get: (e) => JSON.stringify(e.getJSON(), null, 2),
    set: (e, v) => e.commands.setContent(JSON.parse(v)),
    format: (v) => {
      return JSON.stringify(JSON.parse(v), null, 2);
    },
    minify: (v) => {
      return JSON.stringify(JSON.parse(v), (key, value) => {
        // empty
        switch (value) {
          case null:
          case '':
            return;
        }
        if (typeof value === 'object' && Object.values(value).length === 0) {
          return;
        }
        // default
        if (key.startsWith('margin') && value === '0rem') {
          return;
        }
        if (key === 'cssColumns' && value === '1') {
          return;
        }
        if (key === 'textAlign' && value === 'left') {
          return;
        }
        return value;
      });
    },
  },
  markdown: {
    title: 'Markdown',
    get: (e) => createMarkdownSerializer(e.schema).serialize(e.state.doc, {}),
    set: (e, v) => e.commands.setMarkdownContent(v),
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

  const mode = modes[state.mode] || { title: '' };
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
              onFormat={mode.format}
              onMinify={mode.minify}
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
        {Object.entries(modes).map(([name, v]) => (
          <button
            key={name}
            className={'hover:bg-gray-300 active:bg-gray-400 rounded p-0.5'}
            onClick={() => setMode(name)}
          >
            {v.title}
          </button>
        ))}
      </div>
    </>
  );
});
DataViewer.displayName = 'DataViewer';

const DisplayValue: React.FC<{
  title: string;
  value: string;
  onSet?: (v: string) => void;
  onMinify?: (v: string) => string;
  onFormat?: (v: string) => string;
}> = ({ title, value, onSet, onMinify, onFormat }) => {
  const [edit, setEdit] = useState(value);
  const lastRef = useRef(value);

  useEffect(() => {
    if (lastRef.current === edit) {
      setEdit(value);
      lastRef.current = value;
    }
  }, [value]);
  const actions: Array<Partial<ButtonHTMLAttributes<HTMLButtonElement>> | false> = [
    {
      disabled: !onMinify,
      onClick: () => {
        setEdit(onMinify?.(edit) || '');
      },
      children: 'Minify',
    },
    {
      disabled: !onFormat,
      onClick: () => {
        setEdit(onFormat?.(edit) || '');
      },
      children: 'Format',
    },
    {
      disabled: edit === value,
      onClick: () => {
        lastRef.current = value;
        setEdit(value);
      },
      children: 'Reset',
    },
    {
      disabled: edit === value || !onSet,
      onClick: () => {
        lastRef.current = edit;
        onSet?.(edit);
      },
      children: 'Set',
    },
  ];
  return (
    <div className={'flex flex-col gap-2'}>
      <h3 className={'border-b flex justify-between items-center p-2'}>
        <span className={'font-bold'}>{title}</span>

        <div className={'flex gap-2'}>
          <small>size {edit.length}</small>
          {actions.filter(Boolean).map((v, i) => {
            return <button key={i} type={'button'} className={'btn btn-xs btn-outline'} {...v} />;
          })}
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

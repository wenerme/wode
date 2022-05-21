import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import React, { useEffect, useRef, useState } from 'react';
import { EditorHere } from '@src/contents/TipTap/EditorHere';
import UnderlineExtension from '@tiptap/extension-underline';
import LinkExtension from '@tiptap/extension-link';
import ImageExtension from '@tiptap/extension-image';
import TextAlignExtension from '@tiptap/extension-text-align';
import TableExtension from '@tiptap/extension-table';
import TableRowExtension from '@tiptap/extension-table-row';
import TableCellExtension from '@tiptap/extension-table-cell';
import TableHeaderExtension from '@tiptap/extension-table-header';
import TextStyleExtension from '@tiptap/extension-text-style';
import TaskItemExtension from '@tiptap/extension-task-item';
import TaskListExtension from '@tiptap/extension-task-list';
import CharacterCountExtension from '@tiptap/extension-character-count';
import HorizontalRuleExtension from '@tiptap/extension-horizontal-rule';
import HighlightExtension from '@tiptap/extension-highlight';
// import { Highlight as HighlightExtension } from './extensions/highlight';
import { Color as ColorExtension } from '@tiptap/extension-color';
import FontFamilyExtension from '@tiptap/extension-font-family';
import { FontSize as FontSizeExtension, TextStyles as LineHeightExtension } from './extensions/text-styles';
import CSSColumnsExtension from './extensions/css-columns';
import VideExtension from './extensions/video';
import { Toolbar } from '@src/contents/TipTap/Toolbar';
import { createEditorStore, EditorStoreProvider } from './useEditorState';

export const TipTapPageContent = () => {
  const [value, setValue] = useState({ html: '', json: {} });
  const editorDomRef = useRef<HTMLDivElement>(null);
  const editor = useEditor({
    extensions: [
      // Text
      StarterKit.configure({}),
      TaskItemExtension,
      TaskListExtension,
      UnderlineExtension,
      TextAlignExtension.configure({
        types: ['heading', 'paragraph'],
      }),
      TextStyleExtension,
      FontFamilyExtension,
      FontSizeExtension,
      LineHeightExtension,
      // FontWeightExtension,
      // LineHeightExtension,
      // IndentExtension,
      ColorExtension,
      HighlightExtension.configure({ multicolor: true }),
      //
      LinkExtension.configure({
        autolink: true,
        openOnClick: false,
        linkOnPaste: true,
      }),
      // Notes
      ImageExtension.configure({
        inline: false,
        allowBase64: true,
      }),
      VideExtension.configure({
        inline: false,
        allowBase64: true,
      }),
      // Table
      TableExtension.configure({
        resizable: true,
        allowTableNodeSelection: true,
      }),
      TableRowExtension,
      TableCellExtension,
      TableHeaderExtension,

      CharacterCountExtension.configure(),

      CSSColumnsExtension.configure({
        types: ['paragraph'],
      }),
    ],
    content: value.html,
    onUpdate(ctx) {
      setValue({ html: ctx.editor.getHTML(), json: ctx.editor.getJSON() });
    },
  });
  if (editor === null) {
    return null;
  }
  // Update content if value is changed outside (Mainly for i18n)
  // if (editor.getHTML() !== value.html) {
  //   editor.commands.setContent(value.html);
  // }

  return (
    <div className={'flex flex-col gap-4'}>
      <EditorStoreProvider createStore={() => createEditorStore({ editor, editorDomRef })}>
        <div ref={editorDomRef} className={'bg-[#f8f9fa] flex flex-col'}>
          <Toolbar className={'border-b shadow bg-white'} editor={editor} />
          <div className={'relative p-4'}>
            <div className={'px-4 shadow border bg-white resize-y overflow-auto'}>
              <EditorHere editor={editor} />
            </div>
          </div>
        </div>
      </EditorStoreProvider>
      <hr />
      <div className={'container mx-auto'}>
        <div className={'grid grid-cols-2 gap-8'}>
          <DisplayValue title={'HTML'} value={value.html} onSet={(value) => editor.commands.setContent(value)} />
          <DisplayValue
            title={'JSON'}
            value={JSON.stringify(value.json, null, 2)}
            onSet={(value) => editor.commands.setContent(value)}
          />
        </div>
      </div>
    </div>
  );
};

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
            className={'btn btn-xs btn-outline'}
            disabled={edit === value}
            onClick={() => {
              lastRef.current = value;
              setEdit(value);
            }}
          >
            Reset
          </button>
          <button className={'btn btn-xs btn-outline'} disabled={edit === value} onClick={() => onSet?.(edit)}>
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

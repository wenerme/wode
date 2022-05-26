import { Editor, EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import React, { useEffect, useRef, useState } from 'react';
import UnderlineExtension from '@tiptap/extension-underline';
import LinkExtension from '@tiptap/extension-link';
import { Image as ImageExtension } from './extensions/image';
import TextAlignExtension from '@tiptap/extension-text-align';
import TableExtension from '@tiptap/extension-table';
import TableRowExtension from '@tiptap/extension-table-row';
import TableCellExtension from '@tiptap/extension-table-cell';
import TableHeaderExtension from '@tiptap/extension-table-header';
import { TextStyle as TextStyleExtension } from './extensions/text-style';
import TaskItemExtension from '@tiptap/extension-task-item';
import TaskListExtension from '@tiptap/extension-task-list';
import CharacterCountExtension from '@tiptap/extension-character-count';
import HighlightExtension from '@tiptap/extension-highlight';
// import { Highlight as HighlightExtension } from './extensions/highlight';
import { Color as ColorExtension } from '@tiptap/extension-color';
import FontFamilyExtension from '@tiptap/extension-font-family';
import CssColumnsExtension from './extensions/css-columns';
import { BlockStyles, TextFormats, TextIndent } from './extensions/text-styles';
import VideExtension from './extensions/video';
import { Toolbar } from '@src/contents/TipTap/TipTapWord/Toolbar/Toolbar';
import { createEditorStore, EditorStore, EditorStoreProvider, useEditorStoreApi } from './useEditorState';
import { Viewer } from '@src/contents/TipTap/TipTapWord/Viewer';
import { Statusbar } from '@src/contents/TipTap/TipTapWord/Statusbar/Statusbar';
import { Menubar } from '@src/contents/TipTap/TipTapWord/Menubar/Menubar';
import { ClassNamesExtension } from '@src/contents/TipTap/TipTapWord/extensions/class-names';
import { IndentExtension } from '@src/contents/TipTap/TipTapWord/extensions/indent';
// import { Document as DocumentExtension } from './extensions/document';

const TipTapWordExtensions = [
  // Text
  // DocumentExtension,
  StarterKit.configure({
    // document: false,
  }),
  TaskItemExtension,
  TaskListExtension,
  UnderlineExtension,
  TextAlignExtension.configure({
    types: ['heading', 'paragraph'],
  }),
  TextStyleExtension,
  FontFamilyExtension,
  ...TextFormats,
  ...BlockStyles.map((v) => v.configure({ types: ['listItem', 'heading', 'paragraph'] })),
  TextIndent.configure({
    types: ['paragraph'],
  }),
  ClassNamesExtension,
  // FontWeightExtension,
  // LineHeightExtension,
  IndentExtension,
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

  CssColumnsExtension.configure({
    types: ['paragraph'],
  }),
];

export const TipTapWord: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const [value, setValue] = useState({ html: '', json: {} });
  const editorDomRef = useRef<HTMLDivElement>(null);
  const editor = useEditor({
    extensions: TipTapWordExtensions,
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
    <EditorStoreProvider createStore={() => createEditorStore({ editor, editorDomRef })}>
      <EditorStoreConnector editor={editor} editorDomRef={editorDomRef} />
      <div ref={editorDomRef} className={'flex-1 relative bg-[#f8f9fa] flex flex-col min-h-[400px]'}>
        <Menubar className={'border-b bg-white'} editor={editor} />
        <Toolbar className={'border-b shadow bg-white'} editor={editor} />
        <div className={'flex-1 min-h-0 relative'}>
          <div className={'absolute inset-0 p-4 overflow-auto'}>
            <Viewer>
              <EditorContent
                spellCheck="false"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                editor={editor}
              />
            </Viewer>
          </div>
        </div>
        <Statusbar />
        {children}
      </div>
    </EditorStoreProvider>
  );
};

const EditorStoreConnector: React.FC<Partial<EditorStore>> = ({ editor, editorDomRef }) => {
  let api = useEditorStoreApi();
  useEffect(() => {
    api.setState((s) => {
      let change = s.editor !== editor || s.editorDomRef !== editorDomRef;
      s.editor = editor ?? s.editor;
      s.editorDomRef = editorDomRef ?? s.editorDomRef;
      if (change) {
        return { ...s };
      }
      return s;
    });
  }, [editor]);
  return <></>;
};

import { Editor, EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import React, { memo, useEffect, useRef, useState } from 'react';
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
import HighlightExtension from '@tiptap/extension-highlight';
// import { Highlight as HighlightExtension } from './extensions/highlight';
import { Color as ColorExtension } from '@tiptap/extension-color';
import FontFamilyExtension from '@tiptap/extension-font-family';
import { FontSize as FontSizeExtension, TextStyles as LineHeightExtension } from './extensions/text-styles';
import CSSColumnsExtension from './extensions/css-columns';
import VideExtension from './extensions/video';
import { Toolbar } from '@src/contents/TipTap/Toolbar';
import {
  createEditorStore,
  EditorStore,
  EditorStoreProvider,
  useEditorStore,
  useEditorStoreApi,
} from './useEditorState';
import { Viewer } from '@src/contents/TipTap/Viewer';
import { Updater, useImmer } from 'use-immer';
import { Draft } from 'immer';
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
        <StatusBar />
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
const StatusBar = memo(() => {
  return (
    <div className={'bg-white border-t text-xs h-6 flex items-center px-1'}>
      <CharacterCount />
    </div>
  );
});

StatusBar.displayName = 'StatusBar';

function useEditorState<S = any>(o: {
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

const CharacterCount = memo(() => {
  const [state] = useEditorState({
    initialState: { characters: 0, words: 0 },
    onUpdate({ state: s, editor }) {
      s.characters = editor.storage.characterCount.characters();
      s.words = editor.storage.characterCount.words();
    },
  });

  return (
    <span className={'flex gap-2'}>
      <span>
        字数 <span className={'w-[3ch] inline-block'}>{state.characters}</span>
      </span>
      <span>
        词数 <span className={'w-[3ch] inline-block'}>{state.words}</span>
      </span>
    </span>
  );
});

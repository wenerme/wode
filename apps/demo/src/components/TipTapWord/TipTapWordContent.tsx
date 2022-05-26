import React, { useEffect, useRef } from 'react';
import { Editor, EditorContent } from '@tiptap/react';
import {
  createEditorStore,
  EditorStore,
  EditorStoreProvider,
  useEditorStoreApi,
} from '@src/components/TipTapWord/useEditorStore';
import { Menubar } from '@src/components/TipTapWord/Menubar/Menubar';
import { Toolbar } from '@src/components/TipTapWord/Toolbar/Toolbar';
import { Viewer } from '@src/components/TipTapWord/Viewer';
import { Statusbar } from '@src/components/TipTapWord/Statusbar/Statusbar';

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

export const TipTapWordContent: React.FC<{ children: React.ReactNode; editor: Editor }> = ({ children, editor }) => {
  const editorDomRef = useRef<HTMLDivElement>(null);
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

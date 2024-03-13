import React, { useEffect, useState } from 'react';
import type { Extensions } from '@tiptap/core';
import type { Editor } from '@tiptap/react';
import { useEditor } from '@tiptap/react';
import { TipTapWordStarterKit } from '@wener/tiptap';
import { TipTapWordEditor } from '@/components/TipTapWord/TipTapWordEditor';
import type { SlotProps } from '@/components/TipTapWord/components/Slot';
import { Slot } from '@/components/TipTapWord/components/Slot';

export type TipTapWord = React.FC<
  React.PropsWithChildren<{ useExtensions?: () => Extensions; onEditor?: (v: Editor) => void }>
> & {
  Status: React.ComponentType<Omit<SlotProps, 'name'>>;
  Tool: React.ComponentType<Omit<SlotProps, 'name'>>;
  Menu: React.ComponentType<Omit<SlotProps, 'name'>>;
};

export const TipTapWord: TipTapWord = ({ children, onEditor, useExtensions }) => {
  const [value, setValue] = useState({ html: '', json: {} });
  const editor = useEditor(
    {
      extensions: useExtensions?.() ?? ([TipTapWordStarterKit.configure({})] as Extensions),
      content: value.html,
      onUpdate(ctx) {
        setValue({ html: ctx.editor.getHTML(), json: ctx.editor.getJSON() });
      },
    },
    [useExtensions],
  );
  useEffect(() => {
    if (!editor) {
      return;
    }
    onEditor?.(editor);
  }, [editor]);
  if (editor === null) {
    return null;
  }

  // Update content if value is changed outside (Mainly for i18n)
  // if (editor.getHTML() !== value.html) {
  //   editor.commands.setContent(value.html);
  // }
  return <TipTapWordEditor editor={editor}>{children}</TipTapWordEditor>;
};

Slot.displayName = 'Place';

TipTapWord.Status = (props) => <Slot placement={'left'} {...props} name={'Status'} />;
TipTapWord.Tool = (props) => <Slot {...props} name={'Tool'} />;
TipTapWord.Menu = (props) => <Slot {...props} name={'Menu'} />;
TipTapWord.Status.displayName = 'TipTapWord.Status';
TipTapWord.Tool.displayName = 'TipTapWord.Tool';
TipTapWord.Menu.displayName = 'TipTapWord.Menu';

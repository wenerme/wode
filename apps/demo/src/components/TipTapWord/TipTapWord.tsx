import { Editor, useEditor } from '@tiptap/react';
import React, { useEffect, useState } from 'react';
import { TipTapWordEditor } from '@src/components/TipTapWord/TipTapWordEditor';
import { Slot, SlotProps } from '@src/components/TipTapWord/components/Slot';
import { TipTapWordStarterKit } from '@src/components/TipTapWord/extensions/TipTapWordStarterKit';
import { Extensions } from '@tiptap/core/dist/packages/core/src/types';

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
      extensions: useExtensions?.() ?? [TipTapWordStarterKit.configure({})],
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

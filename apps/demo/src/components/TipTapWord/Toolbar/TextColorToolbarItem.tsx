import React from 'react';
import { Editor } from '@tiptap/react';
import { ColorPickerToolbarItem } from '@src/components/TipTapWord/Toolbar/ColorPickerToolbarItem';
import { ImTextColor } from 'react-icons/im';
import type {} from '@tiptap/extension-color';

export const TextColorToolbarItem: React.FC<{ editor: Editor }> = ({ editor }) => {
  const value = editor.getAttributes('textStyle')?.color || '';
  const onChange = (v: string) => {
    editor.chain().focus().setColor(v).run();
  };
  return (
    <ColorPickerToolbarItem
      icon={<ImTextColor />}
      value={value}
      onChange={onChange}
      onReset={() => editor.chain().focus().unsetColor().run()}
    />
  );
};

import React from 'react';
import { ImTextColor } from 'react-icons/im';
import { ColorPickerToolbarItem } from '@src/components/TipTapWord/Toolbar/ColorPickerToolbarItem';
import type {} from '@tiptap/extension-color';
import type { Editor } from '@tiptap/react';

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

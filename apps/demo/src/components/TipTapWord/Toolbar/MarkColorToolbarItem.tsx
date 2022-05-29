import React from 'react';
import { Editor } from '@tiptap/react';
import { ColorPickerToolbarItem } from '@src/components/TipTapWord/Toolbar/ColorPickerToolbarItem';
import { MdBrush } from 'react-icons/md';

export const MarkColorToolbarItem: React.FC<{ editor: Editor; className?: string }> = ({ editor, className }) => {
  const value = editor.getAttributes('highlight')?.color || '';
  const onChange = (v: string) => {
    editor.chain().focus().setHighlight({ color: v }).run();
  };
  return (
    <ColorPickerToolbarItem
      className={className}
      icon={<MdBrush />}
      value={value}
      onChange={onChange}
      onReset={() => editor.chain().focus().unsetHighlight().run()}
    />
  );
};

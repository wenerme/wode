import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import React, { useState } from 'react';
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
import { Color as ColorExtension } from '@tiptap/extension-color';
import FontFamilyExtension from '@tiptap/extension-font-family';
import CssColumnsExtension from './extensions/css-columns';
import { BlockStyles, TextFormats, TextIndent } from './extensions/text-styles';
import VideExtension from './extensions/video';
import { ClassNamesExtension } from '@src/components/TipTapWord/extensions/class-names';
import { IndentExtension } from '@src/components/TipTapWord/extensions/indent';
import { TipTapWordContent } from '@src/components/TipTapWord/TipTapWordContent';
import { Slot, SlotProps } from '@src/components/TipTapWord/components/Slot';
import MarkdownExtension from '@src/components/TipTapWord/extensions/markdown';

const TipTapWordExtensions = [
  MarkdownExtension,
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

export type TipTapWord = React.FC<React.PropsWithChildren<{}>> & {
  Status: React.ComponentType<Omit<SlotProps, 'name'>>;
  Tool: React.ComponentType<Omit<SlotProps, 'name'>>;
  Menu: React.ComponentType<Omit<SlotProps, 'name'>>;
};

export const TipTapWord: TipTapWord = ({ children }) => {
  const [value, setValue] = useState({ html: '', json: {} });
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
  return <TipTapWordContent editor={editor}>{children}</TipTapWordContent>;
};

Slot.displayName = 'Place';

TipTapWord.Status = (props) => <Slot placement={'left'} {...props} name={'Status'} />;
TipTapWord.Tool = (props) => <Slot {...props} name={'Tool'} />;
TipTapWord.Menu = (props) => <Slot {...props} name={'Menu'} />;
TipTapWord.Status.displayName = 'TipTapWord.Status';
TipTapWord.Tool.displayName = 'TipTapWord.Tool';
TipTapWord.Menu.displayName = 'TipTapWord.Menu';

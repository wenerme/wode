import { Extension } from '@tiptap/core';
import StarterKit, { StarterKitOptions } from '@tiptap/starter-kit';
import MarkdownExtension from '@src/components/TipTapWord/extensions/MarkdownExtension';
import { BoldExtension } from '@src/components/TipTapWord/extensions/BoldExtension';
import { ItalicExtension } from '@src/components/TipTapWord/extensions/ItalicExtension';
import { StrikeExtension } from '@src/components/TipTapWord/extensions/StrikeExtension';
import { UnderlineExtension } from '@src/components/TipTapWord/extensions/UnderlineExtension';
import { TaskItemExtension, TaskListExtension } from '@src/components/TipTapWord/extensions/TaskListExtension';
import TextAlignExtension from '@tiptap/extension-text-align';
import { TextStyleExtension } from '@src/components/TipTapWord/extensions/TextStyleExtension';
import FontFamilyExtension from '@tiptap/extension-font-family';
import { BlockStyles, TextFormats, TextIndent } from '@src/components/TipTapWord/extensions/text-styles';
import { ClassNameExtension } from '@src/components/TipTapWord/extensions/ClassNameExtension';
import { IndentExtension } from '@src/components/TipTapWord/extensions/indent';
import { Color as ColorExtension } from '@tiptap/extension-color';
import HighlightExtension from '@tiptap/extension-highlight';
import LinkExtension from '@tiptap/extension-link';
import { Image as ImageExtension } from '@src/components/TipTapWord/extensions/image';
import VideExtension from '@src/components/TipTapWord/extensions/video';
import TableExtension from '@tiptap/extension-table';
import TableRowExtension from '@tiptap/extension-table-row';
import TableCellExtension from '@tiptap/extension-table-cell';
import TableHeaderExtension from '@tiptap/extension-table-header';
import CharacterCountExtension from '@tiptap/extension-character-count';
import { CssColumnsExtension } from '@src/components/TipTapWord/extensions/CssColumnsExtension';

export const TipTapWordStarterKit = Extension.create<StarterKitOptions>({
  name: 'wordStarterKit',

  addExtensions() {
    const extensions = [
      MarkdownExtension,
      // Text
      // DocumentExtension,
      StarterKit.configure({
        // document: false,
        ...this.options,
        strike: false,
        italic: false,
        bold: false,
      }),
      BoldExtension,
      ItalicExtension,
      StrikeExtension,
      UnderlineExtension,
      TaskListExtension,
      TaskItemExtension,
      TextAlignExtension.configure({
        types: ['heading', 'paragraph'],
      }),

      TextStyleExtension,
      FontFamilyExtension,
      ...TextFormats,
      ...BlockStyles.map((v) => v.configure({ types: ['listItem', 'taskItem', 'heading', 'paragraph'] })),
      TextIndent.configure({
        types: ['paragraph'],
      }),
      ClassNameExtension.configure({
        types: ['textStyle'],
      }),
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
    return extensions;
  },
});

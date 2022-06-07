import { Extension } from '@tiptap/core';
import StarterKit, { StarterKitOptions } from '@tiptap/starter-kit';
import MarkdownExtension from './MarkdownExtension';
import { BoldExtension } from './BoldExtension';
import { ItalicExtension } from './ItalicExtension';
import { StrikeExtension } from './StrikeExtension';
import { UnderlineExtension } from './UnderlineExtension';
import { TaskItemExtension, TaskListExtension } from './TaskListExtension';
import TextAlignExtension from '@tiptap/extension-text-align';
import { TextStyleExtension } from './TextStyleExtension';
import FontFamilyExtension from '@tiptap/extension-font-family';
import { BlockStyles, TextFormats, TextIndent } from './text-styles';
import { ClassNameExtension } from './ClassNameExtension';
import { IndentExtension } from './indent';
import { Color as ColorExtension } from '@tiptap/extension-color';
import HighlightExtension from '@tiptap/extension-highlight';
import LinkExtension from '@tiptap/extension-link';
import { Image as ImageExtension } from './image';
import { VideoNode } from './VideoNode';
import TableExtension from '@tiptap/extension-table';
import TableRowExtension from '@tiptap/extension-table-row';
import TableCellExtension from '@tiptap/extension-table-cell';
import TableHeaderExtension from '@tiptap/extension-table-header';
import CharacterCountExtension from '@tiptap/extension-character-count';
import { CssColumnsExtension } from './CssColumnsExtension';
import type { AnyExtension } from '@tiptap/react';
import type { Extensions } from '@tiptap/core/dist/packages/core/src/types';

export interface TipTapWordStarterKitOptions extends StarterKitOptions {
  underline?: false;
  image?: false;
  video?: false;
}

export const TipTapWordStarterKit = Extension.create<TipTapWordStarterKitOptions>({
  name: 'wordStarterKit',

  addExtensions() {
    const { strike, italic, bold, underline, image, video, ...rest } = this.options;
    const extensions: Array<AnyExtension | boolean> = [
      MarkdownExtension,
      // Text
      // DocumentExtension,
      StarterKit.configure({
        // document: false,
        ...rest,
        strike: false,
        italic: false,
        bold: false,
      }),
      bold === false || BoldExtension,
      italic === false || ItalicExtension,
      strike === false || StrikeExtension,
      underline === false || UnderlineExtension,
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
      image === false ||
        ImageExtension.configure({
          inline: false,
          allowBase64: true,
        }),
      video === false ||
        VideoNode.configure({
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
    return extensions.filter((v) => typeof v !== 'boolean') as Extensions;
  },
});

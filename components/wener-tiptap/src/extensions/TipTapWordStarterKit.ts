import { Extension } from '@tiptap/core';
import type { Extensions } from '@tiptap/core/dist/packages/core/src/types';
import { CharacterCount as CharacterCountExtension } from '@tiptap/extension-character-count';
import { Color as ColorExtension } from '@tiptap/extension-color';
import { FontFamily as FontFamilyExtension } from '@tiptap/extension-font-family';
import { Highlight as HighlightExtension } from '@tiptap/extension-highlight';
import { Link as LinkExtension } from '@tiptap/extension-link';
import { Paragraph } from '@tiptap/extension-paragraph';
import { Table as TableExtension } from '@tiptap/extension-table';
import { TableCell as TableCellExtension } from '@tiptap/extension-table-cell';
import { TableHeader as TableHeaderExtension } from '@tiptap/extension-table-header';
import { TableRow as TableRowExtension } from '@tiptap/extension-table-row';
import { TextAlign as TextAlignExtension } from '@tiptap/extension-text-align';
import type { AnyExtension } from '@tiptap/react';
import { StarterKit, type StarterKitOptions } from '@tiptap/starter-kit';
import { BoldExtension } from './BoldExtension';
import { ClassNameExtension } from './ClassNameExtension';
import { CssColumnsExtension } from './CssColumnsExtension';
import { ImageNode as ImageExtension } from './ImageNode';
import { IndentExtension } from './indent';
import { ItalicExtension } from './ItalicExtension';
import MarkdownExtension from './MarkdownExtension';
import { StrikeExtension } from './StrikeExtension';
import { TaskItemExtension, TaskListExtension } from './TaskListExtension';
import { BlockStyles, TextFormats, TextIndent } from './text-styles';
import { TextStyleExtension } from './TextStyleExtension';
import { UnderlineExtension } from './UnderlineExtension';
import { VideoNode } from './VideoNode';

export interface TipTapWordStarterKitOptions extends StarterKitOptions {
  underline?: false;
  image?: false;
  video?: false;
}

export const TipTapWordStarterKit = Extension.create<TipTapWordStarterKitOptions>({
  name: 'wordStarterKit',

  addExtensions() {
    const { strike, italic, bold, underline, image, video, paragraph, ...rest } = this.options;
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
        paragraph: false,
      }),
      bold === false || BoldExtension,
      italic === false || ItalicExtension,
      strike === false || StrikeExtension,
      underline === false || UnderlineExtension,
      paragraph === false || Paragraph,
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

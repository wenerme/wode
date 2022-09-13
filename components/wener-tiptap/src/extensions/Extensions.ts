import { Bold } from '@tiptap/extension-bold';
import { Italic } from '@tiptap/extension-italic';
import { Strike } from '@tiptap/extension-strike';
import { TaskList } from '@tiptap/extension-task-list';
import { TaskItem } from '@tiptap/extension-task-item';
import { Color } from '@tiptap/extension-color';
import { Highlight } from '@tiptap/extension-highlight';
import { Link } from '@tiptap/extension-link';
import { Code } from '@tiptap/extension-code';
import { Blockquote } from '@tiptap/extension-blockquote';
import { Dropcursor } from '@tiptap/extension-dropcursor';
import { FontFamily } from '@tiptap/extension-font-family';
import { CharacterCount } from '@tiptap/extension-character-count';
import { HorizontalRule } from '@tiptap/extension-horizontal-rule';
import { Image } from '@tiptap/extension-image';
import { Document } from '@tiptap/extension-document';
import { Paragraph } from '@tiptap/extension-paragraph';
import { Placeholder } from '@tiptap/extension-placeholder';
import { Table } from '@tiptap/extension-table';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableRow } from '@tiptap/extension-table-row';
import { TextAlign } from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { Underline } from '@tiptap/extension-underline';
import { Extension, Mark, Node } from '@tiptap/core';
import type { AnyExtension } from '@tiptap/react';
import { MarkdownExtension } from './MarkdownExtension';
import { OrderedList } from '@tiptap/extension-ordered-list';
import { BulletList } from '@tiptap/extension-bullet-list';
import { CodeBlock } from '@tiptap/extension-code-block';
import { HardBreak } from '@tiptap/extension-hard-break';
import { Heading } from '@tiptap/extension-heading';
import { History } from '@tiptap/extension-history';
import { VideoNode } from './VideoNode';

export type ExtensionOptions = {
  [key in Extract<keyof typeof Extensions, string>]?: ExtensionOptionOf<typeof Extensions[key]>;
};

type ExtensionOptionOf<T extends Mark | Extension | Node> =
  | boolean
  | (T extends Mark<infer O>
      ? Partial<O> | AnyExtension
      : T extends Extension<infer O>
      ? Partial<O> | AnyExtension
      : T extends Node<infer O>
      ? Partial<O> | AnyExtension
      : never);

export function addExtensions(o: ExtensionOptions): AnyExtension[] {
  const out = [];
  for (const [key, value] of Object.entries(o)) {
    if (value === false) {
      continue;
    }

    if (value instanceof Mark || value instanceof Node || value instanceof Extension) {
      out.push(value);
      continue;
    }
    const ext = Extensions[key as Extract<keyof typeof Extensions, string>];
    if (!ext) {
      throw new Error(`Extension ${key} not found`);
    }
    if (value === true) {
      out.push(ext);
      continue;
    }
    out.push(ext.configure(value));
  }
  return out;
}

export const Extensions = {
  Markdown: MarkdownExtension,
  Video: VideoNode,

  // Node - Block
  Document,
  Paragraph,
  Table,
  TableCell,
  TableHeader,
  TableRow,
  TableHeaderRow: TableRow.extend({
    name: 'tableHeaderRow',
    content: 'tableHeader*',

    renderMarkdown(state, node) {
      state.write('|');
      state.renderInline(node);
      state.ensureNewLine();
      state.write('|');
      node.forEach((cell) => {
        state.write(state.repeat('-', cell.textContent.length + 2));
        state.write('|');
      });
      state.ensureNewLine();
    },

    parseHTML() {
      return [{ tag: 'tr', priority: 70 }];
    },
  }),
  TaskItem,
  TaskList,
  Blockquote,
  BulletList,
  Image,
  CodeBlock,
  HardBreak,
  Heading,
  HorizontalRule,
  OrderedList,

  // Styles - Mark & Extension & Inline
  Link,
  Bold,
  Code,
  Color,
  FontFamily,
  Highlight,
  Italic,
  Strike,
  TextAlign,
  TextStyle,
  Underline,

  // Functions
  Placeholder,
  History,
  Dropcursor,
  CharacterCount,
} as const;

export const ExtensionBundle = Extension.create<ExtensionOptions>({
  name: 'extensionBundle',
  addExtensions() {
    return addExtensions(this.options);
  },
});

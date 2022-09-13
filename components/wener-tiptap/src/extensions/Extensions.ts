import { Extension, Mark, Node } from '@tiptap/core';
import { Blockquote } from '@tiptap/extension-blockquote';
import { Bold } from '@tiptap/extension-bold';
import { BubbleMenu } from '@tiptap/extension-bubble-menu';
import { BulletList } from '@tiptap/extension-bullet-list';
import { CharacterCount } from '@tiptap/extension-character-count';
import { Code } from '@tiptap/extension-code';
import { CodeBlock } from '@tiptap/extension-code-block';
import { Collaboration } from '@tiptap/extension-collaboration';
import { CollaborationCursor } from '@tiptap/extension-collaboration-cursor';
import { Color } from '@tiptap/extension-color';
import { Document } from '@tiptap/extension-document';
import { Dropcursor } from '@tiptap/extension-dropcursor';
import { FloatingMenu } from '@tiptap/extension-floating-menu';
import { FocusClasses } from '@tiptap/extension-focus';
import { FontFamily } from '@tiptap/extension-font-family';
import { Gapcursor } from '@tiptap/extension-gapcursor';
import { HardBreak } from '@tiptap/extension-hard-break';
import { Heading } from '@tiptap/extension-heading';
import { Highlight } from '@tiptap/extension-highlight';
import { History } from '@tiptap/extension-history';
import { HorizontalRule } from '@tiptap/extension-horizontal-rule';
import { Image } from '@tiptap/extension-image';
import { Italic } from '@tiptap/extension-italic';
import { Link } from '@tiptap/extension-link';
import { ListItem } from '@tiptap/extension-list-item';
import { Mention } from '@tiptap/extension-mention';
import { OrderedList } from '@tiptap/extension-ordered-list';
import { Paragraph } from '@tiptap/extension-paragraph';
import { Placeholder } from '@tiptap/extension-placeholder';
import { Strike } from '@tiptap/extension-strike';
import { Subscript } from '@tiptap/extension-subscript';
import { Superscript } from '@tiptap/extension-superscript';
import { Table } from '@tiptap/extension-table';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableRow } from '@tiptap/extension-table-row';
import { TaskItem } from '@tiptap/extension-task-item';
import { TaskList } from '@tiptap/extension-task-list';
import { Text } from '@tiptap/extension-text';
import { TextAlign } from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { Typography } from '@tiptap/extension-typography';
import { Underline } from '@tiptap/extension-underline';
import type { AnyExtension } from '@tiptap/react';
import { MarkdownExtension } from './MarkdownExtension';
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
    out.push(ext.configure(value as any));
  }
  return out;
}

export const Extensions = {
  Markdown: MarkdownExtension,

  // Node - Block
  Document,
  Paragraph,
  Text,

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
  BulletList,
  ListItem,

  Image,
  Video: VideoNode,
  Blockquote,
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
  Gapcursor,
  BubbleMenu,
  Collaboration,
  CollaborationCursor,
  FloatingMenu,
  Mention,
  Subscript,
  Superscript,
  Typography,
  FocusClasses,
} as const;

export const DefaultExtensionBundleOptions: ExtensionOptions = {
  Document: true,
  Strike: true,
  Text: true,
  Blockquote: true,
  Bold: true,
  BulletList: true,
  Code: true,
  CodeBlock: true,
  Dropcursor: true,
  Gapcursor: true,
  HardBreak: true,
  Heading: true,
  History: true,
  HorizontalRule: true,
  Italic: true,
  ListItem: true,
  OrderedList: true,
  Paragraph: true,
};

export const ExtensionBundle = Extension.create<ExtensionOptions>({
  name: 'extensionBundle',
  addOptions() {
    return DefaultExtensionBundleOptions;
  },
  addExtensions() {
    return addExtensions(this.options);
  },
});

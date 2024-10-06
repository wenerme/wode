import { markInputRule, markPasteRule } from '@tiptap/core';
import { Bold, underscoreInputRegex, underscorePasteRegex } from '@tiptap/extension-bold';
import { Italic } from '@tiptap/extension-italic';
import { Strike } from '@tiptap/extension-strike';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableRow } from '@tiptap/extension-table-row';
import { TaskItem } from '@tiptap/extension-task-item';
import { TaskList } from '@tiptap/extension-task-list';
import { Underline } from '@tiptap/extension-underline';
import { DefaultExtensionBundleOptions, type ExtensionOptions } from './Extensions';
import { ImageNode } from './ImageNode';

export const DefaultMarkdownExtensionOptions: ExtensionOptions = {
  ...DefaultExtensionBundleOptions,
  Image: ImageNode,
  Markdown: true,
  TableHeader: TableHeader.extend({
    renderMarkdown(state, node) {
      state.write(' ');
      state.renderInline(node);
      state.write(' |');
    },
  }),
  TableCell: true,
  TableRow: TableRow.extend({
    renderMarkdown(state, node) {
      state.write('|');
      state.renderInline(node);
      state.ensureNewLine();
    },
  }),
  TableHeaderRow: true,
  Link: {
    autolink: true,
    openOnClick: false,
    linkOnPaste: true,
  },
  TaskItem: TaskItem.extend({
    renderMarkdown: (state, node) => {
      state.write(`[${node.attrs['checked'] ? 'x' : ' '}] `);
      state.renderContent(node);
    },
  }),
  TaskList: TaskList.extend({
    renderMarkdown: (state, node) => {
      state.renderList(node, '  ', () => (node.attrs['bullet'] || '*') + ' ');
    },
  }),
  Strike: Strike.extend({
    renderMarkdown: {
      open: '~~',
      close: '~~',
      mixable: true,
      expelEnclosingWhitespace: true,
    },
  }),

  // __ for underline, ** for bold, _ for italic
  Underline: Underline.extend({
    renderMarkdown: {
      open: '__',
      close: '__',
      mixable: true,
      expelEnclosingWhitespace: true,
    },

    addInputRules() {
      return [
        markInputRule({
          find: underscoreInputRegex,
          type: this.type,
        }),
      ];
    },

    addPasteRules() {
      return [
        markPasteRule({
          find: underscorePasteRegex,
          type: this.type,
        }),
      ];
    },
  }),
  Bold: Bold.extend({
    renderMarkdown: {
      open: '**',
      close: '**',
      mixable: true,
      expelEnclosingWhitespace: true,
    },
  }),
  Italic: Italic.extend({
    renderMarkdown: {
      open: '_',
      close: '_',
      mixable: true,
      expelEnclosingWhitespace: true,
    },
  }),
};

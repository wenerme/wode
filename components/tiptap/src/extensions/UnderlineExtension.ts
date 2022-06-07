import TipTapUnderline from '@tiptap/extension-underline';
import { markInputRule, markPasteRule } from '@tiptap/core';
import { underscoreInputRegex, underscorePasteRegex } from '@tiptap/extension-bold';

export const UnderlineExtension = TipTapUnderline.extend({
  // __ for underline, ** for bold, _ for italic
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
});

import TipTapStrike from '@tiptap/extension-strike';

export const StrikeExtension = TipTapStrike.extend({
  renderMarkdown: {
    open: '~~',
    close: '~~',
    mixable: true,
    expelEnclosingWhitespace: true,
  },
});

import { Strike } from '@tiptap/extension-strike';

export const StrikeExtension = Strike.extend({
  renderMarkdown: {
    open: '~~',
    close: '~~',
    mixable: true,
    expelEnclosingWhitespace: true,
  },
});

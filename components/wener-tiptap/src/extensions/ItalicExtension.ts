import { Italic } from '@tiptap/extension-italic';

export const ItalicExtension = Italic.extend({
  renderMarkdown: {
    open: '_',
    close: '_',
    mixable: true,
    expelEnclosingWhitespace: true,
  },
});

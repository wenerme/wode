import Bold from '@tiptap/extension-bold';

export const BoldExtension = Bold.extend({
  renderMarkdown: {
    open: '**',
    close: '**',
    mixable: true,
    expelEnclosingWhitespace: true,
  },
});

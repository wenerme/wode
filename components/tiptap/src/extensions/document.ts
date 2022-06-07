import { mergeAttributes, Node } from '@tiptap/core';

export const Document = Node.create({
  name: 'doc',
  topNode: true,
  content: 'block+',

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  parseHTML() {
    return [{ tag: 'article' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['article', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)];
  },
});

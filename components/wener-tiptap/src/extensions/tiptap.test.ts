import test from 'ava';
import { ExtensionBundle } from './Extensions';
import { DefaultMarkdownExtensionOptions } from './DefaultMarkdownExtensionOptions';
import { Editor } from '@tiptap/core';

test('renderMarkdown', () => {
  ExtensionBundle.configure(DefaultMarkdownExtensionOptions);
  new Editor({
    // element: this.$refs.element,
    extensions: [ExtensionBundle.configure(DefaultMarkdownExtensionOptions)],
    content: '',
    onCreate({ editor }) {
      editor.schema;
    },
    onUpdate({ editor }) {
      editor.schema;
    },
    onSelectionUpdate({ editor }) {
      editor.schema;
    },
  });
});

test.todo('parseMarkdown');

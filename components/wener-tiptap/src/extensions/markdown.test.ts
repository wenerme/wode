import test from 'ava';
import 'prosemirror-model';
import { Editor } from '@tiptap/core';
import { DefaultMarkdownExtensionOptions } from './DefaultMarkdownExtensionOptions';
import { ExtensionBundle } from './Extensions';
import { createMarkdownSerializer } from './MarkdownExtension';
import { createMarkdownParser } from './parseMarkdown';
import { browserEnv } from './utils.test';

let editor: Editor;
test.before(() => {
  browserEnv();
});

test.before(() => {
  let $ele = document.createElement('div');
  editor = new Editor({
    element: $ele,
    extensions: [ExtensionBundle.configure(DefaultMarkdownExtensionOptions)],
    // extensions: [StarterKit.configure()],
    content: `<p>Hello world! :-)</p>`,
    onCreate({}) {},
    onUpdate({}) {},
    onSelectionUpdate({}) {},
  });
});

test('createMakrdownParser', (t) => {
  let node = createMarkdownParser(editor.schema).parse(
    `
## Hi
**Nice** to meed _your_!
  `.trim(),
  );
  t.snapshot(node.toJSON(), 'MarkdownParser');
});

test('parseMarkdown', (t) => {
  editor.commands.selectAll();
  editor.commands.setMarkdownContent(
    `
## Hi
**Nice** to meed _your_!
  `.trim(),
  );
  {
    t.snapshot(editor.getJSON(), 'getJSON');
    t.snapshot(editor.getHTML(), 'getHTML');
    t.snapshot(editor.getText(), 'getText');
    t.snapshot(createMarkdownSerializer(editor.schema).serialize(editor.state.doc, {}), 'getMarkdown');
  }
});

// function assertContent(t: ExecutionContext, o: { text?: string; html?: string; json?: any; markdown?: string }) {
//   if (o.text) {
//     t.is(editor.getText(), o.text);
//   }
//   if (o.html) {
//     t.is(editor.getHTML(), o.html);
//   }
//   if (o.json) {
//     t.deepEqual(editor.getJSON(), o.json);
//   }
//   if (o.markdown) {
//     t.is(createMarkdownSerializer(editor.schema).serialize(editor.state.doc, {}), o.markdown);
//   }
// }

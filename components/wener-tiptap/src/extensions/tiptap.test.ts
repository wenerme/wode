import test from 'ava';
import { ExtensionBundle } from './Extensions';
import { DefaultMarkdownExtensionOptions } from './DefaultMarkdownExtensionOptions';
import { Editor } from '@tiptap/core';
import { JSDOM, ResourceLoader, type ResourceLoaderConstructorOptions } from 'jsdom';
import 'prosemirror-model';
import { createMarkdownSerializer } from './MarkdownExtension';

let editor: Editor;
test.before(() => {
  if (typeof globalThis === 'undefined') {
    throw new Error('globalThis is not defined');
  }

  // https://github.com/lukechilds/window/blob/master/src/index.js
  class Window {
    constructor(jsdomConfig: ResourceLoaderConstructorOptions = {}) {
      const { proxy, strictSSL, userAgent } = jsdomConfig;
      const resources = new ResourceLoader({
        proxy,
        strictSSL,
        userAgent,
      });
      return new JSDOM(
        '',
        Object.assign(jsdomConfig, {
          resources,
        }),
      ).window;
    }
  }

  // https://github.com/lukechilds/browser-env/blob/master/src/index.js
  // Default jsdom config.
  // These settings must override any custom settings to make sure we can iterate
  // over the window object.
  const defaultJsdomConfig = {
    features: {
      FetchExternalResources: false,
      ProcessExternalResources: false,
    },
  };
  // IIFE executed on import to return an array of global Node.js properties that
  // conflict with global browser properties.
  const protectedProperties = (() =>
    Object.getOwnPropertyNames(new Window(defaultJsdomConfig)).filter(
      (prop) => typeof globalThis[prop as keyof typeof globalThis] !== 'undefined',
    ))();

  function browserEnv(...args: string[]) {
    // Sets up global browser environment
    // Extract options from args
    const properties = args.filter((arg) => Array.isArray(arg))[0];
    const userJsdomConfig = args.filter((arg) => !Array.isArray(arg))[0];

    // Create window object
    const window = new Window(Object.assign({}, userJsdomConfig, defaultJsdomConfig));

    // Get all global browser properties
    Object.getOwnPropertyNames(window)

      // Remove protected properties
      .filter((prop) => protectedProperties.indexOf(prop) === -1)

      // If we're only applying specific required properties remove everything else
      .filter((prop) => !(properties && properties.indexOf(prop) === -1))
      .filter((prop) => {
        switch (prop) {
          case 'undefined':
            return false;
        }
        return true;
      })

      // Copy what's left to the Node.js global scope
      .forEach((prop) => {
        // console.debug(`define globalThis.${prop}`);
        Object.defineProperty(globalThis, prop, {
          configurable: true,
          get: () => window[prop as keyof Window] as any,
        });
      });

    return window;
  }

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

test('parseMarkdown', (t) => {
  editor.commands.selectAll();
  editor.commands.setMarkdownContent(
    `
## Hi
**Nice** to meed _your_!
  `.trim(),
  );
  {
    t.log(JSON.stringify(editor.getJSON(), null, 2));
    t.log({
      markdown: createMarkdownSerializer(editor.schema).serialize(editor.state.doc, {}),
      html: editor.getHTML(),
      text: editor.getText(),
    });
  }
  t.pass();
});

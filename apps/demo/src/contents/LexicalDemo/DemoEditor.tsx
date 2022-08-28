import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { PlainTextPlugin as LexicalPlainTextPlugin } from '@lexical/react/LexicalPlainTextPlugin';
import { $getRoot, $getSelection, EditorState, EditorThemeClasses, LexicalNode } from 'lexical';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { ContentEditable as LexicalContentEditable } from '@lexical/react/LexicalContentEditable';
import { OnChangePlugin as LexicalOnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect, useRef } from 'react';
import { AutoFocusPlugin as LexicalAutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { AutoScrollPlugin as LexicalAutoScrollPlugin } from '@lexical/react/LexicalAutoScrollPlugin';
import { ClearEditorPlugin as LexicalClearEditorPlugin } from '@lexical/react/LexicalClearEditorPlugin';
import { HashtagPlugin as LexicalHashtagPlugin } from '@lexical/react/LexicalHashtagPlugin';
import { RichTextPlugin as RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { CodeHighlightNode, CodeNode } from '@lexical/code';
import { HashtagNode } from '@lexical/hashtag';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { ListItemNode, ListNode } from '@lexical/list';
import { MarkNode } from '@lexical/mark';
import { OverflowNode } from '@lexical/overflow';
import { HorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { TableCellNode, TableNode, TableRowNode } from '@lexical/table';
import { Class } from 'utility-types';
import create from 'zustand';
import createContext from 'zustand/context';

const theme: EditorThemeClasses = {
  // Theme styling goes here
};

// When the editor changes, you can get notified via the
// LexicalOnChangePlugin!
function onChange(editorState: EditorState) {
  editorState.read(() => {
    // Read the contents of the EditorState here.
    const root = $getRoot();
    const selection = $getSelection();

    console.log(root, selection);
  });
}

// Lexical React plugins are React components, which makes them
// highly composable. Furthermore, you can lazy load plugins if
// desired, so you don't pay the cost for plugins until you
// actually use them.
function MyCustomAutoFocusPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    // Focus the editor when the effect fires!
    editor.focus();
  }, [editor]);

  return null;
}

function onError(error: any) {
  console.error(error);
}

const nodes: Array<Class<LexicalNode>> = [
  HeadingNode,
  ListNode,
  ListItemNode,
  QuoteNode,
  CodeNode,
  TableNode,
  TableCellNode,
  TableRowNode,
  HashtagNode,
  CodeHighlightNode,
  AutoLinkNode,
  LinkNode,
  OverflowNode,
  // PollNode,
  // StickyNode,
  // ImageNode,
  // MentionNode,
  // EmojiNode,
  // ExcalidrawNode,
  // EquationNode,
  // TypeaheadNode,
  // KeywordNode,
  HorizontalRuleNode,
  // TweetNode,
  // YouTubeNode,
  MarkNode,
];

interface EditorStore {
  settings: {
    isRichText: boolean;
  };
  slots: {};
}

export const {
  Provider: EditorStoreProvider,
  useStore: useEditorStore,
  useStoreApi: useEditorStoreApi,
} = createContext<ReturnType<typeof createEditorStore>>();

type Optional<T, K extends keyof T> = Omit<T, K> & Partial<T>;
export const createEditorStore = (init: Optional<EditorStore, 'settings' | 'slots'>) =>
  create<EditorStore>(() => {
    return {
      slots: {},
      ...init,
      settings: { isRichText: true, ...init.settings },
    };
  });

export const DemoEditor = () => {
  return (
    <EditorStoreProvider createStore={() => createEditorStore({})}>
      <DemoEditorContent />
    </EditorStoreProvider>
  );
};
const DemoEditorContent = () => {
  // const initialConfig: Parameters<typeof LexicalComposer>[0]['initialConfig'] = {
  const initialConfig: any = {
    namespace: 'WenerDemoEditor',
    theme,
    nodes,
    onError: (error: any, editor: any) => {
      console.log(`Editor Error`, error);
    },
  };
  const settings = useEditorStore((s) => s.settings);
  let api = useEditorStoreApi();
  const setSettings = (v: EditorStore['settings']) => {
    api.setState((s) => {
      return { ...s, settings: v };
    });
  };
  return (
    <>
      <LexicalComposer initialConfig={initialConfig}>
        <Editor />
      </LexicalComposer>

      <div>
        <h3>Settings</h3>
        <fieldset>
          <label>
            Rich Text?
            <input
              type={'checkbox'}
              checked={settings.isRichText}
              onChange={(e) => {
                setSettings({ ...settings, isRichText: e.currentTarget.checked });
              }}
            />
          </label>
        </fieldset>
      </div>
    </>
  );
};

const Editor = () => {
  const scrollRef = useRef(null);
  const settings = useEditorStore((s) => s.settings);
  let placeholder = <div>Enter some text...</div>;

  return (
    <>
      <LexicalAutoFocusPlugin />
      <LexicalClearEditorPlugin />

      <LexicalHashtagPlugin />
      {/*<MentionsPlugin />*/}
      {/*<EmojisPlugin />*/}
      {/*<ExcalidrawPlugin />*/}
      {/*<KeywordsPlugin />*/}
      {/*<HorizontalRulePlugin />*/}
      {/*<SpeechToTextPlugin />*/}
      {/*<AutoLinkPlugin />*/}
      {/*<CharacterStylesPopupPlugin />*/}
      {/*<EquationsPlugin />*/}
      <LexicalAutoScrollPlugin scrollRef={scrollRef} />

      {settings.isRichText ? (
        <>
          <RichTextPlugin
            contentEditable={<LexicalContentEditable className={'LexicalContentEditable__root'} />}
            placeholder={placeholder}
          />
          {/*<LexicalMarkdownShortcutPlugin />*/}
        </>
      ) : (
        <>
          <LexicalPlainTextPlugin
            contentEditable={<LexicalContentEditable className={'LexicalContentEditable__root'} />}
            placeholder={placeholder}
          />
        </>
      )}
      <LexicalOnChangePlugin onChange={onChange} />
      <HistoryPlugin />
    </>
  );
};

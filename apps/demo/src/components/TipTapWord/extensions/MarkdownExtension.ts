import { Extension, getExtensionField, Mark, MarkConfig, Node } from '@tiptap/core';
import { defaultMarkdownSerializer, MarkdownSerializer, MarkdownSerializerState } from 'prosemirror-markdown';
import { MarkType, Node as ProsemirrorNode, NodeType, Schema } from 'prosemirror-model';
import { NodeConfig } from '@tiptap/react';
import { createMarkdownParser } from '@src/components/TipTapWord/extensions/parseMarkdown';

// https://github.com/nextcloud/text/blob/master/src/extensions/Markdown.js
// https://github.com/ProseMirror/prosemirror-model/blob/master/src/to_dom.ts
// https://github.com/ProseMirror/prosemirror-markdown/blob/master/src/to_markdown.ts

export type MarkSerializerSpec = {
  /// The string that should appear before a piece of content marked
  /// by this mark, either directly or as a function that returns an
  /// appropriate string.
  open: string | ((state: MarkdownSerializerState, mark: Mark, parent: Node, index: number) => string);
  /// The string that should appear after a piece of content marked by
  /// this mark.
  close: string | ((state: MarkdownSerializerState, mark: Mark, parent: Node, index: number) => string);
  /// When `true`, this indicates that the order in which the mark's
  /// opening and closing syntax appears relative to other mixable
  /// marks can be varied. (For example, you can say `**a *b***` and
  /// `*a **b***`, but not `` `a *b*` ``.)
  mixable?: boolean;
  /// When enabled, causes the serializer to move enclosing whitespace
  /// from inside the marks to outside the marks. This is necessary
  /// for emphasis marks as CommonMark does not permit enclosing
  /// whitespace inside emphasis marks, see:
  /// http:///spec.commonmark.org/0.26/#example-330
  expelEnclosingWhitespace?: boolean;
  /// Can be set to `false` to disable character escaping in a mark. A
  /// non-escaping mark has to have the highest precedence (must
  /// always be the innermost mark).
  escape?: boolean;
};

declare module '@tiptap/core' {
  interface MarkConfig<Options = any, Storage = any> {
    renderMarkdown?: MarkSerializerSpec;
  }

  interface NodeConfig<Options = any, Storage = any> {
    renderMarkdown?: (
      this: {
        name: string;
        options: Options;
        storage: Storage;
      },
      state: MarkdownSerializerState,
      node: ProsemirrorNode,
      parent: ProsemirrorNode,
      index: number,
    ) => void;
  }

  interface Commands<ReturnType> {
    markdown: {
      setMarkdownContent: (content: string) => ReturnType;
    };
  }
}

export interface MarkdownOptions {
  serializers: {
    nodes: Record<string, NodeConfig['renderMarkdown']>;
    marks: Record<string, MarkConfig['renderMarkdown']>;
  };
}

export const MarkdownExtension = Extension.create<MarkdownOptions>({
  name: 'markdown',
  addOptions() {
    return {
      serializers: {
        nodes: {},
        marks: {},
      },
    };
  },
  extendMarkSchema(extension: Mark) {
    // this
    const context = {
      name: extension.name,
      options: extension.options,
      storage: extension.storage,
    };
    return {
      renderMarkdown: getExtensionField(extension, 'renderMarkdown', context),
      parseMarkdown: getExtensionField(extension, 'parseMarkdown', context),
    };
  },

  extendNodeSchema(extension: Node) {
    const context = {
      name: extension.name,
      options: extension.options,
      storage: extension.storage,
    };
    return {
      renderMarkdown: getExtensionField(extension, 'renderMarkdown', context),
      parseMarkdown: getExtensionField(extension, 'parseMarkdown', context),
    };
  },

  addCommands() {
    return {
      setMarkdownContent: (v) => {
        return ({ tr, editor, dispatch }) => {
          if (dispatch) {
            let node = createMarkdownParser(editor.schema).parse(v);
            tr.replaceSelectionWith(node, false).setMeta('preventUpdate', true);
          }
          return true;
        };
      },
    };
  },
});

export const createMarkdownSerializer = (schema: Schema) => {
  const { nodes, marks } = schema;
  const create = () => {
    // snake_case to camelCase
    const defaultNodes = convertNames(defaultMarkdownSerializer.nodes);
    const defaultMarks = convertNames(defaultMarkdownSerializer.marks);
    return new MarkdownSerializer(
      { ...defaultNodes, ...(extractRenderMarkdown(nodes) as any) },
      { ...defaultMarks, ...(extractRenderMarkdown(marks) as any) },
    );
  };
  let serializer = (schema.cached.markdownSerializer ??= create());

  return {
    serializer,
    serialize(content: ProsemirrorNode, options: Record<string, any>): string {
      return this.serializer
        .serialize(content, { ...options, tightLists: true })
        .split('\\[')
        .join('[')
        .split('\\]')
        .join(']');
    },
  };
};

const extractRenderMarkdown = (nodesOrMarks: Record<string, MarkType | NodeType>) => {
  return Object.entries(nodesOrMarks)
    .map(([name, nodeOrMark]) => [name, nodeOrMark.spec.renderMarkdown])
    .filter(([, renderMarkdown]) => renderMarkdown)
    .reduce(
      (items, [name, renderMarkdown]) => ({
        ...items,
        [name]: renderMarkdown,
      }),
      {},
    );
};

const convertNames = (object: Record<string, any>) => {
  const convert = (name: string) => {
    return name.replace(/_(\w)/g, (_m, letter) => letter.toUpperCase());
  };
  return Object.fromEntries(Object.entries(object).map(([name, value]) => [convert(name), value]));
};

export default MarkdownExtension;

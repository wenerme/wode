import { Extension, getExtensionField, Mark, MarkConfig, Node } from '@tiptap/core';
import {
  defaultMarkdownSerializer,
  MarkdownSerializer,
  MarkdownSerializerState,
  MarkSerializerConfig,
} from 'prosemirror-markdown';
import { MarkType, Node as ProsemirrorNode, NodeType, Schema } from 'prosemirror-model';
import { NodeConfig } from '@tiptap/react';

// https://github.com/nextcloud/text/blob/master/src/extensions/Markdown.js
// https://github.com/ProseMirror/prosemirror-model/blob/master/src/to_dom.ts
// https://github.com/ProseMirror/prosemirror-markdown/blob/master/src/to_markdown.ts

declare module '@tiptap/core' {
  interface MarkConfig<Options = any, Storage = any> {
    renderMarkdown?: MarkSerializerConfig;
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
}

export interface MarkdownOptions {
  nodes: Record<string, NodeConfig['renderMarkdown']>;
  marks: Record<string, MarkConfig['renderMarkdown']>;
}

export const MarkdownExtension = Extension.create<MarkdownOptions>({
  name: 'markdown',
  addOptions() {
    return {
      nodes: {},
      marks: {},
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

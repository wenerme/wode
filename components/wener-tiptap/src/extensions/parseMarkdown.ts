import { MarkdownParser } from 'prosemirror-markdown';
import type { Schema } from 'prosemirror-model';
import markdownit from 'markdown-it';

type Token = any;
type Attrs = any;

export interface MarkdownParseSpec {
  /// This token maps to a single node, whose type can be looked up
  /// in the schema under the given name. Exactly one of `node`,
  /// `block`, or `mark` must be set.
  node?: string;

  /// This token (unless `noCloseToken` is true) comes in `_open`
  /// and `_close` variants (which are appended to the base token
  /// name provides a the object property), and wraps a block of
  /// content. The block should be wrapped in a node of the type
  /// named to by the property's value. If the token does not have
  /// `_open` or `_close`, use the `noCloseToken` option.
  block?: string;

  /// This token (again, unless `noCloseToken` is true) also comes
  /// in `_open` and `_close` variants, but should add a mark
  /// (named by the value) to its content, rather than wrapping it
  /// in a node.
  mark?: string;

  /// Attributes for the node or mark. When `getAttrs` is provided,
  /// it takes precedence.
  attrs?: Attrs | null;

  /// A function used to compute the attributes for the node or mark
  /// that takes a [markdown-it
  /// token](https://markdown-it.github.io/markdown-it/#Token) and
  /// returns an attribute object.
  getAttrs?: (token: Token, tokenStream: Token[], index: number) => Attrs | null;

  /// Indicates that the [markdown-it
  /// token](https://markdown-it.github.io/markdown-it/#Token) has
  /// no `_open` or `_close` for the nodes. This defaults to `true`
  /// for `code_inline`, `code_block` and `fence`.
  noCloseToken?: boolean;

  /// When true, ignore content for the matched token.
  ignore?: boolean;
}

export function createMarkdownParser(schema: Schema) {
  let create = () =>
    new MarkdownParser(schema, markdownit('commonmark', { html: false }), {
      blockquote: { block: 'blockquote' },
      paragraph: { block: 'paragraph' },
      list_item: { block: 'listItem' },
      bullet_list: { block: 'bulletList', getAttrs: (_, tokens, i) => ({ tight: listIsTight(tokens, i) }) },
      ordered_list: {
        block: 'orderedList',
        getAttrs: (tok, tokens, i) => ({
          order: +tok.attrGet('start') || 1,
          tight: listIsTight(tokens, i),
        }),
      },
      heading: { block: 'heading', getAttrs: (tok) => ({ level: +tok.tag.slice(1) }) },
      code_block: { block: 'codeBlock', noCloseToken: true },
      fence: { block: 'codeBlock', getAttrs: (tok) => ({ params: tok.info || '' }), noCloseToken: true },
      hr: { node: 'horizontalRule' },
      image: {
        node: 'image',
        getAttrs: (tok) => ({
          src: tok.attrGet('src'),
          title: tok.attrGet('title') || null,
          alt: (tok.children[0] && tok.children[0].content) || null,
        }),
      },
      hardbreak: { node: 'hardBreak' },

      em: { mark: 'italic' },
      strong: { mark: 'bold' },
      link: {
        mark: 'link',
        getAttrs: (tok) => ({
          href: tok.attrGet('href'),
          title: tok.attrGet('title') || null,
        }),
      },
      code_inline: { mark: 'code', noCloseToken: true },
    } as Record<string, MarkdownParseSpec> as any);

  let parser = (schema.cached['markdownParser'] ??= create());
  return {
    parser,
    parse(content: string) {
      return this.parser.parse(content);
    },
  };
}

function listIsTight(tokens: readonly Token[], i: number) {
  while (++i < tokens.length) if (tokens[i].type != 'list_item_open') return tokens[i].hidden;
  return false;
}

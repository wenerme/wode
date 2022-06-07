import { mergeAttributes, Node } from '@tiptap/core';

export interface VideoOptions {
  inline: boolean;
  allowBase64: boolean;
  HTMLAttributes: Record<string, any>;
}

export interface SetVideoOptions {
  src: string;
  title?: string;
  controls?: boolean;

  [key: string]: any;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    video: {
      setVideo: (options: SetVideoOptions) => ReturnType;
    };
  }
}

export const VideoNode = Node.create<VideoOptions>({
  name: 'video',

  addOptions() {
    return {
      inline: false,
      allowBase64: false,
      HTMLAttributes: {},
    };
  },

  inline() {
    return this.options.inline;
  },

  group() {
    return this.options.inline ? 'inline' : 'block';
  },

  draggable: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      alt: {
        default: null,
      },
      title: {
        default: null,
      },
      controls: {
        default: true,
      },
      autoplay: {
        default: false,
        renderHTML: (attrs) => {
          if (attrs['autoplay'] === false) {
            return {};
          }
          return { autoplay: attrs['autoplay'] };
        },
      },
      'data-width': {
        default: null,
      },
      'data-height': {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: this.options.allowBase64 ? 'video[src]' : 'video[src]:not([src^="data:"])',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['video', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)];
  },

  renderMarkdown(state, node) {
    let ele = document.createElement('video');
    Object.entries(node.attrs)
      .filter(([, v]) => v !== null && v !== undefined)
      .map(([k, v]) => ele.setAttribute(k, v));
    state.write(ele.outerHTML);
  },

  addCommands() {
    return {
      setVideo:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
    };
  },
});

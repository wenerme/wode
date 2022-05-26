import { Extension } from '@tiptap/react';

export type CSSColumnsOptions = {
  types: string[];
  columnTypes: number[];
  defaultColumnType: string;
};

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    cssColumns: {
      toggleColumns: (columnType: number | string) => ReturnType;
      unsetColumns: () => ReturnType;
    };
  }
}
/**
 * Based on strapi-tiptap-editor
 * @see {@link https://github.com/dasmikko/strapi-tiptap-editor/blob/aa8d98eb5e30ab4e26d19a18f4bd05ead8317ce5/admin/src/components/Wysiwyg/index.js#L52-L91 | strapi-tiptap-editor}
 */
export default Extension.create<CSSColumnsOptions>({
  name: 'cssColumns',
  addOptions() {
    return {
      types: [],
      columnTypes: [2, 3],
      defaultColumnType: 'two',
    };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          cssColumns: {
            default: null,
            renderHTML: (attributes) => {
              if (attributes.cssColumns === null) return;
              return {
                style: `column-count: ${attributes.cssColumns}`,
              };
            },
            parseHTML: (element) => element.style.columnCount || null,
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      toggleColumns:
        (columnType) =>
        ({ commands, editor }) => {
          if (!editor.isActive({ cssColumns: columnType }))
            return this.options.types.every((type) => commands.updateAttributes(type, { cssColumns: columnType }));
          return this.options.types.every((type) => commands.resetAttributes(type, 'cssColumns'));
        },
      unsetColumns:
        () =>
        ({ commands }) => {
          return this.options.types.every((type) => commands.resetAttributes(type, 'cssColumns'));
        },
    };
  },
});

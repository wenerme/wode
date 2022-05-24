import { Extension } from '@tiptap/core';
import '@tiptap/extension-text-style';

export type LineHeightOptions = {
  types: string[];
};

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    lineHeight: {
      setLineHeight: (lineHeight: string) => ReturnType;
      unsetLineHeight: () => ReturnType;
    };
    fontSize: {
      setFontSize: (lineHeight: string) => ReturnType;
      unsetFontSize: () => ReturnType;
    };
  }
}

export const TextStyles = createSubTextStyle({
  name: 'lineHeight',
  cssName: 'line-height',
});
export const FontSize = createSubTextStyle({
  name: 'fontSize',
  cssName: 'font-size',
  renderValue: (v) => (/^\d+$/.test(v) ? `${v}px` : v),
});

function createSubTextStyle(o: {
  name: string;
  styleName?: keyof CSSStyleDeclaration;
  cssName: string;
  renderValue?: (v: any) => string;
}) {
  const { name, styleName = name, cssName, renderValue = (v) => v } = o;
  const fn = name.charAt(0).toUpperCase() + name.slice(1);
  return Extension.create<LineHeightOptions>({
    name,

    addOptions() {
      return {
        types: ['textStyle'],
      };
    },

    addGlobalAttributes() {
      return [
        {
          types: this.options.types,
          attributes: {
            [name]: {
              default: null,
              parseHTML: (element) => element.style[styleName as any]?.replace(/['"]+/g, ''),
              renderHTML: (attributes) => {
                let attr = attributes[name];
                if (!attr) {
                  return {};
                }

                return {
                  style: `${cssName}: ${renderValue(attr)}`,
                };
              },
            },
          },
        },
      ];
    },

    addCommands() {
      return {
        [`set${fn}`]:
          (value: any) =>
          ({ chain }: any) => {
            return chain()
              .setMark('textStyle', { [name]: value })
              .run();
          },
        [`unset${fn}`]:
          () =>
          ({ chain }: any) => {
            return chain()
              .setMark('textStyle', { [name]: null })
              .removeEmptyTextStyle()
              .run();
          },
      } as any;
    },
  });
}

// export const LineHeight = Extension.create<LineHeightOptions>({
//   name: 'lineHeight',
//
//   addOptions() {
//     return {
//       types: ['textStyle'],
//     };
//   },
//
//   addGlobalAttributes() {
//     return [
//       {
//         types: this.options.types,
//         attributes: {
//           lineHeight: {
//             default: null,
//             parseHTML: (element) => element.style.lineHeight.replace(/['"]+/g, ''),
//             renderHTML: (attributes) => {
//               if (!attributes.lineHeight) {
//                 return {};
//               }
//
//               return {
//                 style: `line-height: ${attributes.lineHeight}`,
//               };
//             },
//           },
//         },
//       },
//     ];
//   },
//
//   addCommands() {
//     return {
//       setLineHeight:
//         (lineHeight) =>
//         ({ chain }) => {
//           return chain().setMark('textStyle', { lineHeight }).run();
//         },
//       unsetLineHeight:
//         () =>
//         ({ chain }) => {
//           return chain().setMark('textStyle', { lineHeight: null }).removeEmptyTextStyle().run();
//         },
//     };
//   },
// });

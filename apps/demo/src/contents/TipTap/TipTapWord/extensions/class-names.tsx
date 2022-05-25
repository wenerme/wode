import { Extension } from '@tiptap/core';
import classNames from 'classnames';

export interface ClassNameOptions {
  types: string[];
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    classNames: {
      setClassNames: (v: string | Record<string, any>) => ReturnType;
      unsetClassNames: () => ReturnType;
      toggleClassName: (v: string) => ReturnType;
    };
  }
}
export const ClassNamesExtension = Extension.create<ClassNameOptions>({
  name: 'classNames',

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
          classNames: {
            default: {},
            parseHTML: (element) => {
              const ele = element as HTMLElement;
              let names = Array.from(ele.classList).map((v) => [v, true]);
              if (!names.length) {
                return {};
              }

              return Object.fromEntries(names);
            },
            renderHTML: (attributes) => {
              const className = classNames(attributes[this.name]);

              if (!className) {
                return {};
              }

              return {
                class: className,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setClassNames:
        (value) =>
        ({ chain, editor }) => {
          let next = editor.getAttributes('textStyle')?.[this.name] || {};
          if (!value) {
          } else if (Array.isArray(value)) {
            next = Object.fromEntries(
              classNames(next, value)
                .split(/\s+/)
                .map((v) => [v, true]),
            );
          } else if (typeof value === 'string') {
            next[value] = true;
          } else if (typeof value === 'object') {
            Object.assign(next, value);
          }
          return chain()
            .setMark('textStyle', { [this.name]: next })
            .run();
        },
      unsetClassNames:
        () =>
        ({ chain }) => {
          return chain()
            .setMark('textStyle', { [this.name]: null })
            .removeEmptyTextStyle()
            .run();
        },
      toggleClassName:
        (value) =>
        ({ chain, editor }) => {
          return chain()
            .setClassNames({ [value]: !editor.getAttributes('textStyle')?.[this.name]?.[value] })
            .run();
        },
    };
  },
});

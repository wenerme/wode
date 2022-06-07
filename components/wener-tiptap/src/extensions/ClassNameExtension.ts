import { Extension } from '@tiptap/core';
import classNames from 'classnames';

export interface ClassNameOptions {
  types: string[];
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    classNames: {
      resetClassNames: (v: string | Record<string, any> | Array<any>) => ReturnType;
      setClassNames: (v: string | Record<string, any> | Array<any>) => ReturnType;
      unsetClassNames: () => ReturnType;
      toggleClassName: (v: string) => ReturnType;
    };
  }
}
export const ClassNameExtension = Extension.create<ClassNameOptions>({
  name: 'className',

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
          className: {
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
      resetClassNames:
        (value) =>
        ({ editor, commands }) => {
          return this.options.types
            .filter((v) => editor.isActive(v))
            .some((type) => {
              return commands.updateAttributes(type, { [this.name]: classNames(value) });
            });
        },
      setClassNames:
        (value) =>
        ({ editor, commands }) => {
          if (!value) {
            return false;
          }
          return this.options.types
            .filter((v) => editor.isActive(v))
            .some((type) => {
              let last = cxo(editor.getAttributes(type)?.[this.name] || '');
              let next: any;
              // allowed turn off className
              if (typeof value === 'object' && !Array.isArray(value)) {
                next = Object.assign(last, value);
              } else {
                next = classNames(last, value);
              }
              return commands.updateAttributes(type, { [this.name]: classNames(next) });
            });
        },
      unsetClassNames:
        () =>
        ({ commands, editor }) => {
          return this.options.types
            .filter((v) => editor.isActive(v))
            .some((type) => {
              return commands.updateAttributes(type, { [this.name]: null });
            });
        },
      toggleClassName:
        (value) =>
        ({ editor, commands }) => {
          if (!value) {
            return false;
          }
          return this.options.types
            .filter((v) => editor.isActive(v))
            .some((type) => {
              let next = cxo(editor.getAttributes(type)?.[this.name] || '');
              next[value] = !next[value];
              return commands.updateAttributes(type, { [this.name]: classNames(next) });
            });
        },
    };
  },
});

const cxo = (...s: any) => {
  return Object.fromEntries(
    classNames(s)
      .split(/\s+/)
      .map((v) => [v, true]),
  );
};

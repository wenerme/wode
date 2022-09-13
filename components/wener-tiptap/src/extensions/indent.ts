import { Extension } from '@tiptap/core';

export interface IndentOptions {
  types: string[];
  min: number;
  max: number;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    indent: {
      decreaseIndent: (bc?: boolean) => ReturnType;
      increaseIndent: () => ReturnType;
      unsetIndent: () => ReturnType;
    };
  }
}

// TODO rewrite to use data-indent, render to margin

export const IndentExtension = Extension.create<IndentOptions>({
  name: 'indent',
  addOptions() {
    return {
      types: ['listItem', 'heading', 'paragraph', 'blockquote'],
      min: 0,
      max: Number.POSITIVE_INFINITY,
    };
  },
  addCommands() {
    return {
      decreaseIndent:
        (backspace) =>
        ({ chain, state }) => {
          const selection = state.selection;
          if (backspace && (selection.$anchor.parentOffset > 0 || selection.from !== selection.to)) return false;
          return chain()
            .setMarginLeft(update({ step: -1, unit: 'rem', min: this.options.min, max: this.options.max }))
            .run();
        },
      increaseIndent:
        () =>
        ({ chain }) =>
          chain()
            .setMarginLeft(update({ unit: 'rem', min: this.options.min, max: this.options.max }))
            .run(),
      unsetIndent:
        () =>
        ({ commands }) => {
          return commands.unsetMarginLeft();
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      Tab: () => this.editor.commands.increaseIndent(),
      'Shift-Tab': () => this.editor.commands.decreaseIndent(),
      Backspace: () => this.editor.commands.decreaseIndent(true),
    };
  },
});

function update({ step = 1, min = 0, max = Number.POSITIVE_INFINITY, unit = '' } = {}): (
  v: string | number,
  delta?: number,
) => string {
  return (last, delta = step) => {
    let n;

    // TODO CSSNumericValue.parse Chrome only 66+
    //  polyfill https://github.com/csstools/css-typed-om
    if (last === undefined || last === null) {
      n = 0;
    } else if (typeof last === 'number') {
      n = last;
    } else {
      // will 16rem -> 16
      n = parseFloat(last);
      if (Number.isNaN(n)) {
        n = 0;
      }
    }
    n += delta;
    n = clamp(n, min, max);
    let frac = 0;
    let abs = Math.abs(delta);
    if (abs >= 1) {
    } else if (abs >= 0.1) {
      frac = 1;
    } else if (abs >= 0.01) {
      frac = 2;
    } else if (abs >= 0.001) {
      frac = 3;
    } else {
      frac = 4;
    }

    return `${n.toFixed(frac)}${unit}`;
  };
}

const clamp = (val: number, min: number, max: number) => (val < min ? min : val > max ? max : val);

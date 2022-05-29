import { Editor } from '@tiptap/react';

export function isActive(editor: Editor, a?: ((o: { editor: Editor }) => boolean) | string | object) {
  if (a === undefined) {
    return undefined;
  }
  if (typeof a === 'function') {
    return a({ editor });
  }
  return editor.isActive(a);
}

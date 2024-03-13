import React, { useRef } from 'react';
import { IoText } from 'react-icons/io5';
import {
  MdAttachFile,
  MdChecklist,
  MdCode,
  MdFormatListBulleted,
  MdFormatListNumbered,
  MdFormatQuote,
  MdHorizontalRule,
  MdImage,
  MdInsertLink,
  MdMic,
  MdMovie,
  MdPictureAsPdf,
  MdTagFaces,
  MdToc,
} from 'react-icons/md';
import { Placeholder } from '@tiptap/extension-placeholder';
import { ReactRenderer } from '@tiptap/react';
import { ColorHighlighterExtension, TipTapWordStarterKit } from '@wener/tiptap';
import type { Instance } from 'tippy.js';
import tippy from 'tippy.js';
import { useImmer } from 'use-immer';
import type { CommandListRef } from '@/components/TipTapWord/CommandList';
import { CommandList } from '@/components/TipTapWord/CommandList';
import { CharacterCounter } from '@/components/TipTapWord/Statusbar/CharacterCounter';
import { DataViewer } from '@/components/TipTapWord/Statusbar/DataViewer';
import { TipTapWord } from '@/components/TipTapWord/TipTapWord';
import type { CommandSuggestionItem } from '@/components/TipTapWord/extensions/commands';
import { CommandExtension } from '@/components/TipTapWord/extensions/commands';

function useExtensions() {
  return [
    TipTapWordStarterKit.configure({}),
    ColorHighlighterExtension,
    CommandExtension.configure({
      suggestion: {
        items: ({ query }) => {
          const items: CommandSuggestionItem[] = [
            {
              icon: <IoText />,
              title: 'Text',
              description: 'Just start writing with plain text.',
              command: ({ editor, range }) => {
                editor.chain().focus().deleteRange(range).setParagraph().run();
              },
            },

            {
              icon: <div className={'flex items-center justify-center text-[1.6em]'}>H1</div>,
              title: 'Heading 1',
              description: 'Big section heading.',
              command: ({ editor, range }) => {
                editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run();
              },
            },
            {
              icon: <div className={'flex items-center justify-center text-[1.4em]'}>H2</div>,
              title: 'Heading 2',
              description: 'Medium section heading.',
              command: ({ editor, range }) => {
                editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run();
              },
            },
            {
              icon: <div className={'flex items-center justify-center text-[1.2em]'}>H3</div>,
              title: 'Heading 3',
              description: 'Small section heading.',
              command: ({ editor, range }) => {
                editor.chain().focus().deleteRange(range).setNode('heading', { level: 3 }).run();
              },
            },
            {
              icon: <MdChecklist />,
              title: 'To-do list',
              description: 'Track tasks with a to-do list.',
              command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleTaskList().run(),
            },
            {
              icon: <MdFormatListBulleted />,
              title: 'Bulleted list',
              description: 'Create a simple bulleted list.',
              command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleBulletList().run(),
            },
            {
              icon: <MdFormatListNumbered />,
              title: 'Numbered list',
              description: 'Create a list with numbering.',
              command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleOrderedList().run(),
            },
            {
              title: 'Toggle list',
              description: 'Toggles can hide and show content inside.',
            },

            {
              icon: <MdFormatQuote />,
              title: 'Quote',
              description: 'Capture a quote.',
              command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setBlockquote().run(),
            },
            {
              icon: <MdHorizontalRule />,
              title: 'Divider',
              description: 'Visually divide blocks.',
              command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setHorizontalRule().run(),
            },
            {
              icon: <MdInsertLink />,
              title: 'Link to page',
              description: 'Link to and exiting page.',
            },
            {
              title: 'Callout',
              description: 'Make writing stand out.',
            },
            // Inline
            {
              title: 'Mention a person',
              description: 'Ping someone so they get a notification.',
            },
            {
              icon: <MdTagFaces />,
              title: 'Emoji',
              description: 'Search for an emoji to place in text.',
            },
            {
              title: 'Inline equation',
              description: 'Insert mathematical symbols in text.',
            },
            // Media
            {
              icon: <MdImage />,
              title: 'Image',

              description: 'Upload or embed with a link.',
            },
            {
              title: 'Video',
              icon: <MdMovie />,
              description: 'Upload or embed with a link.',
            },
            {
              title: 'Audio',
              icon: <MdMic />,
              description: 'Upload or embed with a link.',
            },
            {
              icon: <MdCode />,
              title: 'Code',
              description: 'Capture a code snippet.',
              command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setCodeBlock().run(),
            },
            {
              icon: <MdAttachFile />,
              title: 'File',
              description: 'Upload or embed with a link.',
            },
            // Embeds
            {
              icon: <MdPictureAsPdf />,
              title: 'PDF',
              description: 'Embed a PDF.',
            },

            // Advanced Blocks
            {
              icon: <MdToc />,

              title: 'Table of contents',
              description: 'Show an outline of your page.',
            },
            {
              title: 'Block equation',
              description: 'Display a standalone math equation.',
            },
            {
              title: 'Toggle heading 1',
              description: 'Hide content inside a large heading',
            },
            {
              title: 'Toggle heading 2',
              description: 'Hide content inside a medium heading',
            },
            {
              title: 'Toggle heading 2',
              description: 'Hide content inside a small heading',
            },
            // Turn into
            // Formats
            // {
            //   title: 'Bold',
            //   icon: <MdFormatBold />,
            //   command: ({ editor, range }) => {
            //     editor.chain().focus().deleteRange(range).setMark('bold').run();
            //   },
            // },
            // {
            //   title: 'Italic',
            //   icon: <MdFormatItalic />,
            //   command: ({ editor, range }) => {
            //     editor.chain().focus().deleteRange(range).setMark('italic').run();
            //   },
            // },
          ];
          return items
            .filter((v) => v.command)
            .filter((v) => v.title.includes(query) || v.description?.includes(query));
        },
        render() {
          let reactRenderer: ReactRenderer<CommandListRef, CommandSuggestionItem>;
          let popup: Instance[];

          return {
            onStart: (props) => {
              reactRenderer = new ReactRenderer(CommandList, {
                props,
                editor: props.editor,
              });
              if (!props.clientRect) {
                return;
              }
              popup = tippy('body', {
                // getReferenceClientRect: props.clientRect,
                // appendTo: () => document.body,
                // content: reactRenderer.element,
                // showOnCreate: true,
                // interactive: true,
                // trigger: 'manual',
                // placement: 'bottom-start',
                getReferenceClientRect: props.clientRect as any, // fixme
                appendTo: () => document.body,
                content: reactRenderer.element,
                showOnCreate: true,
                interactive: true,
                trigger: 'manual',
                placement: 'bottom-start',
              });
            },

            onUpdate(props) {
              reactRenderer.updateProps(props);

              popup[0].setProps({
                getReferenceClientRect: props.clientRect as any, // fixme
              });
            },

            onKeyDown(props) {
              if (props.event.key === 'Escape') {
                popup[0].hide();

                return true;
              }

              return reactRenderer?.ref?.onKeyDown(props) ?? false;
            },

            onExit() {
              popup[0].destroy();
              reactRenderer.destroy();
            },
          };
        },
      },
    }),
    Placeholder.configure({
      placeholder: ({ node }) => {
        if (node.type.name === 'heading') {
          return `Heading ${node.attrs.level || ''}`;
        }
        if (node.type.name === 'taskItem') {
          return `To-do`;
        }

        return `Type '/' for commands`;
      },
    }),
  ];
}

export const TipTapPageContent = () => {
  const [state, update] = useImmer({ count: 0 });
  const counterRef = useRef(0);
  console.debug(`Render TipTapWord`, counterRef.current++);
  return (
    <TipTapWord
      useExtensions={useExtensions}
      onEditor={() => {
        console.debug(`TipTapWord onEditor`, counterRef.current++);
      }}
    >
      <TipTapWord.Status>
        <CharacterCounter />
      </TipTapWord.Status>
      <TipTapWord.Status placement={'right'}>
        <DataViewer />
      </TipTapWord.Status>
      <TipTapWord.Status>
        <button
          className={'hover:bg-gray-200 rounded p-0.5'}
          onClick={() =>
            update((s) => {
              s.count++;
            })
          }
        >
          Counter {state.count}
        </button>
      </TipTapWord.Status>
    </TipTapWord>
  );
};
export default TipTapPageContent;

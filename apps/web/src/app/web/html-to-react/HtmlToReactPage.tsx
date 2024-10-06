'use client';

import React from 'react';
import { MdAnchor } from 'react-icons/md';
import { clsx } from 'clsx';
import { Element, Text } from 'domhandler';
import parse, { attributesToProps, domToReact, type DOMNode, type HTMLReactParserOptions } from 'html-react-parser';
import { useImmer } from 'use-immer';

const initialHtml = `
<h1>Heading L1</h1><p>Hello</p>
<h2>Heading L2</h2><p>Hello</p>
`;
export const HtmlToReactPage = () => {
  const [state, update] = useImmer({ edit: initialHtml, html: initialHtml });
  const options: HTMLReactParserOptions = {
    replace: (dom) => {
      if (dom instanceof Element) {
        const props = attributesToProps(dom.attribs);
        if (dom.children.every((v) => v instanceof Text)) {
          props.id = dom.children
            .map((v) => (v as Text).data)
            .join(' ')
            .toLowerCase()
            .replace(/\s+/, '-');
          props.className = clsx(props.className, 'group relative flex items-center');
        }
        switch (dom.name) {
          case 'h1':
          case 'h2':
          case 'h3':
          case 'h4':
            return (
              <dom.name {...props}>
                {domToReact(dom.children as DOMNode[], options)}
                {props.id && (
                  <a href={`#${props.id}`} className={'ml-2 opacity-0 group-hover:opacity-50'}>
                    <MdAnchor className={'inline h-5'} />
                  </a>
                )}
              </dom.name>
            );
        }
      }
    },
  };
  return (
    <div className={'container mx-auto'}>
      <div className={'mx-auto flex max-w-prose justify-center gap-2'}>
        <textarea
          className={'flex-1 border p-2'}
          defaultValue={state.html}
          onBlur={(e) => update({ ...state, html: e.currentTarget.value })}
        />
        <div className={'prose flex-1 border p-2'}>{parse(state.html, options)}</div>
      </div>
    </div>
  );
};

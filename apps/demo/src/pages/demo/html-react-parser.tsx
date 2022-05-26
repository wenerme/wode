import type { NextPage } from 'next';
import Head from 'next/head';
import React from 'react';
import { useImmer } from 'use-immer';
import parse, { attributesToProps, domToReact, HTMLReactParserOptions } from 'html-react-parser';
import { Element, Text } from 'domhandler';
import { MdAnchor } from 'react-icons/md';
import classNames from 'classnames';

let initialHtml = `
<h1>Heading L1</h1><p>Hello</p>
<h2>Heading L2</h2><p>Hello</p>
`;
const Demo = () => {
  let [state, update] = useImmer({ edit: initialHtml, html: initialHtml });
  let options: HTMLReactParserOptions = {
    replace: (dom) => {
      if (dom instanceof Element) {
        const props = attributesToProps(dom.attribs);
        if (dom.children.every((v) => v instanceof Text)) {
          props.id = dom.children
            .map((v) => (v as Text).data)
            .join(' ')
            .toLowerCase()
            .replace(/\s+/, '-');
          props.className = classNames(props.className, 'relative group flex items-center');
        }
        switch (dom.name) {
          case 'h1':
          case 'h2':
          case 'h3':
          case 'h4':
            return (
              <dom.name {...props}>
                {domToReact(dom.children, options)}
                {props.id && (
                  <a href={`#${props.id}`} className={'opacity-0 group-hover:opacity-50 ml-2'}>
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
      <div className={'flex mx-auto justify-center max-w-prose gap-2'}>
        <textarea
          className={'flex-1 border p-2'}
          defaultValue={state.html}
          onBlur={(e) => update({ ...state, html: e.currentTarget.value })}
        />
        <div className={'flex-1 border p-2 prose'}>{parse(state.html, options)}</div>
      </div>
    </div>
  );
};

const CurrentPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>Demo Page</title>
      </Head>
      <Demo />
    </>
  );
};

export default CurrentPage;

import React, { cloneElement, forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { MdImage } from 'react-icons/md';
import classNames from 'classnames';
import { CommandSuggestionItem } from '@src/components/TipTapWord/extensions/commands';

export type CommandListRef = {
  onKeyDown: (o: { event: KeyboardEvent }) => boolean;
};
export type CommandListProps = {
  items: CommandSuggestionItem[];
  command: Function;
};
export const CommandList = forwardRef<CommandListRef, CommandListProps>((props, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectItem = (index: number) => {
    const item = props.items[index];

    if (item) {
      props.command(item);
    }
  };
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => setSelectedIndex(0), [props.items]);
  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (event.key === 'ArrowUp') {
        setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
        return true;
      }

      if (event.key === 'ArrowDown') {
        setSelectedIndex((selectedIndex + 1) % props.items.length);
        return true;
      }

      if (event.key === 'Enter') {
        selectItem(selectedIndex);
        return true;
      }

      return false;
    },
  }));
  useEffect(() => {
    let $div = containerRef.current;
    if (!$div) {
      return;
    }
    let $ele = $div.querySelector(`[data-index="${selectedIndex}"]`) as HTMLButtonElement;
    if (!$ele) {
      return;
    }
    let top = $div.scrollTop;

    let min = $ele.offsetTop;
    if (min < top) {
      $div.scrollTop = min;
      return;
    }
    let max = min + $ele.clientHeight;
    let h = $div.clientHeight;
    if (max > top + h) {
      $div.scrollTop = max - h;
      return;
    }
  }, [selectedIndex]);
  return (
    <div
      ref={containerRef}
      className="items relative flex flex-col shadow-lg rounded border w-80 h-80 overflow-y-auto p-1"
    >
      {props.items.length ? (
        props.items.map((item, index) => (
          <button
            type={'button'}
            className={classNames(
              `item ${index === selectedIndex ? 'is-selected bg-gray-200' : ''}`,
              'flex hover:bg-gray-200 rounded p-1 gap-2',
            )}
            key={index}
            data-index={index}
            onClick={() => selectItem(index)}
          >
            <div className={'w-12 h-12 p-2 border border-gray-300 rounded text-gray-400 shrink-0'}>
              {!item.icon && <MdImage className={'h-full w-full'} />}
              {item.icon &&
                cloneElement(item.icon, { className: classNames('h-full w-full', item.icon.props.className) })}
            </div>
            <div className={'flex flex-col '}>
              <span className={'self-start'}>{item.title}</span>
              <small className={'text-gray-500 truncate'}>{item.description}</small>
            </div>
          </button>
        ))
      ) : (
        <div className="item">No actions</div>
      )}
    </div>
  );
});
CommandList.displayName = 'CommandList';

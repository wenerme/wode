import React, { HTMLProps } from 'react';
import { Editor } from '@tiptap/react';
import classNames from 'classnames';
import { MenuToolItem } from '@src/components/TipTapWord/components/MenuToolItem';

const menus = [
  {
    label: '文件',
    children: [
      { label: '下载', children: [{ label: 'HTML (.html)' }, { label: 'JSON (.json)' }, { label: 'Text (.txt)' }] },
      // { type: 'divider' },
      { label: '打印' },
    ],
  },
  { label: '编辑', children: [{ label: '撤销' }, { label: '重做' }] },
  { label: '查看', children: [{ label: '模式' }] },
  { label: '插入', children: [{ label: '图片' }] },
  { label: '格式', children: [{ label: '文本' }] },
  { label: '工具', children: [{ label: '字数统计' }] },
  { label: '扩展程序', children: [{ label: '无' }] },
  { label: '帮助', children: [{ label: '键盘快捷键' }] },
];

export const Menubar: React.FC<{ editor: Editor } & Omit<HTMLProps<HTMLDivElement>, 'ref' | 'as' | 'children'>> = ({
  editor,
  className,
  ...rest
}) => {
  return (
    <div className={classNames(className, 'flex text-sm gap-1 px-4 relative')} {...rest}>
      {menus.map((v, i) => (
        <MenuToolItem
          key={i}
          items={v.children}
          label={<span className={'hover:bg-gray-100 active:bg-gray-200 p-1.5 rounded'}>{v.label}</span>}
        />
      ))}
    </div>
  );
};

import {
  MdArrowDropDown,
  MdAutoAwesome,
  MdBrush,
  MdChecklist,
  MdCode,
  MdDesktopMac,
  MdFormatAlignCenter,
  MdFormatAlignJustify,
  MdFormatAlignLeft,
  MdFormatAlignRight,
  MdFormatBold,
  MdFormatClear,
  MdFormatIndentDecrease,
  MdFormatIndentIncrease,
  MdFormatItalic,
  MdFormatLineSpacing,
  MdFormatListBulleted,
  MdFormatListNumbered,
  MdFormatQuote,
  MdFormatStrikethrough,
  MdFormatUnderlined,
  MdHorizontalRule,
  MdImage,
  MdLaptop,
  MdLink,
  MdOutlineModeEdit,
  MdOutlineRemoveRedEye,
  MdPhone,
  MdPrint,
  MdRedo,
  MdScreenshot,
  MdSettings,
  MdTableChart,
  MdTablet,
  MdUndo,
  MdVideoLibrary,
} from 'react-icons/md';
import React, { cloneElement, HTMLProps, useRef, useState } from 'react';
import styled from 'styled-components';
import { Listbox, Popover } from '@headlessui/react';
import { FakeInput } from '@src/contents/TipTap/FakeInput';
import { ChainedCommands, Editor } from '@tiptap/react';
import classNames, { Argument } from 'classnames';
import { CgQuote } from 'react-icons/cg';
import { ColorPlates } from '@src/contents/TipTap/ColorPlates';
import { ImTextColor } from 'react-icons/im';
import { BsLayoutSplit, BsLayoutThreeColumns } from 'react-icons/bs';
import { MenuSpec, MenuToolItem } from '@src/contents/TipTap/MenuToolItem';
import { useEditorStore, useEditorStoreApi } from '@src/contents/TipTap/useEditorState';

const FontFamilySet: OptionItem[] = [
  { label: '默认字体', value: '' },
  { label: '苹方', value: '.PingFang SC' },
  { label: '华文黑体', value: 'STHeiti' },
  { label: '华文宋体', value: 'STSongti' },
  { label: '华文楷体', value: 'STKaiti' },
  { label: '华文仿宋', value: 'STFangsong' },
  { label: '阿里巴巴普惠体', value: 'AlibabaPuHuiTi_2,AlibabaPuHuiTi' },
  { label: '黑体', value: 'Hei' },
  { label: '楷体', value: 'Kai' },
  { label: '宋体', value: 'Song' },
  { value: '微软雅黑' },
  { value: 'Arial' },
  { value: 'Robot' },
  { value: 'Robot Mono' },
  { value: 'Helvetica' },
  { value: 'Helvetica Neue' },
  { value: 'Verdana' },
  { value: 'Courier New' },
  { value: 'monospace' },
  { value: 'Times' },
  { value: 'Zapf Chancery' },
  { value: 'Zapfino' },
];
const FontFamilySelect: React.FC<{ editor: Editor }> = ({ editor }) => {
  let ff = editor.getAttributes('textStyle')?.fontFamily || '';
  const value = FontFamilySet.find((v) => v.value === ff) || FontFamilySet[0];
  // const [value, setValue] = useState(FontFamilySet[0]);
  return (
    <Dropdown
      value={value}
      onChange={(v) => {
        if (!v.value) {
          editor.chain().focus().unsetFontFamily().run();
        } else {
          editor.chain().focus().setFontFamily(v.value).run();
        }
      }}
      options={FontFamilySet}
      renderOptionLabel={(v) => <span style={{ fontFamily: v.value }}>{v.label || v.value}</span>}
    />
  );
};
const FontSizeSet = [8, 12, 16, 18, 20, 24, 30, 32, 36, 40, 50, 60, 72, 80].map((value) => ({
  label: String(value),
  value: String(value),
}));
const FontSizeSelect: React.FC<{ editor: Editor }> = ({ editor }) => {
  const [value, setValue] = useState('');
  return (
    <FakeInput
      className={'mx-[5px]'}
      options={FontSizeSet}
      placeholder={'默认'}
      value={editor.getAttributes('textStyle')?.fontSize || ''}
      onChange={(v) => {
        if (!v) {
          editor.chain().focus().unsetFontSize().run();
        } else {
          editor.chain().focus().setFontSize(v).run();
        }
      }}
    />
  );
};

const TypographySet: Array<OptionItem & EditorCommandOptions> = [
  { label: <p>普通文本</p>, value: 'paragraph', active: ({ editor }) => editor.isActive('paragraph') },
  // { label: <p className="lead">副标题</p> },
  { label: <h1>一级标题</h1>, value: 'h1', active: ({ editor }) => editor.isActive('heading', { level: 1 }) },
  { label: <h2>二级标题</h2>, value: 'h2', active: ({ editor }) => editor.isActive('heading', { level: 2 }) },
  { label: <h3>三级标题</h3>, value: 'h3', active: ({ editor }) => editor.isActive('heading', { level: 3 }) },
  { label: <h4>四级标题</h4>, value: 'h4', active: ({ editor }) => editor.isActive('heading', { level: 4 }) },
];
const TypographySelect: React.FC<{ editor: Editor }> = ({ editor }) => {
  const value = TypographySet.find((v) => isActive(editor!, v.active)) || TypographySet[0];
  return (
    <Dropdown
      value={value}
      onChange={(v) => {
        if (v.value === 'paragraph') {
          editor!.chain().focus().setParagraph().run();
        } else {
          editor
            .chain()
            .focus()
            .toggleHeading({ level: parseInt(v.value.replace('h', '')) as any })
            .run();
        }
      }}
      options={TypographySet}
      renderOptionLabel={(v) => <article className={'prose'}>{v.label}</article>}
    />
  );
};

interface OptionItem {
  value?: any;
  label?: React.ReactNode;
}

interface DropdownProps<T = OptionItem> {
  value: T;
  onChange: (v: T) => void;
  options: T[];
  renderOptionLabel?: (v: T) => React.ReactNode;
  renderLabel?: (v: T) => React.ReactNode;
  position?: string;
  width?: number;
}

function Dropdown<T extends OptionItem>({
  value,
  onChange,
  options,
  width = 250,
  position = 'left',
  renderLabel = (v) => v?.label ?? v?.value,
  renderOptionLabel = renderLabel,
}: DropdownProps<T>) {
  return (
    <Listbox as={'div'} className={'relative __tool min-w-[6rem]'} value={value} onChange={onChange}>
      {({ open }) => {
        return (
          <>
            <Listbox.Button
              className={classNames('flex items-center justify-between w-full font-sm', open && 'active')}
            >
              <span>{renderLabel(value)}</span>
              <MdArrowDropDown className={'w-5 h-5'} />
            </Listbox.Button>
            <Listbox.Options
              className={classNames(
                '__options absolute z-20 top-full border rounded shadow p-2 bg-white flex flex-col gap-0.5 max-h-[400px] overflow-x-auto',
                position === 'left' && 'left-0',
                position === 'right' && 'right-0',
              )}
              style={{
                width,
              }}
            >
              {options.map((v, i) => {
                return (
                  <Listbox.Option key={i} className={'__option hover:bg-gray-200 px-2 py-1 rounded'} value={v}>
                    {renderOptionLabel(v)}
                  </Listbox.Option>
                );
              })}
            </Listbox.Options>
          </>
        );
      }}
    </Listbox>
  );
}

interface EditorCommandParams {
  editor: Editor;
}

interface EditorCommandOptions<Params = EditorCommandParams> {
  disabled?: (o: Params) => boolean;
  active?: ((o: Params) => boolean) | string;
  onClick?: (o: Params) => void;
  command?: (o: { chain: ChainedCommands }) => ChainedCommands;
}

function isActive(editor: Editor, a?: ((o: { editor: Editor }) => boolean) | string | object) {
  if (a === undefined) {
    return undefined;
  }
  if (typeof a === 'function') {
    return a({ editor });
  }
  return editor.isActive(a);
}

const lineHeights = [0.8, 1, 1.1, 1.2, 1.5, 1.8, 2.0, 2.5, 3.0];
const LineSpacingSelect = () => {
  return (
    <button className={'__tool'}>
      <MdFormatLineSpacing className={'w-5 h-5'} />
    </button>
  );
};

const TextColorSelect: React.FC<{ editor: Editor }> = ({ editor }) => {
  const value = editor.getAttributes('textStyle')?.color || '';
  const onChange = (v: string) => {
    editor.chain().focus().setColor(v).run();
  };
  return (
    <ColorSelect
      icon={<ImTextColor />}
      value={value}
      onChange={onChange}
      onReset={() => editor.chain().focus().unsetColor().run()}
    />
  );
};
const MarkColorSelect: React.FC<{ editor: Editor; className?: string }> = ({ editor, className }) => {
  const value = editor.getAttributes('highlight')?.color || '';
  const onChange = (v: string) => {
    editor.chain().focus().setHighlight({ color: v }).run();
  };
  return (
    <ColorSelect
      className={className}
      icon={<MdBrush />}
      value={value}
      onChange={onChange}
      onReset={() => editor.chain().focus().unsetHighlight().run()}
    />
  );
};
const ColorSelect: React.FC<{
  value: string;
  onChange?: (v: string) => void;
  icon?: React.ReactNode;
  onReset?: () => void;
  className?: string;
}> = ({ value, onChange, icon, onReset, className }) => {
  return (
    <Popover className="relative">
      {({ open, close }) => {
        return (
          <>
            <Popover.Button className={classNames('__tool flex flex-col', className)}>
              {icon}
              <div style={{ height: 3, width: 14, backgroundColor: value || '' }}></div>
            </Popover.Button>
            <Popover.Panel className="absolute z-10 p-2 border rounded shadow bg-white" style={{ width: 250 }}>
              <ColorPlates
                value={value}
                onChange={(v) => {
                  onChange?.(v);
                  close();
                }}
                onReset={onReset}
              />
            </Popover.Panel>
          </>
        );
      }}
    </Popover>
  );
};

const tools: Array<ToolItem> = [
  {
    icon: <MdUndo />,
    tooltip: '撤销',
    command: ({ chain }) => chain.undo(),
  },
  {
    icon: <MdRedo />,
    tooltip: '重做',
    command: ({ chain }) => chain.redo(),
  },
  {
    icon: <MdPrint />,
    tooltip: '打印',
  },
  {
    type: 'divider',
  },
  {
    content: <TypographySelect editor={undefined as any} />,
    tooltip: '样式',
  },
  {
    type: 'divider',
  },
  {
    content: <FontFamilySelect editor={undefined as any} />,
    tooltip: '字体',
  },
  {
    content: <FontSizeSelect editor={undefined as any} />,
    tooltip: '字号',
  },
  {
    icon: <MdFormatBold />,
    tooltip: '粗体',
    command: ({ chain }) => chain.toggleBold(),
    active: 'bold',
  },
  {
    icon: <MdFormatItalic />,
    tooltip: '斜体',
    command: ({ chain }) => chain.toggleItalic(),
    active: 'italic',
  },
  {
    icon: <MdFormatUnderlined />,
    tooltip: '下划线',
    command: ({ chain }) => chain.toggleUnderline(),
    active: 'underline',
  },
  {
    icon: <MdFormatStrikethrough />,
    tooltip: '删除线',
    command: ({ chain }) => chain.toggleStrike(),
    active: 'strike',
  },
  {
    icon: <CgQuote />,
    tooltip: '代码',
    command: ({ chain }) => chain.toggleCode(),
    active: 'code',
  },
  {
    content: <TextColorSelect editor={undefined as any} />,
    tooltip: '文本颜色',
  },
  {
    content: <MarkColorSelect editor={undefined as any} />,
    tooltip: '突出显示颜色',
    active: 'highlight',
  },
  {
    type: 'divider',
  },
  {
    icon: <MdLink />,
    tooltip: '插入链接',
    active: 'link',
  },
  {
    icon: <MdImage />,
    tooltip: '插入图片',
    active: 'image',
  },
  {
    icon: <MdVideoLibrary />,
    tooltip: '插入视频',
    active: 'video',
  },
  {
    icon: <MdCode />,
    tooltip: '插入代码块',
    active: 'codeBlock',
    command: ({ chain }) => chain.toggleCodeBlock(),
  },
  {
    icon: <MdFormatQuote />,
    tooltip: '引用',
    active: 'blockquote',
    command: ({ chain }) => chain.toggleBlockquote(),
  },
  {
    icon: <MdTableChart />,
    tooltip: '插入表格',
    active: 'table',
    command: ({ chain }) => chain.insertTable({ cols: 3, rows: 3, withHeaderRow: true }),
  },
  {
    icon: <MdHorizontalRule />,
    tooltip: '插入分隔符',
    command: ({ chain }) => chain.setHorizontalRule(),
  },
  {
    type: 'divider',
  },
  {
    icon: <MdFormatAlignLeft />,
    tooltip: '左对齐',
    active: ({ editor }) => editor.isActive({ textAlign: 'left' }),
    command: ({ chain }) => chain.setTextAlign('left'),
  },
  {
    icon: <MdFormatAlignCenter />,
    tooltip: '居中对齐',
    active: ({ editor }) => editor.isActive({ textAlign: 'center' }),
    command: ({ chain }) => chain.setTextAlign('center'),
  },
  {
    icon: <MdFormatAlignRight />,
    tooltip: '右对齐',
    active: ({ editor }) => editor.isActive({ textAlign: 'right' }),
    command: ({ chain }) => chain.setTextAlign('right'),
  },
  {
    icon: <MdFormatAlignJustify />,
    tooltip: '两端对齐',
    active: ({ editor }) => editor.isActive({ textAlign: 'justify' }),
    command: ({ chain }) => chain.setTextAlign('justify'),
  },
  {
    type: 'divider',
  },
  {
    icon: <BsLayoutSplit />,
    active: { cssColumns: '2' },
    command: ({ chain }) => chain.toggleColumns('2'),
    tooltip: '两列布局',
  },
  {
    icon: <BsLayoutThreeColumns />,
    active: { cssColumns: '3' },
    command: ({ chain }) => chain.toggleColumns('3'),
    tooltip: '三列布局',
  },
  {
    type: 'divider',
  },
  {
    content: <LineSpacingSelect />,
    tooltip: '行间距和段落间距',
  },
  {
    type: 'divider',
  },
  {
    icon: <MdChecklist />,
    tooltip: '核对清单',
    active: 'taskList',
    command: ({ chain }) => chain.toggleTaskList(),
  },
  {
    icon: <MdFormatListBulleted />,
    tooltip: '符号项目列表',
    active: 'bulletList',
    command: ({ chain }) => chain.toggleBulletList(),
  },
  {
    icon: <MdFormatListNumbered />,
    tooltip: '编号列表',
    active: 'orderedList',
    command: ({ chain }) => chain.toggleOrderedList(),
  },
  {
    icon: <MdFormatIndentDecrease />,
    tooltip: '减少缩进',
  },
  {
    icon: <MdFormatIndentIncrease />,
    tooltip: '增加缩进',
  },
  {
    type: 'divider',
  },
  {
    icon: <MdFormatClear />,
    tooltip: '清除格式',
    onClick: ({ editor }) =>
      editor
        .chain()
        .focus()
        .unsetBold()
        .unsetItalic()
        .unsetCode()
        .unsetStrike()
        .unsetHighlight()
        .unsetMark('textStyle')
        .run(),
  },
];

const EditModeSet = [
  { value: 'edit', icon: <MdOutlineModeEdit className={'w-5 h-5'} />, title: '编辑', description: '直接编辑文档' },
  {
    value: 'view',
    icon: <MdOutlineRemoveRedEye className={'w-5 h-5'} />,
    title: '查看',
    description: '查看或打印最终文档',
  },
];
const EditModeSelect: React.FC<{ editor: Editor }> = ({ editor }) => {
  const value = editor.isEditable ? EditModeSet[0] : EditModeSet[1];
  const [, setValue] = useState(value.value);
  return (
    <Dropdown
      value={value}
      onChange={(v) => {
        editor.setEditable(v.value === 'edit');
        // force update
        setValue(v.value);
      }}
      options={EditModeSet}
      position={'right'}
      width={200}
      renderLabel={(v) => (
        <span className={'flex px-1 items-center gap-1'}>
          {v.icon}
          {v.title}
        </span>
      )}
      renderOptionLabel={(v) => {
        return (
          <div className={'flex'}>
            <div className={'p-1'}>{v.icon}</div>
            <div className={'flex flex-col'}>
              <span className={'font-bold'}>{v.title}</span>
              <small className={'text-gray-500'}>{v.description}</small>
            </div>
          </div>
        );
      }}
    />
  );
};

const SettingMenuItems: MenuSpec[] = [
  {
    label: '预览屏宽',
    icon: <MdScreenshot />,
    name: 'viewSize',
    children: [
      { label: '自动', value: '' },
      { label: '桌面', icon: <MdDesktopMac />, value: 'desktop' },
      { label: '平板', icon: <MdTablet />, value: 'tablet' },
      { label: '笔记本', icon: <MdLaptop />, value: 'laptop' },
      { label: '手机', icon: <MdPhone />, value: 'phone' },
    ],
  },
  {
    label: '预设样式',
    icon: <MdAutoAwesome />,
    name: 'presetStyleName',
    children: [
      { label: '无', value: '' },
      {
        label: 'Prose',
        icon: <MdTablet />,
        children: [
          { label: 'Gray', value: 'prose-gray' },
          { label: 'Slate', value: 'prose-slate' },
          { label: 'Zinc', value: 'prose-zinc' },
          { label: 'Neutral', value: 'prose-neutral' },
          { label: 'Stone', value: 'prose-stone' },
        ],
      },
    ],
  },
  { type: 'divider' },
  {
    label: 'v1.0',
    disabled: true,
  },
];

const SettingToolItem = () => {
  let settings = useEditorStore((s) => s.settings);
  let api = useEditorStoreApi();
  return (
    <MenuToolItem
      items={SettingMenuItems}
      label={
        <span className={'__tool p-0.5'}>
          <MdSettings className={'w-5 h-5'} />
        </span>
      }
      getItemProps={(v) => {
        let active = !v.disabled && v.value !== undefined && v.name && settings[v.name] === v.value;
        let props: Record<string, any> = {};
        if (active) {
          props['data-active'] = true;
        }
        return props;
      }}
      onItemClick={(e, { name, value }) => {
        if (value !== undefined && name) {
          api.setState((s) => {
            s.settings[name] = value;
            return { ...s, settings: { ...s.settings } };
          });
        }
      }}
    />
  );
};

const settings: Array<ToolItem> = [
  {
    content: <EditModeSelect editor={undefined as any} />,
    tooltip: '编辑模式',
  },
  {
    content: <SettingToolItem />,
    tooltip: '设置',
  },
];

const Container = styled.div`
  color: rgba(0, 0, 0, 0.7);
  z-index: 1;

  .__tools {
    display: flex;
    padding: 6px 0;
    align-items: center;
    flex-wrap: wrap;

    & > hr {
      height: 20px;
      border-top: none;
      border-left: 1px solid #dadce0;
      margin: 0 4px;

      user-select: none;
    }
  }

  button.__tool {
    padding: 2px;
  }

  .__tool {
    width: fit-content;
    border-radius: 4px;

    display: flex;
    align-items: center;
    justify-content: center;

    color: rgba(0, 0, 0, 0.7);
    margin: 0 1px;
    border: 1px solid transparent;

    user-select: none;

    &:disabled {
      color: rgba(0, 0, 0, 0.4);
    }

    &:hover {
      background-color: #f1f3f4;
    }

    &.active,
    &.open,
    button.active {
      color: #1a73e8;
      background-color: #e8f0fe;
    }
  }
`;

type ToolItem = {
  tooltip?: string;
  type?: 'divider';
  icon?: React.ReactElement;
  content?: React.ReactElement;
  disabled?: (o: RenderParam) => boolean;
  active?: ((o: RenderParam) => boolean) | string | object;
  onClick?: (o: RenderParam) => void;
  command?: (o: { chain: ChainedCommands }) => ChainedCommands;
};

type RenderParam = { item: ToolItem; editor: Editor; props: HTMLProps<HTMLButtonElement> };

function renderToolItem({ item, key, editor }: { item: ToolItem; key: any; editor: Editor }) {
  if (item.type === 'divider') {
    return <hr key={key} />;
  }
  const props: Omit<HTMLProps<HTMLButtonElement>, 'type'> & { editor: Editor } = {
    key: key,
    editor,
    title: item.tooltip,
  };
  const param = { item, editor, props };
  if (item.command) {
    if (item.disabled === undefined) {
      item.disabled = ({ editor }) => !item.command?.({ chain: editor.can().chain() });
    }
    if (item.onClick === undefined) {
      item.onClick = ({ editor }) => {
        item.command?.({ chain: editor.chain().focus() }).run();
      };
    }
  }
  if (item.disabled) {
    props.disabled = item.disabled(param);
  }
  if (item.onClick) {
    props.onClick = () => {
      item.onClick?.(param);
    };
  }
  const cn: Argument[] = ['__tool'];
  if (item.active) {
    cn.push(isActive(editor, item.active) && 'active');
  }
  props.className = classNames(...cn, props.className);
  if (item.content) {
    return cloneElement(item.content, props);
  }
  if (item.icon) {
    return (
      <button type={'button'} {...props}>
        {cloneElement(item.icon, { className: 'w-[20px] h-[20px]' })}
      </button>
    );
  }
  return undefined;
}

export const Toolbar: React.FC<{ editor: Editor } & Omit<HTMLProps<HTMLDivElement>, 'ref' | 'as'>> = ({
  editor,
  children,
  ...rest
}) => {
  const countRef = useRef(0);
  console.log(`Render Toolbar ${countRef.current++}`);
  return (
    <Container {...rest}>
      <div className={'flex px-4'}>
        <div className={'flex-1 __tools'}>{tools.map((item, key) => renderToolItem({ item, editor, key }))}</div>
        <div className={'__tools self-start'}>{settings.map((item, key) => renderToolItem({ item, editor, key }))}</div>
      </div>
    </Container>
  );
};

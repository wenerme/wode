import { FaHtml5 } from 'react-icons/fa';
import { ImLab } from 'react-icons/im';

const MenuItems = [
  {
    icon: <ImLab />,
    label: 'Try',
    children: [
      // { icon: <MdEditNote />, label: 'Tiptap', href: '/tiptap' },
      // { icon: <MdEditNote />, label: 'Lexical Editor', href: '/demo/lexical' },
      // { icon: <MdMenu />, label: 'Menu', href: '/demo/menu' },
      // { icon: <MdInsertDriveFile />, label: 'File Input', href: '/demo/file-input' },
      // { icon: <SiReact />, label: 'html-react-parser', href: '/demo/html-react-parser' },
      // { icon: <FaMarkdown />, label: 'markdown-it', href: '/demo/markdown-it' },
      // { icon: <FaHtml5 />, label: '.docx to HTML', href: '/demo/mammoth' },
      { icon: <FaHtml5 />, label: 'Font Face', href: '/web/font-face' },
      { icon: <FaHtml5 />, label: 'Color Names', href: '/web/color-name' },
      { icon: <FaHtml5 />, label: 'UserAgent', href: '/web/ua' },
      { icon: <FaHtml5 />, label: 'Cookies', href: '/web/cookie' },
      // { icon: <FaHtml5 />, label: 'Daisy Themes', href: '/demo/daisy-theme' },
      // { icon: <FaHtml5 />, label: 'Intl.Segmenter', href: '/demo/Intl.Segmenter' },
      // { icon: <FaHtml5 />, label: 'sucrase', href: '/demo/sucrase' },
      // { icon: <FaHtml5 />, label: 'IDs', href: '/demo/ids' },
    ],
  },
  {
    icon: <ImLab />,
    label: 'China',
    children: [
      //
      { icon: <FaHtml5 />, label: 'ID Info', href: '/cn/id' },
    ],
  },
];

export const Playground = () => {
  return <div className={'flex'}></div>;
};

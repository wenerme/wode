import { VscGithubInverted } from 'react-icons/vsc';
import { MdEditNote, MdInsertDriveFile, MdMenu } from 'react-icons/md';
import { IoCalculator } from 'react-icons/io5';
import { GrAppsRounded } from 'react-icons/gr';
import { ImLab } from 'react-icons/im';
import { SiReact } from 'react-icons/si';
import { FaHtml5, FaMarkdown, FaUserSecret } from 'react-icons/fa';

export const NavLinks = [
  {
    icon: <GrAppsRounded />,
    label: 'Apps',
    children: [{ icon: <IoCalculator />, label: 'Calculator', href: '/apps/calculator' }],
  },
  {
    icon: <ImLab />,
    label: 'Demo',
    children: [
      { icon: <MdEditNote />, label: 'Tiptap', href: '/tiptap' },
      { icon: <MdEditNote />, label: 'Lexical Editor', href: '/demo/lexical' },
      { icon: <MdMenu />, label: 'Menu', href: '/demo/menu' },
      { icon: <MdInsertDriveFile />, label: 'File Input', href: '/demo/file-input' },
      { icon: <SiReact />, label: 'html-react-parser', href: '/demo/html-react-parser' },
      { icon: <FaMarkdown />, label: 'markdown-it', href: '/demo/markdown-it' },
      { icon: <FaHtml5 />, label: '.docx to HTML', href: '/demo/mammoth' },
      { icon: <FaHtml5 />, label: 'Font Face', href: '/web/font-face' },
      { icon: <FaHtml5 />, label: 'Color Names', href: '/web/color-name' },
    ],
  },
  {
    icon: <VscGithubInverted />,
    label: 'Github',
    href: 'https://github.com/wenerme/wode',
    children: [
      { icon: <FaUserSecret />, label: 'Wener', href: 'https://wener.me' },
      { icon: <VscGithubInverted />, label: 'Github', href: 'https://github.com/wenerme/wode' },
    ],
  },
];

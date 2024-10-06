import { FaHtml5 } from 'react-icons/fa6';
import { PiPassword } from 'react-icons/pi';
import { HashLockOutlined, IpfsOutlined } from 'common/icons';
import { defineEntry, getDefineEntry } from './defineEntry';
import RiddleJson from './riddle.json';

defineEntry([
  {
    href: '/ipfs/gateway/check',
    title: 'IPFS Gateway Checker',
    icon: <IpfsOutlined />,
    tags: ['ipfs', 'network', 'checker'],
  },
  {
    href: '/zxcvbn/check',
    title: 'Zxcvbn Password Strength',
    icon: <PiPassword />,
    tags: ['password', 'checker'],
  },
  {
    href: '/hash',
    title: 'Hashing',
    description: 'Hashing and Encoding',
    icon: <HashLockOutlined />,
    tags: ['hashing', 'codec'],
  },
  {
    href: '/semver',
    title: 'Semantic Versioning',
    icon: <div className={'flex items-center text-2xl font-semibold normal-case'}>Ver.</div>,
    tags: ['parser'],
  },
  {
    href: '/web/Intl.Segmenter',
    title: 'Intl.Segmenter',
    description: '',
    icon: <FaHtml5 />,
    tags: ['web', 'spec'],
  },
  {
    href: '/web/html-to-react',
    title: 'HTML to React',
    description: '',
    icon: <FaHtml5 />,
    tags: ['web', 'parser', 'transform'],
  },
  {
    href: '/sucrase/transform',
    title: 'Sucrase Transform',
    description: '',
    icon: <FaHtml5 />,
    tags: ['parser', 'transform'],
  },
  {
    href: '/eta/render',
    title: 'ETA Template render',
    description: '',
    icon: <FaHtml5 />,
    tags: ['render'],
  },
  {
    href: '/daisy/theme',
    title: 'DaisyUI theme',
    icon: <FaHtml5 />,
    tags: ['design'],
  },
  {
    href: '/cn/id',
    title: 'China ID explainer',
    icon: <FaHtml5 />,
    tags: ['parser', 'china'],
  },
  {
    href: '/id/benchmark',
    title: 'ID generator benchmark',
    icon: <FaHtml5 />,
    tags: ['benchmark', 'id'],
  },
]);

defineEntry([
  {
    href: '/children/riddle/print',
    title: 'Children Riddle',
  },
]);

// not ready
defineEntry({
  href: '/cn/tax/voucher-binder-cover',
  title: '记账凭证封面生成',
  icon: <FaHtml5 />,
  tags: ['generator', 'pdf'],
  metadata: {
    disabled: true,
  },
});

export function getHomeEntryItems() {
  return getDefineEntry().filter((v) => !v.metadata?.disabled);
}
export function getChildrenRiddles() {
  return RiddleJson.items;
}

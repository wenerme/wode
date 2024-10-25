import React from 'react';
import { FaHtml5 } from 'react-icons/fa6';
import { PiBaby, PiPassword } from 'react-icons/pi';
import { Trans } from '@lingui/macro';
import { HashLockOutlined, IpfsOutlined } from 'common/icons';
import { defineEntry, defineTags, getDefineEntry } from './defineEntry';
import RiddleJson from './riddle.json';

defineTags({
  icon: <IpfsOutlined />,
  name: 'ipfs',
  title: 'IPFS',
});

defineTags({
  icon: <PiBaby />,
  name: 'children',
  title: <Trans id={'tags.children'}>儿童</Trans>,
});
defineTags({
  icon: <FaHtml5 />,
  name: 'web',
  title: <Trans id={'tags.web'}>Web技术</Trans>,
});

defineEntry([
  {
    href: '/ipfs/gateway/check',
    title: <Trans comment={'IPFS Gateway Checker'}>IPFS 网关检测</Trans>,
    tags: ['network', 'checker'],
  },
  {
    href: '/zxcvbn/check',
    title: <Trans comment={'Zxcvbn Password Strength'}>Zxcvbn 密码强度检测</Trans>,
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
    title: (
      <Trans id={'entry.semver.title'} comment={'Semantic Versioning'}>
        语义版本
      </Trans>
    ),
    icon: <div className={'flex items-center text-2xl font-semibold normal-case'}>Ver.</div>,
    tags: ['parser'],
  },
  {
    href: '/web/Intl.Segmenter',
    title: 'Intl.Segmenter',
    description: '',
    tags: ['spec'],
  },
  {
    href: '/web/html-to-react',
    title: 'HTML to React',
    description: '',
    tags: ['parser', 'transform'],
  },
  {
    href: '/sucrase/transform',
    title: 'Sucrase Transform',
    description: '',
    tags: ['parser', 'transform'],
  },
  {
    href: '/eta/render',
    title: 'ETA Template render',
    description: '',
    tags: ['render'],
  },
  {
    href: '/daisy/theme',
    title: 'DaisyUI theme',
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

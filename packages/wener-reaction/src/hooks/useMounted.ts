import { useEffect, useState } from 'react';

/**
 * 配合 nextjs 可以实现只有客户端才渲染的组件
 * @see https://github.com/zeit/next.js/blob/canary/examples/progressive-render/pages/index.js
 */
export function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

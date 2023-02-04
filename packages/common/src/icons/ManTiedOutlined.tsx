import * as React from 'react';
import { type SVGProps, memo } from 'react';

const SvgManTiedOutlined = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" fill="currentColor" {...props}>
    <path d="m424.32 681.28-37.312 227.2 121.536 114.08 109.664-114.496-28.864-226.784H424.32zm82.112 262.4-58.72-55.136 24.928-151.648h66.656l19.424 152.16-52.288 54.592z" />
    <path d="m959.584 949.44-.384-6.4c-9.952-152.384-99.68-290.368-234.72-362.816A324.96 324.96 0 0 0 842.592 329.12c0-180.864-148.288-328-330.656-328h-.16c-182.368 0-330.656 147.136-330.656 328 0 97.504 42.88 188.416 118.144 251.104C164.224 652.672 74.496 790.656 64.512 943.04l-.352 6.368c0 .128-.16.288-.16.416v1.504c0 16.96 13.824 30.848 30.592 30.848a30.848 30.848 0 0 0 30.848-30.848v-.896h.544l.448-6.24c11.104-144.96 102.464-271.68 233.376-323.968l5.184 2.336 3.584 2.112c41.984 20.032 86.016 30.656 131.296 32.288 4 .192 8 .32 11.904.32h.16c3.936 0 7.936-.128 11.904-.32a330.048 330.048 0 0 0 131.328-32.32l3.584-2.08 5.184-2.336c130.88 52.288 222.272 179.008 233.376 323.968l.448 6.24h.544v.896c0 16.896 13.696 30.848 30.848 30.848a30.848 30.848 0 0 0 30.592-30.848v-1.504c0-.128-.16-.288-.16-.416zm-711.84-620.32c0-144.48 118.496-261.92 264.128-262.016C657.504 67.2 776 184.64 776 329.12c0 144.384-118.496 261.984-264.128 262.08-145.664-.096-264.128-117.696-264.128-262.08z" />
  </svg>
);
const Memo = memo(SvgManTiedOutlined);
export default Memo;

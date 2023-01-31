import * as React from 'react';
import { SVGProps, memo } from 'react';

const SvgIpfsOutlined = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" fill="currentColor" {...props}>
    <path d="m883.832 211.353-309-176.02L510.593 0l-64.241 35.332-321.204 181.802L75.039 245.4v531.273l61.028 34.69 351.398 199.146L510.592 1024l64.24-35.332L885.76 812.005l61.029-34.69V246.043zM479.756 932.136 200.951 774.103a73.235 73.235 0 0 0 11.563-37.902 75.162 75.162 0 0 0-73.877-75.162V317.35l279.448 157.39a93.15 93.15 0 0 0 64.241 106.64zm-33.405-510.073L169.473 264.03 446.35 106.64a73.235 73.235 0 0 0 128.482 0l278.805 158.675-278.805 156.748a93.15 93.15 0 0 0-128.482 0zM880.62 661.039a75.804 75.804 0 0 0-75.805 75.804 73.235 73.235 0 0 0 12.206 38.545L542.07 932.136V582.023a93.15 93.15 0 0 0 64.24-107.283l275.594-157.39v344.331z" />
  </svg>
);
const Memo = memo(SvgIpfsOutlined);
export default Memo;

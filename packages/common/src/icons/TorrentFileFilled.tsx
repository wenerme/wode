import * as React from 'react';
import { SVGProps, memo } from 'react';

const SvgTorrentFileFilled = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={200} height={200} viewBox="0 0 1024 1024" {...props}>
    <path
      d="M183.037 58.877c26.653-8.678 92.022-1.92 126.705-1.92h245.73c41.543 0 87.79-7.224 122.864 0 20.966 4.32 34.289 29.103 47.992 44.155 32.215 35.377 55.094 53.87 90.23 92.15 12.905 14.06 38.922 34.25 42.232 47.995 6.211 25.766 0 61.576 0 90.23V782.63c0 48.848 11.761 151.491-9.597 170.86-19.717 17.882-131.064 7.677-167.02 7.677H250.227c-27.18 0-67.873 3.157-78.71-7.677-11.358-11.359-7.68-73.887-7.68-107.507 0-244.153-2.55-499.408 0-742.948.246-23.306-1.666-37.36 19.2-44.158zm343.637 263.007C401.818 312.94 318.966 414.644 323.18 517.7c3.453 84.426 57.625 144.163 124.784 168.94-31.117-82.799-68.352-169.688-92.15-253.41 19.943-8.215 44.355-11.958 71.033-13.44 31.803 43.699 31.846 144.335 101.747 149.742 26.542 2.053 56.666-12.334 59.512-40.315 2.384-23.419-14.359-47.775-23.037-67.192-9.948-22.267-20.744-40.18-26.875-63.353 16.448-6.587 36.838-9.236 57.592-11.517 16.894 20.631 28.552 51.31 42.235 80.63 11.85 25.395 20.168 68.912 59.512 61.432 7.189-116.943-66.741-199.872-170.86-207.332zm-26.878 289.887c10.01 30.305 23.332 57.298 36.478 84.467 78.236-12.631 125.074-56.66 151.66-120.945-29.812 10.79-55.706-4.042-74.87-15.357-9.588 43.505-63.337 67.105-113.268 51.835z"
      className="TorrentFileFilled_svg__selected"
    />
  </svg>
);

const Memo = memo(SvgTorrentFileFilled);
export default Memo;
import * as React from 'react';
import type { SVGProps } from 'react';
import { memo } from 'react';

const SvgCertificateVerifiedBadgeOutlined = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={202.539}
    height={200}
    className="CertificateVerifiedBadgeOutlined_svg__icon"
    viewBox="0 0 1037 1024"
    {...props}
  >
    <path d="M514.286 1024a133.929 133.929 0 0 1-91.071-37.5l-75-75H246.429A128.572 128.572 0 0 1 112.5 777.57V675.785l-69.643-75a128.572 128.572 0 0 1 0-187.5l69.643-69.643V241.856a128.572 128.572 0 0 1 133.93-133.929h101.786l69.643-69.643a133.929 133.929 0 0 1 187.5 0l69.643 69.643h101.786a42.857 42.857 0 0 1 0 80.358h-133.93l-91.072-96.43a48.214 48.214 0 0 0-75 0l-96.428 96.43h-133.93a48.214 48.214 0 0 0-53.57 53.571v133.929l-96.43 96.429a48.214 48.214 0 0 0 0 75l96.43 96.428v139.286a48.214 48.214 0 0 0 53.57 53.572h133.93l96.428 91.071a48.214 48.214 0 0 0 75 0l96.43-96.428H787.5a48.214 48.214 0 0 0 53.572-53.572V643.642l96.428-96.428a48.214 48.214 0 0 0 0-75 41.679 41.679 0 1 1 58.929-58.93 128.572 128.572 0 0 1 0 187.501l-69.643 69.643v101.786A128.572 128.572 0 0 1 782.144 911.5H675l-69.643 69.643A133.929 133.929 0 0 1 514.286 1024z" />
    <path d="M514.286 702.571 300 498.999a42.857 42.857 0 1 1 53.572-58.928l160.714 150 342.858-342.858a41.679 41.679 0 0 1 58.929 58.929z" />
  </svg>
);

const Memo = memo(SvgCertificateVerifiedBadgeOutlined);
export default Memo;

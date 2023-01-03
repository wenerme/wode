import * as React from 'react';
import { SVGProps, memo } from 'react';

const SvgBarcodeScanOutlined = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={200}
    height={200}
    className="BarcodeScanOutlined_svg__icon"
    viewBox="0 0 1024 1024"
    {...props}
  >
    <path d="M822.588 970.667H800a24 24 0 0 1 0-48h31.059A112.941 112.941 0 0 0 944 809.725v-31.058a24 24 0 1 1 48 0v22.588a169.412 169.412 0 0 1-169.412 169.412zm25.412-192h-48v-576h48v576zm120-552a24 24 0 0 1-24-24v-31.06a112.941 112.941 0 0 0-112.941-112.94H800a24 24 0 0 1 0-48h22.588A169.412 169.412 0 0 1 992 180.078v22.589a24 24 0 0 1-24 24zm-264 504h48v48h-48v-48zm24-528h24v480h-24v-480zm-96 528h48v48h-48v-48zm24-528h24v480h-24v-480zm-96 528h48v48h-48v-48zm0-528h48v480h-48v-480zm-72 528h48v48h-48v-48zm-72-528h96v480h-96v-480zm-72 528h48v48h-48v-48zm0-528h24v480h-24v-480zm-72 528h48v48h-48v-48zm0-528h24v480h-24v-480zm-48 768h-22.588A169.412 169.412 0 0 1 32 801.255v-22.588a24 24 0 1 1 48 0v31.058a112.941 112.941 0 0 0 112.941 112.942H224a24 24 0 0 1 0 48zm0-192h-48v-576h48v576zm0-720h-31.059A112.941 112.941 0 0 0 80 171.607v31.06a24 24 0 0 1-48 0v-22.589A169.412 169.412 0 0 1 201.412 10.667H224a24 24 0 1 1 0 48zm240 720h-48v-48h48v48z" />
  </svg>
);

const Memo = memo(SvgBarcodeScanOutlined);
export default Memo;

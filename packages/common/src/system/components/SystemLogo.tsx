import React, { HTMLAttributes, ReactSVGElement } from 'react';
import { useComponent } from './ComponentContext';

export const SystemLogo: React.FC<HTMLAttributes<ReactSVGElement>> = (props) => {
  const Logo = useComponent('Logo');
  return <Logo {...props} />;
};

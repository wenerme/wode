import type { HTMLAttributes, ReactSVGElement } from 'react';
import React from 'react';
import { useComponent } from './ComponentContext';

export const SystemLogo: React.FC<HTMLAttributes<ReactSVGElement>> = (props) => {
  const Logo = useComponent('Logo');
  return <Logo {...props} />;
};

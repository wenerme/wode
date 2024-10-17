import type { FC, HTMLProps } from 'react';
import { mergeProps } from '@wener/reaction/universal';
import styles from './DotsFadeLoader.module.css';

export const DotsFadeLoader: FC<Omit<HTMLProps<HTMLDivElement>, 'ref' | 'children' | 'as'>> = (props) => {
  return (
    <div {...mergeProps(props, { className: styles.DotsFadeLoader })}>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
    </div>
  );
};

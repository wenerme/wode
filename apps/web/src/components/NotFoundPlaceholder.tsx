import type { FC, ReactNode } from 'react';
import { ContentContainer } from '@/components/ContentContainer';

export const NotFoundPlaceholder = () => {
  return <NonIdealStatePlaceholder>内容未找到</NonIdealStatePlaceholder>;
};

export const ServerErrorPlaceholder = () => {
  return <NonIdealStatePlaceholder>服务器错误</NonIdealStatePlaceholder>;
};

export const NonIdealStatePlaceholder: FC<{ children?: ReactNode }> = ({ children }) => {
  return <ContentContainer>{children}</ContentContainer>;
};

import { ReactNode } from 'react';

export interface AlternativeRendererProps {
  children?: ReactNode;
  render?: () => ReactNode;
  fallback?: ReactNode;
}

export function renderAlternative(alt: boolean, { children, fallback, render }: AlternativeRendererProps) {
  return alt ? (render ? render() : children) : fallback;
}

import { flexRender, type FlexRenderable } from './flexRender';

export type FlexRendererProps<P extends {}> = P & {
  render?: FlexRenderable<P>;
  children?: FlexRenderable<P>;
};

export function FlexRenderer<P extends {}>({ children, render = children, ...props }: FlexRendererProps<P>) {
  return flexRender(render, props as any);
}

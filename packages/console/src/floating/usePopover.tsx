import { useState } from 'react';
import {
  autoPlacement,
  AutoPlacementOptions,
  autoUpdate,
  flip,
  offset,
  OffsetOptions,
  Placement,
  shift,
  useClick,
  useDismiss,
  useFloating,
  useFloatingNodeId,
  useHover,
  UseHoverProps,
  useInteractions,
  useRole,
  UseRoleProps,
} from '@floating-ui/react';

export function usePopover(
  props: {
    hover?: boolean | UseHoverProps;
    role?: boolean | UseRoleProps;
    placement?: Placement;
    autoPlacement?: AutoPlacementOptions;
    offset?: OffsetOptions;
    // boundary?: Boundary;
  } = {},
) {
  // let { container } = useContainer();
  const [open, setOpen] = useState(false);
  const nodeId = useFloatingNodeId();
  const { refs, floatingStyles, context } = useFloating({
    nodeId,
    placement: props.placement,
    open: open,
    onOpenChange: setOpen,
    middleware: [
      offset(props.offset ?? 10),
      !props.placement &&
        autoPlacement({
          // boundary: props.boundary,
          ...props.autoPlacement,
        }),
      // 至少确保在视窗内
      props.placement && flip(),
      shift(),
    ],
    whileElementsMounted: autoUpdate,
  });

  const click = useClick(context);
  const dismiss = useDismiss(context);

  let list = [click, dismiss];
  if (props.role ?? true) {
    const role = useRole(context, typeof props.role === 'object' ? props.role : {});
    list.push(role);
  }
  if (props.hover) {
    let opts = typeof props.hover === 'object' ? props.hover : { move: false };
    const hover = useHover(context, opts);
    list.push(hover);
  }

  // Merge all the interactions into prop getters
  const { getReferenceProps, getFloatingProps } = useInteractions(list);

  return {
    nodeId,
    refs,
    open,
    setOpen,
    getReferenceProps,
    getFloatingProps,
    floatingStyles,
    context,
  };
}

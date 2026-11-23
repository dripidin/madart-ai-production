"use client";

import { cn } from "@/utils/cn";
import {
  arrow,
  autoUpdate,
  flip,
  FloatingArrow,
  FloatingPortal,
  offset,
  safePolygon,
  shift,
  useDismiss,
  useFloating,
  useFocus,
  useHover,
  useInteractions,
  useMergeRefs,
  useRole,
  type Placement,
} from "@floating-ui/react";
import * as React from "react";

interface TooltipOptions {
  initialOpen?: boolean;
  placement?: Placement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function useTooltip({
  initialOpen = false,
  placement = "top",
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: TooltipOptions = {}) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(initialOpen);
  const [arrowElement, setArrowElement] = React.useState<SVGSVGElement | null>(null);

  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = setControlledOpen ?? setUncontrolledOpen;

  const data = useFloating({
    placement,
    open,
    onOpenChange: setOpen,
    whileElementsMounted: autoUpdate,

    middleware: [
      offset(10),
      flip({
        crossAxis: placement.includes("-"),
        fallbackAxisSideDirection: "start",
        padding: 5,
      }),
      shift({ padding: 5 }),
      arrow({
        element: arrowElement,
      }),
    ],
  });

  const context = data.context;

  const hover = useHover(context, {
    move: false,
    enabled: controlledOpen == null,
    handleClose: safePolygon(),
  });
  const focus = useFocus(context, {
    enabled: controlledOpen == null,
  });
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: "tooltip" });

  const interactions = useInteractions([hover, focus, dismiss, role]);

  return React.useMemo(
    () => ({
      open,
      setOpen,
      setReference: data.refs.setReference,
      setFloating: data.refs.setFloating,
      floatingStyles: data.floatingStyles,
      placement: data.placement,
      floatingContext: data.context,
      getReferenceProps: interactions.getReferenceProps,
      getFloatingProps: interactions.getFloatingProps,
      setArrowElement,
    }),
    [open, setOpen, interactions, data],
  );
}

type ContextType = ReturnType<typeof useTooltip> | null;

const TooltipContext = React.createContext<ContextType>(null);

const useTooltipContext = () => {
  const context = React.useContext(TooltipContext);

  if (context == null) {
    throw new Error("Tooltip components must be wrapped in <Tooltip />");
  }

  return context;
};

export function Tooltip({ children, ...options }: { children: React.ReactNode } & TooltipOptions) {
  const tooltip = useTooltip(options);
  return <TooltipContext.Provider value={tooltip}>{children}</TooltipContext.Provider>;
}

export const TooltipTrigger = React.forwardRef<
  HTMLElement,
  React.HTMLProps<HTMLElement> & { asChild?: boolean }
>(function TooltipTrigger({ children, asChild = false, ...props }, propRef) {
  const context = useTooltipContext();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const childrenRef = (children as any).ref;
  const ref = useMergeRefs([context.setReference, propRef, childrenRef]);

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(
      children,
      {
        ...context.getReferenceProps({
          ...props,
          ...(React.isValidElement(children) && typeof children.props === "object"
            ? children.props
            : {}),
          "data-state": context.open ? "open" : "closed",
        } as React.HTMLProps<Element>),
        ref,
      } as React.HTMLProps<Element>,
    );
  }

  return (
    <button
      ref={ref}
      data-state={context.open ? "open" : "closed"}
      {...context.getReferenceProps(props)}
    >
      {children}
    </button>
  );
});

export const TooltipContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<"div">
>(function TooltipContent({ style, className, ...props }, propRef) {
  const {
    open,
    placement,
    floatingStyles,
    floatingContext,
    setFloating,
    getFloatingProps,
    setArrowElement,
  } = useTooltipContext();
  const ref = useMergeRefs([setFloating, propRef]);

  if (!open) return null;

  const side = placement.split("-")[0];

  return (
    <FloatingPortal>
      <div
        ref={ref}
        style={{
          ...floatingStyles,
          ...style,
        }}
        data-side={side}
        {...getFloatingProps(props)}
        className={cn(
          "hidden rounded-lg border border-border-secondary bg-tooltip-background px-3 py-1.5 text-sm font-medium text-tooltip-text-color shadow-md sm:block",
          "duration-150 animate-in fade-in-0 zoom-in-95",
          "data-[side=bottom]:slide-in-from-top-1 data-[side=left]:slide-in-from-right-1 data-[side=right]:slide-in-from-left-1 data-[side=top]:slide-in-from-bottom-1",
          className,
        )}
      >
        <FloatingArrow
          ref={setArrowElement}
          context={floatingContext}
          className="fill-tooltip-background [&>path:last-of-type]:stroke-border-secondary"
          width={18}
          height={18}
          d="M0 20C0 20 2.06906 19.9829 5.91817 15.4092C7.49986 13.5236 8.97939 12.3809 10.0002 12.3809C11.0202 12.3809 12.481 13.6451 14.0814 15.5472C17.952 20.1437 20 20 20 20H0Z"
        />
        {props.children}
      </div>
    </FloatingPortal>
  );
});

import type { RegisteredRouter } from "@tanstack/react-router";
import {
  Link,
  useNavigate,
  useRouterState,
  type LinkComponentProps,
} from "@tanstack/react-router";
import type { AnchorHTMLAttributes } from "react";

// Properly typed Link component that preserves generic type parameters
export function TypedLink<
  TFrom extends string = string,
  TTo extends string | undefined = ".",
  TMaskFrom extends string = TFrom,
  TMaskTo extends string = ".",
>(props: LinkComponentProps<"a", RegisteredRouter, TFrom, TTo, TMaskFrom, TMaskTo>) {
  const navigate = useNavigate();
  const routerState = useRouterState();
  const isWebKit =
    typeof navigator !== "undefined" &&
    /WebKit/.test(navigator.userAgent) &&
    !/Chrome|Edg|OPR/.test(navigator.userAgent);

  if (isWebKit) {
    // For WebKit, manually handle active state
    const { activeProps, to, children, ...restProps } = props;
    const isActive = routerState.location.pathname === to;

    const activeAttributes = isActive && activeProps ? activeProps : {};
    const anchorProps = restProps as AnchorHTMLAttributes<HTMLAnchorElement>;
    const activeAnchorProps = activeAttributes as AnchorHTMLAttributes<HTMLAnchorElement>;

    // Fallback to a real <a> so Safari's click semantics are 100% reliable
    return (
      <a
        href={(to as string) ?? routerState.location.pathname}
        {...anchorProps}
        {...activeAnchorProps}
        onClick={(e) => {
          anchorProps.onClick?.(e);
          if (e.defaultPrevented) {
            return;
          }
          e.preventDefault();
          // Use navigate with proper typing
          navigate({ to: to as string });
        }}
      >
        {typeof children === "function"
          ? children({ isActive, isTransitioning: false })
          : children}
      </a>
    );
  }

  return <Link {...props} />;
}

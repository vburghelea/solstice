import type { RegisteredRouter } from "@tanstack/react-router";
import {
  Link,
  useNavigate,
  useRouterState,
  type LinkComponentProps,
} from "@tanstack/react-router";

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
    const { activeProps, to, ...restProps } = props;
    const isActive = routerState.location.pathname === to;

    const activeAttributes = isActive && activeProps ? activeProps : {};

    // Fallback to a real <a> so Safari's click semantics are 100% reliable
    return (
      <a
        href={to as string}
        dsf
        {...restProps}
        {...activeAttributes}
        onClick={(e) => {
          e.preventDefault();
          // Use navigate with proper typing
          navigate({ to: to as string });
        }}
      >
        {typeof props.children === "function"
          ? props.children({ isActive, isTransitioning: false })
          : props.children}
      </a>
    );
  }

  return <Link {...props} />;
}

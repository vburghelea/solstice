import {
  Link,
  type NavigateOptions,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";

type Props = React.ComponentProps<typeof Link>;

export function SafeLink(props: Props) {
  const navigate = useNavigate();
  const routerState = useRouterState();
  const isWebKit =
    typeof navigator !== "undefined" &&
    /WebKit/.test(navigator.userAgent) &&
    !/Chrome|Edg|OPR/.test(navigator.userAgent);

  if (isWebKit) {
    // For WebKit, manually handle active state
    const { activeProps, ...restProps } = props;
    const linkProps = { ...restProps } as Record<string, unknown> & Props;
    delete linkProps.activeOptions;
    const isActive = routerState.location.pathname === props.to;

    const activeAttributes = isActive && activeProps ? activeProps : {};

    // Fallback to a real <a> so Safari's click semantics are 100% reliable
    return (
      <a
        href={props.to as string}
        {...(linkProps as Props)}
        {...activeAttributes}
        onClick={(e) => {
          e.preventDefault();
          navigate({ to: props.to, replace: false } as NavigateOptions);
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

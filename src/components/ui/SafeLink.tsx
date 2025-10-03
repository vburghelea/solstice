import { useRouter, useRouterState } from "@tanstack/react-router";
import React from "react";

type Primitive = string | number | boolean;

type LinkChildren =
  | React.ReactNode
  | ((state: { isActive: boolean; isTransitioning: false }) => React.ReactNode);

export interface SafeLinkProps
  extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "children"> {
  to: string;
  params?: Record<string, Primitive>;
  search?: Record<string, Primitive | undefined>;
  replace?: boolean;
  activeProps?: Record<string, unknown>;
  inactiveProps?: Record<string, unknown>;
  from?: string;
  children: LinkChildren;
  [key: string]: unknown;
}

const encodeSegment = (value: Primitive) => encodeURIComponent(String(value));

const buildPath = (
  to: string,
  params?: Record<string, Primitive>,
  search?: Record<string, Primitive | undefined>,
) => {
  let path = to;

  if (params) {
    for (const [key, raw] of Object.entries(params)) {
      const token = `$${key}`;
      if (!path.includes(token)) continue;
      path = path.replaceAll(token, encodeSegment(raw));
    }
  }

  if (path.includes("$")) {
    throw new Error(`Missing param value for path "${path}"`);
  }

  if (search) {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(search)) {
      if (value === undefined || value === null || value === false) continue;
      if (value === true) {
        query.set(key, "1");
      } else {
        query.set(key, String(value));
      }
    }
    const qs = query.toString();
    if (qs) {
      path = `${path}?${qs}`;
    }
  }

  return path;
};

export function SafeLink({
  to,
  params,
  search,
  replace,
  activeProps,
  inactiveProps,
  children,
  onClick,
  className,
  style,
  ...rest
}: SafeLinkProps) {
  const router = useRouter();
  const routerState = useRouterState();

  const href = React.useMemo(() => buildPath(to, params, search), [to, params, search]);
  const pathname = href.split("?")[0];
  const isActive = routerState.location.pathname === pathname;

  const composedProps = {
    ...(inactiveProps ?? {}),
    ...(isActive ? activeProps : {}),
  } as Record<string, unknown>;

  const mergedClassName = [className, composedProps["className"] as string | undefined]
    .filter(Boolean)
    .join(" ");
  const mergedStyle = {
    ...(composedProps["style"] as React.CSSProperties | undefined),
    ...style,
  };
  delete composedProps["className"];
  delete composedProps["style"];

  return (
    <a
      {...rest}
      {...composedProps}
      className={mergedClassName || undefined}
      style={Object.keys(mergedStyle).length ? mergedStyle : undefined}
      href={href}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) {
          return;
        }
        event.preventDefault();
        const options: { to: string; replace?: boolean } = { to: href };
        if (typeof replace !== "undefined") {
          options.replace = replace;
        }
        void (
          router.navigate as unknown as (options: {
            to: string;
            replace?: boolean;
          }) => Promise<void>
        )(options);
      }}
    >
      {typeof children === "function"
        ? children({ isActive, isTransitioning: false })
        : children}
    </a>
  );
}

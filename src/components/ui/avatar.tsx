import * as AvatarPrimitive from "@radix-ui/react-avatar";
import * as React from "react";

import { normalizeUploadedAvatarPath } from "~/shared/lib/avatar-url";
import { cn } from "~/shared/lib/utils";

type AvatarRootProps = React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>;
type AvatarImageProps = React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>;
type AvatarFallbackProps = React.ComponentPropsWithoutRef<
  typeof AvatarPrimitive.Fallback
>;
type AnchorProps = Omit<React.ComponentPropsWithoutRef<"a">, "children" | "href">;

export interface AvatarProps extends Omit<AvatarRootProps, "children"> {
  name?: string | null;
  email?: string | null;
  alt?: string;
  src?: string | null;
  srcUploaded?: string | null;
  srcProvider?: string | null;
  fallback?: string | null;
  imageClassName?: string;
  fallbackClassName?: string;
  profileHref?: string | null;
  userId?: string | null;
  linkProps?: AnchorProps;
}

type AvatarImageComponentProps = AvatarImageProps & {
  ref?: React.Ref<React.ElementRef<typeof AvatarPrimitive.Image>>;
};

type AvatarFallbackComponentProps = AvatarFallbackProps & {
  ref?: React.Ref<React.ElementRef<typeof AvatarPrimitive.Fallback>>;
};

type AvatarComponentProps = AvatarProps & {
  ref?: React.Ref<React.ElementRef<typeof AvatarPrimitive.Root>>;
};

export function AvatarImage(props: AvatarImageComponentProps) {
  const { className, ref: forwardedRef, ...rest } = props;
  return (
    <AvatarPrimitive.Image
      ref={forwardedRef}
      data-slot="avatar-image"
      className={cn("aspect-square size-full", className)}
      {...rest}
    />
  );
}

export function AvatarFallback(props: AvatarFallbackComponentProps) {
  const { className, ref: forwardedRef, ...rest } = props;
  return (
    <AvatarPrimitive.Fallback
      ref={forwardedRef}
      data-slot="avatar-fallback"
      className={cn(
        "bg-muted flex size-full items-center justify-center rounded-full",
        className,
      )}
      {...rest}
    />
  );
}

export function Avatar(props: AvatarComponentProps) {
  const {
    className,
    name,
    email,
    alt,
    src,
    srcUploaded,
    srcProvider,
    fallback,
    imageClassName,
    fallbackClassName,
    profileHref,
    userId,
    linkProps,
    ref: forwardedRef,
    ...rootProps
  } = props;
  const normalizedUploaded = normalizeUploadedAvatarPath(srcUploaded ?? undefined);
  const resolvedSrc = src ?? normalizedUploaded ?? srcProvider ?? undefined;
  const ariaLabel = alt || name || email || "User avatar";
  const fallbackSource = fallback ?? name ?? email ?? "?";
  const fallbackInitial = fallbackSource.trim().charAt(0).toUpperCase() || "?";
  const root = (
    <AvatarPrimitive.Root
      ref={forwardedRef}
      data-slot="avatar"
      className={cn(
        "relative flex size-8 shrink-0 overflow-hidden rounded-full",
        className,
      )}
      {...rootProps}
    >
      {resolvedSrc ? (
        <AvatarImage src={resolvedSrc} alt={ariaLabel} className={imageClassName} />
      ) : null}
      <AvatarFallback className={fallbackClassName}>{fallbackInitial}</AvatarFallback>
    </AvatarPrimitive.Root>
  );

  const href =
    profileHref ?? (userId ? `/dashboard/profile/${encodeURIComponent(userId)}` : null);

  if (!href) {
    return root;
  }

  const { className: linkClassName, ...restLinkProps } = linkProps ?? {};
  const anchorProps: React.AnchorHTMLAttributes<HTMLAnchorElement> = {
    ...restLinkProps,
    href,
    className: cn("inline-flex", linkClassName),
  };

  if (!anchorProps["aria-label"]) {
    anchorProps["aria-label"] = ariaLabel;
  }

  return <a {...anchorProps}>{root}</a>;
}

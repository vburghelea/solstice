import React from "react";

type SkipLinkProps = {
  href: string;
  children: React.ReactNode;
};

export function SkipLink({ href, children }: SkipLinkProps) {
  return (
    <a
      href={href}
      className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
    >
      {children}
    </a>
  );
}

export function SkipLinks() {
  return (
    <div aria-label="Skip links" className="relative">
      <SkipLink href="#main-content">Skip to main content</SkipLink>
      <SkipLink href="#primary-navigation">Skip to navigation</SkipLink>
    </div>
  );
}

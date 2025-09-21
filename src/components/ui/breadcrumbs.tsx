import { Link, useRouterState } from "@tanstack/react-router";

const LABEL_OVERRIDES: Record<string, string> = {
  dashboard: "Dashboard",
  admin: "Admin",
  teams: "Teams",
  events: "Events",
  members: "Members",
  membership: "Membership",
  profile: "Profile",
  settings: "Settings",
  reports: "Reports",
  "events-review": "Event Review",
  roles: "Roles",
  forbidden: "Forbidden",
  manage: "Manage",
};

function formatSegment(segment: string): string {
  if (LABEL_OVERRIDES[segment]) {
    return LABEL_OVERRIDES[segment];
  }

  const clean = segment.replace(/[-_]/g, " ");
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

export function Breadcrumbs() {
  const location = useRouterState({ select: (state) => state.location });
  const segments = location.pathname.split("/").filter(Boolean);

  if (segments.length <= 1) {
    return null;
  }

  const crumbs = segments
    .map((segment, index) => ({ segment, index }))
    .filter(({ index }) => index !== 0) // skip the root dashboard node; rendered separately below
    .map(({ segment, index }) => {
      const href = `/${segments.slice(0, index + 1).join("/")}`;
      const label = formatSegment(segment);
      const isLast = index === segments.length - 1;

      const node = isLast ? (
        <span className="text-muted-foreground">{label}</span>
      ) : (
        <Link to={href} className="text-muted-foreground hover:text-foreground">
          {label}
        </Link>
      );

      return { key: href, node };
    });

  return (
    <nav aria-label="Breadcrumb" className="text-sm">
      <ol className="text-muted-foreground flex flex-wrap items-center gap-2">
        <li>
          <Link to="/dashboard" className="hover:text-foreground">
            Dashboard
          </Link>
        </li>
        {crumbs.map((crumb) => (
          <li key={crumb.key} className="flex items-center gap-2">
            <span aria-hidden="true">/</span>
            {crumb.node}
          </li>
        ))}
      </ol>
    </nav>
  );
}

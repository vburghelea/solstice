import { useQuery } from "@tanstack/react-query";
import { useNavigate, useRouteContext } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "~/components/ui/command";
import { getAppNavSections } from "~/features/layouts/app-nav";
import { getSinAdminNav } from "~/features/layouts/sin-admin-nav";
import { useOrgContext } from "~/features/organizations/org-context";
import { isFeatureEnabled, filterNavItems } from "~/tenant/feature-gates";
import { searchGlobal } from "../search.queries";
import { GLOBAL_SEARCH_OPEN_EVENT } from "../search.events";
import type { GlobalSearchResult, GlobalSearchResultType } from "../search.schemas";

const typeLabels: Record<GlobalSearchResultType, string> = {
  organization: "Organizations",
  form: "Forms",
  reporting_task: "Reporting tasks",
  template: "Templates",
  data_catalog: "Data catalog",
  support_request: "Support requests",
};

export function GlobalSearchCommandPalette() {
  const enabled = isFeatureEnabled("sin_global_search");
  const navigate = useNavigate();
  const context = useRouteContext({ strict: false });
  const { organizationRole } = useOrgContext();
  const user = context?.user ?? null;

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const sections = useMemo(() => {
    const baseSections = getAppNavSections().map((section) => ({
      ...section,
      items: filterNavItems(section.items, { user, organizationRole }),
    }));

    const sinAdminItems = filterNavItems(getSinAdminNav(), { user, organizationRole });
    if (sinAdminItems.length > 0) {
      baseSections.push({ label: "SIN Admin", items: sinAdminItems });
    }

    return baseSections.filter((section) => section.items.length > 0);
  }, [organizationRole, user]);

  const actionItems = useMemo(() => {
    return sections.flatMap((section) =>
      section.items.map((item) => ({
        section: section.label,
        label: item.label,
        href: item.to,
      })),
    );
  }, [sections]);

  const shouldSearch = open && query.trim().length >= 2;
  const { data: results = [], isFetching } = useQuery({
    queryKey: ["global-search", query],
    queryFn: () => searchGlobal({ data: { query, limit: 6 } }),
    enabled: shouldSearch,
  });

  const groupedResults = useMemo(() => {
    const groups = new Map<GlobalSearchResultType, GlobalSearchResult[]>();
    results.forEach((result) => {
      const list = groups.get(result.type) ?? [];
      list.push(result);
      groups.set(result.type, list);
    });
    return groups;
  }, [results]);

  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (!event.key) return;
      const isK = event.key.toLowerCase() === "k";
      const hasShortcut = (event.metaKey || event.ctrlKey) && isK;
      if (!hasShortcut) return;

      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      event.preventDefault();
      setOpen((prev) => !prev);
    };

    const onOpen = () => setOpen(true);

    document.addEventListener("keydown", onKeyDown);
    window.addEventListener(GLOBAL_SEARCH_OPEN_EVENT, onOpen);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener(GLOBAL_SEARCH_OPEN_EVENT, onOpen);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <CommandDialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery("");
      }}
    >
      <CommandInput
        placeholder="Search actions, templates, forms, and more..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {actionItems.length > 0 ? (
          <CommandGroup heading="Actions">
            {actionItems.map((item) => (
              <CommandItem
                key={`${item.section}-${item.href}`}
                value={item.label}
                onSelect={() => {
                  setOpen(false);
                  setQuery("");
                  void navigate({ to: item.href });
                }}
              >
                <span className="text-muted-foreground text-xs">{item.section}</span>
                <span>{item.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}

        {shouldSearch ? <CommandSeparator /> : null}

        {shouldSearch && isFetching ? (
          <CommandGroup heading="Results">
            <CommandItem disabled>Searching...</CommandItem>
          </CommandGroup>
        ) : null}

        {shouldSearch &&
          Array.from(groupedResults.entries()).map(([type, entries]) => (
            <CommandGroup key={type} heading={typeLabels[type]}>
              {entries.map((entry) => (
                <CommandItem
                  key={entry.id}
                  value={`${entry.title} ${entry.subtitle ?? ""}`}
                  onSelect={() => {
                    setOpen(false);
                    setQuery("");
                    void navigate({ to: entry.href });
                  }}
                >
                  <div className="flex flex-col">
                    <span>{entry.title}</span>
                    {entry.subtitle ? (
                      <span className="text-muted-foreground text-xs">
                        {entry.subtitle}
                      </span>
                    ) : null}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          ))}

        {shouldSearch && results.length === 0 && !isFetching ? (
          <CommandEmpty>No matching results.</CommandEmpty>
        ) : null}
      </CommandList>
    </CommandDialog>
  );
}

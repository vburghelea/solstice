import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { SystemsDashboardTable } from "~/features/game-systems/admin/components/systems-dashboard-table";
import { listAdminGameSystems } from "~/features/game-systems/admin/game-systems-admin.queries";
import type { ListAdminGameSystemsInput } from "~/features/game-systems/admin/game-systems-admin.schemas";
import type {
  AdminGameSystemListResponse,
  AdminSystemSortOption,
  AdminSystemStatusFilter,
} from "~/features/game-systems/admin/game-systems-admin.types";
import { Badge } from "~/shared/ui/badge";
import { Button } from "~/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/shared/ui/card";
import { Input } from "~/shared/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/shared/ui/select";

const DEFAULT_STATUS: AdminSystemStatusFilter = "all";
const DEFAULT_SORT: AdminSystemSortOption = "updated-desc";
const DEFAULT_PAGE = 1;
const DEFAULT_PER_PAGE = 20;

const rawSearchSchema = z.object({
  q: z.string().optional(),
  status: z
    .enum(["all", "needs_curation", "errors", "published", "unpublished"])
    .optional(),
  sort: z.enum(["updated-desc", "name-asc", "crawl-status"]).optional(),
  page: z.coerce.number().int().min(1).optional(),
  perPage: z.coerce.number().int().min(5).max(100).optional(),
});

type AdminSystemsSearchParams = z.infer<typeof rawSearchSchema>;

interface AdminSystemsFormState {
  q: string;
  status: AdminSystemStatusFilter;
  sort: AdminSystemSortOption;
  perPage: number;
}

export const Route = createFileRoute("/dashboard/systems/")({
  validateSearch: rawSearchSchema.parse,
  component: AdminSystemsPage,
});

function AdminSystemsPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  const listInput = useMemo(() => buildListInputFromSearch(search), [search]);

  const systemsQuery = useQuery({
    queryKey: ["admin-game-systems", listInput],
    queryFn: async () => listAdminGameSystems({ data: listInput }),
    placeholderData: (previous) => previous,
  });

  const derivedFormState = useMemo(() => buildFormStateFromSearch(search), [search]);
  const [formState, setFormState] = useState<AdminSystemsFormState>(derivedFormState);

  useEffect(() => {
    // eslint-disable-next-line @eslint-react/hooks-extra/no-direct-set-state-in-use-effect
    setFormState((previous) =>
      formStatesEqual(previous, derivedFormState) ? previous : derivedFormState,
    );
  }, [derivedFormState]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextSearch = buildSearchFromForm(formState);
    navigate({ search: nextSearch });
  };

  const handleReset = () => {
    setFormState({
      q: "",
      status: DEFAULT_STATUS,
      sort: DEFAULT_SORT,
      perPage: DEFAULT_PER_PAGE,
    });
    navigate({ search: {} });
  };

  const handlePageChange = (nextPage: number) => {
    const safePage = Number.isFinite(nextPage) ? Math.max(Math.floor(nextPage), 1) : 1;

    navigate({
      search: (previous) => {
        const nextSearch = { ...previous };
        if (safePage <= 1) {
          delete nextSearch.page;
        } else {
          nextSearch.page = safePage;
        }
        return nextSearch;
      },
    });
  };

  const data: AdminGameSystemListResponse | undefined = systemsQuery.data;
  const systems = data?.items ?? [];
  const stats = data?.stats;
  const total = data?.total ?? 0;
  const page = data?.page ?? DEFAULT_PAGE;
  const perPage = data?.perPage ?? DEFAULT_PER_PAGE;
  const pageCount = data?.pageCount ?? 0;

  const filteredTotal = total;
  const summaryStats = buildSummaryStats(stats, filteredTotal);
  const isPristine =
    formState.q.trim() === "" &&
    formState.status === DEFAULT_STATUS &&
    formState.sort === DEFAULT_SORT;

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <Card className="bg-card text-card-foreground shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl font-semibold">Game systems</CardTitle>
          <CardDescription className="text-sm">
            Monitor crawler status, editorial readiness, and media moderation for each
            ruleset.
          </CardDescription>
        </CardHeader>
        <CardContent className="gap-4 space-y-4">
          <SummaryBadges summaryStats={summaryStats} total={filteredTotal} />
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Search by name, filter by status, and adjust sorting.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end"
          >
            <div className="flex flex-col gap-2 sm:w-64">
              <label
                className="text-foreground text-xs font-medium"
                htmlFor="systems-search"
              >
                Keyword
              </label>
              <Input
                id="systems-search"
                type="search"
                placeholder="Search systems"
                value={formState.q}
                onChange={(event) =>
                  setFormState((previous) => ({ ...previous, q: event.target.value }))
                }
              />
            </div>

            <div className="flex flex-col gap-2 sm:w-48">
              <label className="text-foreground text-xs font-medium">Status</label>
              <Select
                value={formState.status}
                onValueChange={(value) =>
                  setFormState((previous) => ({
                    ...previous,
                    status: value as AdminSystemStatusFilter,
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2 sm:w-48">
              <label className="text-foreground text-xs font-medium">Sort</label>
              <Select
                value={formState.sort}
                onValueChange={(value) =>
                  setFormState((previous) => ({
                    ...previous,
                    sort: value as AdminSystemSortOption,
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2 sm:w-40">
              <label className="text-foreground text-xs font-medium">Per page</label>
              <Select
                value={String(formState.perPage)}
                onValueChange={(value) =>
                  setFormState((previous) => ({
                    ...previous,
                    perPage: Number(value),
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Results per page" />
                </SelectTrigger>
                <SelectContent>
                  {PER_PAGE_OPTIONS.map((option) => (
                    <SelectItem key={option} value={String(option)}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-2 sm:pt-0">
              <Button type="submit" disabled={systemsQuery.isFetching}>
                Apply
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={handleReset}
                disabled={systemsQuery.isFetching || isPristine}
              >
                Clear
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {systemsQuery.isLoading ? (
        <Card className="border-dashed">
          <CardContent className="text-muted-foreground py-10 text-center text-sm">
            Loading systems…
          </CardContent>
        </Card>
      ) : systems.length > 0 ? (
        <SystemsDashboardTable
          systems={systems}
          page={page}
          perPage={perPage}
          pageCount={pageCount}
          total={total}
          isLoading={systemsQuery.isFetching}
          onPageChange={handlePageChange}
        />
      ) : (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>No systems found</CardTitle>
            <CardDescription>
              Adjust filters or clear the search to view the full catalog.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}

const STATUS_OPTIONS: Array<{ value: AdminSystemStatusFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "needs_curation", label: "Needs curation" },
  { value: "errors", label: "Errors" },
  { value: "published", label: "Published" },
  { value: "unpublished", label: "Unpublished" },
];

const SORT_OPTIONS: Array<{ value: AdminSystemSortOption; label: string }> = [
  { value: "updated-desc", label: "Recently updated" },
  { value: "name-asc", label: "Name" },
  { value: "crawl-status", label: "Crawl status" },
];

const PER_PAGE_OPTIONS = [10, 20, 50] as const;

function SummaryBadges({
  summaryStats,
  total,
}: {
  summaryStats: ReturnType<typeof buildSummaryStats>;
  total: number;
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {summaryStats.map((stat) => (
          <Badge
            key={stat.label}
            variant={stat.variant}
            className="gap-1 rounded-full px-3 py-1"
          >
            <span className="text-muted-foreground/80 text-[10px] tracking-wide uppercase">
              {stat.label}
            </span>
            <span className="text-card-foreground text-sm font-semibold">
              {stat.value}
            </span>
          </Badge>
        ))}
      </div>
      <p className="text-muted-foreground text-xs">
        Showing {total} {total === 1 ? "system" : "systems"} matching the current filter.
      </p>
    </div>
  );
}

function buildListInputFromSearch(
  search: AdminSystemsSearchParams,
): ListAdminGameSystemsInput {
  return {
    q: search.q,
    status: (search.status as AdminSystemStatusFilter | undefined) ?? DEFAULT_STATUS,
    sort: (search.sort as AdminSystemSortOption | undefined) ?? DEFAULT_SORT,
    page: search.page ?? DEFAULT_PAGE,
    perPage: search.perPage ?? DEFAULT_PER_PAGE,
  };
}

function buildFormStateFromSearch(
  search: AdminSystemsSearchParams,
): AdminSystemsFormState {
  return {
    q: search.q ?? "",
    status: (search.status as AdminSystemStatusFilter | undefined) ?? DEFAULT_STATUS,
    sort: (search.sort as AdminSystemSortOption | undefined) ?? DEFAULT_SORT,
    perPage: search.perPage ?? DEFAULT_PER_PAGE,
  };
}

function formStatesEqual(a: AdminSystemsFormState, b: AdminSystemsFormState) {
  return (
    a.q === b.q && a.status === b.status && a.sort === b.sort && a.perPage === b.perPage
  );
}

function buildSearchFromForm(form: AdminSystemsFormState): AdminSystemsSearchParams {
  const trimmedQuery = form.q.trim();
  const nextSearch: AdminSystemsSearchParams = {};

  if (trimmedQuery.length > 0) {
    nextSearch.q = trimmedQuery;
  }

  if (form.status !== DEFAULT_STATUS) {
    nextSearch.status = form.status;
  }

  if (form.sort !== DEFAULT_SORT) {
    nextSearch.sort = form.sort;
  }

  if (form.perPage !== DEFAULT_PER_PAGE) {
    nextSearch.perPage = form.perPage;
  }

  return nextSearch;
}

function buildSummaryStats(
  stats: AdminGameSystemListResponse["stats"] | undefined,
  filteredTotal: number,
) {
  const total = stats?.total ?? filteredTotal;
  const needsCuration = stats?.needsCuration ?? 0;
  const errors = stats?.errors ?? 0;
  const published = stats?.published ?? 0;

  const summary = [
    { label: "Total", value: total, variant: "secondary" as const },
    {
      label: "Needs curation",
      value: needsCuration,
      variant: needsCuration > 0 ? ("destructive" as const) : ("secondary" as const),
    },
    {
      label: "Errors",
      value: errors,
      variant: errors > 0 ? ("destructive" as const) : ("secondary" as const),
    },
    { label: "Published", value: published, variant: "outline" as const },
    {
      label: "Visible now",
      value: filteredTotal,
      variant: "outline" as const,
    },
  ];

  return summary;
}

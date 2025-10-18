import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { ManualSystemCreateDialog } from "~/features/game-systems/admin/components/manual-system-create-dialog";
import { SystemsDashboardTable } from "~/features/game-systems/admin/components/systems-dashboard-table";
import { listAdminGameSystems } from "~/features/game-systems/admin/game-systems-admin.queries";
import type { ListAdminGameSystemsInput } from "~/features/game-systems/admin/game-systems-admin.schemas";
import type {
  AdminGameSystemListResponse,
  AdminSystemSortOption,
  AdminSystemStatusFilter,
} from "~/features/game-systems/admin/game-systems-admin.types";
import {
  DEFAULT_SYSTEM_DETAIL_ROUTE,
  type SystemDetailRoute,
} from "~/features/game-systems/admin/lib/system-routes";
import { useGameSystemsTranslation } from "~/hooks/useTypedTranslation";
import { cn } from "~/shared/lib/utils";

export const adminSystemsSearchSchema = z.object({
  q: z.string().optional(),
  status: z
    .enum(["all", "needs_curation", "errors", "published", "unpublished"])
    .optional(),
  sort: z.enum(["updated-desc", "name-asc", "crawl-status"]).optional(),
  page: z.coerce.number().int().min(1).optional(),
  perPage: z.coerce.number().int().min(5).max(100).optional(),
});

export type AdminSystemsSearchParams = z.infer<typeof adminSystemsSearchSchema>;

export const ADMIN_SYSTEMS_DEFAULT_STATUS: AdminSystemStatusFilter = "all";
export const ADMIN_SYSTEMS_DEFAULT_SORT: AdminSystemSortOption = "updated-desc";
export const ADMIN_SYSTEMS_DEFAULT_PAGE = 1;
export const ADMIN_SYSTEMS_DEFAULT_PER_PAGE = 20;

const PER_PAGE_OPTIONS = [10, 20, 50] as const;

interface AdminSystemsPageProps {
  search: AdminSystemsSearchParams;
  navigate: (options: {
    search?: (previous: AdminSystemsSearchParams) => AdminSystemsSearchParams;
    replace?: boolean;
  }) => Promise<void>;
  detailRoute?: SystemDetailRoute;
  className?: string;
  headerTitle?: string;
  headerDescription?: string;
}

const DEFAULT_CONTAINER_CLASS = "space-y-6 p-4 sm:p-6 lg:p-8";

interface AdminSystemsFormState {
  q: string;
  status: AdminSystemStatusFilter;
  sort: AdminSystemSortOption;
  perPage: number;
}

export function AdminSystemsPage({
  search,
  navigate,
  detailRoute = DEFAULT_SYSTEM_DETAIL_ROUTE,
  className,
  headerTitle,
  headerDescription,
}: AdminSystemsPageProps) {
  const { t } = useGameSystemsTranslation();
  const { q, status, sort, page: searchPage, perPage: searchPerPage } = search;

  // Set default header values from translations if not provided
  const resolvedHeaderTitle = headerTitle ?? t("admin.page.default_title");
  const resolvedHeaderDescription =
    headerDescription ?? t("admin.page.default_description");

  const listInput = useMemo(() => {
    const params: AdminSystemsSearchParams = {
      q: q ?? undefined,
      status,
      sort,
      page: searchPage,
      perPage: searchPerPage,
    };
    return buildListInputFromSearch(params);
  }, [q, searchPage, searchPerPage, sort, status]);

  const queryKey = useMemo(
    () =>
      [
        "admin-game-systems",
        listInput.q ?? "",
        listInput.status,
        listInput.sort,
        listInput.page,
        listInput.perPage,
        listInput,
      ] as const,
    [listInput],
  );

  const systemsQuery = useQuery<AdminGameSystemListResponse>({
    queryKey,
    queryFn: async ({ queryKey: [, , , , , , input] }) =>
      listAdminGameSystems({ data: input }),
    placeholderData: (previous) => previous,
    structuralSharing: false,
  });

  const derivedFormState = useMemo(() => {
    const params: AdminSystemsSearchParams = {
      q: q ?? undefined,
      status,
      sort,
      perPage: searchPerPage,
    };
    return buildFormStateFromSearch(params);
  }, [q, searchPerPage, sort, status]);

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
    navigate({
      search: () => ({ ...nextSearch }),
    }).catch(() => {
      // Navigation errors are surfaced via router error boundary
    });
  };

  const handleReset = () => {
    setFormState({
      q: "",
      status: ADMIN_SYSTEMS_DEFAULT_STATUS,
      sort: ADMIN_SYSTEMS_DEFAULT_SORT,
      perPage: ADMIN_SYSTEMS_DEFAULT_PER_PAGE,
    });
    navigate({
      search: () => ({}),
    }).catch(() => {
      // Navigation errors are surfaced via router error boundary
    });
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
    }).catch(() => {
      // Navigation errors are surfaced via router error boundary
    });
  };

  const data: AdminGameSystemListResponse | undefined = systemsQuery.data;
  const systems = data?.items ?? [];
  const stats = data?.stats;
  const total = data?.total ?? 0;
  const currentPage = data?.page ?? ADMIN_SYSTEMS_DEFAULT_PAGE;
  const currentPerPage = data?.perPage ?? ADMIN_SYSTEMS_DEFAULT_PER_PAGE;
  const pageCount = data?.pageCount ?? 0;

  const filteredTotal = total;
  const summaryStats = buildSummaryStats(stats, filteredTotal, t);
  const isPristine =
    formState.q.trim() === "" &&
    formState.status === ADMIN_SYSTEMS_DEFAULT_STATUS &&
    formState.sort === ADMIN_SYSTEMS_DEFAULT_SORT &&
    formState.perPage === ADMIN_SYSTEMS_DEFAULT_PER_PAGE;

  // Dynamic status and sort options from translations
  const statusOptions: Array<{ value: AdminSystemStatusFilter; label: string }> = [
    { value: "all", label: t("admin.status_options.all") },
    { value: "needs_curation", label: t("admin.status_options.needs_curation") },
    { value: "errors", label: t("admin.status_options.errors") },
    { value: "published", label: t("admin.status_options.published") },
    { value: "unpublished", label: t("admin.status_options.unpublished") },
  ];

  const sortOptions: Array<{ value: AdminSystemSortOption; label: string }> = [
    { value: "updated-desc", label: t("admin.sort_options.updated_desc") },
    { value: "name-asc", label: t("admin.sort_options.name_asc") },
    { value: "crawl-status", label: t("admin.sort_options.crawl_status") },
  ];

  return (
    <div className={cn(DEFAULT_CONTAINER_CLASS, className)}>
      <Card className="bg-card text-card-foreground shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <CardTitle className="text-2xl font-semibold">
                {resolvedHeaderTitle}
              </CardTitle>
              <CardDescription className="text-sm">
                {resolvedHeaderDescription}
              </CardDescription>
            </div>
            <ManualSystemCreateDialog detailRoute={detailRoute} />
          </div>
        </CardHeader>
        <CardContent className="gap-4 space-y-4">
          <SummaryBadges summaryStats={summaryStats} total={filteredTotal} t={t} />
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle>{t("admin.page.filters_title")}</CardTitle>
          <CardDescription>{t("admin.page.filters_description")}</CardDescription>
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
                {t("admin.page.search_label")}
              </label>
              <Input
                id="systems-search"
                type="search"
                placeholder={t("admin.page.search_placeholder")}
                value={formState.q}
                onChange={(event) =>
                  setFormState((previous) => ({ ...previous, q: event.target.value }))
                }
              />
            </div>

            <div className="flex flex-col gap-2 sm:w-48">
              <label className="text-foreground text-xs font-medium">
                {t("admin.page.status_label")}
              </label>
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
                  <SelectValue placeholder={t("admin.page.status_placeholder")} />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2 sm:w-48">
              <label className="text-foreground text-xs font-medium">
                {t("admin.page.sort_label")}
              </label>
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
                  <SelectValue placeholder={t("admin.page.sort_placeholder")} />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2 sm:w-40">
              <label className="text-foreground text-xs font-medium">
                {t("admin.page.per_page_label")}
              </label>
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
                  <SelectValue placeholder={t("admin.page.per_page_placeholder")} />
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
                {t("admin.page.apply_button")}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={handleReset}
                disabled={systemsQuery.isFetching || isPristine}
              >
                {t("admin.page.clear_button")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {systemsQuery.isLoading ? (
        <Card className="border-dashed">
          <CardContent className="text-muted-foreground py-10 text-center text-sm">
            {t("admin.page.loading")}
          </CardContent>
        </Card>
      ) : systems.length > 0 ? (
        <SystemsDashboardTable
          systems={systems}
          page={currentPage}
          perPage={currentPerPage}
          pageCount={pageCount}
          total={total}
          isLoading={systemsQuery.isFetching}
          onPageChange={handlePageChange}
          systemDetailRoute={detailRoute}
        />
      ) : (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>{t("admin.page.no_systems_title")}</CardTitle>
            <CardDescription>{t("admin.page.no_systems_description")}</CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}

function SummaryBadges({
  summaryStats,
  total,
  t,
}: {
  summaryStats: ReturnType<typeof buildSummaryStats>;
  total: number;
  t: (key: string) => string;
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
        {(t as (key: string, options?: Record<string, unknown>) => string)(
          "admin.page.showing_results",
          {
            total,
            itemType:
              total === 1
                ? t("admin.page.system_singular")
                : t("admin.page.system_plural"),
          },
        )}
      </p>
    </div>
  );
}

function buildListInputFromSearch(
  search: AdminSystemsSearchParams,
): ListAdminGameSystemsInput {
  return {
    q: search.q,
    status:
      (search.status as AdminSystemStatusFilter | undefined) ??
      ADMIN_SYSTEMS_DEFAULT_STATUS,
    sort:
      (search.sort as AdminSystemSortOption | undefined) ?? ADMIN_SYSTEMS_DEFAULT_SORT,
    page: search.page ?? ADMIN_SYSTEMS_DEFAULT_PAGE,
    perPage: search.perPage ?? ADMIN_SYSTEMS_DEFAULT_PER_PAGE,
  };
}

function buildFormStateFromSearch(
  search: AdminSystemsSearchParams,
): AdminSystemsFormState {
  return {
    q: search.q ?? "",
    status:
      (search.status as AdminSystemStatusFilter | undefined) ??
      ADMIN_SYSTEMS_DEFAULT_STATUS,
    sort:
      (search.sort as AdminSystemSortOption | undefined) ?? ADMIN_SYSTEMS_DEFAULT_SORT,
    perPage: search.perPage ?? ADMIN_SYSTEMS_DEFAULT_PER_PAGE,
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

  if (form.status !== ADMIN_SYSTEMS_DEFAULT_STATUS) {
    nextSearch.status = form.status;
  }

  if (form.sort !== ADMIN_SYSTEMS_DEFAULT_SORT) {
    nextSearch.sort = form.sort;
  }

  if (form.perPage !== ADMIN_SYSTEMS_DEFAULT_PER_PAGE) {
    nextSearch.perPage = form.perPage;
  }

  return nextSearch;
}

function buildSummaryStats(
  stats: AdminGameSystemListResponse["stats"] | undefined,
  filteredTotal: number,
  t: (key: string) => string,
) {
  const total = stats?.total ?? filteredTotal;
  const needsCuration = stats?.needsCuration ?? 0;
  const errors = stats?.errors ?? 0;
  const published = stats?.published ?? 0;

  const summary = [
    {
      label: t("admin.summary_badges.total"),
      value: total,
      variant: "secondary" as const,
    },
    {
      label: t("admin.summary_badges.needs_curation"),
      value: needsCuration,
      variant: needsCuration > 0 ? ("destructive" as const) : ("secondary" as const),
    },
    {
      label: t("admin.summary_badges.errors"),
      value: errors,
      variant: errors > 0 ? ("destructive" as const) : ("secondary" as const),
    },
    {
      label: t("admin.summary_badges.published"),
      value: published,
      variant: "outline" as const,
    },
    {
      label: t("admin.summary_badges.visible_now"),
      value: filteredTotal,
      variant: "outline" as const,
    },
  ];

  return summary;
}

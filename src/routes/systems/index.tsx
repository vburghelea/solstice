import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";

import { CategoryTagInput } from "~/features/game-systems/components/category-tag-input";
import { SystemCard } from "~/features/game-systems/components/system-card";
import { listSystems } from "~/features/game-systems/game-systems.queries";
import type { ListSystemsInput } from "~/features/game-systems/game-systems.schemas";
import type {
  AvailableGameSystemFilters,
  GameSystemListItem,
} from "~/features/game-systems/game-systems.types";
import { PublicLayout } from "~/features/layouts/public-layout";
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

const SYSTEMS_PER_PAGE = 20;

const rawSearchSchema = z.object({
  q: z.string().optional(),
  categories: z.union([z.string(), z.array(z.string())]).optional(),
  page: z.string().optional(),
});

type SystemsSearchParams = z.infer<typeof rawSearchSchema>;

interface FiltersFormState {
  q: string;
  categoryIds: string[];
}

export const Route = createFileRoute("/systems/")({
  validateSearch: rawSearchSchema.parse,
  component: SystemsBrowsePage,
});

function SystemsBrowsePage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  const listInput = useMemo(() => buildListInputFromSearch(search), [search]);

  const systemsQuery = useQuery({
    queryKey: ["game-systems", listInput],
    queryFn: () => listSystems({ data: listInput }),
    placeholderData: (previous) => previous,
  });

  const derivedFormState = useMemo(() => buildFormStateFromSearch(search), [search]);
  const [formState, setFormState] = useState<FiltersFormState>(derivedFormState);

  useEffect(() => {
    // Sync router search params into the form when navigation changes filters.
    // eslint-disable-next-line @eslint-react/hooks-extra/no-direct-set-state-in-use-effect
    setFormState((previous) =>
      formStatesEqual(previous, derivedFormState) ? previous : derivedFormState,
    );
  }, [derivedFormState]);

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextSearch = buildSearchFromForm(formState, { resetPage: true });
    navigate({ search: nextSearch });
  };

  const handleReset = () => {
    navigate({ search: {} });
  };

  const data = systemsQuery.data;
  const systems = data?.items ?? [];
  const filters = data?.availableFilters ?? emptyFilters;
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.perPage)) : 1;
  const currentPage = data?.page ?? 1;

  const goToPage = (page: number) => {
    const safePage = Math.min(Math.max(1, page), totalPages);
    const nextSearch: SystemsSearchParams = {
      ...search,
      page: safePage === 1 ? undefined : String(safePage),
    };
    navigate({ search: nextSearch });
  };

  return (
    <PublicLayout>
      <section className="bg-secondary text-secondary-foreground py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-semibold sm:text-4xl">Explore Game Systems</h1>
          <p className="text-secondary-foreground/80 mt-4 max-w-2xl text-sm sm:text-base">
            Browse tabletop rulesets with curated hero art, taxonomy, and key details. Use
            the search box or pick a category to narrow the catalog.
          </p>
        </div>
      </section>

      <section className="container mx-auto space-y-8 px-4 py-10 sm:px-6 lg:px-8">
        <FilterPanel
          filters={filters}
          formState={formState}
          setFormState={setFormState}
          isSubmitting={systemsQuery.isFetching}
          onSubmit={handleFormSubmit}
          onReset={handleReset}
        />

        <ResultsSummary
          systemsCount={systems.length}
          total={data?.total ?? 0}
          isFetching={systemsQuery.isFetching}
        />

        <SystemsGrid systems={systems} isLoading={systemsQuery.isLoading} />

        {systems.length === 0 && !systemsQuery.isLoading ? (
          <Card className="bg-muted/40 border-dashed text-center">
            <CardHeader>
              <CardTitle>No systems found</CardTitle>
              <CardDescription>
                Clear your filters or try a different name to browse the full catalog.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : null}

        {data && data.total > data.perPage ? (
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            isLoading={systemsQuery.isFetching}
            onChange={goToPage}
          />
        ) : null}
      </section>
    </PublicLayout>
  );
}

interface FilterPanelProps {
  filters: AvailableGameSystemFilters;
  formState: FiltersFormState;
  setFormState: React.Dispatch<React.SetStateAction<FiltersFormState>>;
  isSubmitting: boolean;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onReset: () => void;
}

function FilterPanel({
  filters,
  formState,
  setFormState,
  isSubmitting,
  onSubmit,
  onReset,
}: FilterPanelProps) {
  const selectedCategoryTags = useMemo(() => {
    const lookup = new Map(
      filters.categories.map((category) => [String(category.id), category]),
    );
    return formState.categoryIds
      .map((id) => {
        const category = lookup.get(id);
        if (!category) return null;
        return { id: Number(category.id), name: category.name };
      })
      .filter((tag): tag is { id: number; name: string } => tag !== null);
  }, [filters.categories, formState.categoryIds]);

  const handleAddCategory = (tag: { id: number; name: string }) => {
    setFormState((prev) => {
      const tagId = String(tag.id);
      if (prev.categoryIds.includes(tagId)) return prev;
      return { ...prev, categoryIds: [...prev.categoryIds, tagId] };
    });
  };

  const handleRemoveCategory = (id: number) => {
    setFormState((prev) => ({
      ...prev,
      categoryIds: prev.categoryIds.filter((existingId) => existingId !== String(id)),
    }));
  };

  return (
    <Card>
      <CardHeader className="gap-4">
        <div>
          <CardTitle>Find a system</CardTitle>
          <CardDescription>
            Search by name or filter by category to discover new systems.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <form className="space-y-6" onSubmit={onSubmit}>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-2">
              <label
                className="text-foreground text-sm font-medium"
                htmlFor="system-search"
              >
                Search
              </label>
              <Input
                id="system-search"
                placeholder="Search by name"
                value={formState.q}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, q: event.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <label
                className="text-foreground text-sm font-medium"
                htmlFor="categories-select"
              >
                Categories
              </label>
              <CategoryTagInput
                id="categories-select"
                tags={selectedCategoryTags}
                onAddTag={handleAddCategory}
                onRemoveTag={handleRemoveCategory}
                placeholder="Type to search categories"
              />
              <p className="text-muted-foreground text-xs">
                Use tags to combine multiple categories in your search.
              </p>
            </div>
          </div>

          <div className="border-border flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
            <ActiveFilterSummary formState={formState} filters={filters} />
            <div className="flex gap-2 self-end">
              <Button
                type="button"
                variant="outline"
                onClick={onReset}
                disabled={isSubmitting}
              >
                Clear
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                Apply filters
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function ResultsSummary({
  systemsCount,
  total,
  isFetching,
}: {
  systemsCount: number;
  total: number;
  isFetching: boolean;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-muted-foreground text-sm">
        Showing <span className="text-foreground font-semibold">{systemsCount}</span> of
        <span className="text-foreground font-semibold"> {total}</span> published systems.
      </div>
      {isFetching ? (
        <span className="text-muted-foreground text-xs tracking-wide uppercase">
          Updating results…
        </span>
      ) : null}
    </div>
  );
}

function SystemsGrid({
  systems,
  isLoading,
}: {
  systems: GameSystemListItem[];
  isLoading: boolean;
}) {
  if (isLoading && systems.length === 0) {
    const placeholders = Array.from({ length: 6 }, (_, index) => index);
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {placeholders.map((key) => (
          <div
            key={`systems-skeleton-${key}`}
            className="border-border bg-muted/60 h-80 animate-pulse rounded-xl border border-dashed"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {systems.map((system) => (
        <SystemCard key={system.id} system={system} />
      ))}
    </div>
  );
}

function PaginationControls({
  currentPage,
  totalPages,
  isLoading,
  onChange,
}: {
  currentPage: number;
  totalPages: number;
  isLoading: boolean;
  onChange: (page: number) => void;
}) {
  const previousDisabled = currentPage <= 1 || isLoading;
  const nextDisabled = currentPage >= totalPages || isLoading;

  return (
    <div className="flex items-center justify-center gap-4">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={previousDisabled}
        onClick={() => onChange(currentPage - 1)}
      >
        Previous
      </Button>
      <span className="text-muted-foreground text-sm">
        Page <span className="text-foreground font-semibold">{currentPage}</span> of
        <span className="text-foreground font-semibold"> {totalPages}</span>
      </span>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={nextDisabled}
        onClick={() => onChange(currentPage + 1)}
      >
        Next
      </Button>
    </div>
  );
}

function ActiveFilterSummary({
  formState,
  filters,
}: {
  formState: FiltersFormState;
  filters: AvailableGameSystemFilters;
}) {
  const activeBadges: Array<{ key: string; label: string }> = [];

  if (formState.q.trim()) {
    activeBadges.push({ key: "search", label: `Search: "${formState.q.trim()}"` });
  }

  if (formState.categoryIds.length) {
    const names = filters.categories
      .filter((category) => formState.categoryIds.includes(String(category.id)))
      .map((item) => item.name)
      .slice(0, 3)
      .join(", ");
    activeBadges.push({ key: "categories", label: `Categories: ${names}` });
  }

  if (activeBadges.length === 0) {
    return <span className="text-muted-foreground text-xs">All systems</span>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {activeBadges.map((badge) => (
        <Badge key={badge.key} variant="outline" className="text-xs">
          {badge.label}
        </Badge>
      ))}
    </div>
  );
}

const emptyFilters: AvailableGameSystemFilters = {
  categories: [],
};

function buildFormStateFromSearch(search: SystemsSearchParams): FiltersFormState {
  return {
    q: search.q ?? "",
    categoryIds: toStringArray(search.categories),
  };
}

function buildSearchFromForm(
  formState: FiltersFormState,
  options: { resetPage?: boolean } = {},
): SystemsSearchParams {
  const next: SystemsSearchParams = {};

  if (formState.q.trim()) next.q = formState.q.trim();
  if (formState.categoryIds.length) next.categories = formState.categoryIds;
  if (options.resetPage) {
    next.page = undefined;
  }
  return next;
}

function buildListInputFromSearch(search: SystemsSearchParams): ListSystemsInput {
  const genreIds = toNumberArray(search.categories);
  const page = toNumber(search.page) ?? 1;

  const input: ListSystemsInput = {
    genreIds,
    q: search.q?.trim() ? search.q.trim() : undefined,
    page,
    perPage: SYSTEMS_PER_PAGE,
  };

  return input;
}

function toNumber(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function toNumberArray(value: string | string[] | undefined): number[] | undefined {
  if (value === undefined) return undefined;
  const values = Array.isArray(value) ? value : [value];
  const numbers = values
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .map((item) => Number(item))
    .filter((num) => Number.isFinite(num));
  return numbers.length > 0 ? numbers : undefined;
}

function toStringArray(value: string | string[] | undefined): string[] {
  if (value === undefined) return [];
  return (Array.isArray(value) ? value : [value]).filter(
    (item) => item.trim().length > 0,
  );
}

function formStatesEqual(a: FiltersFormState, b: FiltersFormState) {
  return a.q === b.q && arrayEqual(a.categoryIds, b.categoryIds);
}

function arrayEqual(a: string[], b: string[]) {
  if (a.length !== b.length) return false;
  return a.every((value, index) => value === b[index]);
}

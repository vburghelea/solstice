import { formatDistanceToNow } from "date-fns";
import {
  AlertTriangleIcon,
  CheckIcon,
  Loader2,
  PlusIcon,
  RefreshCwIcon,
  ToggleLeftIcon,
  ToggleRightIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

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
import { Skeleton } from "~/components/ui/skeleton";
import { WORKSPACE_FEATURE_FLAGS } from "~/lib/feature-flag-keys";
import {
  FEATURE_FLAG_CHANGE_EVENT,
  FEATURE_FLAG_STORAGE_PREFIX,
  setFeatureFlagOverride,
  useFeatureFlag,
} from "~/lib/feature-flags";

import {
  useAdminFeatureFlags,
  type FeatureFlagRecord,
} from "../feature-flags/admin-feature-flags.queries";

const curatedFlags: Array<{
  key: string;
  label: string;
  description: string;
}> = [
  {
    key: "persona-coming-soon-visitor",
    label: "Visitor coming-soon card",
    description:
      "Controls whether the visitor namespace shows the feedback module Jordan uses for narrative intake.",
  },
  {
    key: "persona-coming-soon-player",
    label: "Player coming-soon card",
    description:
      "Toggles the player dashboard placeholder for safe rollout sequencing across personas.",
  },
  {
    key: "persona-coming-soon-ops",
    label: "Operations coming-soon card",
    description:
      "Determines if Priya sees the ops workspace preview or the production console.",
  },
  {
    key: "persona-coming-soon-gm",
    label: "GM coming-soon card",
    description:
      "Keeps Alex's studio experience behind a flag for iterative testing with Jordan's oversight.",
  },
  {
    key: "persona-coming-soon-admin",
    label: "Admin coming-soon card",
    description:
      "Legacy placeholder for Jordan's workspace. Disable once the governance console ships.",
  },
  {
    key: WORKSPACE_FEATURE_FLAGS.sharedInbox,
    label: "Workspace shared inbox",
    description:
      "Toggles the shared inbox experience across player, ops, GM, and admin workspaces.",
  },
  {
    key: WORKSPACE_FEATURE_FLAGS.collaboration,
    label: "Cross-persona collaboration workspace",
    description:
      "Controls access to the collaboration workspace for role-based dashboards.",
  },
];

interface CombinedFlag extends FeatureFlagRecord {
  label?: string;
  description?: string;
}

function FeatureFlagRow({ flag }: { flag: CombinedFlag }) {
  const effective = useFeatureFlag(flag.key, flag.environmentValue ?? false);
  const [override, setOverride] = useState<boolean | null>(() => {
    if (typeof window === "undefined") return null;
    const stored = window.localStorage.getItem(
      `${FEATURE_FLAG_STORAGE_PREFIX}${flag.key}`,
    );
    if (stored === null) return null;
    return stored === "true";
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleChange = (event: Event) => {
      const detail = (event as CustomEvent<{ flag: string; value: boolean | null }>)
        .detail;
      if (detail?.flag !== flag.key) return;
      setOverride(detail.value);
    };
    window.addEventListener(FEATURE_FLAG_CHANGE_EVENT, handleChange);
    return () => {
      window.removeEventListener(FEATURE_FLAG_CHANGE_EVENT, handleChange);
    };
  }, [flag.key]);

  const environmentLabel =
    flag.environmentValue === null
      ? "Not set"
      : flag.environmentValue
        ? "Enabled"
        : "Disabled";

  return (
    <div className="border-border token-gap-sm rounded-lg border p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="token-stack-xs">
          <div className="flex items-center gap-2">
            {effective ? (
              <ToggleRightIcon aria-hidden className="size-5 text-emerald-600" />
            ) : (
              <ToggleLeftIcon aria-hidden className="text-muted-foreground size-5" />
            )}
            <p className="text-body-sm text-foreground font-semibold">
              {flag.label ?? flag.key}
            </p>
          </div>
          <p className="text-body-xs text-muted-foreground">
            {flag.description ?? "Custom flag override"}
          </p>
        </div>
        <div className="token-gap-xs flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className="bg-muted text-muted-foreground border-transparent"
          >
            Env: {environmentLabel}
          </Badge>
          <Badge variant="outline" className="border-transparent">
            Override: {override === null ? "None" : override ? "Enabled" : "Disabled"}
          </Badge>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          onClick={() => setFeatureFlagOverride(flag.key, true)}
        >
          Enable
        </Button>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => setFeatureFlagOverride(flag.key, false)}
        >
          Disable
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => setFeatureFlagOverride(flag.key, null)}
        >
          Clear override
        </Button>
        <span className="text-body-xs text-muted-foreground">
          Effective state: {effective ? "Enabled" : "Disabled"}
        </span>
      </div>
    </div>
  );
}

function FeatureFlagSkeleton() {
  const skeletonRows = ["flag-1", "flag-2", "flag-3", "flag-4"];
  return (
    <Card className="bg-surface-elevated border-subtle">
      <CardHeader className="token-stack-sm">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-72" />
      </CardHeader>
      <CardContent className="token-stack-sm">
        {skeletonRows.map((key) => (
          <Skeleton key={key} className="h-20 w-full" />
        ))}
      </CardContent>
    </Card>
  );
}

export function AdminFeatureFlagConsole() {
  const [customKey, setCustomKey] = useState("");
  const [customFlags, setCustomFlags] = useState<string[]>([]);
  const { data, isLoading, isError, error, refetch, isRefetching } =
    useAdminFeatureFlags();

  const allFlags = useMemo(() => {
    const map = new Map<string, CombinedFlag>();
    for (const curated of curatedFlags) {
      map.set(curated.key, {
        key: curated.key,
        envKey: curated.key,
        environmentValue: null,
        label: curated.label,
        description: curated.description,
      });
    }
    if (data) {
      for (const flag of data.flags) {
        map.set(flag.key, {
          ...map.get(flag.key),
          ...flag,
        });
      }
    }
    for (const key of customFlags) {
      if (!map.has(key)) {
        map.set(key, { key, envKey: key, environmentValue: null });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.key.localeCompare(b.key));
  }, [customFlags, data]);

  const handleAddCustomFlag = () => {
    const normalized = customKey.trim();
    if (!normalized) return;
    setCustomFlags((previous) =>
      previous.includes(normalized) ? previous : [...previous, normalized],
    );
    setCustomKey("");
  };

  if (isLoading && !data) {
    return <FeatureFlagSkeleton />;
  }

  if (isError) {
    return (
      <Card className="bg-destructive/5 border-destructive/30">
        <CardHeader className="token-stack-sm">
          <div className="token-gap-xs flex items-center gap-2">
            <AlertTriangleIcon className="text-destructive size-5" aria-hidden />
            <CardTitle className="text-heading-sm">Feature flags unavailable</CardTitle>
          </div>
          <CardDescription className="text-body-sm text-destructive">
            {error?.message ?? "We couldn't read the platform flag registry."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => refetch()} variant="secondary">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-surface-elevated border-subtle">
      <CardHeader className="token-stack-sm">
        <div className="token-stack-xs">
          <CardTitle className="text-heading-sm">Feature rollout console</CardTitle>
          <CardDescription className="text-body-sm text-muted-strong">
            Manage local overrides for experiments and persona previews without touching
            production environment variables.
          </CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Input
              value={customKey}
              onChange={(event) => setCustomKey(event.target.value)}
              placeholder="Add flag key"
              className="w-[220px]"
            />
            <Button type="button" variant="outline" onClick={handleAddCustomFlag}>
              <PlusIcon className="mr-1 size-4" aria-hidden />
              Add
            </Button>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="flex items-center gap-2"
          >
            {isRefetching ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <RefreshCwIcon className="size-4" aria-hidden />
            )}
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="token-stack-md">
        {allFlags.length === 0 ? (
          <div className="token-stack-sm rounded-lg border border-dashed p-6 text-center">
            <CheckIcon className="mx-auto size-8 text-emerald-500" aria-hidden />
            <p className="text-body-sm text-foreground font-semibold">
              No feature flags discovered
            </p>
            <p className="text-body-sm text-muted-strong">
              Add a flag key to manage overrides or define environment variables prefixed
              with VITE_FLAG_.
            </p>
          </div>
        ) : (
          <div className="token-stack-sm">
            {allFlags.map((flag) => (
              <FeatureFlagRow key={flag.key} flag={flag} />
            ))}
          </div>
        )}
        {data?.flags.length ? (
          <p className="text-body-xs text-muted-foreground">
            Environment snapshot refreshed{" "}
            {formatDistanceToNow(new Date(), { addSuffix: true })}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

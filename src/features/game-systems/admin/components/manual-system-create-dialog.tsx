import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { useGameSystemsTranslation } from "~/hooks/useTypedTranslation";
import { createManualGameSystem } from "../game-systems-admin.mutations";
import {
  DEFAULT_SYSTEM_DETAIL_ROUTE,
  type SystemDetailRoute,
} from "../lib/system-routes";

// These will be updated with translation function inside the component
const EXTERNAL_SOURCE_OPTIONS = [
  { value: "none", translationKey: "options.none" },
  { value: "startplaying", translationKey: "options.startplaying" },
  { value: "bgg", translationKey: "options.bgg" },
  { value: "wikipedia", translationKey: "options.wikipedia" },
  { value: "custom", translationKey: "options.custom" },
] as const;

type ExternalSourceOption = (typeof EXTERNAL_SOURCE_OPTIONS)[number]["value"];

interface ManualSystemFormState {
  name: string;
  sourceKind: ExternalSourceOption;
  sourceValue: string;
  customKey: string;
  queueRecrawl: boolean;
}

const INITIAL_FORM_STATE: ManualSystemFormState = {
  name: "",
  sourceKind: "none",
  sourceValue: "",
  customKey: "",
  queueRecrawl: true,
};

interface ManualSystemCreateDialogProps {
  onCreated?: () => void;
  detailRoute?: SystemDetailRoute;
}

export function ManualSystemCreateDialog({
  onCreated,
  detailRoute = DEFAULT_SYSTEM_DETAIL_ROUTE,
}: ManualSystemCreateDialogProps) {
  const { t } = useGameSystemsTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [formState, setFormState] = useState<ManualSystemFormState>(INITIAL_FORM_STATE);

  const trimmedName = formState.name.trim();
  const trimmedSourceValue = formState.sourceValue.trim();
  const trimmedCustomKey = formState.customKey.trim();

  const navigateToSystemDetail = (systemId: string) => {
    if (detailRoute === "/admin/systems/$systemId") {
      const navigateOptions = {
        to: "/admin/systems/$systemId",
        params: { systemId },
        // TanStack Router's navigate typings expect strongly typed route objects; casting via unknown avoids
        // incompatibilities when sharing this component across namespaces.
      } as unknown as Parameters<typeof router.navigate>[0];
      void router.navigate(navigateOptions);
      return;
    }

    const navigateOptions = {
      to: "/admin/systems/$systemId",
      params: { systemId },
      // See note above regarding TanStack Router navigation typings.
    } as unknown as Parameters<typeof router.navigate>[0];
    void router.navigate(navigateOptions);
  };

  const externalSourcePayload = useMemo(() => {
    if (formState.sourceKind === "none") return undefined;
    if (trimmedSourceValue.length === 0) return undefined;

    if (formState.sourceKind === "custom") {
      if (trimmedCustomKey.length === 0) return undefined;
      return {
        kind: "custom" as const,
        value: trimmedSourceValue,
        customKey: trimmedCustomKey,
      };
    }

    return {
      kind: formState.sourceKind,
      value: trimmedSourceValue,
    } as const;
  }, [formState.sourceKind, trimmedCustomKey, trimmedSourceValue]);

  const canSubmit =
    trimmedName.length > 0 &&
    (formState.sourceKind === "none" || externalSourcePayload !== undefined);

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: trimmedName,
        queueRecrawl: formState.queueRecrawl,
        externalSource: externalSourcePayload,
      };

      const result = await createManualGameSystem({ data: payload });
      return { result, payload };
    },
    onSuccess: ({ result, payload }) => {
      const targetId = result?.id;
      toast.success(
        t("admin.manual_system_dialog.messages.create_success", { name: payload.name }),
        {
          description: t("admin.manual_system_dialog.messages.create_description"),
          action:
            typeof targetId === "number"
              ? {
                  label: t("admin.manual_system_dialog.messages.create_action"),
                  onClick: () => navigateToSystemDetail(String(targetId)),
                }
              : undefined,
        },
      );
      setFormState(INITIAL_FORM_STATE);
      setOpen(false);
      onCreated?.();
      void queryClient.invalidateQueries({ queryKey: ["admin-game-systems"] });
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error
          ? error.message
          : t("admin.manual_system_dialog.messages.create_failed");
      toast.error(message);
    },
  });

  const resetAndClose = () => {
    if (mutation.isPending) return;
    setFormState(INITIAL_FORM_STATE);
    setOpen(false);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit || mutation.isPending) return;
    mutation.mutate();
  };

  const showSourceFields = formState.sourceKind !== "none";
  const showCustomKey = formState.sourceKind === "custom";

  // Memoized source options with translations
  const externalSourceOptions = useMemo(
    () =>
      EXTERNAL_SOURCE_OPTIONS.map((option) => ({
        ...option,
        label: t(`admin.manual_system_dialog.${option.translationKey}`),
      })),
    [t],
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          resetAndClose();
        } else {
          setOpen(true);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" variant="default">
          {t("admin.manual_system_dialog.button")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader className="space-y-2 text-left">
            <DialogTitle>{t("admin.manual_system_dialog.title")}</DialogTitle>
            <DialogDescription>
              {t("admin.manual_system_dialog.description")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="manual-system-name">
                {t("admin.manual_system_dialog.fields.system_name")}
              </Label>
              <Input
                id="manual-system-name"
                value={formState.name}
                onChange={(event) =>
                  setFormState((previous) => ({
                    ...previous,
                    name: event.target.value,
                  }))
                }
                placeholder={t("admin.manual_system_dialog.placeholders.system_name")}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="manual-system-source">
                {t("admin.manual_system_dialog.fields.external_source")}
              </Label>
              <Select
                value={formState.sourceKind}
                onValueChange={(next) =>
                  setFormState((previous) => ({
                    ...previous,
                    sourceKind: next as ExternalSourceOption,
                  }))
                }
              >
                <SelectTrigger id="manual-system-source">
                  <SelectValue
                    placeholder={t(
                      "admin.manual_system_dialog.placeholders.select_source",
                    )}
                  />
                </SelectTrigger>
                <SelectContent>
                  {externalSourceOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {showSourceFields ? (
              <div className="space-y-1">
                <Label htmlFor="manual-system-reference">
                  {formState.sourceKind === "custom"
                    ? t("admin.manual_system_dialog.fields.reference_value")
                    : t("admin.manual_system_dialog.fields.external_reference")}
                </Label>
                <Input
                  id="manual-system-reference"
                  value={formState.sourceValue}
                  onChange={(event) =>
                    setFormState((previous) => ({
                      ...previous,
                      sourceValue: event.target.value,
                    }))
                  }
                  placeholder={
                    formState.sourceKind === "bgg"
                      ? t("admin.manual_system_dialog.placeholders.bgg_id")
                      : formState.sourceKind === "wikipedia"
                        ? t("admin.manual_system_dialog.placeholders.wikipedia_url")
                        : t("admin.manual_system_dialog.placeholders.external_identifier")
                  }
                  required
                />
              </div>
            ) : null}
            {showCustomKey ? (
              <div className="space-y-1">
                <Label htmlFor="manual-system-custom-key">
                  {t("admin.manual_system_dialog.fields.custom_source_key")}
                </Label>
                <Input
                  id="manual-system-custom-key"
                  value={formState.customKey}
                  onChange={(event) =>
                    setFormState((previous) => ({
                      ...previous,
                      customKey: event.target.value,
                    }))
                  }
                  placeholder={t("admin.manual_system_dialog.placeholders.custom_key")}
                  required
                />
              </div>
            ) : null}
            <div className="flex items-center gap-2">
              <Checkbox
                id="manual-system-queue-recrawl"
                checked={formState.queueRecrawl}
                onCheckedChange={(checked) =>
                  setFormState((previous) => ({
                    ...previous,
                    queueRecrawl: Boolean(checked),
                  }))
                }
              />
              <Label htmlFor="manual-system-queue-recrawl" className="cursor-pointer">
                {t("admin.manual_system_dialog.checkbox.queue_recrawl")}
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={resetAndClose}
              disabled={mutation.isPending}
            >
              {t("admin.manual_system_dialog.buttons.cancel")}
            </Button>
            <Button type="submit" disabled={!canSubmit || mutation.isPending}>
              {mutation.isPending
                ? t("admin.manual_system_dialog.buttons.creating")
                : t("admin.manual_system_dialog.buttons.create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

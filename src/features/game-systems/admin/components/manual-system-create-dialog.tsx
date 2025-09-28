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
import { createManualGameSystem } from "../game-systems-admin.mutations";

const EXTERNAL_SOURCE_OPTIONS = [
  { value: "none", label: "None" },
  { value: "startplaying", label: "StartPlaying" },
  { value: "bgg", label: "BoardGameGeek" },
  { value: "wikipedia", label: "Wikipedia" },
  { value: "custom", label: "Custom" },
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
}

export function ManualSystemCreateDialog({ onCreated }: ManualSystemCreateDialogProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [formState, setFormState] = useState<ManualSystemFormState>(INITIAL_FORM_STATE);

  const trimmedName = formState.name.trim();
  const trimmedSourceValue = formState.sourceValue.trim();
  const trimmedCustomKey = formState.customKey.trim();

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
      toast.success(`Created “${payload.name}”`, {
        description: "Manual systems start as drafts until you publish them.",
        action:
          typeof targetId === "number"
            ? {
                label: "Edit",
                onClick: () => {
                  void router.navigate({
                    to: "/dashboard/systems/$systemId",
                    params: { systemId: String(targetId) },
                  });
                },
              }
            : undefined,
      });
      setFormState(INITIAL_FORM_STATE);
      setOpen(false);
      onCreated?.();
      void queryClient.invalidateQueries({ queryKey: ["admin-game-systems"] });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Failed to create system.";
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
          Add manual system
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader className="space-y-2 text-left">
            <DialogTitle>Add manual game system</DialogTitle>
            <DialogDescription>
              Create a CMS-owned system with optional crawl metadata.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="manual-system-name">System name</Label>
              <Input
                id="manual-system-name"
                value={formState.name}
                onChange={(event) =>
                  setFormState((previous) => ({
                    ...previous,
                    name: event.target.value,
                  }))
                }
                placeholder="e.g., The Wild Beyond the Witchlight"
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="manual-system-source">External source</Label>
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
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  {EXTERNAL_SOURCE_OPTIONS.map((option) => (
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
                    ? "Reference value"
                    : "External reference"}
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
                      ? "Enter BGG thing ID"
                      : formState.sourceKind === "wikipedia"
                        ? "Enter Wikipedia URL"
                        : "Enter external identifier"
                  }
                  required
                />
              </div>
            ) : null}
            {showCustomKey ? (
              <div className="space-y-1">
                <Label htmlFor="manual-system-custom-key">Custom source key</Label>
                <Input
                  id="manual-system-custom-key"
                  value={formState.customKey}
                  onChange={(event) =>
                    setFormState((previous) => ({
                      ...previous,
                      customKey: event.target.value,
                    }))
                  }
                  placeholder="e.g., driveThruRPG"
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
                Queue an initial recrawl
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
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit || mutation.isPending}>
              {mutation.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

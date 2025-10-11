import { Loader2Icon } from "lucide-react";
import { useState } from "react";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { cn } from "~/shared/lib/utils";

import {
  useActivePersona,
  useRoleSwitcher,
} from "~/features/roles/role-switcher-context";

export function RoleSwitcher() {
  const { resolution, status, error, switchPersona, clearError } = useRoleSwitcher();
  const activePersona = useActivePersona();
  const [open, setOpen] = useState(false);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      clearError();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" aria-expanded={open}>
          {status === "switching" ? (
            <Loader2Icon className="mr-2 size-4 animate-spin" aria-hidden="true" />
          ) : null}
          <span className="mr-2 font-medium">{activePersona.shortLabel}</span>
          <Badge variant="secondary">Persona</Badge>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg" showCloseButton>
        <DialogHeader>
          <DialogTitle>Switch persona</DialogTitle>
          <DialogDescription>
            Choose a workspace to preview persona-specific navigation and tooling.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          {resolution.personas.map((persona) => {
            const isActive = persona.id === resolution.activePersonaId;
            const isDisabled =
              persona.availability !== "available" || status === "switching";

            return (
              <button
                key={persona.id}
                type="button"
                onClick={() => switchPersona(persona.id)}
                disabled={isDisabled}
                className={cn(
                  "border-border focus-visible:ring-ring hover:bg-muted/60 inline-flex w-full flex-col gap-2",
                  "rounded-md border p-4 text-left transition focus-visible:ring-2 focus-visible:outline-hidden",
                  isActive && "border-primary bg-primary/10",
                  persona.availability !== "available" && "opacity-60",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col">
                    <span className="text-base font-semibold">{persona.label}</span>
                    <span className="text-muted-foreground text-sm">
                      {persona.description}
                    </span>
                  </div>
                  <Badge variant={isActive ? "default" : "outline"}>
                    {persona.availability === "available"
                      ? isActive
                        ? "Active"
                        : "Available"
                      : "Locked"}
                  </Badge>
                </div>
                {persona.availability !== "available" && persona.availabilityReason ? (
                  <p className="text-muted-foreground text-xs">
                    {persona.availabilityReason}
                  </p>
                ) : null}
              </button>
            );
          })}
        </div>
        {error ? (
          <p className="text-destructive text-sm" role="alert">
            {error}
          </p>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

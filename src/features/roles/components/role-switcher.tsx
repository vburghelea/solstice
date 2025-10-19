import { Loader2Icon } from "lucide-react";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";

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
import { useRolesTranslation } from "~/hooks/useTypedTranslation";
import { cn } from "~/shared/lib/utils";

import {
  useActivePersona,
  useRoleSwitcher,
} from "~/features/roles/role-switcher-context";

export function RoleSwitcher() {
  const { t } = useRolesTranslation();
  const { resolution, status, error, switchPersona, clearError } = useRoleSwitcher();
  const activePersona = useActivePersona();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    if (!isHydrated) {
      // eslint-disable-next-line @eslint-react/hooks-extra/no-direct-set-state-in-use-effect
      setIsHydrated(true);
    }
  }, [isHydrated]); // isHydrated only changes once, safe for hydration detection
  const [open, dispatchOpen] = useReducer(
    (state: boolean, action: "open" | "close" | "toggle") => {
      switch (action) {
        case "open":
          return true;
        case "close":
          return false;
        case "toggle":
          return !state;
        default:
          return state;
      }
    },
    false,
  );
  const previousPersonaIdRef = useRef(resolution.activePersonaId);

  const closeDialog = useCallback(() => {
    dispatchOpen("close");
  }, []);

  const handleOpenChange = (nextOpen: boolean) => {
    dispatchOpen(nextOpen ? "open" : "close");
    if (!nextOpen) {
      clearError();
    }
  };

  useEffect(() => {
    if (previousPersonaIdRef.current === resolution.activePersonaId) {
      return;
    }

    previousPersonaIdRef.current = resolution.activePersonaId;
    closeDialog();
  }, [closeDialog, resolution.activePersonaId]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" aria-expanded={open}>
          {status === "switching" ? (
            <Loader2Icon className="mr-2 size-4 animate-spin" aria-hidden="true" />
          ) : null}
          <span className="mr-2 font-medium">
            {isHydrated
              ? t(`personas.${activePersona.id}.short_label`)
              : t("switcher.loading")}
          </span>
          <Badge variant="secondary">{t("switcher.badge")}</Badge>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg" showCloseButton>
        <DialogHeader>
          <DialogTitle>{t("switcher.title")}</DialogTitle>
          <DialogDescription>{t("switcher.description")}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          {resolution.personas
            .filter(
              (persona) =>
                persona.availability === "available" ||
                persona.id === resolution.activePersonaId,
            )
            .map((persona) => {
              const isActive = persona.id === resolution.activePersonaId;
              const isDisabled = status === "switching";

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
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col">
                      <span className="text-base font-semibold">
                        {t(`personas.${persona.id}.label`)}
                      </span>
                      <span className="text-muted-foreground text-sm">
                        {t(`personas.${persona.id}.description`)}
                      </span>
                    </div>
                    <Badge variant={isActive ? "default" : "outline"}>
                      {isActive
                        ? t("switcher.status.active")
                        : t("switcher.status.available")}
                    </Badge>
                  </div>
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

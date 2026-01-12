import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { PasskeyIcon } from "~/components/ui/icons";
import { auth } from "~/lib/auth-client";
import { dismissPasskeyPrompt, getCurrentUserPasskeyPromptStatus } from "../auth.queries";

type PasskeyPromptStatus = Awaited<ReturnType<typeof getCurrentUserPasskeyPromptStatus>>;

const LEGACY_PASSKEY_PROMPT_DISMISSED_KEY = "passkey-prompt-dismissed";
const PASSKEY_PROMPT_SNOOZED_KEY = "passkey-prompt-snoozed";
const PASSKEY_PROMPT_SNOOZE_DURATION_HOURS = 24;

function getPasskeyPromptSnoozed(): boolean {
  if (typeof window === "undefined") return true;
  const snoozed = localStorage.getItem(PASSKEY_PROMPT_SNOOZED_KEY);
  if (!snoozed) return false;

  const snoozedAt = Number.parseInt(snoozed, 10);
  const hoursSinceSnoozed = (Date.now() - snoozedAt) / (1000 * 60 * 60);

  return hoursSinceSnoozed < PASSKEY_PROMPT_SNOOZE_DURATION_HOURS;
}

function getLegacyPasskeyPromptDismissed(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(localStorage.getItem(LEGACY_PASSKEY_PROMPT_DISMISSED_KEY));
}

function clearLegacyPasskeyPromptDismissed(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(LEGACY_PASSKEY_PROMPT_DISMISSED_KEY);
}

function setPasskeyPromptSnoozed(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PASSKEY_PROMPT_SNOOZED_KEY, Date.now().toString());
}

function clearPasskeyPromptSnooze(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(PASSKEY_PROMPT_SNOOZED_KEY);
}

type PasskeyPromptProps = {
  /** Override to force show the prompt (for testing) */
  forceShow?: boolean;
};

/**
 * Post-login passkey creation prompt.
 * Shows after successful login if the user doesn't have any passkeys registered.
 * Follows FIDO Alliance UX guidelines for passkey adoption.
 */
export function PasskeyPrompt({ forceShow }: PasskeyPromptProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [passkeySupported, setPasskeySupported] = useState(false);

  useEffect(() => {
    setPasskeySupported(Boolean(window.PublicKeyCredential));
  }, []);

  const { data: passkeyPromptStatus, isLoading } = useQuery({
    queryKey: ["passkey-prompt-status"],
    queryFn: () => getCurrentUserPasskeyPromptStatus(),
    staleTime: 60_000,
  });

  useEffect(() => {
    if (isLoading || !passkeySupported) return;

    const hasNoPasskeys = passkeyPromptStatus?.count === 0;
    const snoozed = getPasskeyPromptSnoozed();
    const dismissed = passkeyPromptStatus?.dismissed ?? false;
    const legacyDismissed = getLegacyPasskeyPromptDismissed();
    const twoFactorEnabled = passkeyPromptStatus?.twoFactorEnabled ?? false;

    if (
      (forceShow ||
        (hasNoPasskeys &&
          !dismissed &&
          !legacyDismissed &&
          !snoozed &&
          !twoFactorEnabled)) &&
      passkeySupported
    ) {
      // Small delay to not interrupt login flow
      const timer = setTimeout(() => setOpen(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [passkeyPromptStatus, isLoading, forceShow, passkeySupported]);

  const addPasskeyMutation = useMutation({
    mutationFn: async () => {
      const result = await auth.passkey.addPasskey({});
      if (result?.error) {
        throw new Error(result.error.message || "Failed to add passkey");
      }
      return result;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["user-passkey-count"] });
      await queryClient.invalidateQueries({ queryKey: ["passkeys"] });
      toast.success("Passkey created! You can now sign in faster.");
      setOpen(false);
    },
    onError: (error) => {
      toast.error((error as Error).message || "Failed to create passkey");
    },
  });

  const {
    mutate: dismissPasskeyPromptMutate,
    mutateAsync: dismissPasskeyPromptMutateAsync,
    isPending: isDismissPending,
  } = useMutation({
    mutationFn: async () => dismissPasskeyPrompt(),
    onSuccess: () => {
      queryClient.setQueryData<PasskeyPromptStatus>(
        ["passkey-prompt-status"],
        (prev) => ({
          count: prev?.count ?? 0,
          dismissed: true,
          twoFactorEnabled: prev?.twoFactorEnabled ?? false,
        }),
      );
      clearPasskeyPromptSnooze();
    },
    onError: (error) => {
      toast.error((error as Error).message || "Failed to dismiss passkey prompt");
    },
  });

  useEffect(() => {
    if (passkeyPromptStatus?.dismissed) {
      clearLegacyPasskeyPromptDismissed();
      return;
    }

    if (!passkeyPromptStatus?.dismissed && getLegacyPasskeyPromptDismissed()) {
      dismissPasskeyPromptMutate();
      clearLegacyPasskeyPromptDismissed();
    }
  }, [passkeyPromptStatus, dismissPasskeyPromptMutate]);

  const handleDismiss = async (dontShowAgain: boolean) => {
    if (dontShowAgain) {
      await dismissPasskeyPromptMutateAsync();
    } else {
      setPasskeyPromptSnoozed();
    }
    setOpen(false);
  };

  if (!passkeySupported) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center sm:text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <PasskeyIcon className="h-8 w-8 text-primary" />
          </div>
          <DialogTitle className="text-xl">
            Enable faster sign-in with a passkey
          </DialogTitle>
          <DialogDescription className="text-base">
            Passkeys let you sign in securely with your fingerprint, face, or screen lock
            — no password needed.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          <div className="flex items-start gap-3">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700">
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div>
              <p className="font-medium">Faster sign-in</p>
              <p className="text-sm text-muted-foreground">
                One tap to sign in — no typing passwords
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700">
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div>
              <p className="font-medium">Phishing-resistant</p>
              <p className="text-sm text-muted-foreground">
                Passkeys can't be stolen or guessed like passwords
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700">
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div>
              <p className="font-medium">Synced across devices</p>
              <p className="text-sm text-muted-foreground">
                Available on all your devices with the same account
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            className="w-full"
            onClick={() => addPasskeyMutation.mutate()}
            disabled={addPasskeyMutation.isPending || isDismissPending}
          >
            {addPasskeyMutation.isPending ? (
              <>
                <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Creating passkey...
              </>
            ) : (
              <>
                <PasskeyIcon className="mr-2 h-4 w-4" />
                Create a passkey
              </>
            )}
          </Button>
          <div className="flex w-full gap-2">
            <Button
              variant="ghost"
              className="flex-1"
              onClick={() => handleDismiss(false)}
              disabled={addPasskeyMutation.isPending || isDismissPending}
            >
              Not now
            </Button>
            <Button
              variant="ghost"
              className="flex-1 text-muted-foreground"
              onClick={() => handleDismiss(true)}
              disabled={addPasskeyMutation.isPending || isDismissPending}
            >
              Don't show again
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

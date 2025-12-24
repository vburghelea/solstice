import {
  FormEvent,
  ReactNode,
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { toast } from "sonner";
import { FormSubmitButton } from "~/components/form-fields/FormSubmitButton";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { auth } from "~/lib/auth-client";

type StepUpContextValue = {
  requestStepUp: (reason?: string) => void;
};

const StepUpContext = createContext<StepUpContextValue | null>(null);

const STEP_UP_MESSAGES = [
  "Re-authentication required for this action",
  "MFA re-verification required for this action",
];

export const getStepUpErrorMessage = (error: unknown) => {
  if (!error) return null;
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : typeof error === "object" && "message" in error
          ? String((error as { message?: unknown }).message ?? "")
          : "";

  if (!message) return null;
  return STEP_UP_MESSAGES.find((match) => message.includes(match)) ?? null;
};

export function StepUpProvider({ children }: { readonly children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string | null>(null);

  const requestStepUp = useCallback((message?: string) => {
    setReason(message ?? "Re-authentication required for this action");
    setOpen(true);
  }, []);

  const handleOpenChange = useCallback((nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setReason(null);
    }
  }, []);

  const value = useMemo(() => ({ requestStepUp }), [requestStepUp]);

  return (
    <StepUpContext value={value}>
      {children}
      <StepUpDialog open={open} reason={reason} onOpenChange={handleOpenChange} />
    </StepUpContext>
  );
}

export const useStepUpPrompt = () => {
  const context = use(StepUpContext);
  if (!context) {
    throw new Error("StepUpProvider is missing from the component tree.");
  }
  return context;
};

function StepUpDialog({
  open,
  reason,
  onOpenChange,
}: {
  open: boolean;
  reason: string | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [email, setEmail] = useState("");
  const [emailLocked, setEmailLocked] = useState(false);
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"password" | "mfa">("password");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const resetState = useCallback(() => {
    setPassword("");
    setCode("");
    setStep("password");
    setIsSubmitting(false);
    setErrorMessage("");
  }, []);

  const handleDialogOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        resetState();
      }
      onOpenChange(nextOpen);
    },
    [onOpenChange, resetState],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    let isActive = true;

    const loadSessionEmail = async () => {
      try {
        const result = await auth.getSession();
        const sessionEmail = result?.data?.user?.email;
        if (!isActive) return;
        if (sessionEmail) {
          setEmail(sessionEmail);
          setEmailLocked(true);
        } else {
          setEmail("");
          setEmailLocked(false);
        }
      } catch {
        if (!isActive) return;
        setEmailLocked(false);
      }
    };

    void loadSessionEmail();

    return () => {
      isActive = false;
    };
  }, [open]);

  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    if (!email.trim() || !password) {
      setErrorMessage("Email and password are required.");
      setIsSubmitting(false);
      return;
    }

    try {
      const result = await auth.signIn.email({ email: email.trim(), password });

      if (result?.error) {
        throw new Error(result.error.message || "Authentication failed");
      }

      if (
        result?.data &&
        "twoFactorRedirect" in result.data &&
        result.data.twoFactorRedirect
      ) {
        setStep("mfa");
        setIsSubmitting(false);
        return;
      }

      toast.success("Re-authenticated. Please retry the action.");
      onOpenChange(false);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Authentication failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMfaSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    if (!code.trim()) {
      setErrorMessage("Authentication code is required.");
      setIsSubmitting(false);
      return;
    }

    try {
      const result = await auth.twoFactor.verifyTotp({ code: code.trim() });
      if (result?.error) {
        throw new Error(result.error.message || "Invalid authentication code");
      }

      toast.success("Re-authenticated. Please retry the action.");
      onOpenChange(false);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Authentication verification failed",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Confirm your identity</DialogTitle>
          <DialogDescription>
            {reason ?? "Re-authentication is required to continue this action."}
          </DialogDescription>
        </DialogHeader>

        {step === "password" ? (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="step-up-email">Email</Label>
              <Input
                id="step-up-email"
                type="email"
                value={email}
                disabled={emailLocked || isSubmitting}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="step-up-password">Password</Label>
              <Input
                id="step-up-password"
                type="password"
                value={password}
                disabled={isSubmitting}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            {errorMessage ? (
              <p className="text-destructive text-sm">{errorMessage}</p>
            ) : null}
            <DialogFooter className="gap-2 sm:justify-end">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <FormSubmitButton isSubmitting={isSubmitting} loadingText="Confirming...">
                Continue
              </FormSubmitButton>
            </DialogFooter>
          </form>
        ) : (
          <form onSubmit={handleMfaSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="step-up-code">Authentication code</Label>
              <Input
                id="step-up-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                disabled={isSubmitting}
                onChange={(event) => setCode(event.target.value)}
              />
            </div>
            {errorMessage ? (
              <p className="text-destructive text-sm">{errorMessage}</p>
            ) : null}
            <DialogFooter className="gap-2 sm:justify-end">
              <Button type="button" variant="ghost" onClick={() => setStep("password")}>
                Back
              </Button>
              <FormSubmitButton isSubmitting={isSubmitting} loadingText="Verifying...">
                Verify
              </FormSubmitButton>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { FormSubmitButton } from "~/components/form-fields/FormSubmitButton";
import { ValidatedInput } from "~/components/form-fields/ValidatedInput";
import { Button } from "~/components/ui/button";
import { GoogleIcon, LogoIcon } from "~/components/ui/icons";
import { Input } from "~/components/ui/input";
import { SafeLink as Link } from "~/components/ui/SafeLink";
import { recordSecurityEvent } from "~/features/security/security.mutations";
import { getAccountLockStatus } from "~/features/security/security.queries";
import { auth } from "~/lib/auth-client";
import { useAppForm } from "~/lib/hooks/useAppForm";
import { getBrand } from "~/tenant";
import { authQueryKey } from "../auth.queries";
import { loginFormSchema } from "../auth.schemas";

type LoginFormProps = {
  redirectPath?: string | undefined;
};

export default function LoginForm(props?: LoginFormProps) {
  const brand = getBrand();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const router = useRouter();

  const safeRedirectPath = props?.redirectPath?.startsWith("/")
    ? props.redirectPath
    : "/dashboard";

  const [isHydrated, setIsHydrated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [twoFactorRequired, setTwoFactorRequired] = useState(false);
  const [twoFactorMethod, setTwoFactorMethod] = useState<"totp" | "backup">("totp");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [twoFactorError, setTwoFactorError] = useState("");
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);

  useEffect(() => {
    // Form handlers need to wait for hydration; setting state here is intentional.
    // eslint-disable-next-line @eslint-react/hooks-extra/no-direct-set-state-in-use-effect
    setIsHydrated(true);
  }, []);

  const form = useAppForm({
    defaultValues: {
      email: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const result = await auth.signIn.email(value);

        if (result?.error) {
          void recordSecurityEvent({
            data: { eventType: "login_fail", identifier: value.email },
          });
          throw new Error(result.error.message || "Invalid email or password");
        }

        if (
          result?.data &&
          "twoFactorRedirect" in result.data &&
          result.data.twoFactorRedirect
        ) {
          setTwoFactorRequired(true);
          setIsLoading(false);
          return;
        }

        // Success path
        if (result?.data && "user" in result.data && result.data.user?.id) {
          const userId = result.data.user.id;
          void recordSecurityEvent({
            data: { eventType: "login_success", userId: result.data.user.id },
          });
          const lock = await getAccountLockStatus({ data: { userId } });
          if (lock) {
            await auth.signOut();
            setErrorMessage("Account locked. Contact an administrator for access.");
            return;
          }
        }
        await queryClient.invalidateQueries({ queryKey: authQueryKey });
        await router.invalidate();
        await navigate({ to: safeRedirectPath });
      } catch (error) {
        // Error handling
        setErrorMessage((error as Error)?.message || "Invalid email or password");
        // Keep form values but reset submitting state by resetting with current values
        form.reset(value);
      } finally {
        // Always reset loading state
        setIsLoading(false);
      }
    },
  });

  if (twoFactorRequired) {
    return (
      <div className="flex flex-col gap-6">
        <form
          data-testid="login-2fa-form"
          onSubmit={async (event) => {
            event.preventDefault();
            event.stopPropagation();
            setTwoFactorLoading(true);
            setTwoFactorError("");

            try {
              const result =
                twoFactorMethod === "backup"
                  ? await auth.twoFactor.verifyBackupCode({ code: twoFactorCode })
                  : await auth.twoFactor.verifyTotp({ code: twoFactorCode });

              if (result?.error) {
                void recordSecurityEvent({
                  data: { eventType: "mfa_fail" },
                });
                throw new Error(result.error.message || "Invalid authentication code");
              }

              if (result?.data?.user?.id) {
                void recordSecurityEvent({
                  data: { eventType: "mfa_success", userId: result.data.user.id },
                });
              }

              await queryClient.invalidateQueries({ queryKey: authQueryKey });
              await router.invalidate();
              await navigate({ to: safeRedirectPath });
            } catch (error) {
              setTwoFactorError(
                (error as Error)?.message || "Invalid authentication code",
              );
            } finally {
              setTwoFactorLoading(false);
            }
          }}
        >
          <div className="flex flex-col gap-6">
            <div className="flex flex-col items-center gap-2">
              <a href="#" className="flex flex-col items-center gap-2 font-medium">
                <div className="flex h-8 w-8 items-center justify-center rounded-md">
                  <LogoIcon className="size-6" />
                </div>
                <span className="sr-only">{brand.name}</span>
              </a>
              <h1 className="text-xl font-bold">Confirm your sign-in</h1>
              <p className="text-muted-foreground text-sm">
                {twoFactorMethod === "backup"
                  ? "Enter one of your backup codes."
                  : "Enter the code from your authenticator app."}
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant={twoFactorMethod === "totp" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTwoFactorMethod("totp")}
                  disabled={twoFactorLoading}
                >
                  Authenticator code
                </Button>
                <Button
                  type="button"
                  variant={twoFactorMethod === "backup" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTwoFactorMethod("backup")}
                  disabled={twoFactorLoading}
                >
                  Backup code
                </Button>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="two-factor-code">
                  {twoFactorMethod === "backup" ? "Backup code" : "Authentication code"}
                </label>
                <Input
                  id="two-factor-code"
                  autoComplete={
                    twoFactorMethod === "backup" ? "one-time-code" : "one-time-code"
                  }
                  inputMode="numeric"
                  placeholder={twoFactorMethod === "backup" ? "backup-xxxxxx" : "123456"}
                  value={twoFactorCode}
                  onChange={(event) => setTwoFactorCode(event.target.value.trim())}
                />
              </div>

              <FormSubmitButton
                isSubmitting={twoFactorLoading}
                className="mt-2 w-full"
                size="lg"
                loadingText="Verifying..."
              >
                Verify code
              </FormSubmitButton>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                disabled={twoFactorLoading}
                onClick={() => {
                  setTwoFactorRequired(false);
                  setTwoFactorMethod("totp");
                  setTwoFactorCode("");
                  setTwoFactorError("");
                }}
              >
                Back to login
              </Button>
            </div>

            {twoFactorError && (
              <span className="text-destructive text-center text-sm">
                {twoFactorError}
              </span>
            )}
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <form
        data-testid="login-form"
        data-hydrated={isHydrated ? "true" : "false"}
        onSubmit={async (e) => {
          e.preventDefault();
          e.stopPropagation();
          await form.handleSubmit();
        }}
      >
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-2">
            <a href="#" className="flex flex-col items-center gap-2 font-medium">
              <div className="flex h-8 w-8 items-center justify-center rounded-md">
                <LogoIcon className="size-6" />
              </div>
              <span className="sr-only">{brand.name}</span>
            </a>
            <h1 className="text-xl font-bold">Welcome back to {brand.name}</h1>
          </div>
          <div className="flex flex-col gap-5">
            <form.Field
              name="email"
              validators={{
                onChange: ({ value }) => {
                  try {
                    loginFormSchema.shape.email.parse(value);
                    return undefined;
                  } catch (error) {
                    if (error instanceof z.ZodError) {
                      return error.issues[0]?.message || "Invalid email";
                    }
                    return "Invalid email";
                  }
                },
              }}
            >
              {(field) => (
                <ValidatedInput
                  field={field}
                  label="Email"
                  type="email"
                  placeholder="hello@example.com"
                  autoComplete="email"
                  autoFocus
                />
              )}
            </form.Field>
            <form.Field
              name="password"
              validators={{
                onChange: ({ value }) => {
                  try {
                    loginFormSchema.shape.password.parse(value);
                    return undefined;
                  } catch (error) {
                    if (error instanceof z.ZodError) {
                      return error.issues[0]?.message || "Password is required";
                    }
                    return "Password is required";
                  }
                },
              }}
            >
              {(field) => (
                <ValidatedInput
                  field={field}
                  label="Password"
                  type="password"
                  placeholder="Password"
                  autoComplete="current-password"
                />
              )}
            </form.Field>
            <FormSubmitButton
              isSubmitting={form.state.isSubmitting || isLoading}
              className="mt-2 w-full"
              size="lg"
              loadingText="Logging in..."
            >
              Login
            </FormSubmitButton>
          </div>
          {errorMessage && (
            <span className="text-destructive text-center text-sm">{errorMessage}</span>
          )}
          <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
            <span className="bg-background text-muted-foreground relative z-10 px-2">
              Or
            </span>
          </div>
          <Button
            variant="outline"
            className="w-full"
            type="button"
            disabled={isLoading || form.state.isSubmitting}
            onClick={() =>
              auth.signInWithOAuth(
                {
                  provider: "google",
                  callbackURL: safeRedirectPath,
                },
                {
                  onRequest: () => {
                    setIsLoading(true);
                    setErrorMessage("");
                  },
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  onError: (ctx: any) => {
                    setIsLoading(false);
                    setErrorMessage(ctx.error?.message || "OAuth login failed");
                  },
                },
              )
            }
          >
            <GoogleIcon />
            Login with Google
          </Button>
        </div>
      </form>

      <div className="text-center text-sm">
        Don&apos;t have an account?{" "}
        <Link to="/auth/signup" className="underline underline-offset-4">
          Sign up
        </Link>
      </div>
    </div>
  );
}

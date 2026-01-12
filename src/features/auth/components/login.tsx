import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { z } from "zod";
import { FormSubmitButton } from "~/components/form-fields/FormSubmitButton";
import { ValidatedInput } from "~/components/form-fields/ValidatedInput";
import { Button } from "~/components/ui/button";
import {
  AppleIcon,
  GoogleIcon,
  LogoIcon,
  MicrosoftIcon,
  PasskeyIcon,
} from "~/components/ui/icons";
import { Input } from "~/components/ui/input";
import { SafeLink as Link } from "~/components/ui/SafeLink";
import { getAccountLockStatus } from "~/features/security/security.queries";
import { auth } from "~/lib/auth-client";
import { useAppForm } from "~/lib/hooks/useAppForm";
import { getBrand } from "~/tenant";
import type { SocialAuthProvider } from "../auth.queries";
import { authQueryKey, checkPasskeysByEmail } from "../auth.queries";
import { loginFormSchema } from "../auth.schemas";
import { FormErrorSummary } from "~/components/form-fields/FormErrorSummary";

type LoginFormProps = {
  redirectPath?: string | undefined;
  socialProviders?: SocialAuthProvider[];
};

export default function LoginForm(props?: LoginFormProps) {
  const brand = getBrand();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const router = useRouter();

  const safeRedirectPath = props?.redirectPath?.startsWith("/")
    ? props.redirectPath
    : "/dashboard";
  const inviteToken = safeRedirectPath.startsWith("/join/")
    ? safeRedirectPath.replace("/join/", "")
    : undefined;
  const signupHref = inviteToken
    ? `/auth/signup?invite=${encodeURIComponent(inviteToken)}`
    : "/auth/signup";

  const [isHydrated, setIsHydrated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [twoFactorRequired, setTwoFactorRequired] = useState(false);
  const [twoFactorMethod, setTwoFactorMethod] = useState<"totp" | "backup">("totp");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [twoFactorError, setTwoFactorError] = useState("");
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);
  const [passkeySupported, setPasskeySupported] = useState(false);

  // Identifier-first flow state
  const [loginStep, setLoginStep] = useState<"email" | "passkey-prompt" | "credentials">(
    "email",
  );
  const [userHasPasskeys, setUserHasPasskeys] = useState(false);
  const [checkingPasskeys, setCheckingPasskeys] = useState(false);
  const [checkedEmail, setCheckedEmail] = useState("");

  const socialProviders = props?.socialProviders ?? ["google"];
  const providerConfig: Record<
    SocialAuthProvider,
    { label: string; Icon: typeof GoogleIcon }
  > = {
    google: { label: "Google", Icon: GoogleIcon },
    microsoft: { label: "Microsoft", Icon: MicrosoftIcon },
    apple: { label: "Apple", Icon: AppleIcon },
  };

  useEffect(() => {
    // Form handlers need to wait for hydration; setting state here is intentional.
    // eslint-disable-next-line @eslint-react/hooks-extra/no-direct-set-state-in-use-effect
    setIsHydrated(true);
    if (typeof window !== "undefined") {
      // eslint-disable-next-line @eslint-react/hooks-extra/no-direct-set-state-in-use-effect
      setPasskeySupported(Boolean(window.PublicKeyCredential));
    }
  }, []);

  // Check if user has passkeys after email is entered (identifier-first flow)
  const handleEmailContinue = useCallback(
    async (email: string) => {
      if (!email || !passkeySupported) {
        setLoginStep("credentials");
        return;
      }

      // Validate email format first
      const emailValidation = z.string().email().safeParse(email);
      if (!emailValidation.success) {
        setLoginStep("credentials");
        return;
      }

      // Don't re-check if we already checked this email
      if (checkedEmail === email) {
        if (userHasPasskeys) {
          setLoginStep("passkey-prompt");
        } else {
          setLoginStep("credentials");
        }
        return;
      }

      setCheckingPasskeys(true);
      setErrorMessage("");

      try {
        const result = await checkPasskeysByEmail({ data: { email } });
        setCheckedEmail(email);
        setUserHasPasskeys(result.hasPasskeys);

        if (result.hasPasskeys) {
          setLoginStep("passkey-prompt");
        } else {
          setLoginStep("credentials");
        }
      } catch {
        // On error, just proceed to credentials
        setLoginStep("credentials");
      } finally {
        setCheckingPasskeys(false);
      }
    },
    [passkeySupported, checkedEmail, userHasPasskeys],
  );

  // Handle passkey sign-in attempt
  const handlePasskeySignIn = useCallback(async () => {
    if (!passkeySupported) {
      setErrorMessage("Passkeys are not supported on this device.");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const result = await auth.signInWithPasskey({});
      if (result?.error) {
        throw new Error(result.error.message || "Passkey login failed");
      }
      await queryClient.invalidateQueries({ queryKey: authQueryKey });
      await router.invalidate();
      await navigate({ to: safeRedirectPath });
    } catch (error) {
      setErrorMessage((error as Error)?.message || "Passkey login failed");
    } finally {
      setIsLoading(false);
    }
  }, [passkeySupported, queryClient, router, navigate, safeRedirectPath]);

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
                throw new Error(result.error.message || "Invalid authentication code");
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
                  data-testid="login-2fa-code"
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

  // Render passkey prompt step (identifier-first flow)
  if (loginStep === "passkey-prompt") {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-2">
            <a href="#" className="flex flex-col items-center gap-2 font-medium">
              <div className="flex h-8 w-8 items-center justify-center rounded-md">
                <LogoIcon className="size-6" />
              </div>
              <span className="sr-only">{brand.name}</span>
            </a>
            <h1 className="text-xl font-bold">Welcome back!</h1>
            <p className="text-muted-foreground text-sm">{form.state.values.email}</p>
          </div>

          <div className="flex flex-col gap-4">
            {/* Passkey option - prominent */}
            <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-4">
              <div className="mb-3 flex items-center gap-2">
                <PasskeyIcon className="h-5 w-5 text-primary" />
                <span className="font-medium">Sign in faster with your passkey</span>
              </div>
              <p className="mb-4 text-sm text-muted-foreground">
                Use your fingerprint, face, or screen lock to sign in instantly.
              </p>
              <Button
                className="w-full"
                size="lg"
                onClick={handlePasskeySignIn}
                disabled={isLoading || !isHydrated}
              >
                {isLoading ? (
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
                    Signing in...
                  </>
                ) : (
                  <>
                    <PasskeyIcon className="mr-2 h-4 w-4" />
                    Sign in with passkey
                  </>
                )}
              </Button>
            </div>

            {errorMessage && <FormErrorSummary errors={[errorMessage]} />}

            <div className="relative text-center text-sm">
              <span className="text-muted-foreground">or</span>
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => setLoginStep("credentials")}
              disabled={isLoading}
            >
              Use password instead
            </Button>

            <Button
              variant="ghost"
              className="w-full text-muted-foreground"
              onClick={() => {
                setLoginStep("email");
                setCheckedEmail("");
                setUserHasPasskeys(false);
              }}
              disabled={isLoading}
            >
              Use a different email
            </Button>
          </div>
        </div>

        <div className="text-center text-sm">
          Don&apos;t have an account?{" "}
          <Link to={signupHref} className="underline underline-offset-4">
            Sign up
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <form
        data-testid="login-form"
        data-hydrated={isHydrated ? "true" : "false"}
        data-login-step={loginStep}
        onSubmit={async (e) => {
          e.preventDefault();
          e.stopPropagation();

          // In email step, check for passkeys before proceeding
          if (loginStep === "email") {
            await handleEmailContinue(form.state.values.email);
            return;
          }

          // In credentials step, submit the form
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
            {/* Email field - always shown but different based on step */}
            {loginStep === "credentials" ? (
              // Credentials step: show email as read-only with change option
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <div className="flex items-center justify-between rounded-md border bg-muted/50 px-3 py-2">
                  <span className="text-sm">{form.state.values.email}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-auto px-2 py-1 text-xs"
                    onClick={() => {
                      setLoginStep("email");
                      setCheckedEmail("");
                      setUserHasPasskeys(false);
                    }}
                  >
                    Change
                  </Button>
                </div>
              </div>
            ) : (
              // Email step: show editable email field
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
                    autoComplete="username webauthn"
                    autoFocus
                    data-testid="login-email"
                  />
                )}
              </form.Field>
            )}

            {/* Password field - only shown in credentials step */}
            {loginStep === "credentials" && (
              <>
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
                      autoComplete="current-password webauthn"
                      autoFocus
                      data-testid="login-password"
                    />
                  )}
                </form.Field>
                <div className="text-right text-sm">
                  <Link
                    to="/auth/forgot-password"
                    className="underline underline-offset-4"
                  >
                    Forgot password?
                  </Link>
                </div>
              </>
            )}

            {/* Submit button - different text based on step */}
            <FormSubmitButton
              isSubmitting={form.state.isSubmitting || isLoading || checkingPasskeys}
              className="mt-2 w-full"
              size="lg"
              loadingText={
                checkingPasskeys
                  ? "Checking..."
                  : loginStep === "email"
                    ? "Continuing..."
                    : "Logging in..."
              }
            >
              {loginStep === "email" ? "Continue" : "Login"}
            </FormSubmitButton>
          </div>

          {errorMessage && <FormErrorSummary errors={[errorMessage]} />}

          {/* Social providers and passkey button - shown in email step */}
          {loginStep === "email" && (
            <>
              {socialProviders.length > 0 || passkeySupported ? (
                <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
                  <span className="bg-background text-muted-foreground relative z-10 px-2">
                    Or
                  </span>
                </div>
              ) : null}

              <div className="space-y-2">
                {socialProviders.map((providerId) => {
                  const config = providerConfig[providerId];
                  if (!config) {
                    return null;
                  }

                  const { Icon, label } = config;
                  return (
                    <Button
                      key={providerId}
                      variant="outline"
                      className="w-full"
                      type="button"
                      disabled={isLoading || form.state.isSubmitting}
                      onClick={() =>
                        auth.signInWithOAuth(
                          {
                            provider: providerId,
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
                      <Icon />
                      Login with {label}
                    </Button>
                  );
                })}

                {passkeySupported && (
                  <Button
                    variant="outline"
                    className="w-full"
                    type="button"
                    disabled={isLoading || form.state.isSubmitting || !isHydrated}
                    onClick={handlePasskeySignIn}
                  >
                    <PasskeyIcon className="mr-2 h-4 w-4" />
                    Sign in with a passkey
                  </Button>
                )}
              </div>
            </>
          )}

          {/* Passkey option shown in credentials step if user has passkeys */}
          {loginStep === "credentials" && userHasPasskeys && passkeySupported && (
            <Button
              variant="outline"
              className="w-full"
              type="button"
              disabled={isLoading || form.state.isSubmitting}
              onClick={handlePasskeySignIn}
            >
              <PasskeyIcon className="mr-2 h-4 w-4" />
              Use passkey instead
            </Button>
          )}
        </div>
      </form>

      <div className="text-center text-sm">
        Don&apos;t have an account?{" "}
        <Link to={signupHref} className="underline underline-offset-4">
          Sign up
        </Link>
      </div>
    </div>
  );
}

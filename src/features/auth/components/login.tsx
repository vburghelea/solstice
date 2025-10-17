import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { FormSubmitButton } from "~/components/form-fields/FormSubmitButton";
import { ValidatedInput } from "~/components/form-fields/ValidatedInput";
import { Button } from "~/components/ui/button";
import { GoogleIcon, LogoIcon } from "~/components/ui/icons";
import { SafeLink as Link } from "~/components/ui/SafeLink";
import { useAuthTranslation, useCommonTranslation } from "~/hooks/useTypedTranslation";
import { auth } from "~/lib/auth-client";
import { useAppForm } from "~/lib/hooks/useAppForm";
import { loginFormSchema } from "../auth.schemas";

type LoginFormProps = {
  redirectPath?: string | undefined;
};

export default function LoginForm(props?: LoginFormProps) {
  const { t: authT } = useAuthTranslation();
  const { t: commonT } = useCommonTranslation();
  const queryClient = useQueryClient();
  const router = useRouter();
  const navigate = useNavigate();

  const navigateTo = async (path: string): Promise<void> => {
    await navigate({ to: path } as never);
  };

  const safeRedirectPath = props?.redirectPath?.startsWith("/")
    ? props.redirectPath
    : "/player";

  const [isHydrated, setIsHydrated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

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
          throw new Error(
            result.error.message || authT("login.errors.invalid_credentials"),
          );
        }

        // Success path
        await queryClient.invalidateQueries({ queryKey: ["user"] });
        await router.invalidate();
        await navigateTo(safeRedirectPath);
      } catch (error) {
        // Error handling
        setErrorMessage(
          (error as Error)?.message || authT("login.errors.invalid_credentials"),
        );
        // Keep form values but reset submitting state by resetting with current values
        form.reset(value);
      } finally {
        // Always reset loading state
        setIsLoading(false);
      }
    },
  });

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
              <span className="sr-only">{authT("brand_name")}</span>
            </a>
            <h1 className="text-xl font-bold">{authT("login.welcome_back")}</h1>
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
                      return (
                        error.errors?.[0]?.message || commonT("validation.invalid_email")
                      );
                    }
                    return commonT("validation.invalid_email");
                  }
                },
              }}
            >
              {(field) => (
                <ValidatedInput
                  field={field}
                  label={commonT("labels.email")}
                  type="email"
                  placeholder={commonT("placeholders.email")}
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
                      return (
                        error.errors?.[0]?.message ||
                        commonT("validation.password_required")
                      );
                    }
                    return commonT("validation.password_required");
                  }
                },
              }}
            >
              {(field) => (
                <ValidatedInput
                  field={field}
                  label={commonT("labels.password")}
                  type="password"
                  placeholder={commonT("placeholders.password")}
                  autoComplete="current-password"
                />
              )}
            </form.Field>
            <div className="text-right text-sm">
              <Link to="/auth/forgot-password" className="underline underline-offset-4">
                {authT("buttons.forgot_password")}
              </Link>
            </div>
            <FormSubmitButton
              isSubmitting={form.state.isSubmitting || isLoading}
              className="mt-2 w-full"
              size="lg"
              loadingText={authT("buttons.logging_in")}
            >
              {authT("buttons.login")}
            </FormSubmitButton>
          </div>
          {errorMessage && (
            <span className="text-destructive text-center text-sm">{errorMessage}</span>
          )}
          <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
            <span className="bg-background text-muted-foreground relative z-10 px-2">
              {authT("login.oauth.or_continue_with")}
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
                    setErrorMessage(
                      ctx.error?.message || authT("login.errors.oauth_failed"),
                    );
                  },
                },
              )
            }
          >
            <GoogleIcon />
            {authT("login.oauth.login_with_google")}
          </Button>
          <Button
            variant="outline"
            className="w-full"
            type="button"
            disabled={isLoading || form.state.isSubmitting}
            onClick={() =>
              auth.signInWithOAuth(
                {
                  provider: "discord",
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
                    setErrorMessage(
                      ctx.error?.message || authT("login.errors.oauth_failed"),
                    );
                  },
                },
              )
            }
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-discord mr-2 h-4 w-4"
            >
              <path d="M10.5 11.5c-.98-.98-2.52-.98-3.5 0-.98.98-.98 2.52 0 3.5.98.98 2.52.98 3.5 0 .98-.98.98-2.52 0-3.5Z" />
              <path d="M17 11.5c-.98-.98-2.52-.98-3.5 0-.98.98-.98 2.52 0 3.5.98.98 2.52.98 3.5 0 .98-.98.98-2.52 0-3.5Z" />
              <path d="M8 17.5s1.5 2 4 2 4-2 4-2" />
              <path d="M19.5 10c.98-.98.98-2.52 0-3.5-.98-.98-2.52-.98-3.5 0-.98.98-.98 2.52 0 3.5.98.98 2.52.98 3.5 0Z" />
              <path d="M4.5 10c.98-.98.98-2.52 0-3.5-.98-.98-2.52-.98-3.5 0-.98.98-.98 2.52 0 3.5.98.98 2.52.98 3.5 0Z" />
              <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10Z" />
            </svg>
            {authT("login.oauth.login_with_discord")}
          </Button>
        </div>
      </form>

      <div className="text-center text-sm">
        {authT("login.buttons.no_account")}{" "}
        <Link to="/auth/signup" className="underline underline-offset-4">
          {authT("login.buttons.sign_up")}
        </Link>
      </div>
    </div>
  );
}

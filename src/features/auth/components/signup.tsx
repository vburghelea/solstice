import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useRouteContext } from "@tanstack/react-router";
import { useState } from "react";
import { auth } from "~/lib/auth-client";
import { Button } from "~/shared/ui/button";
import { GitHubIcon, GoogleIcon, LoaderIcon, LogoIcon } from "~/shared/ui/icons";
import { Input } from "~/shared/ui/input";
import { Label } from "~/shared/ui/label";

export default function SignupForm() {
  const { redirectUrl } = useRouteContext({ from: "/(auth)/signup" });
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isLoading) return;

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirm_password") as string;

    if (!name || !email || !password || !confirmPassword) return;

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    auth.signUp.email(
      {
        name,
        email,
        password,
        callbackURL: redirectUrl,
      },
      {
        onError: (ctx) => {
          setErrorMessage(ctx.error.message);
          setIsLoading(false);
        },
        onSuccess: async () => {
          await queryClient.invalidateQueries({ queryKey: ["user"] });
          navigate({ to: redirectUrl });
        },
      },
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-2">
            <a href="#" className="flex flex-col items-center gap-2 font-medium">
              <div className="flex h-8 w-8 items-center justify-center rounded-md">
                <LogoIcon className="size-6" />
              </div>
              <span className="sr-only">Acme Inc.</span>
            </a>
            <h1 className="text-xl font-bold">Sign up for Acme Inc.</h1>
          </div>
          <div className="flex flex-col gap-5">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="John Doe"
                readOnly={isLoading}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="hello@example.com"
                readOnly={isLoading}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Password"
                readOnly={isLoading}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirm_password">Confirm Password</Label>
              <Input
                id="confirm_password"
                name="confirm_password"
                type="password"
                placeholder="Confirm Password"
                readOnly={isLoading}
                required
              />
            </div>
            <Button type="submit" className="mt-2 w-full" size="lg" disabled={isLoading}>
              {isLoading && <LoaderIcon className="animate-spin" />}
              {isLoading ? "Signing up..." : "Sign up"}
            </Button>
          </div>
          {errorMessage && (
            <span className="text-destructive text-center text-sm">{errorMessage}</span>
          )}
          <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
            <span className="bg-background text-muted-foreground relative z-10 px-2">
              Or
            </span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Button
              variant="outline"
              className="w-full"
              type="button"
              disabled={isLoading}
              onClick={() =>
                auth.signInWithOAuth(
                  {
                    provider: "github",
                    callbackURL: redirectUrl,
                  },
                  {
                    onRequest: () => {
                      setIsLoading(true);
                      setErrorMessage("");
                    },
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    onError: (ctx: any) => {
                      setIsLoading(false);
                      setErrorMessage(ctx.error?.message || "OAuth signup failed");
                    },
                  },
                )
              }
            >
              <GitHubIcon />
              Sign up with GitHub
            </Button>
            <Button
              variant="outline"
              className="w-full"
              type="button"
              disabled={isLoading}
              onClick={() =>
                auth.signInWithOAuth(
                  {
                    provider: "google",
                    callbackURL: redirectUrl,
                  },
                  {
                    onRequest: () => {
                      setIsLoading(true);
                      setErrorMessage("");
                    },
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    onError: (ctx: any) => {
                      setIsLoading(false);
                      setErrorMessage(ctx.error?.message || "OAuth signup failed");
                    },
                  },
                )
              }
            >
              <GoogleIcon />
              Sign up with Google
            </Button>
          </div>
        </div>
      </form>

      <div className="text-center text-sm">
        Already have an account?{" "}
        <Link to="/login" className="underline underline-offset-4">
          Login
        </Link>
      </div>
    </div>
  );
}

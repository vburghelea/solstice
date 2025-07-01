import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useRouteContext } from "@tanstack/react-router";
import React, { useEffect, useState } from "react";
import { auth } from "~/lib/auth-client";
import { Button } from "~/shared/ui/button";
import { GitHubIcon, LoaderIcon, LogoIcon } from "~/shared/ui/icons";
import { Input } from "~/shared/ui/input";
import { Label } from "~/shared/ui/label";

export default function LoginForm() {
  const { redirectUrl } = useRouteContext({ from: "/(auth)/login" });
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [debugInfo, setDebugInfo] = useState("");

  // Debug: Verify component is mounting
  console.log("LoginForm component mounted");
  console.log("Environment:", { baseUrl: import.meta.env["VITE_BASE_URL"] });

  // Show debug info on screen
  useEffect(() => {
    setDebugInfo(`Component mounted. Base URL: ${import.meta.env["VITE_BASE_URL"]}`);

    // Test if JavaScript is running in browser
    const testButton = document.createElement("button");
    testButton.textContent = "Direct DOM Test Button";
    testButton.style.cssText =
      "position: fixed; top: 10px; right: 10px; z-index: 9999; background: red; color: white; padding: 10px;";
    testButton.addEventListener("click", () => {
      alert("Direct DOM button clicked!");
      console.log("Direct DOM click worked");
    });
    document.body.appendChild(testButton);

    // Also test inline onclick
    const inlineButton = document.createElement("button");
    inlineButton.textContent = "Inline onclick test";
    inlineButton.style.cssText =
      "position: fixed; top: 60px; right: 10px; z-index: 9999; background: green; color: white; padding: 10px;";
    inlineButton.onclick = () => alert("Inline onclick worked!");
    document.body.appendChild(inlineButton);

    return () => {
      testButton.remove();
      inlineButton.remove();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email || !password) {
      setErrorMessage("Please fill in all fields");
      setIsLoading(false);
      return;
    }

    try {
      await auth.signIn.email(
        {
          email,
          password,
          callbackURL: redirectUrl,
        },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["user"] });
            navigate({ to: redirectUrl });
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onError: (ctx: any) => {
            setErrorMessage(ctx.error?.message || "Login failed");
            setIsLoading(false);
          },
        },
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      setErrorMessage(error.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
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
            <h1 className="text-xl font-bold">Welcome back to Acme Inc.</h1>
          </div>
          <div className="flex flex-col gap-5">
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
                placeholder="Enter password here"
                readOnly={isLoading}
                required
              />
            </div>
            <Button type="submit" className="mt-2 w-full" size="lg" disabled={isLoading}>
              {isLoading && <LoaderIcon className="animate-spin" />}
              {isLoading ? "Logging in..." : "Login"}
            </Button>
          </div>
          {errorMessage && (
            <span className="text-destructive text-center text-sm">{errorMessage}</span>
          )}
          {debugInfo && (
            <div className="rounded bg-yellow-100 p-2 text-center text-sm">
              DEBUG: {debugInfo}
            </div>
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
              onClick={() => {
                console.log("GitHub OAuth button clicked");
                console.log("Redirect URL:", redirectUrl);
                console.log("Base URL:", import.meta.env["VITE_BASE_URL"]);

                // Better Auth will handle the redirect automatically
                auth.signInWithOAuth({
                  provider: "github",
                  callbackURL: redirectUrl,
                });
              }}
            >
              <GitHubIcon />
              Login with GitHub
            </Button>
            <button
              className="w-full rounded border bg-blue-500 p-2 text-white"
              type="button"
              onClick={() => alert("TEST: Button clicked!")}
            >
              TEST: Click me
            </button>
          </div>
        </div>
      </form>

      <div className="text-center text-sm">
        Don&apos;t have an account?{" "}
        <Link to="/signup" className="underline underline-offset-4">
          Sign up
        </Link>
      </div>
    </div>
  );
}

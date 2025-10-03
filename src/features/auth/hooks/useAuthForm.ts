import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { useState } from "react";

interface UseAuthFormOptions {
  redirectUrl?: string;
}

/**
 * Custom hook for handling authentication form state and navigation
 * Reduces repetitive code in login and signup components
 *
 * @example
 * const { isLoading, errorMessage, handleAuth } = useAuthForm();
 *
 * const onSubmit = async (e) => {
 *   await handleAuth(async () => {
 *     // Your auth logic here
 *   });
 * };
 */
export function useAuthForm(options: UseAuthFormOptions = {}) {
  const { redirectUrl = "/dashboard" } = options;
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const queryClient = useQueryClient();
  const router = useRouter();
  const navigate = useNavigate();
  const navigateTo = async (path: string): Promise<void> => {
    await navigate({ to: path } as never);
  };

  const handleAuth = async (
    authFunction: () => Promise<void>,
    onError?: (error: unknown) => void,
  ) => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      await authFunction();
      // Success is handled by the auth function's onSuccess callback
    } catch (error) {
      const message = error instanceof Error ? error.message : "Authentication failed";
      setErrorMessage(message);
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthSuccess = async () => {
    queryClient.invalidateQueries({ queryKey: ["user"] });
    await router.invalidate();
    await navigateTo(redirectUrl);
  };

  const resetError = () => setErrorMessage("");

  return {
    isLoading,
    errorMessage,
    handleAuth,
    handleAuthSuccess,
    resetError,
    setErrorMessage,
    setIsLoading,
  };
}

import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { authQueryKey } from "../auth.queries";

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
  const navigate = useNavigate();
  const router = useRouter();

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
    queryClient.invalidateQueries({ queryKey: authQueryKey });
    await router.invalidate();
    navigate({ to: redirectUrl });
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

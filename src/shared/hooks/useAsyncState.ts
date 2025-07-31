import { useCallback, useState } from "react";

type AsyncState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; error: string };

/**
 * Custom hook for managing async state without contradictions
 * Ensures states like loading/error/success are mutually exclusive
 *
 * @example
 * const { state, execute, reset } = useAsyncState<UserData>();
 *
 * const handleSubmit = async () => {
 *   await execute(async () => {
 *     const data = await fetchUserData();
 *     return data;
 *   });
 * };
 *
 * if (state.status === 'loading') return <Spinner />;
 * if (state.status === 'error') return <Error message={state.error} />;
 * if (state.status === 'success') return <Success data={state.data} />;
 */
export function useAsyncState<T>() {
  const [state, setState] = useState<AsyncState<T>>({ status: "idle" });

  const execute = useCallback(async (asyncFunction: () => Promise<T>) => {
    setState({ status: "loading" });

    try {
      const data = await asyncFunction();
      setState({ status: "success", data });
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred";
      setState({ status: "error", error: errorMessage });
      throw error;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ status: "idle" });
  }, []);

  const setError = useCallback((error: string) => {
    setState({ status: "error", error });
  }, []);

  const setData = useCallback((data: T) => {
    setState({ status: "success", data });
  }, []);

  return {
    state,
    execute,
    reset,
    setError,
    setData,
    isIdle: state.status === "idle",
    isLoading: state.status === "loading",
    isSuccess: state.status === "success",
    isError: state.status === "error",
  };
}

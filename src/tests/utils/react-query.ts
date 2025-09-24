import * as rq from "@tanstack/react-query";
import { vi } from "vitest";

// Spies useMutation to execute mutationFn and invoke onSuccess with its result.
// Useful for route-level tests that rely on mutation side-effects (e.g., closing edit mode).
export function spyUseMutationRun() {
  return vi.spyOn(rq, "useMutation").mockImplementation(
    (
      opts: rq.UseMutationOptions<unknown, unknown, unknown, unknown>,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      _queryClient?: rq.QueryClient,
    ): rq.UseMutationResult<unknown, unknown, unknown, unknown> => {
      const fn = (opts?.mutationFn ?? (async () => undefined)) as (
        vars: unknown,
      ) => unknown | Promise<unknown>;
      const result: unknown = {
        mutate: async (variables: unknown) => {
          try {
            const result = await fn(variables);
            await opts?.onSuccess?.(
              result,
              variables,
              undefined,
              undefined as unknown as rq.MutationFunctionContext,
            );
            return result as unknown as void;
          } catch (err) {
            await opts?.onError?.(
              err,
              variables,
              undefined,
              undefined as unknown as rq.MutationFunctionContext,
            );
            throw err;
          }
        },
        mutateAsync: async (variables: unknown) => {
          try {
            const result = await fn(variables);
            await opts?.onSuccess?.(
              result,
              variables,
              undefined,
              undefined as unknown as rq.MutationFunctionContext,
            );
            return result as unknown as unknown;
          } catch (err) {
            await opts?.onError?.(
              err,
              variables,
              undefined,
              undefined as unknown as rq.MutationFunctionContext,
            );
            throw err;
          }
        },
        // minimal fields used by components/tests
        isPending: false,
        isSuccess: false,
        error: null,
        variables: undefined,
        context: undefined,
        data: undefined,
        failureCount: 0,
        failureReason: null,
        isError: false,
        isIdle: true,
        isPaused: false,
        reset: () => {},
        status: "idle",
        submittedAt: 0,
        internal: {} as unknown,
      };
      return result as rq.UseMutationResult<unknown, unknown, unknown, unknown>;
    },
  );
}

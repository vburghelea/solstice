import { z } from "zod";

// Most server functions return data directly (response: 'data' is default)
// This helper is only needed if you're using response: 'full' or 'raw'
export async function unwrapServerFnResult<T>(
  result: Promise<T> | Promise<Response> | Promise<any>,
): Promise<T> {
  const resolved = await result;

  if (resolved instanceof Response) {
    return (await resolved.json()) as T;
  }

  if (resolved && typeof resolved === "object" && "fetcher" in resolved && "data" in resolved) {
    return (resolved as { data: T }).data;
  }

  return resolved as T;
}

// Simple helper to maintain consistency in calling server functions
// This just adds the { data: ... } wrapper that TanStack expects
export const callServerFn = <TData, TResult>(
  fn: (options: { data: TData }) => Promise<TResult>,
  data: TData
): Promise<TResult> => {
  return fn({ data });
};

// Typed Zod adapter - but note: you can pass schemas directly to .validator()
export const zod$ = <T extends z.ZodTypeAny>(schema: T) =>
  (input: unknown) => schema.parse(input) as z.infer<T>;

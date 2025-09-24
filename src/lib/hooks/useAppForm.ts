import { useForm } from "@tanstack/react-form";

/**
 * Custom hook that wraps TanStack Form's useForm with sensible defaults
 *
 * @example
 * ```tsx
 * const form = useAppForm({
 *   defaultValues: { email: "", password: "" },
 *   onSubmit: async ({ value }) => {
 *     await login(value);
 *   },
 * });
 * ```
 */
export function useAppForm<TFormData>(options: {
  defaultValues: TFormData;
  onSubmit: (props: { value: TFormData }) => void | Promise<void>;
}) {
  return useForm({
    ...options,
  });
}

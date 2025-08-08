export type OperationResult<T> =
  | { success: true; data: T }
  | { success: false; errors: { code: string; message: string; field?: string }[] };

import { z } from "zod";

export const ServerErrorSchema = z.object({
  code: z.enum(["UNAUTHORIZED", "FORBIDDEN", "NOT_FOUND", "VALIDATION", "INTERNAL"]),
  message: z.string(),
  details: z.record(z.unknown()).optional(),
});

export type ServerError = z.infer<typeof ServerErrorSchema>;

export class TypedServerError extends Error {
  public readonly error: ServerError;

  constructor(error: ServerError) {
    super(error.message);
    this.name = "TypedServerError";
    this.error = error;
  }
}

const createError = (code: ServerError["code"], message: string, details?: ServerError["details"]) =>
  new TypedServerError({ code, message, ...(details ? { details } : {}) });

export const unauthorized = (message = "Unauthorized") => createError("UNAUTHORIZED", message);
export const forbidden = (message = "Forbidden") => createError("FORBIDDEN", message);
export const notFound = (message = "Resource not found") => createError("NOT_FOUND", message);
export const validationError = (message: string, details?: ServerError["details"]) =>
  createError("VALIDATION", message, details);
export const internalError = (message = "Internal server error") => createError("INTERNAL", message);

export const isTypedServerError = (error: unknown): error is TypedServerError =>
  error instanceof TypedServerError;

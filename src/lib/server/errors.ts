import { z } from "zod";

export const ServerErrorSchema = z.object({
  code: z.enum([
    "UNAUTHORIZED",
    "FORBIDDEN",
    "NOT_FOUND",
    "BAD_REQUEST",
    "VALIDATION",
    "RATE_LIMITED",
    "INTERNAL",
  ]),
  message: z.string(),
  details: z.record(z.string(), z.unknown()).optional(),
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

const createError = (
  code: ServerError["code"],
  message: string,
  details?: ServerError["details"],
) => new TypedServerError({ code, message, ...(details ? { details } : {}) });

export const unauthorized = (
  message = "Unauthorized",
  details?: ServerError["details"],
) => createError("UNAUTHORIZED", message, details);
export const forbidden = (message = "Forbidden", details?: ServerError["details"]) =>
  createError("FORBIDDEN", message, details);
export const notFound = (message = "Resource not found") =>
  createError("NOT_FOUND", message);
export const badRequest = (message = "Bad request") =>
  createError("BAD_REQUEST", message);
export const validationError = (message: string, details?: ServerError["details"]) =>
  createError("VALIDATION", message, details);
export const rateLimited = (
  message = "Too many requests",
  details?: ServerError["details"],
) => createError("RATE_LIMITED", message, details);
export const internalError = (message = "Internal server error") =>
  createError("INTERNAL", message);

export const isTypedServerError = (error: unknown): error is TypedServerError =>
  error instanceof TypedServerError;

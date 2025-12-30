import { AnyFieldApi } from "@tanstack/react-form";
import React from "react";

// ---=== Helper Types ===---

// Base props for field components
export interface FieldComponentProps {
  field: AnyFieldApi;
  label: string;
  placeholder?: string;
  className?: string;
}

// Props for form submit button components
export interface FormSubmitButtonProps extends Omit<
  React.ComponentProps<"button">,
  "type" | "children"
> {
  children?: React.ReactNode;
}

// Type guard to check if an object is a FieldApi instance
export function isFieldApi(obj: unknown): obj is AnyFieldApi {
  if (typeof obj !== "object" || obj === null) return false;

  // Check for essential field properties from TanStack Form v5
  const hasState = "state" in obj;
  const hasHandleChange = "handleChange" in obj;
  const hasHandleBlur = "handleBlur" in obj;
  const hasForm = "form" in obj;
  const hasName = "name" in obj;

  return hasState && hasHandleChange && hasHandleBlur && hasForm && hasName;
}

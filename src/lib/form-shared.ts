import type { AnyFieldApi } from "@tanstack/react-form";
import type { ComponentProps, ReactNode } from "react";

export interface FieldComponentProps {
  field: AnyFieldApi;
  label: string;
  placeholder?: string;
  className?: string;
}

export interface FormSubmitButtonProps
  extends Omit<ComponentProps<"button">, "type" | "children"> {
  children?: ReactNode;
}

export function isFieldApi(obj: unknown): obj is AnyFieldApi {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "getValue" in obj &&
    "setValue" in obj &&
    "name" in obj &&
    "getMeta" in obj
  );
}

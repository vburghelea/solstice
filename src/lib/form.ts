import { AnyFieldApi } from "@tanstack/react-form";
import React from "react";

// Import the actual component implementations

import { FormSubmitButton as ImportedFormSubmitButton } from "../components/form-fields/FormSubmitButton";

// Forward declare component types to avoid circular dependencies
// We will define these components in other files and import them below.
// It's important that the types match the actual components.

type FormSubmitButtonComponent = React.FC<FormSubmitButtonProps>;

// Define contexts for the form and fields
// Call without generics first
export const { formContext, fieldContext } = createFormHookContexts();

// Re-export the provider and hooks for convenience if needed elsewhere,
// but the main interaction is via createFormHook below.
// export const FormProvider = formContext.Provider; // Example if needed
// export const useFormContext = () => React.useContext(formContext);
// export const FieldProvider = fieldContext.Provider; // Example if needed
// export const useFieldContext = () => React.useContext(fieldContext);

// Create the custom form hook
// We configure it once here with our reusable components
// We also get AppField and AppForm components bound to our contexts
export const { useAppForm } = createFormHook({
  // Provide the ACTUAL context objects
  formContext: formContext,
  fieldContext: fieldContext,
  // Register reusable field components

  // Register reusable form-level components
  formComponents: {
    // Register the imported button
    SubmitButton: ImportedFormSubmitButton,
  } as {
    // Explicitly type the components map
    SubmitButton: FormSubmitButtonComponent;
    // Add other form components here
  },
  fieldComponents: {},
});

// ---=== Helper Types ===---

// Base props for field components
export interface FieldComponentProps {
  field: AnyFieldApi;
  label: string;
  placeholder?: string;
  className?: string;
}

// Props for form submit button components
export interface FormSubmitButtonProps
  extends Omit<React.ComponentProps<"button">, "type" | "children"> {
  children?: React.ReactNode;
}

// Type guard to check if an object is a FieldApi instance
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

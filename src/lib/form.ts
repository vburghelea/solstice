import {
  AnyFieldApi,
  createFormHook,
  createFormHookContexts,
} from "@tanstack/react-form";
import React from "react";

// Import the actual component implementations
import { FormSubmitButton as ImportedFormSubmitButton } from "../components/form-fields/FormSubmitButton";
import { ValidatedInput as ImportedValidatedInput } from "../components/form-fields/ValidatedInput";

// Forward declare component types to avoid circular dependencies
// We will define these components in other files and import them below.
// It's important that the types match the actual components.
type ValidatedInputComponent = React.FC<FieldComponentProps<string>>; // Assuming Input handles string
// Add other field component types here (e.g., ValidatedSelectComponent)
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
  fieldComponents: {
    // Register the imported component
    ValidatedInput: ImportedValidatedInput,
  } as {
    // Explicitly type the components map with the actual component types
    ValidatedInput: ValidatedInputComponent;
    // Add other components here
  },
  // Register reusable form-level components
  formComponents: {
    // Register the imported button
    SubmitButton: ImportedFormSubmitButton,
  } as {
    // Explicitly type the components map
    SubmitButton: FormSubmitButtonComponent;
    // Add other form components here
  },
});

// ---=== Helper Types ===---

// Base props for field components registered in `fieldComponents`
// They receive the `field` API automatically.
export interface FieldComponentProps {
  // Use AnyFieldApi for simpler typing
  field: AnyFieldApi;
  label: string;
  // Add other common props like placeholder, className, etc.
  placeholder?: string;
  className?: string;
  // We might need to pass the specific field type if AnyFieldApi is too broad
  // For now, let's keep it simple
}

// Props for components registered in `formComponents`
// They typically don't receive a 'field' prop directly but can use `useFormContext`
export interface FormSubmitButtonProps
  extends Omit<React.ComponentProps<"button">, "type" | "children"> {
  // Allow custom children, default to "Submit"
  children?: React.ReactNode;
  // Add any other specific props needed for the submit button
}

// Type guard to check if an object is a FieldApi instance
// Use AnyFieldApi here too for consistency
export function isFieldApi(obj: unknown): obj is AnyFieldApi {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "getValue" in obj &&
    "setValue" in obj &&
    "getName" in obj &&
    "getMeta" in obj
  );
}

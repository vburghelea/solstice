import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import React from "react";
import type { FieldComponentProps, FormSubmitButtonProps } from "./form-shared";

// Import the actual component implementations

import { FormSubmitButton as ImportedFormSubmitButton } from "../components/form-fields/FormSubmitButton";
import { ValidatedCheckbox as ImportedValidatedCheckbox } from "../components/form-fields/ValidatedCheckbox";
import { ValidatedDatePicker as ImportedValidatedDatePicker } from "../components/form-fields/ValidatedDatePicker";
import { ValidatedInput as ImportedValidatedInput } from "../components/form-fields/ValidatedInput";
import { ValidatedSelect as ImportedValidatedSelect } from "../components/form-fields/ValidatedSelect";

// Forward declare component types to avoid circular dependencies
// We will define these components in other files and import them below.
// It's important that the types match the actual components.

type ValidatedInputComponent = React.FC<FieldComponentProps>;
type ValidatedSelectComponent = React.FC<
  FieldComponentProps & {
    options: Array<{ value: string; label: string }>;
    placeholderText?: string;
  }
>;
type ValidatedDatePickerComponent = React.FC<FieldComponentProps>;
type ValidatedCheckboxComponent = React.FC<FieldComponentProps>;
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
    ValidatedSelect: ImportedValidatedSelect,
    ValidatedDatePicker: ImportedValidatedDatePicker,
    ValidatedCheckbox: ImportedValidatedCheckbox,
  } as {
    // Explicitly type the components map with the actual component types
    ValidatedInput: ValidatedInputComponent;
    ValidatedSelect: ValidatedSelectComponent;
    ValidatedDatePicker: ValidatedDatePickerComponent;
    ValidatedCheckbox: ValidatedCheckboxComponent;
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

export { isFieldApi } from "./form-shared";
export type { FieldComponentProps, FormSubmitButtonProps } from "./form-shared";

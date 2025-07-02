import React from "react";
import { Button } from "~/lib/components/ui/button"; // Use alias
import {
  formContext, // Import the context object itself
  FormSubmitButtonProps,
} from "~/lib/form"; // Use alias
import { cn } from "~/lib/utils"; // Use alias

export const FormSubmitButton: React.FC<FormSubmitButtonProps> = ({
  children,
  className,
  ...rest // Pass rest of props like variant, size etc. to Button
}) => {
  // Use the form context via useContext
  const form = React.use(formContext);

  // Check if form context exists (it should within AppForm)
  if (!form) {
    // This should ideally not happen if used within AppForm
    console.error(
      "FormSubmitButton must be used within a FormProvider (implicitly via AppForm)",
    );
    // Render a disabled button or null as fallback
    return (
      <Button type="submit" disabled className={cn(className)} {...rest}>
        {children ?? "Submit"}
      </Button>
    );
  }

  // Determine if the button should be disabled
  const isDisabled = form.state.isSubmitting || !form.state.canSubmit;

  return (
    <Button
      type="submit"
      disabled={isDisabled}
      className={cn(className)} // Allow overriding styles
      {...rest}
    >
      {form.state.isSubmitting ? "Submitting..." : (children ?? "Submit")}
    </Button>
  );
};

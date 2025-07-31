import React from "react";
import { Button } from "~/components/ui/button";
import { Loader2 } from "~/components/ui/icons";
import { cn } from "~/shared/lib/utils";

interface FormSubmitButtonProps extends React.ComponentProps<typeof Button> {
  isSubmitting?: boolean;
  loadingText?: string;
}

export const FormSubmitButton: React.FC<FormSubmitButtonProps> = ({
  isSubmitting = false,
  loadingText,
  children,
  disabled,
  className,
  ...props
}) => {
  return (
    <Button
      type="submit"
      disabled={disabled || isSubmitting}
      className={cn(className)}
      {...props}
    >
      {isSubmitting ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {loadingText || "Loading..."}
        </>
      ) : (
        children
      )}
    </Button>
  );
};

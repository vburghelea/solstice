import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FormSubmitButton } from "~/components/form-fields/FormSubmitButton";
import { ValidatedFileUpload } from "~/components/form-fields/ValidatedFileUpload";
import { ValidatedPhoneInput } from "~/components/form-fields/ValidatedPhoneInput";
import { useAppForm } from "~/lib/hooks/useAppForm";

function PhoneForm() {
  const form = useAppForm({
    defaultValues: { phone: "" },
    onSubmit: () => undefined,
  });

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      <form.Field name="phone">
        {(field) => (
          <div className="space-y-2">
            <ValidatedPhoneInput
              field={field}
              label="Phone"
              placeholder="(555) 123-4567"
            />
            <div data-testid="raw-value">
              {String(field.form.state.values.phone ?? "")}
            </div>
          </div>
        )}
      </form.Field>
      <FormSubmitButton isSubmitting={false}>Submit</FormSubmitButton>
    </form>
  );
}

function FileForm() {
  const form = useAppForm({
    defaultValues: { logo: null as File | null },
    onSubmit: () => undefined,
  });

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      <form.Field name="logo">
        {(field) => (
          <div className="space-y-2">
            <ValidatedFileUpload
              field={field}
              label="Team logo"
              accept="image/png"
              maxSizeMb={1}
              description="Upload a PNG under 1MB"
            />
            <div data-testid="file-value">
              {(() => {
                const value = field.form.state.values.logo;
                if (value instanceof File) return value.name;
                if (typeof value === "string") return value;
                return "";
              })()}
            </div>
          </div>
        )}
      </form.Field>
    </form>
  );
}

const originalCreateObjectURL = URL.createObjectURL;
const originalRevokeObjectURL = URL.revokeObjectURL;

describe("form field components", () => {
  beforeEach(() => {
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      writable: true,
      value: vi.fn(() => "blob:preview"),
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      writable: true,
      value: vi.fn(),
    });
  });

  afterEach(() => {
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      writable: true,
      value: originalCreateObjectURL,
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      writable: true,
      value: originalRevokeObjectURL,
    });
  });

  it("formats phone numbers while storing canonical value", async () => {
    render(<PhoneForm />);
    const input = screen.getByLabelText(/phone/i) as HTMLInputElement;
    const user = userEvent.setup();

    await user.type(input, "6045551234");

    expect(input.value).toBe("(604) 555-1234");
    expect(screen.getByTestId("raw-value").textContent).toBe("+16045551234");

    await user.clear(input);
    expect(screen.getByTestId("raw-value").textContent).toBe("");
  });

  it("prevents files larger than the limit and shows an error", async () => {
    render(<FileForm />);
    const input = screen.getByLabelText(/team logo/i) as HTMLInputElement;
    const user = userEvent.setup();

    const oversized = new File([new Uint8Array(2 * 1024 * 1024)], "huge.png", {
      type: "image/png",
    });

    await user.upload(input, oversized);

    expect(screen.getByText(/maximum size is 1MB/i)).toBeInTheDocument();
    expect(screen.getByTestId("file-value").textContent).toBe("");

    const validFile = new File([new Uint8Array(200_000)], "logo.png", {
      type: "image/png",
    });
    await user.upload(input, validFile);

    expect(screen.queryByText(/maximum size is 1MB/i)).not.toBeInTheDocument();
    expect(screen.getByTestId("file-value").textContent).toBe("logo.png");
  });
});

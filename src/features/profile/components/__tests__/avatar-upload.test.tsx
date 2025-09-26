import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import { vi } from "vitest";
import { spyUseMutationRun } from "~/tests/utils/react-query";

// Mock the aliased mutations import used by the component
vi.mock("~/features/profile/profile.mutations", () => ({
  uploadAvatar: vi.fn(async () => ({ success: true })),
  removeUploadedAvatar: vi.fn(async () => ({ success: true })),
}));

describe("AvatarUpload", () => {
  let mutationSpy: ReturnType<typeof spyUseMutationRun>;

  beforeEach(() => {
    mutationSpy = spyUseMutationRun();
  });

  afterEach(() => {
    mutationSpy.mockRestore();
  });

  it("shows 'Use provider avatar' only when uploaded avatar exists and triggers removal", async () => {
    const { AvatarUpload } = await import("../avatar-upload");
    const { removeUploadedAvatar } = await import("~/features/profile/profile.mutations");
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    const { rerender } = render(
      <QueryClientProvider client={qc}>
        <AvatarUpload
          name="Test User"
          email="test@example.com"
          image="https://example.com/p.png"
          uploadedAvatarPath={null}
        />
      </QueryClientProvider>,
    );

    expect(screen.queryByText(/Use provider avatar/i)).not.toBeInTheDocument();

    rerender(
      <QueryClientProvider client={qc}>
        <AvatarUpload
          name="Test User"
          email="test@example.com"
          image="https://example.com/p.png"
          uploadedAvatarPath="/api/avatars/test.webp"
        />
      </QueryClientProvider>,
    );

    const revertBtn = await screen.findByRole("button", {
      name: /Use provider avatar/i,
    });
    fireEvent.click(revertBtn);

    await waitFor(() => {
      expect(removeUploadedAvatar).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Reverted to provider avatar");
    });
  });

  it("clicking 'Upload avatar' triggers hidden file input click", async () => {
    const { AvatarUpload } = await import("../avatar-upload");
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { container } = render(
      <QueryClientProvider client={qc}>
        <AvatarUpload
          name="X"
          email="x@example.com"
          image={null}
          uploadedAvatarPath={null}
        />
      </QueryClientProvider>,
    );
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const clickSpy = vi.spyOn(input, "click");

    const button = screen.getByRole("button", { name: /upload avatar/i });
    fireEvent.click(button);
    expect(clickSpy).toHaveBeenCalled();
  });
});

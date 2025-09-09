import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { toast } from "sonner";
import { vi } from "vitest";

// Mock the aliased mutations import used by the component
vi.mock("~/features/profile/profile.mutations", () => ({
  uploadAvatar: vi.fn(async () => ({ success: true })),
  removeUploadedAvatar: vi.fn(async () => ({ success: true })),
}));

describe("AvatarUpload", () => {
  it.skip("shows 'Use provider avatar' only when uploaded avatar exists and triggers removal", async () => {
    const { AvatarUpload } = await import("../avatar-upload");
    // Ensure our mocked useMutation actually invokes the mutationFn
    const rq = await import("@tanstack/react-query");
    /* eslint-disable @typescript-eslint/no-explicit-any */
    (rq as any).useMutation.mockImplementation(
      (
        /* eslint-disable @typescript-eslint/no-explicit-any */
        opts: any,
      ) => ({
        mutate: async (variables: unknown) => {
          const res = await opts.mutationFn?.(variables);
          await opts.onSuccess?.(res, variables, undefined);
        },
        mutateAsync: async (variables: unknown) => {
          const res = await opts.mutationFn?.(variables);
          await opts.onSuccess?.(res, variables, undefined);
          return res;
        },
        isPending: false,
        isSuccess: false,
        error: null,
      }),
    );
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    // Alternatively, assert on success toast (mutation executed)

    const { rerender } = render(
      <QueryClientProvider client={qc}>
        <AvatarUpload
          name="Test User"
          email="test@example.com"
          image={"https://example.com/p.png"}
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
          image={"https://example.com/p.png"}
          uploadedAvatarPath={"/api/avatars/test.webp"}
        />
      </QueryClientProvider>,
    );
    const revertBtn = await screen.findByText(/Use provider avatar/i);
    fireEvent.click(revertBtn);
    // Mutation runs synchronously in our override above
    expect(
      (toast.success as any).mock.calls.some((args: any[]) =>
        String(args?.[0]).includes("Reverted to provider avatar"),
      ),
    ).toBe(true);
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

import {
  ErrorComponent,
  type ErrorComponentProps,
  rootRouteId,
  useMatch,
  useRouter,
} from "@tanstack/react-router";
import { AlertCircle } from "lucide-react";
import { Button } from "~/components/ui/button";

export function DefaultCatchBoundary({ error }: Readonly<ErrorComponentProps>) {
  const router = useRouter();
  const isRoot = useMatch({
    strict: false,
    select: (state) => state.id === rootRouteId,
  });

  console.error(error);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center bg-gray-50 px-6 py-16 text-center">
      <div className="text-brand-red flex items-center gap-2">
        <AlertCircle className="h-5 w-5" />
        <span className="text-xs font-semibold tracking-[0.3em] uppercase">
          Something went wrong
        </span>
      </div>
      <h1 className="mt-4 text-2xl font-bold text-gray-900 sm:text-3xl">
        We hit a bludger while loading this view
      </h1>
      <p className="mt-3 max-w-xl text-sm text-gray-600 sm:text-base">
        {error.message ||
          "An unexpected error occurred. Try again in a moment or return to the previous page."}
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button
          type="button"
          className="btn-brand-primary"
          onClick={() => {
            router.invalidate();
          }}
        >
          Retry
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            if (isRoot) {
              router.navigate({ to: "/" });
            } else {
              window.history.back();
            }
          }}
          className="border-brand-red text-brand-red hover:bg-brand-red/10"
        >
          {isRoot ? "Go to homepage" : "Go back"}
        </Button>
        <Button asChild variant="ghost" className="text-sm">
          <a href="/resources#safe-sport">Visit resources</a>
        </Button>
      </div>
      <div className="mt-10 w-full max-w-xl rounded-2xl border border-gray-200 bg-white p-6 text-left text-sm text-gray-600 shadow-sm">
        <p className="font-semibold text-gray-900">Technical details</p>
        <ErrorComponent error={error} />
      </div>
    </div>
  );
}

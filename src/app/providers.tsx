import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";
import { StepUpProvider } from "~/features/auth/step-up";

interface ProvidersProps {
  readonly children: ReactNode;
  readonly queryClient?: QueryClient;
}

export function Providers({ children, queryClient }: ProvidersProps) {
  const [client] = useState(
    () =>
      queryClient ||
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            staleTime: 1000 * 60 * 5, // 5 minutes
            // Retry with exponential backoff to handle transient Lambda failures
            retry: 3,
            retryDelay: (attemptIndex) => Math.min(200 * 2 ** attemptIndex, 2000),
          },
          mutations: {
            // Fewer retries for mutations to avoid duplicate side effects
            retry: 2,
            retryDelay: (attemptIndex) => Math.min(200 * 2 ** attemptIndex, 1000),
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={client}>
      <StepUpProvider>{children}</StepUpProvider>
    </QueryClientProvider>
  );
}

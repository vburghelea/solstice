import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useEffect, useState } from "react";
import { initializePostHogClient } from "~/lib/analytics/posthog";

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
            staleTime: 1000 * 60 * 2, // 2 minutes
          },
        },
      }),
  );

  useEffect(() => {
    initializePostHogClient();
  }, []);

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

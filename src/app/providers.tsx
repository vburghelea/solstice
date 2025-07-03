import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";

interface ProvidersProps {
  readonly children: ReactNode;
  readonly queryClient?: QueryClient;
}

export function Providers({ children, queryClient }: ProvidersProps) {
  const client =
    queryClient ||
    new QueryClient({
      defaultOptions: {
        queries: {
          refetchOnWindowFocus: false,
          staleTime: 1000 * 60 * 2, // 2 minutes
        },
      },
    });

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

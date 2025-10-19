import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";
import { I18nextProvider } from "react-i18next";
import i18n from "~/lib/i18n/i18n";

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

  return (
    <QueryClientProvider client={client}>
      <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
    </QueryClientProvider>
  );
}

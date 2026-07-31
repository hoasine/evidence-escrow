"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { WalletProvider } from "@/lib/genlayer/WalletProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 2000,
            refetchOnWindowFocus: false,
            retry: 1,
            throwOnError: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <WalletProvider>{children}</WalletProvider>
      <Toaster
        position="top-right"
        theme="dark"
        richColors
        closeButton
        offset="88px"
        toastOptions={{
          style: {
            background: "oklch(0.17 0.016 215)",
            border: "1px solid oklch(0.32 0.02 215)",
            color: "oklch(0.96 0.008 210)",
          },
        }}
      />
    </QueryClientProvider>
  );
}

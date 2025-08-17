"use client";

import { ReactNode, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { getUrl, TRPCProvider } from "@/trpc/client";
import {
  httpBatchLink,
  splitLink,
  httpSubscriptionLink,
  createTRPCClient,
} from "@trpc/client";
import superjson from "superjson";
import { makeQueryClient } from "@/lib/query-client";
import { AppRouter } from "@/server/trpc/routers/_app";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "next-themes";
import ConvexClientProvider from "@/components/ConvexClientProvider";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { GlobalModals } from "@/components/modals";

let browserQueryClient: QueryClient | undefined = undefined;

function getQueryClient() {
  if (typeof window === "undefined") {
    return makeQueryClient();
  } else {
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}

export function CoreProviders({ children }: { children: ReactNode }) {
  const queryClient = getQueryClient();

  const [trpcClient] = useState(() =>
    createTRPCClient<AppRouter>({
      links: [
        splitLink({
          condition: (op) => op.type === "subscription",
          true: httpSubscriptionLink({
            transformer: superjson,
            url: getUrl(),
          }),
          false: httpBatchLink({
            transformer: superjson,
            url: getUrl(),
            headers() {
              return {
                "x-trpc-source": "client",
              };
            },
          }),
        }),
      ],
    }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        <NuqsAdapter>
          <ConvexClientProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              {children}
              <Toaster />
              <GlobalModals />
            </ThemeProvider>
          </ConvexClientProvider>
        </NuqsAdapter>
      </TRPCProvider>
    </QueryClientProvider>
  );
}

import "server-only";

import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { cache } from "react";
import { makeQueryClient } from "@/lib/query-client";
import { createContext } from "@/server/trpc/context";
import { createCallerFactory } from "@/server/trpc/init";
import { appRouter } from "@/server/trpc/routers/_app";

export const getQueryClient = cache(makeQueryClient);

export const trpcQueryOptions = createTRPCOptionsProxy({
  router: appRouter,
  queryClient: getQueryClient,
  ctx: createContext,
});

export const createCaller = createCallerFactory(appRouter);

export const trpcServerCaller = cache(async () => {
  const ctx = await createContext();
  return createCaller(ctx);
});

export function HydrateClient(props: { children: React.ReactNode }) {
  const queryClient = getQueryClient();
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {props.children}
    </HydrationBoundary>
  );
}

"use client";

import { useSearchParams } from "next/navigation";
import { useConvexAuth } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function Footer() {
  const searchParams = useSearchParams();

  const { isAuthenticated } = useConvexAuth();
  const { signOut } = useAuthActions();
  const router = useRouter();

  return (
    <footer className="text-md fixed bottom-20 right-4 z-20 flex w-min flex-col items-center justify-between font-medium text-primary sm:flex-row">
      <div className="mb-3 flex items-center justify-between space-x-3 sm:mb-0">
        {isAuthenticated ? (
          <>
            <button
              className="bg-slate-200 dark:bg-slate-800 text-foreground rounded-md px-2 py-1"
              onClick={() =>
                void signOut().then(() => {
                  router.push("/signin");
                })
              }
            >
              logout
            </button>
          </>
        ) : (
          <>
            <Link
              className="bg-slate-200 dark:bg-slate-800 text-foreground rounded-md px-2 py-1"
              href={{
                pathname: "/signin",
                query: searchParams.toString(),
              }}
            >
              login
            </Link>
          </>
        )}
      </div>
    </footer>
  );
}

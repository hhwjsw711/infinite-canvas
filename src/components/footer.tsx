"use client";

import { useSearchParams } from "next/navigation";
import { SignOutButton } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Link } from "@/components/ui/link";

export function Footer() {
  const searchParams = useSearchParams();

  const user = useQuery(api.users.getMyUser);

  return (
    <footer className="text-md fixed bottom-4 right-4 z-20 flex w-min flex-col items-center justify-between font-medium text-primary sm:flex-row">
      <div className="mb-3 flex items-center justify-between space-x-3 sm:mb-0">
        {user != null ? (
          <>
            <div>{user.email}</div>
            <div>/</div>
            <SignOutButton>
              <button>signout</button>
            </SignOutButton>
          </>
        ) : (
          <>
            <Link
              href={{
                pathname: "/sign-in",
                query: searchParams.toString(),
              }}
            >
              signin
            </Link>
            <div>or</div>
            <Link
              href={{
                pathname: "/sign-up",
                query: searchParams.toString(),
              }}
            >
              signup
            </Link>
          </>
        )}
      </div>
    </footer>
  );
}

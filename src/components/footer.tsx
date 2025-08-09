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
    <footer className="fixed bottom-4 right-4 z-20 hidden sm:block">
      <nav className="flex items-center space-x-3 text-base font-medium text-primary">
        <Link
          href={{
            pathname: "/explore",
            query: searchParams.toString(),
          }}
        >
          explore
        </Link>
        <div>/</div>
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
      </nav>
    </footer>
  );
}

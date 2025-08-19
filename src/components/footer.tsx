"use client";

import { useSearchParams } from "next/navigation";
import { SignOutButton } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Link } from "@/components/ui/link";
import { useBuyCreditsModal } from "@/hooks/use-buy-credits-modal";
import { StudioSelector } from "./studio-selector";

export function Footer() {
  const searchParams = useSearchParams();
  const { setOpen: setBuyCreditsModalOpen } = useBuyCreditsModal();
  const user = useQuery(api.users.getMyUser);

  return (
    <footer className="fixed bottom-4 right-4 z-20 hidden sm:block">
      <nav className="flex items-center space-x-3 text-base font-medium text-primary">
        <Link
          href={{
            pathname: "/explore",
            query: searchParams.toString(),
          }}
          className="hover:underline"
        >
          explore
        </Link>
        <div>/</div>
        {user != null ? (
          <>
            <StudioSelector />
            <div>/</div>
            <div>{user.email}</div>
            <div>/</div>
            <button
              onClick={() => setBuyCreditsModalOpen(true)}
              className="hover:underline"
            >
              credits
            </button>
            <div>/</div>
            <SignOutButton>
              <button className="hover:underline">signout</button>
            </SignOutButton>
          </>
        ) : (
          <>
            <Link
              href={{
                pathname: "/sign-in",
                query: searchParams.toString(),
              }}
              className="hover:underline"
            >
              signin
            </Link>
            <div>or</div>
            <Link
              href={{
                pathname: "/sign-up",
                query: searchParams.toString(),
              }}
              className="hover:underline"
            >
              signup
            </Link>
          </>
        )}
      </nav>
    </footer>
  );
}

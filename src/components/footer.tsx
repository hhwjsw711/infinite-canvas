"use client";

import { useSearchParams } from "next/navigation";
import { useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";
import { Link } from "./link";
import { api } from "../../convex/_generated/api";

export function Footer() {
  const searchParams = useSearchParams();

  const user = useQuery(api.users.getUser);
  const { signOut } = useAuthActions();
  const router = useRouter();

  return (
    <footer className="text-md fixed bottom-4 right-4 z-20 flex w-min flex-col items-center justify-between font-medium text-primary sm:flex-row">
      <div className="mb-3 flex items-center justify-between space-x-3 sm:mb-0">
        <Link
          href={{
            pathname: "/about",
            query: searchParams.toString(),
          }}
        >
          about
        </Link>
        <div>/</div>
        <Link
          href={{
            pathname: "/ourfiles",
            query: searchParams.toString(),
          }}
        >
          ourfiles
        </Link>
        <div>/</div>
        <Link
          href={{
            pathname: "/rooms",
            query: searchParams.toString(),
          }}
        >
          rooms
        </Link>
        <div>/</div>
        {user != null ? (
          <>
            <div>{user.email}</div>
            <div>/</div>
            <button
              onClick={() =>
                void signOut().then(() => {
                  router.push("/");
                })
              }
            >
              logout
            </button>
          </>
        ) : (
          <>
            <Link
              href={{
                pathname: "/login",
                query: searchParams.toString(),
              }}
            >
              login
            </Link>
            <div>or</div>
            <Link
              href={{
                pathname: "/signup",
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

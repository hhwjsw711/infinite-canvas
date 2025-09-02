"use client";

import { Button } from "@/components/ui/button";
import { SignInButton, SignUpButton } from "@clerk/clerk-react";
import { ClerkLoading, SignedIn, SignedOut } from "@clerk/nextjs";
import Link from "next/link";

export function DashboardButtons() {
  return (
    <>
      <ClerkLoading>
        <div className="w-40 h-9" />
      </ClerkLoading>
      <SignedIn>
        <OpenDashboardLinkButton />
      </SignedIn>
      <SignedOut>
        <div className="flex gap-3 animate-[fade-in_0.2s]">
          <SignInButton mode="modal">
            <Button variant="ghost" size="sm" className="rounded-xl">
              Sign in
            </Button>
          </SignInButton>
          <SignUpButton mode="modal">
            <Button
              variant="primary"
              size="sm"
              className="rounded-xl shadow-sm"
            >
              Sign up
            </Button>
          </SignUpButton>
        </div>
      </SignedOut>
    </>
  );
}

function OpenDashboardLinkButton() {
  return (
    <Link href="/t" className="animate-[fade-in_0.2s]">
      <Button variant="primary" size="sm" className="rounded-xl shadow-sm">
        Dashboard
      </Button>
    </Link>
  );
}

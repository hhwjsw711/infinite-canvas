"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { InputCard } from "@/components/input-card";
import { DangerZone } from "@/components/danger-zone";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function AccountSettings() {
  const router = useRouter();

  // Get current user data
  const user = useQuery(api.users.getMyUser);

  // Mutations
  const updateUser = useMutation(api.users.updateMyUser);
  const deleteUser = useMutation(api.users.deleteMyUser);

  const handleSaveUserName = async (name: string) => {
    if (!name.trim()) {
      throw new Error("Name cannot be empty");
    }

    await updateUser({
      name: name.trim(),
    });
  };

  const handleSaveUserEmail = async (email: string) => {
    // Basic frontend validation for UX
    if (!email.trim() || !email.includes("@")) {
      throw new Error("Please enter a valid email address");
    }

    await updateUser({
      email: email.trim(),
    });
  };

  const handleDeleteUser = async () => {
    await deleteUser({});
    // Force a complete page reload to clear auth state
    window.location.href = "/";
  };

  if (!user) {
    return (
      <div className="space-y-6 max-w-2xl">
        {/* Full Name Skeleton */}
        <Card>
          <CardHeader className="pb-4">
            <div className="space-y-2">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-4 w-64" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-16 sm:w-20" />
            </div>
          </CardContent>
        </Card>

        {/* Email Skeleton */}
        <Card>
          <CardHeader className="pb-4">
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-56" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-16 sm:w-20" />
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone Skeleton */}
        <Card className="border-red-200 dark:border-red-800">
          <CardHeader>
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-80" />
            </div>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-10 w-32" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <InputCard
        title="Full Name"
        description="Your full name as it will appear across the platform."
        value={user.name || ""}
        placeholder="Enter your full name"
        onSave={handleSaveUserName}
      />

      <InputCard
        title="Email Address"
        description="The email address associated with your account."
        value={user.email || ""}
        placeholder="Enter your email address"
        onSave={handleSaveUserEmail}
      />

      <DangerZone
        title="Delete Account"
        description="Permanently delete your account and all associated data. This action cannot be undone."
        buttonText="Delete Account"
        onDelete={handleDeleteUser}
      />
    </div>
  );
}

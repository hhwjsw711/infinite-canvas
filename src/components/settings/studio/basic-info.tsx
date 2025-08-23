import React from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { InputCard } from "@/components/input-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface OrganizationBasicInfoProps {
  organizationId: Id<"organizations">;
}

export function OrganizationBasicInfo({
  organizationId,
}: OrganizationBasicInfoProps) {
  // Get organization data
  const organization = useQuery(api.organizations.getById, { organizationId });

  // Mutations
  const updateOrganization = useMutation(api.organizations.update);

  const handleSaveName = async (name: string) => {
    if (!name.trim()) {
      throw new Error("Organization name cannot be empty");
    }

    await updateOrganization({
      organizationId,
      name: name.trim(),
    });
  };

  const handleSaveEmail = async (email: string) => {
    await updateOrganization({
      organizationId,
      email: email.trim() || undefined,
    });
  };

  if (!organization) {
    return (
      <div className="space-y-6">
        {/* Organization Name Skeleton */}
        <Card>
          <CardHeader className="pb-4">
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-16 sm:w-20" />
            </div>
          </CardContent>
        </Card>

        {/* Organization Email Skeleton */}
        <Card>
          <CardHeader className="pb-4">
            <div className="space-y-2">
              <Skeleton className="h-5 w-40" />
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
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <InputCard
        title="Organization Name"
        description="The name of your organization"
        value={organization.name}
        placeholder="Enter organization name"
        onSave={handleSaveName}
      />

      <InputCard
        title="Organization Email"
        description="Contact email for your organization"
        value={organization.email || ""}
        placeholder="Enter organization email"
        onSave={handleSaveEmail}
      />
    </div>
  );
}

import React from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { DangerZone } from "@/components/danger-zone";
import { Card, CardContent } from "@/components/ui/card";

interface OrganizationDangerZoneProps {
  organizationId: Id<"organizations">;
}

export function OrganizationDangerZone({
  organizationId,
}: OrganizationDangerZoneProps) {
  const router = useRouter();

  // Get user's organizations to check if deletion is allowed
  const userOrganizations = useQuery(api.organizations.listMine, {});

  // Mutations
  const deleteOrganization = useMutation(api.organizations.deleteOrganization);

  const handleDeleteOrganization = async () => {
    try {
      await deleteOrganization({ organizationId });

      // Navigate to first remaining organization
      if (userOrganizations && userOrganizations.length > 1) {
        const remainingOrg = userOrganizations.find(
          (org) => org._id !== organizationId,
        );
        if (remainingOrg) {
          router.replace(`/${remainingOrg._id}`);
        }
      }
    } catch (error) {
      throw error;
    }
  };

  if (!userOrganizations) {
    return null; // Loading handled by parent
  }

  const canDeleteOrganization = userOrganizations.length > 1;

  if (!canDeleteOrganization) {
    return (
      <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-blue-600 dark:text-blue-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Cannot delete this organization
              </p>
              <p className="text-sm text-blue-600 dark:text-blue-400">
                This is your only organization. Create another organization
                before you can delete this one.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <DangerZone
      title="Delete Organization"
      description="Permanently delete this organization and all its content"
      buttonText="Delete Organization"
      onDelete={handleDeleteOrganization}
    />
  );
}

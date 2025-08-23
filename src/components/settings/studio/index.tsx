import React from "react";
import { useParams } from "next/navigation";
import { Id } from "../../../../convex/_generated/dataModel";
import { TeamMembers } from "./team/team-members";
import { OrganizationBasicInfo } from "./basic-info";
import { OrganizationDangerZone } from "./danger-zone";

export function StudioSettings() {
  const params = useParams();
  const organizationId = params.organizationId as Id<"organizations">;

  return (
    <div className="space-y-6 max-w-2xl">
      <OrganizationBasicInfo organizationId={organizationId} />
      <TeamMembers organizationId={organizationId} />
      <OrganizationDangerZone organizationId={organizationId} />
    </div>
  );
}

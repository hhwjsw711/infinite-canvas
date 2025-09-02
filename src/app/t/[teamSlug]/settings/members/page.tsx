"use client";

import { useCurrentTeam } from "@/hooks/useCurrentTeam";
import { SettingsMenuButton } from "../SettingsMenuButton";
import { AddMember } from "./AddMember";
import { MembersList } from "./MemberList";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function MembersPage() {
  const team = useCurrentTeam();
  const router = useRouter();
  useEffect(() => {
    if (team?.isPersonal === true) {
      router.replace(`/t/${team.slug}/settings`);
    }
  }, [team, router]);
  return (
    <>
      <div className="flex items-center mt-8">
        <SettingsMenuButton />
        <h1 className="text-4xl font-extrabold">Members</h1>
      </div>

      <AddMember />
      <MembersList />
    </>
  );
}

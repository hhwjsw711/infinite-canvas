import { AcceptInviteDialog } from "@/components/team/AcceptInviteDialog";
import { Notifications } from "./Notifications";
import { TeamMenu } from "@/components/team/TeamMenu";
import { ProfileButton } from "./ProfileButton";
import { TeamSwitcher } from "@/components/team/TeamSwitcher";
import { Suspense } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense>
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur px-4 py-2 flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <TeamSwitcher />
          <div className="flex items-center gap-4">
            <Notifications />
            <ProfileButton />
          </div>
        </div>
        <TeamMenu />
      </header>
      {children}
      <AcceptInviteDialog />
    </Suspense>
  );
}

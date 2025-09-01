import * as React from "react";
import { Id } from "../../convex/_generated/dataModel";
import { INVITE_PARAM } from "../app/constants";

interface Props {
  inviteId: Id<"invites">;
  inviterEmail: string;
  teamName: string;
}

export const InviteEmail = ({ inviterEmail, teamName, inviteId }: Props) => {
  return (
    <div>
      <strong>{inviterEmail}</strong> invited you to join team{" "}
      <strong>{teamName}</strong> in My App. Click{" "}
      <a href={`${process.env.HOSTED_URL}/t?${INVITE_PARAM}=${inviteId}`}>
        here to accept
      </a>{" "}
      or log in to My App.
    </div>
  );
};

export default InviteEmail;

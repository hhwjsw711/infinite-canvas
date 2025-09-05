"use node";

import { ConvexError, v } from "convex/values";
import { Resend } from "resend";
import { INVITE_PARAM } from "../../../../src/lib/constants";
import { api, internal } from "../../../_generated/api";
import { Id } from "../../../_generated/dataModel";
import { action } from "../../../_generated/server";

// To enable sending emails, set
// - `RESEND_API_KEY`
// - `HOSTED_URL` to the URL where your site is hosted
// on your Convex dashboard:
// https://dashboard.convex.dev/deployment/settings/environment-variables
// To test emails, override the email address by setting
// `OVERRIDE_INVITE_EMAIL`.
export const send = action({
  args: {
    teamId: v.id("teams"),
    email: v.string(),
    roleId: v.id("roles"),
  },
  async handler(ctx, { teamId, email, roleId }) {
    const { inviterEmail, teamName } = await ctx.runMutation(
      internal.users.teams.members.invites.prepare,
      { teamId },
    );
    const inviteId = await ctx.runMutation(
      internal.users.teams.members.invites.create,
      { teamId, email, roleId, inviterEmail },
    );
    try {
      await sendInviteEmail({ email, inviteId, inviterEmail, teamName });
    } catch (error) {
      await ctx.runMutation(api.users.teams.members.invites.deleteInvite, {
        inviteId,
      });
      throw error;
    }
  },
});

async function sendInviteEmail({
  email,
  inviteId,
  inviterEmail,
  teamName,
}: {
  email: string;
  inviteId: Id<"invites">;
  inviterEmail: string;
  teamName: string;
}) {
  if (
    process.env.RESEND_API_KEY === undefined ||
    process.env.HOSTED_URL === undefined
  ) {
    console.error(
      "Set up `RESEND_API_KEY` and `HOSTED_URL` to send invite emails",
    );
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: "Infinite Canvas <bot@emails.infinite-canvas.com>",
    to: [process.env.OVERRIDE_INVITE_EMAIL ?? email],
    subject: `${inviterEmail} invited you to join them in Infinite Canvas`,
    react: (
      <div>
        <strong>{inviterEmail}</strong> invited you to join team{" "}
        <strong>{teamName}</strong> in Infinite Canvas. Click{" "}
        <a href={`${process.env.HOSTED_URL}/t?${INVITE_PARAM}=${inviteId}`}>
          here to accept
        </a>{" "}
        or log in to Infinite Canvas.
      </div>
    ),
  });

  if (error) {
    throw new ConvexError("Could not send invitation email");
  }
}

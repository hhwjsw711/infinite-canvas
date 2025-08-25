"use node";

import { action } from "./_generated/server";
import { render, pretty } from "@react-email/render";
import { components } from "./_generated/api";
import { Resend } from "@convex-dev/resend";
import InviteEmail from "../src/emails/templates/invite";
import WelcomeEmail from "../src/emails/templates/welcome";
import { v } from "convex/values";

export const resend: Resend = new Resend(components.resend, {
  testMode: false,
});

export const sendInviteEmail = action({
  args: {
    invitedByUsername: v.string(),
    invitedByEmail: v.string(),
    teamName: v.string(),
    inviteLink: v.string(),
    inviteeEmail: v.string(),
    organizationName: v.string(),
  },
  handler: async (ctx, args) => {
    const html = await pretty(
      await render(
        InviteEmail({
          invitedByUsername: args.invitedByUsername,
          invitedByEmail: args.invitedByEmail,
          teamName: args.teamName,
          inviteLink: args.inviteLink,
        }),
      ),
    );

    // 2. Send your email as usual using the component
    await resend.sendEmail(ctx, {
      from: "Infinite Canvas <hello@emails.infinite-canvas.com>",
      to: args.inviteeEmail,
      subject: `You've been invited to join ${args.organizationName} on Infinite Canvas`,
      html,
    });
  },
});

export const sendWelcomeEmail = action({
  args: {
    name: v.string(),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const html = await pretty(
      await render(
        WelcomeEmail({
          name: args.name,
        }),
      ),
    );

    await resend.sendEmail(ctx, {
      from: "Infinite Canvas <hello@emails.infinite-canvas.com>",
      to: args.email,
      subject: "Welcome to Infinite Canvas!",
      html,
    });
  },
});

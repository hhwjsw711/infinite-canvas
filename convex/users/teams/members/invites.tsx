import { v } from "convex/values";
import { internalMutation, mutation, query } from "../../../functions";
import {
  viewerHasPermission,
  viewerHasPermissionX,
} from "../../../permissions";

export const list = query({
  args: {
    teamId: v.optional(v.id("teams")),
  },
  async handler(ctx, { teamId }) {
    if (
      teamId === undefined ||
      ctx.viewer === null ||
      !(await viewerHasPermission(ctx, teamId, "Read Members"))
    ) {
      return null;
    }

    return await ctx
      .table("teams")
      .getX(teamId)
      .edge("invites")
      .map(async (invite) => {
        return {
          _id: invite._id,
          email: invite.email,
          role: (await invite.edge("role")).name,
        };
      });
  },
});

export const deleteInvite = mutation({
  args: {
    inviteId: v.id("invites"),
  },
  async handler(ctx, { inviteId }) {
    const invite = await ctx.table("invites").getX(inviteId);
    await viewerHasPermissionX(ctx, invite.teamId, "Manage Members");
    await ctx.table("invites").getX(inviteId).delete();
  },
});

export const prepare = internalMutation({
  args: {
    teamId: v.id("teams"),
  },
  async handler(ctx, { teamId }) {
    await viewerHasPermissionX(ctx, teamId, "Manage Members");
    return {
      inviterEmail: ctx.viewerX().email,
      teamName: (await ctx.table("teams").getX(teamId)).name,
    };
  },
});

export const create = internalMutation({
  args: {
    teamId: v.id("teams"),
    email: v.string(),
    roleId: v.id("roles"),
    inviterEmail: v.string(),
  },
  async handler(ctx, { teamId, email, roleId, inviterEmail }) {
    return await ctx.table("invites").insert({
      teamId,
      email,
      roleId,
      inviterEmail,
    });
  },
});

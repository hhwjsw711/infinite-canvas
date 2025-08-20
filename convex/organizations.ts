import { v } from "convex/values";
import { authMutation, authQuery } from "./util";
import { internalMutation } from "./_generated/server";

export const createDefaultForUser = internalMutation({
  args: {
    userId: v.id("users"),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const membership = await ctx.db
      .query("members")
      .withIndex("by_userId_OrganizationId", (q) => q.eq("userId", args.userId))
      .first();

    if (membership) {
      const org = await ctx.db.get(membership.organizationId);
      if (org) {
        return { id: org._id, name: org.name };
      }
    }

    const orgId = await ctx.db.insert("organizations", {
      name: args.name ?? "Personal",
      plan: "free",
    });

    await ctx.db.insert("members", {
      userId: args.userId,
      organizationId: orgId,
      role: "owner",
    });

    const org = await ctx.db.get(orgId);
    return org ? { id: org._id, name: org.name } : null;
  },
});

export const create = authMutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const orgId = await ctx.db.insert("organizations", {
      name: args.name,
      plan: "free",
    });

    await ctx.db.insert("members", {
      organizationId: orgId,
      userId: ctx.user._id,
      role: "owner",
    });

    return { id: orgId };
  },
});

export const listMine = authQuery({
  args: {},
  handler: async (ctx) => {
    if (!ctx.user) return [];

    const memberships = await ctx.db
      .query("members")
      .withIndex("by_userId_OrganizationId", (q) =>
        q.eq("userId", ctx.user._id),
      )
      .order("asc")
      .collect();

    const rows = await Promise.all(
      memberships.map(async (m) => {
        const org = await ctx.db.get(m.organizationId);
        if (!org) return null;
        return { _id: org._id, name: org.name, plan: org.plan };
      }),
    );

    return rows.filter((r): r is NonNullable<typeof r> => r !== null);
  },
});

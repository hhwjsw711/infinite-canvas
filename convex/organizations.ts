import { v } from "convex/values";
import { authMutation, authQuery } from "./util";

export const create = authMutation({
  args: {
    name: v.string(),
  },
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

    if (memberships.length === 0) return [];

    const rows = await Promise.all(
      memberships.map(async (m) => {
        const org = await ctx.db.get(m.organizationId);
        if (!org) return null;
        return {
          _id: org._id,
          name: org.name,
          plan: org.plan,
          logo: org.logo,
          email: org.email,
          role: m.role,
          createdAt: m._creationTime,
        };
      }),
    );

    return rows.filter((r): r is NonNullable<typeof r> => r !== null);
  },
});

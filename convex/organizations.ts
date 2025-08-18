import { v } from "convex/values";
import { authMutation } from "./util";

export const create = authMutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const orgId = await ctx.db.insert("organizations", {
      name: args.name,
    });

    await ctx.db.insert("members", {
      organizationId: orgId,
      userId: ctx.user._id,
      role: "owner",
    });

    return { id: orgId };
  },
});

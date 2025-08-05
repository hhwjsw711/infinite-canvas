import { ConvexError, v } from "convex/values";
import { internalMutation, internalQuery, query } from "./_generated/server";
import { authMutation, authQuery } from "./util";

export const getUserById = internalQuery({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    return user;
  },
});

export const getProfile = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);

    return {
      name: user?.name,
      profileImage: user?.profileImage,
    };
  },
});

export const createUser = internalMutation({
  args: {
    email: v.string(),
    userId: v.string(),
    name: v.string(),
    profileImage: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (user) return;

    await ctx.db.insert("users", {
      email: args.email,
      userId: args.userId,
      profileImage: args.profileImage,
      name: args.name,
    });
  },
});

export const updateUser = internalMutation({
  args: { userId: v.string(), name: v.string(), profileImage: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!user) {
      throw new ConvexError("user not found");
    }

    await ctx.db.patch(user._id, {
      name: args.name,
      profileImage: args.profileImage,
    });
  },
});

export const getMyUser = authQuery({
  args: {},
  async handler(ctx, args) {
    return ctx.user;
  },
});

export const updateMyUser = authMutation({
  args: { name: v.string() },
  async handler(ctx, args) {
    await ctx.db.patch(ctx.user._id, {
      name: args.name,
    });
  },
});

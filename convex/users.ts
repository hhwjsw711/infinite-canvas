import { ConvexError, v } from "convex/values";
import { internalMutation, internalQuery, query } from "./_generated/server";
import { authMutation, authQuery } from "./util";
import { internal, api } from "./_generated/api";

const FREE_CREDITS = 5;

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

    if (!user) {
      throw new ConvexError("User not found");
    }

    return {
      name: user.name,
      profileImage: user.profileImage,
    };
  },
});

export const createUser = internalMutation({
  args: {
    email: v.string(),
    userId: v.string(),
    name: v.optional(v.string()),
    profileImage: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (existing) {
      await ctx.runMutation(internal.organizations.createDefaultForUser, {
        userId: existing._id,
      });
      return { id: existing._id };
    }

    const userId = await ctx.db.insert("users", {
      email: args.email,
      userId: args.userId, // Clerk ID
      profileImage: args.profileImage,
      credits: FREE_CREDITS,
      name: args.name,
    });

    await ctx.runMutation(internal.organizations.createDefaultForUser, {
      userId,
    });

    // Send welcome email asynchronously
    await ctx.scheduler.runAfter(0, api.emails.sendWelcomeEmail, {
      name: args.name || "there",
      email: args.email,
    });

    return { id: userId };
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
  args: {
    name: v.optional(v.string()),
    email: v.optional(v.string()),
  },
  async handler(ctx, args) {
    // Build update object based on provided fields
    const updates: { name?: string; email?: string } = {};

    if (args.name !== undefined) {
      updates.name = args.name;
    }

    if (args.email !== undefined) {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(args.email)) {
        throw new ConvexError("Invalid email format");
      }
      updates.email = args.email;
    }

    // Only patch if there are actual updates
    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(ctx.user._id, updates);
    }

    return null;
  },
});

export const deleteMyUser = authMutation({
  args: {},
  async handler(ctx, args) {
    const userId = ctx.user._id;

    // Get user's organization memberships
    const memberships = await ctx.db
      .query("members")
      .withIndex("by_userId_OrganizationId", (q) => q.eq("userId", userId))
      .collect();

    // Check if user is the only owner of any organization
    for (const membership of memberships) {
      if (membership.role === "owner") {
        const ownerCount = await ctx.db
          .query("members")
          .withIndex("by_organizationId", (q) =>
            q.eq("organizationId", membership.organizationId),
          )
          .filter((q) => q.eq(q.field("role"), "owner"))
          .collect()
          .then((owners) => owners.length);

        if (ownerCount === 1) {
          throw new ConvexError(
            "Cannot delete account: You are the only owner of an organization. Transfer ownership first.",
          );
        }
      }
    }

    // Step 1: Delete memberships
    for (const membership of memberships) {
      await ctx.db.delete(membership._id);
    }

    // Step 2: Delete invitations (both sent and received)
    const invitations = await ctx.db
      .query("invitations")
      .filter((q) =>
        q.or(
          q.eq(q.field("inviterUserId"), userId),
          q.eq(q.field("email"), ctx.user.email),
        ),
      )
      .collect();

    for (const invitation of invitations) {
      await ctx.db.delete(invitation._id);
    }

    // Step 3: Finally delete the user
    await ctx.db.delete(userId);
    return null;
  },
});

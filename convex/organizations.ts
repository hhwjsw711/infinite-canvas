import { v } from "convex/values";
import { authMutation, authQuery } from "./util";
import { internalMutation, internalQuery } from "./_generated/server";
import { Id } from "./_generated/dataModel";

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
        const existingCanvas = await ctx.db
          .query("canvases")
          .withIndex("by_organizationId", (q) =>
            q.eq("organizationId", membership.organizationId),
          )
          .first();

        if (!existingCanvas) {
          const now = Date.now();
          const canvasId = await ctx.db.insert("canvases", {
            title: "Untitled",
            organizationId: membership.organizationId,
            stateJson: {
              images: [],
              videos: [],
              viewport: { x: 0, y: 0, scale: 1 },
              version: "1.0.0",
            },
            isPublic: false,
            updatedAt: now,
            lastAccessedAt: now,
          });
          return { id: org._id, name: org.name, canvasId };
        }

        return { id: org._id, name: org.name, canvasId: existingCanvas._id };
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

    const now = Date.now();
    const canvasId = await ctx.db.insert("canvases", {
      title: "Untitled",
      organizationId: orgId,
      stateJson: {
        images: [],
        videos: [],
        viewport: { x: 0, y: 0, scale: 1 },
        version: "1.0.0",
      },
      isPublic: false,
      updatedAt: now,
      lastAccessedAt: now,
    });

    const org = await ctx.db.get(orgId);
    return org ? { id: org._id, name: org.name, canvasId } : null;
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

    const now = Date.now();
    const canvasId = await ctx.db.insert("canvases", {
      title: "Untitled",
      organizationId: orgId,
      stateJson: {
        images: [],
        videos: [],
        viewport: { x: 0, y: 0, scale: 1 },
        version: "1.0.0",
      },
      isPublic: false,
      updatedAt: now,
      lastAccessedAt: now,
    });

    return { id: orgId, canvasId };
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

export const getUserFirstOrganization = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const membership = await ctx.db
      .query("members")
      .withIndex("by_userId_OrganizationId", (q) => q.eq("userId", args.userId))
      .first();

    return membership;
  },
});

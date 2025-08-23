import { ConvexError, v } from "convex/values";
import { QueryCtx, internalMutation, query } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";
import { adminAuthMutation, authAction, authMutation } from "./util";
import { internal } from "./_generated/api";
import { Doc, Id } from "./_generated/dataModel";

export const getCanvas = query({
  args: { canvasId: v.id("canvases") },
  handler: async (ctx, args) => {
    const canvas = await ctx.db.get(args.canvasId);
    if (!canvas) {
      throw new ConvexError("Canvas not found");
    }
    return await attachUrlToCanvas(ctx, canvas);
  },
});

function attachUrlToCanvas(ctx: QueryCtx, canvas: Doc<"canvases">) {
  const r2PublicUrl = process.env.R2_PUBLIC_URL;

  const imagesWithUrl = canvas.stateJson.images.map((image) => ({
    ...image,
    url:
      r2PublicUrl && image.cloudImageId
        ? `${r2PublicUrl}/${image.cloudImageId}`
        : image.src,
  }));

  const videosWithUrl = canvas.stateJson.videos.map((video) => ({
    ...video,
    url:
      r2PublicUrl && video.cloudVideoId
        ? `${r2PublicUrl}/${video.cloudVideoId}`
        : video.src,
  }));

  return {
    ...canvas,
    stateJson: {
      ...canvas.stateJson,
      images: imagesWithUrl,
      videos: videosWithUrl,
    },
  };
}

export const getRecentCanvases = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const canvases = await ctx.db
      .query("canvases")
      .withIndex("by_updatedAt")
      .order("desc")
      .paginate(args.paginationOpts);

    return {
      ...canvases,
      page: await Promise.all(
        canvases.page.map((canvas) => attachUrlToCanvas(ctx, canvas)),
      ),
    };
  },
});

export const getPublicCanvases = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const canvases = await ctx.db
      .query("canvases")
      .withIndex("by_isPublic")
      .filter((q) => q.eq(q.field("isPublic"), true))
      .order("desc")
      .paginate(args.paginationOpts);

    return {
      ...canvases,
      page: await Promise.all(
        canvases.page.map((canvas) => attachUrlToCanvas(ctx, canvas)),
      ),
    };
  },
});

export const getCanvasesByOrganization = query({
  args: {
    organizationId: v.id("organizations"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const canvasesQuery = ctx.db
      .query("canvases")
      .withIndex("by_organizationId", (q) =>
        q.eq("organizationId", args.organizationId),
      )
      .order("desc")
      .take(args.limit ?? 10);

    const canvasesArray = await canvasesQuery;

    return await Promise.all(
      canvasesArray.map((canvas) => attachUrlToCanvas(ctx, canvas)),
    );
  },
});

export const getFirstCanvasByOrganization = query({
  args: {
    organizationId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const firstCanvas = await ctx.db
      .query("canvases")
      .withIndex("by_organizationId", (q) =>
        q.eq("organizationId", args.organizationId),
      )
      .order("asc")
      .first();

    return firstCanvas ? await attachUrlToCanvas(ctx, firstCanvas) : null;
  },
});

export const createCanvas = internalMutation({
  args: {
    title: v.string(),
    state: v.any(),
    isPublic: v.boolean(),
    organizationId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const organization = await ctx.db.get(args.organizationId);

    if (!organization) {
      throw new ConvexError("Organization not found");
    }

    const now = Date.now();

    const id = await ctx.db.insert("canvases", {
      title: args.title,
      organizationId: args.organizationId,
      stateJson: args.state,
      isPublic: args.isPublic,
      updatedAt: now,
      lastAccessedAt: now,
    });

    return id;
  },
});

export const createCanvasAction = authAction({
  args: {
    title: v.optional(v.string()),
    state: v.any(),
    isPublic: v.optional(v.boolean()),
    organizationId: v.optional(v.id("organizations")),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{
    canvasId: Id<"canvases">;
    organizationId: Id<"organizations">;
  }> => {
    let organizationId = args.organizationId;

    if (!organizationId) {
      const membership = await ctx.runQuery(
        internal.organizations.getUserFirstOrganization,
        {
          userId: ctx.user._id,
        },
      );

      if (!membership) {
        throw new ConvexError("User has no organization");
      }

      organizationId = membership.organizationId;
    }

    const canvasId: Id<"canvases"> = await ctx.runMutation(
      internal.canvases.createCanvas,
      {
        title: args.title ?? "Untitled",
        state: args.state,
        isPublic: args.isPublic ?? false,
        organizationId,
      },
    );

    return { canvasId, organizationId };
  },
});

export const deleteCanvas = authMutation({
  args: { canvasId: v.id("canvases") },
  handler: async (ctx, args) => {
    const canvas = await ctx.db.get(args.canvasId);
    if (!canvas) {
      throw new ConvexError("Canvas not found");
    }

    // Verify user has access to this organization
    const membership = await ctx.db
      .query("members")
      .withIndex("by_userId_OrganizationId", (q) =>
        q
          .eq("userId", ctx.user._id)
          .eq("organizationId", canvas.organizationId),
      )
      .unique();

    if (!membership) {
      throw new ConvexError("You don't have permission to delete this canvas");
    }

    await ctx.db.delete(args.canvasId);
  },
});

export const updateCanvas = authMutation({
  args: {
    title: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
    state: v.optional(v.any()),
    canvasId: v.id("canvases"),
  },
  handler: async (ctx, args) => {
    const canvas = await ctx.db.get(args.canvasId);
    if (!canvas) {
      throw new ConvexError("Canvas not found");
    }

    const { canvasId, state, ...rest } = args;
    const updates: Partial<Doc<"canvases">> = {
      ...rest,
      updatedAt: Date.now(),
    };

    if (args.state !== undefined) {
      updates.stateJson = args.state;
    }

    await ctx.db.patch(args.canvasId, updates);
  },
});

export const createShareLink = authMutation({
  args: {
    canvasId: v.id("canvases"),
    expiresIn: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Check canvas exists and ownership
    const canvas = await ctx.db.get(args.canvasId);
    if (!canvas) {
      throw new ConvexError("Canvas not found");
    }

    const shareToken = crypto.randomUUID();

    const now = Date.now();
    const expiresAt = args.expiresIn
      ? now + args.expiresIn * 60 * 60 * 1000
      : undefined;

    await ctx.db.insert("sharedLinks", {
      canvasId: args.canvasId,
      shareToken,
      expiresAt,
    });

    return { shareToken };
  },
});

export const getByShareToken = query({
  args: { shareToken: v.string() },
  handler: async (ctx, args) => {
    const shareLink = await ctx.db
      .query("sharedLinks")
      .withIndex("by_shareToken", (q) => q.eq("shareToken", args.shareToken))
      .unique();

    if (!shareLink) throw new ConvexError("Invalid share link");

    if (shareLink.expiresAt && shareLink.expiresAt < Date.now()) {
      throw new ConvexError("Share link has expired");
    }

    const canvas = await ctx.db.get(shareLink.canvasId);
    if (!canvas) throw new ConvexError("Canvas not found");

    return await attachUrlToCanvas(ctx, canvas);
  },
});

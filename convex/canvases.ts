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

export const createCanvas = internalMutation({
  args: {
    title: v.string(),
    state: v.any(),
    isPublic: v.boolean(),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);

    if (!user) {
      throw new ConvexError("User not found");
    }

    const now = Date.now();

    const id = await ctx.db.insert("canvases", {
      title: args.title,
      userId: user._id,
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
  },
  handler: async (ctx, args) => {
    const canvasId: Id<"canvases"> = await ctx.runMutation(
      internal.canvases.createCanvas,
      {
        title: args.title ?? "Untitled Canvas",
        state: args.state,
        isPublic: args.isPublic ?? false,
        userId: ctx.user._id,
      },
    );

    return canvasId;
  },
});

export const deleteCanvas = adminAuthMutation({
  args: { canvasId: v.id("canvases") },
  async handler(ctx, args) {
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

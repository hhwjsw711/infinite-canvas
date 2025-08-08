import { ConvexError, v } from "convex/values";
import { QueryCtx, internalMutation, query } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";
import { adminAuthMutation, authAction } from "./util";
import { internal } from "./_generated/api";
import { Doc, Id } from "./_generated/dataModel";

async function attachUrlToCanvas(ctx: QueryCtx, canvas: Doc<"canvases">) {
  const imagesWithUrl = await Promise.all(
    canvas.stateJson.images.map(async (image) => ({
      ...image,
      url: image.cloudImageId
        ? await ctx.storage.getUrl(image.cloudImageId)
        : null,
    })),
  );

  const videosWithUrl = await Promise.all(
    canvas.stateJson.videos.map(async (video) => ({
      ...video,
      url: video.cloudVideoId
        ? await ctx.storage.getUrl(video.cloudVideoId)
        : null,
    })),
  );

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

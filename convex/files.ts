import { mutation, action, query } from "./_generated/server";
import { v } from "convex/values";
import { R2 } from "@convex-dev/r2";
import { components } from "./_generated/api";

export const r2 = new R2(components.r2);

export const generateUploadUrl = mutation({
  args: {
    canvasId: v.string(),
    fileName: v.string(),
  },
  handler: async (ctx, { canvasId, fileName }) => {
    const r2Key = `canvases/${canvasId}/images/${fileName}`;
    const { url, key } = await r2.generateUploadUrl(r2Key);

    const imageUrl = `${process.env.R2_PUBLIC_URL}/${r2Key}`;

    return {
      url,
      key,
      imageUrl,
    };
  },
});

export const syncMetadata = action({
  args: {
    key: v.string(),
  },
  handler: async (ctx, args) => {
    await r2.syncMetadata(ctx, args.key);
  },
});

export const create = mutation({
  args: {
    canvasId: v.string(),
    key: v.string(),
    url: v.string(),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("files", {
      canvasId: args.canvasId,
      key: args.key,
      url: args.url,
    });

    return id;
  },
});
